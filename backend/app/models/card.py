from .. import db
from .user import User
from .session import Session
from .question import Question
from datetime import datetime


class Card(db.Model):
    __tablename__ = "card"

    card_id = db.Column(db.Integer, primary_key=True)
    question_id = db.Column(db.Integer, db.ForeignKey(Question.question_id), index=True)
    session_id = db.Column(db.Integer, db.ForeignKey(Session.session_id), index=True)
    user_id = db.Column(db.Integer, db.ForeignKey(User.user_id), index=True)
    concept = db.Column(db.String(120), nullable=False)
    definition = db.Column(db.Text(), nullable=True)
    explanation = db.Column(db.Text(), nullable=False)
    use_case = db.Column(db.Text(), nullable=False)
    avoid_when = db.Column(db.Text(), nullable=True)
    mnemonic = db.Column(db.String(200), nullable=True)
    tags = db.Column(db.JSON(), nullable=True)
    code = db.Column(db.Text(), nullable=True)
    code_language = db.Column(db.String(50), nullable=True, default="javascript")
    # Inherited from the session's level: 1=Basico, 2=Intermedio, 3=Avanzado
    difficulty = db.Column(db.Integer(), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def serialize(self):
        return{
            "card_id": self.card_id,
            "question_id": self.question_id,
            "session_id": self.session_id,
            "user_id": self.user_id,
            "concept": self.concept,
            "definition": self.definition,
            "explanation": self.explanation,
            "use_case": self.use_case,
            "avoid_when": self.avoid_when,
            "mnemonic": self.mnemonic,
            "code": self.code,
            "code_language": self.code_language,
            "tags": self.tags or [],
            "difficulty": self.difficulty,
            "created_at": self.created_at.isoformat()
        }