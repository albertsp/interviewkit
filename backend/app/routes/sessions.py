from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..constants.stacks import VALID_LEVELS, VALID_STACKS, VALID_TOPICS, TOPICS
from ..constants.gamification import (
    XP_PER_LEVEL, XP_PER_RESULT, XP_COMPLETION_BONUS,
    compute_level, xp_to_next_level,
)
from ..models.session import Session
from ..models.question import Question
from ..models.user import User
from .. import db, limiter
from ..services.ai_service import generate_questions, generate_feedback

sessions = Blueprint('sessions', __name__, url_prefix='/sessions')

# Groq free tier (ver AUDIT.md F0-2): 30 RPM / 1.000 RPD / 100K TPD,
# compartido entre TODOS los usuarios de la app. "groq_global" agrupa
# ambos endpoints de IA bajo un unico presupuesto para no agotarlo.
GROQ_GLOBAL_LIMIT = "20 per minute;40 per day"
GROQ_GLOBAL_SCOPE = "groq_global"


def _groq_global_key():
    return "global"


@sessions.route('/', methods=['POST'])
# Protegemos el endpoint con JWT
@jwt_required()
# Limite por usuario: evita que una sola cuenta agote el presupuesto compartido
@limiter.limit("5 per hour")
# Limite global: protege el presupuesto real de la cuenta de Groq (free tier)
@limiter.shared_limit(GROQ_GLOBAL_LIMIT, scope=GROQ_GLOBAL_SCOPE, key_func=_groq_global_key)
def create_session():

    # Extraemos user_id del token
    user_id = get_jwt_identity()

    # Obtenemos el body y accedemos a los campos
    data = request.get_json() or {}
    stack = data.get("stack")
    level = data.get("level")
    topic = data.get("topic")

    # Validamos que el stack y el nivel pertenecen a las listas permitidas
    if stack not in VALID_STACKS or level not in VALID_LEVELS:
        return jsonify({"Error": "El stack seleccionado o el nivel no estan permitidos"}), 400

    # El tema es opcional (compatibilidad con clientes que aun no lo envian):
    # si falta o no es valido para el stack, usamos el catch-all del stack.
    stack_topics = VALID_TOPICS.get(stack, set())
    if topic not in stack_topics:
        topic = TOPICS.get(stack, [None])[0]

    # Creamos sesion en BD
    new_session = Session(user_id=user_id, stack=stack, level=level, topic=topic)
    db.session.add(new_session)
    db.session.commit()

    # Generamos preguntas: bloque teorico + bloque de codigo
    questions = generate_questions(stack, level, topic)
    theory_questions = questions.get("theory", [])
    code_questions = questions.get("code", [])

    if not theory_questions and not code_questions:
        db.session.delete(new_session)
        db.session.commit()
        return jsonify({"error": "No se pudieron generar las preguntas. Intentalo de nuevo."}), 503

    # Guardamos cada pregunta como registro Question en BD de la session actual,
    # primero el bloque teorico y luego el de codigo
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

    # Devolvemos la sesion con las preguntas
    return jsonify({
        "session_id": new_session.session_id,
        "stack": new_session.stack,
        "level": new_session.level,
        "topic": new_session.topic,
        "questions": questions_data
    }), 201


@sessions.route('/<int:session_id>/questions/<int:question_id>', methods=['PATCH'])
# Protegemos el endpoint con JWT
@jwt_required()
@limiter.limit("15 per hour")
@limiter.shared_limit(GROQ_GLOBAL_LIMIT, scope=GROQ_GLOBAL_SCOPE, key_func=_groq_global_key)
def answer_question(session_id, question_id):
    # Extraemos user_id del token
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    user_sesion = Session.query.filter_by(session_id=session_id, user_id=user_id).first()
    
    if user_sesion is None:
        return jsonify({"msg": "La sesión no existe"}), 404

    user_question = Question.query.filter_by(question_id=question_id, session_id=session_id).first()

    if user_question is None:
        return jsonify({"msg": "La pregunta no existe"}), 404

    user_question.answer = data.get("answer")
    db.session.commit()

    # Generamos el feedback de la respuesta y guardamos en BD
    result = generate_feedback(
        user_sesion.stack, user_question.question, data.get("answer"), user_question.question_type
    )
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
# Protegemos el endpoint con JWT
@jwt_required()
def complete_session(session_id):
    """Calcula XP ganado en la sesion, actualiza User y devuelve stats."""
    user_id = get_jwt_identity()

    # Validamos que la sesion pertenece al usuario
    user_session = Session.query.filter_by(session_id=session_id, user_id=user_id).first()
    if user_session is None:
        return jsonify({"msg": "La sesion no existe"}), 404

    # Proteccion contra idempotencia: si ya fue completada, no se puede repetir
    if user_session.is_completed:
        return jsonify({"msg": "Esta sesion ya fue completada"}), 409

    # Obtenemos todas las preguntas respondidas
    questions = Question.query.filter_by(session_id=session_id).all()
    answered = [q for q in questions if q.result is not None]

    # Calculamos XP por resultado
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

    # Bonus por completar todas las preguntas de la sesion
    bonus_applied = False
    if len(answered) == len(questions) and len(questions) > 0:
        xp_earned += XP_COMPLETION_BONUS
        bonus_applied = True

    # Actualizamos XP total y nivel del usuario
    user = User.query.filter_by(user_id=user_id).first()
    if user is None:
        return jsonify({"msg": "Usuario no encontrado"}), 404

    user.total_xp = (user.total_xp or 0) + xp_earned
    user.level = compute_level(user.total_xp)

    # Marcamos la sesion como completada para evitar duplicar XP
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