from sqlalchemy import func
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models.user import User
from ..models.session import Session
from ..models.question import Question
from ..models.card import Card
from ..constants.gamification import XP_PER_LEVEL, compute_level, xp_to_next_level
from .. import db

user = Blueprint('user', __name__, url_prefix='/me')


@user.route('/stats', methods=['GET'])
@jwt_required()
def get_my_stats():
    """Devuelve las estadisticas completas del usuario autenticado."""
    user_id = get_jwt_identity()
    user_row = User.query.filter_by(user_id=user_id).first()
    if user_row is None:
        return jsonify({"msg": "Usuario no encontrado"}), 404

    total_xp = user_row.total_xp or 0
    level = compute_level(total_xp)
    progress_in_level = max(0, total_xp - ((level - 1) * XP_PER_LEVEL))

    # --- Results summary: count questions by result ---
    result_counts = (
        db.session.query(Question.result, func.count(Question.question_id))
        .join(Session, Question.session_id == Session.session_id)
        .filter(Session.user_id == user_id, Question.result.isnot(None))
        .group_by(Question.result)
        .all()
    )
    results_summary = {"correct": 0, "partially_correct": 0, "incorrect": 0}
    for result_val, count in result_counts:
        key = result_val.lower()
        if key in results_summary:
            results_summary[key] = count

    # --- Stacks stats: sessions + cards grouped by stack ---
    stack_session_counts = (
        db.session.query(Session.stack, func.count(Session.session_id))
        .filter(Session.user_id == user_id)
        .group_by(Session.stack)
        .all()
    )
    stack_card_counts = (
        db.session.query(Session.stack, func.count(Card.card_id))
        .join(Session, Card.session_id == Session.session_id)
        .filter(Card.user_id == user_id)
        .group_by(Session.stack)
        .all()
    )
    card_count_map = {s: c for s, c in stack_card_counts}
    stacks_stats = [
        {"stack": s, "sessions": sc, "cards": card_count_map.get(s, 0)}
        for s, sc in stack_session_counts
    ]

    # --- Sessions count ---
    sessions_count = Session.query.filter_by(user_id=user_id).count()

    # --- Recent sessions: last 5 with question breakdown ---
    recent_sessions_rows = (
        Session.query.filter_by(user_id=user_id)
        .order_by(Session.created_at.desc())
        .limit(5)
        .all()
    )
    recent_session_ids = [sess.session_id for sess in recent_sessions_rows]
    questions_by_session = {}
    if recent_session_ids:
        for q in Question.query.filter(Question.session_id.in_(recent_session_ids)).all():
            questions_by_session.setdefault(q.session_id, []).append(q)

    recent_sessions = []
    for sess in recent_sessions_rows:
        questions = questions_by_session.get(sess.session_id, [])
        total_questions = len(questions)
        correct = sum(1 for q in questions if q.result == "CORRECT")
        partially = sum(1 for q in questions if q.result == "PARTIALLY_CORRECT")
        incorrect = sum(1 for q in questions if q.result == "INCORRECT")
        recent_sessions.append({
            "stack": sess.stack,
            "level": sess.level,
            "created_at": sess.created_at.isoformat() if sess.created_at else None,
            "total_questions": total_questions,
            "correct": correct,
            "partially_correct": partially,
            "incorrect": incorrect,
        })

    # --- Cards summary: total + top 5 tags ---
    cards_total = Card.query.filter_by(user_id=user_id).count()
    all_tags = (
        db.session.query(Card.tags)
        .filter(Card.user_id == user_id, Card.tags.isnot(None))
        .all()
    )
    tag_counter = {}
    for (tags_json,) in all_tags:
        if isinstance(tags_json, list):
            for tag in tags_json:
                tag_counter[tag] = tag_counter.get(tag, 0) + 1
    top_tags = [t for t, _ in sorted(tag_counter.items(), key=lambda x: x[1], reverse=True)][:5]

    return jsonify({
        "total_xp": total_xp,
        "level": level,
        "xp_to_next_level": xp_to_next_level(total_xp),
        "progress_in_level": progress_in_level,
        "xp_per_level": XP_PER_LEVEL,
        "results_summary": results_summary,
        "stacks_stats": stacks_stats,
        "sessions_count": sessions_count,
        "recent_sessions": recent_sessions,
        "cards_summary": {"total": cards_total, "top_tags": top_tags},
    })


@user.route('/profile', methods=['GET'])
@jwt_required()
def get_my_profile():
    """Devuelve los datos publicos del perfil del usuario autenticado."""
    user_id = get_jwt_identity()
    user_row = User.query.filter_by(user_id=user_id).first()
    if user_row is None:
        return jsonify({"msg": "Usuario no encontrado"}), 404
    
    total_xp = user_row.total_xp or 0
    level = compute_level(total_xp)
    progress_in_level = max(0, total_xp - ((level - 1) * XP_PER_LEVEL))

    return jsonify({
        "name": user_row.name,
        "email": user_row.email,
        "total_xp": total_xp,
        "level": level,
        "progress_in_level": progress_in_level,
        "xp_per_level": XP_PER_LEVEL,
        "xp_to_next_level": xp_to_next_level(total_xp),
    })


@user.route('/profile', methods=['PATCH'])
@jwt_required()
def update_my_profile():
    """Actualiza los datos del perfil del usuario autenticado."""
    user_id = get_jwt_identity()
    user_row = User.query.filter_by(user_id=user_id).first()
    if user_row is None:
        return jsonify({"msg": "Usuario no encontrado"}), 404

    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"msg": "El campo name es obligatorio"}), 400

    user_row.name = name[:80]
    db.session.commit()

    return jsonify({
        "name": user_row.name,
        "email": user_row.email,
    })
