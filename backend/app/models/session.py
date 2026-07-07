from .. import db
from .user import User
from datetime import datetime

class Session(db.Model):
    __tablename__ = "session"

    session_id = db.Column(db.Integer, primary_key=True)
    stack = db.Column(db.String(80), nullable=False)
    level = db.Column(db.String(20), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer,db.ForeignKey(User.user_id), index=True)
    feedback = db.Column(db.String(250), nullable=True)
    is_completed = db.Column(db.Boolean, default=False, nullable=False)