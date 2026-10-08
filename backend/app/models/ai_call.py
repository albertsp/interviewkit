from datetime import datetime

from .. import db
from .user import User


class AICall(db.Model):
    """One row per real call to Groq (retries included). Metadata only:
    never store question text, user answers or generated feedback (GDPR)."""
    __tablename__ = "ai_call"
    __table_args__ = (
        db.Index("ix_ai_call_kind_status", "kind", "status"),
    )

    id = db.Column(db.Integer, primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    kind = db.Column(db.String(20), nullable=False)  # "questions" | "feedback"
    model = db.Column(db.String(80), nullable=False)
    stack = db.Column(db.String(80), nullable=True)
    level = db.Column(db.String(20), nullable=True)
    topic = db.Column(db.String(80), nullable=True)
    # SET NULL: deleting an account keeps the metrics but anonymizes them.
    user_id = db.Column(db.Integer, db.ForeignKey(User.user_id, ondelete="SET NULL"), nullable=True)
    # Deliberately NOT a foreign key: create_session deletes the session row
    # when the AI fails, and the id must survive to correlate those failures.
    session_id = db.Column(db.Integer, nullable=True)
    attempt = db.Column(db.Integer, nullable=False, default=1)
    latency_ms = db.Column(db.Integer, nullable=False)
    prompt_tokens = db.Column(db.Integer, nullable=True)
    completion_tokens = db.Column(db.Integer, nullable=True)
    total_tokens = db.Column(db.Integer, nullable=True)
    # ok | rate_limited | timeout | connection_error | api_error
    # | unexpected_error | unreadable_json
    status = db.Column(db.String(20), nullable=False)
    http_status = db.Column(db.Integer, nullable=True)
    error_type = db.Column(db.String(80), nullable=True)
