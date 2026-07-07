from .. import db
from .session import Session


class Question(db.Model):
    __tablename__ = "question"

    question_id = db.Column(db.Integer, primary_key=True)
    question = db.Column(db.Text(), nullable=False)
    answer = db.Column(db.Text(), nullable=True)
    session_id = db.Column(db.Integer,db.ForeignKey(Session.session_id), index=True)
    feedback = db.Column(db.Text(), nullable=True)
    # Resultado devuelto por la IA: CORRECT, PARTIALLY_CORRECT, INCORRECT
    result = db.Column(db.String(20), nullable=True)
