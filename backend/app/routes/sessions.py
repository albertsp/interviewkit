from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..constants.stacks import VALID_LEVELS, VALID_STACKS, VALID_TOPICS, TOPICS, LEGACY_TOPIC_ALIASES
from ..constants.gamification import (
    XP_PER_LEVEL, XP_PER_RESULT, XP_COMPLETION_BONUS,
    compute_level, xp_to_next_level,
)
from ..models.session import Session
from ..models.question import Question
from ..models.user import User
from .. import db, limiter
from ..services.ai_service import AIUnavailableError, ai_call_context, generate_questions, generate_feedback

sessions = Blueprint('sessions', __name__, url_prefix='/sessions')

# Groq free tier (see AUDIT.md F0-2): 30 RPM / 1,000 RPD / 100K TPD,
# shared across ALL users of the app. "groq_global" groups both AI
# endpoints under a single budget so one doesn't drain the other's quota.
GROQ_GLOBAL_LIMIT = "20 per minute;40 per day"
GROQ_GLOBAL_SCOPE = "groq_global"

# A huge answer burns the shared Groq token quota (100K TPD).
MAX_ANSWER_LENGTH = 4000


def _groq_global_key():
    return "global"


def _deduct_only_on_success(response):
    """Failed requests (AI errors, validation) don't spend quota: the user
    didn't get anything for them, and retrying would otherwise lock them out."""
    return response.status_code < 400


def _ai_error_response(error):
    """Turns an AIUnavailableError into the API error response, forwarding
    the provider's Retry-After when it gave one."""
    response = jsonify({"error": error.message})
    response.status_code = error.status
    if error.retry_after is not None:
        response.headers["Retry-After"] = str(error.retry_after)
    return response


@sessions.route('/', methods=['POST'])
@jwt_required()
# Per-user limit: keeps a single account from draining the shared budget
@limiter.limit("5 per hour", deduct_when=_deduct_only_on_success)
# Global limit: protects the actual Groq account budget (free tier)
@limiter.shared_limit(
    GROQ_GLOBAL_LIMIT, scope=GROQ_GLOBAL_SCOPE, key_func=_groq_global_key,
    deduct_when=_deduct_only_on_success,
)
def create_session():

    user_id = get_jwt_identity()

    data = request.get_json() or {}
    stack = data.get("stack")
    level = data.get("level")
    topic = data.get("topic")

    if stack not in VALID_STACKS or level not in VALID_LEVELS:
        return jsonify({"Error": "El stack seleccionado o el nivel no estan permitidos"}), 400

    # Topic is optional for backwards compatibility with clients that don't
    # send it yet: if missing or invalid for the stack, fall back to its catch-all.
    topic = LEGACY_TOPIC_ALIASES.get(stack, {}).get(topic, topic)
    stack_topics = VALID_TOPICS.get(stack, set())
    if topic not in stack_topics:
        topic = TOPICS.get(stack, [None])[0]

    new_session = Session(user_id=user_id, stack=stack, level=level, topic=topic)
    db.session.add(new_session)
    db.session.commit()

    # Two question blocks: theory first, then code
    try:
        with ai_call_context(user_id=int(user_id), session_id=new_session.session_id):
            questions = generate_questions(stack, level, topic)
    except AIUnavailableError as error:
        db.session.delete(new_session)
        db.session.commit()
        return _ai_error_response(error)
    theory_questions = questions.get("theory", [])
    code_questions = questions.get("code", [])

    if not theory_questions and not code_questions:
        db.session.delete(new_session)
        db.session.commit()
        return jsonify({"error": "No se pudieron generar las preguntas. Intentalo de nuevo."}), 503

    # Order matters here: theory questions are saved before code questions
    for question in theory_questions:
        db.session.add(Question(question=question, session_id=new_session.session_id, question_type="theory"))
    for question in code_questions:
        db.session.add(Question(question=question, session_id=new_session.session_id, question_type="code"))

    db.session.commit()

    saved_questions = Question.query.filter_by(session_id=new_session.session_id).order_by(Question.question_id).all()

    questions_data = [
        {"question_id": q.question_id, "question": q.question, "type": q.question_type}
        for q in saved_questions
    ]

    return jsonify({
        "session_id": new_session.session_id,
        "stack": new_session.stack,
        "level": new_session.level,
        "topic": new_session.topic,
        "questions": questions_data
    }), 201


@sessions.route('/<int:session_id>/questions/<int:question_id>', methods=['PATCH'])
@jwt_required()
@limiter.limit("15 per hour", deduct_when=_deduct_only_on_success)
@limiter.shared_limit(
    GROQ_GLOBAL_LIMIT, scope=GROQ_GLOBAL_SCOPE, key_func=_groq_global_key,
    deduct_when=_deduct_only_on_success,
)
def answer_question(session_id, question_id):
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    user_sesion = Session.query.filter_by(session_id=session_id, user_id=user_id).first()

    if user_sesion is None:
        return jsonify({"msg": "La sesión no existe"}), 404

    user_question = Question.query.filter_by(question_id=question_id, session_id=session_id).first()

    if user_question is None:
        return jsonify({"msg": "La pregunta no existe"}), 404

    answer = data.get("answer")
    if isinstance(answer, str) and len(answer) > MAX_ANSWER_LENGTH:
        return jsonify({"error": f"La respuesta no puede superar los {MAX_ANSWER_LENGTH} caracteres"}), 400

    user_question.answer = answer
    db.session.commit()

    # The answer is already saved: if the AI fails, `result` stays untouched
    # (it earns no XP) and the user can simply resubmit.
    try:
        with ai_call_context(user_id=int(user_id), session_id=session_id):
            result = generate_feedback(
                user_sesion.stack, user_question.question, answer, user_question.question_type
            )
    except AIUnavailableError as error:
        return _ai_error_response(error)
    user_question.feedback = result["feedback"]
    user_question.result = result["result"]
    db.session.commit()

    return jsonify({
        "session_id": session_id,
        "question_id": question_id,
        "result": result["result"],
        "feedback": user_question.feedback,
        "card": result["card"]
    }), 200


@sessions.route('/<int:session_id>/complete', methods=['POST'])
@jwt_required()
def complete_session(session_id):
    """Computes the XP earned in the session, updates the User, and returns stats."""
    user_id = get_jwt_identity()

    # Ownership check: the session must belong to the authenticated user
    user_session = Session.query.filter_by(session_id=session_id, user_id=user_id).first()
    if user_session is None:
        return jsonify({"msg": "La sesion no existe"}), 404

    # Idempotency guard: a session can only be completed once
    if user_session.is_completed:
        return jsonify({"msg": "Esta sesion ya fue completada"}), 409

    questions = Question.query.filter_by(session_id=session_id).all()
    answered = [q for q in questions if q.result is not None]

    breakdown = []
    xp_earned = 0
    for q in answered:
        xp = XP_PER_RESULT.get(q.result, 0)
        xp_earned += xp
        breakdown.append({
            "question_id": q.question_id,
            "result": q.result,
            "xp": xp,
        })

    # Bonus for completing every question in the session
    bonus_applied = False
    if len(answered) == len(questions) and len(questions) > 0:
        xp_earned += XP_COMPLETION_BONUS
        bonus_applied = True

    user = User.query.filter_by(user_id=user_id).first()
    if user is None:
        return jsonify({"msg": "Usuario no encontrado"}), 404

    user.total_xp = (user.total_xp or 0) + xp_earned
    user.level = compute_level(user.total_xp)

    # Marked completed to prevent this session from awarding XP again
    user_session.is_completed = True
    db.session.commit()

    progress_in_level = max(0, user.total_xp - ((user.level - 1) * XP_PER_LEVEL))

    return jsonify({
        "session_id": session_id,
        "xp_earned": xp_earned,
        "bonus_applied": bonus_applied,
        "total_xp": user.total_xp,
        "level": user.level,
        "xp_to_next_level": xp_to_next_level(user.total_xp),
        "progress_in_level": progress_in_level,
        "xp_per_level": XP_PER_LEVEL,
        "breakdown": breakdown,
    }), 200