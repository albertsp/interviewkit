from .. import db
from .user import User
from .session import Session
from .question import Question
from datetime import datetime


class Card(db.Model):
    __tablename__ = "card"

    # Identificador unico de la card
    card_id = db.Column(db.Integer, primary_key=True)
    # FK a la pregunta de la que se genero esta card
    question_id = db.Column(db.Integer, db.ForeignKey(Question.question_id), index=True)
    # FK a la sesion a la que pertenece
    session_id = db.Column(db.Integer, db.ForeignKey(Session.session_id), index=True)
    # FK al usuario propietario
    user_id = db.Column(db.Integer, db.ForeignKey(User.user_id), index=True)
    # Nombre corto del concepto (titulo de la card)
    concept = db.Column(db.String(120), nullable=False)
    # Definicion tecnica en una frase
    definition = db.Column(db.Text(), nullable=True)
    # Aclaracion profunda del concepto
    explanation = db.Column(db.Text(), nullable=False)
    # Caso de uso practico: cuando SI usarlo
    use_case = db.Column(db.Text(), nullable=False)
    # Anti-patron: cuando NO usarlo
    avoid_when = db.Column(db.Text(), nullable=True)
    # Truco mnemotecnico opcional
    mnemonic = db.Column(db.String(200), nullable=True)
    # Chips para clasificar y filtrar (array de strings)
    tags = db.Column(db.JSON(), nullable=True)
    # Snippet de codigo de ejemplo
    code = db.Column(db.Text(), nullable=True)
    # Lenguaje del snippet de codigo
    code_language = db.Column(db.String(50), nullable=True, default="javascript")
    # Dificultad heredada de la sesion: 1=Basico, 2=Intermedio, 3=Avanzado
    difficulty = db.Column(db.Integer(), nullable=True)
    # Fecha de creacion de la card
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