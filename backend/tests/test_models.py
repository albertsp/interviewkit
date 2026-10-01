"""
Tests for the SQLAlchemy models: User, OAuthAccount, Session, Question, Card.

These are pure model/constraint tests -- no HTTP layer involved -- covering
defaults, nullability, uniqueness constraints, and relationships as defined
in app/models/*.py.
"""
import pytest
import bcrypt
from sqlalchemy.exc import IntegrityError

from app.models.user import User
from app.models.oauth_account import OAuthAccount
from app.models.session import Session
from app.models.question import Question
from app.models.card import Card


class TestUserModel:
    def test_create_user(self, db, app):
        with app.app_context():
            user = User(name="Test User", email="test@example.com")
            user.password = bcrypt.hashpw(b"password123", bcrypt.gensalt(12)).decode("utf-8")
            db.session.add(user)
            db.session.commit()

            saved = User.query.filter_by(email="test@example.com").first()
            assert saved is not None
            assert saved.name == "Test User"
            assert saved.total_xp == 0
            assert saved.level == 1

    def test_user_password_is_nullable_for_oauth_only_accounts(self, db, app):
        with app.app_context():
            user = User(name="OAuth User", email="oauth@example.com")
            db.session.add(user)
            db.session.commit()

            saved = User.query.filter_by(email="oauth@example.com").first()
            assert saved.password is None

    def test_user_email_must_be_unique(self, db, app):
        with app.app_context():
            db.session.add(User(name="User 1", email="same@example.com"))
            db.session.commit()

            db.session.add(User(name="User 2", email="same@example.com"))
            with pytest.raises(IntegrityError):
                db.session.commit()

    def test_user_defaults(self, db, app):
        with app.app_context():
            user = User(name="Default User", email="default@example.com")
            db.session.add(user)
            db.session.commit()

            assert user.total_xp == 0
            assert user.level == 1
            assert user.oauth_accounts.count() == 0


class TestOAuthAccountModel:
    def test_create_oauth_account(self, db, app):
        with app.app_context():
            user = User(name="OAuth User", email="oauth-user@example.com")
            db.session.add(user)
            db.session.flush()

            link = OAuthAccount(user_id=user.user_id, provider="google", provider_user_id="google_123")
            db.session.add(link)
            db.session.commit()

            saved = OAuthAccount.query.filter_by(provider="google", provider_user_id="google_123").first()
            assert saved is not None
            assert saved.user_id == user.user_id

    def test_provider_and_provider_user_id_combination_must_be_unique(self, db, app):
        """The uq_oauth_provider_user constraint: the SAME provider_user_id
        cannot be linked twice for the SAME provider, even to different
        users (each provider account maps to exactly one local user)."""
        with app.app_context():
            user1 = User(name="User 1", email="u1@example.com")
            user2 = User(name="User 2", email="u2@example.com")
            db.session.add_all([user1, user2])
            db.session.flush()

            db.session.add(OAuthAccount(user_id=user1.user_id, provider="google", provider_user_id="same_id"))
            db.session.commit()

            db.session.add(OAuthAccount(user_id=user2.user_id, provider="google", provider_user_id="same_id"))
            with pytest.raises(IntegrityError):
                db.session.commit()

    def test_same_provider_user_id_across_different_providers_is_allowed(self, db, app):
        with app.app_context():
            user = User(name="User", email="user@example.com")
            db.session.add(user)
            db.session.flush()

            db.session.add(OAuthAccount(user_id=user.user_id, provider="google", provider_user_id="123"))
            db.session.add(OAuthAccount(user_id=user.user_id, provider="github", provider_user_id="123"))
            db.session.commit()  # must not raise

            assert OAuthAccount.query.filter_by(provider_user_id="123").count() == 2


class TestSessionModel:
    def test_create_session_defaults(self, db, app):
        with app.app_context():
            user = User(name="User", email="sessionowner@example.com")
            db.session.add(user)
            db.session.flush()

            session_obj = Session(user_id=user.user_id, stack="Python", level="Básico", topic="General / Mixto")
            db.session.add(session_obj)
            db.session.commit()

            saved = Session.query.filter_by(session_id=session_obj.session_id).first()
            assert saved.is_completed is False
            assert saved.created_at is not None
            assert saved.feedback is None

    def test_session_topic_is_nullable(self, db, app):
        with app.app_context():
            user = User(name="User", email="notopic@example.com")
            db.session.add(user)
            db.session.flush()

            session_obj = Session(user_id=user.user_id, stack="Python", level="Básico")
            db.session.add(session_obj)
            db.session.commit()  # must not raise: topic has no nullable=False


class TestQuestionModel:
    def test_create_question_defaults_to_code_type(self, db, app):
        """question_type has server_default='code'; a Question created
        without explicitly setting it should still round-trip with that
        value once persisted."""
        with app.app_context():
            user = User(name="User", email="questionowner@example.com")
            db.session.add(user)
            db.session.flush()
            session_obj = Session(user_id=user.user_id, stack="Python", level="Básico")
            db.session.add(session_obj)
            db.session.flush()

            question = Question(question="What is a decorator?", session_id=session_obj.session_id)
            db.session.add(question)
            db.session.commit()
            db.session.refresh(question)

            assert question.question_type == "code"
            assert question.answer is None
            assert question.result is None


class TestCardModel:
    def test_card_serialize_returns_expected_shape(self, db, app):
        with app.app_context():
            user = User(name="User", email="cardowner@example.com")
            db.session.add(user)
            db.session.flush()
            session_obj = Session(user_id=user.user_id, stack="JavaScript", level="Básico")
            db.session.add(session_obj)
            db.session.flush()
            question = Question(question="Explain closures", session_id=session_obj.session_id)
            db.session.add(question)
            db.session.flush()

            card = Card(
                question_id=question.question_id,
                session_id=session_obj.session_id,
                user_id=user.user_id,
                concept="Closures",
                explanation="A closure captures its lexical scope.",
                use_case="Encapsulating private state.",
                difficulty=1,
            )
            db.session.add(card)
            db.session.commit()

            serialized = card.serialize()
            assert serialized["concept"] == "Closures"
            assert serialized["tags"] == []  # None is normalized to an empty list
            assert serialized["difficulty"] == 1
            assert "created_at" in serialized

    def test_card_tags_defaults_to_none_and_serializes_as_empty_list(self, db, app):
        with app.app_context():
            user = User(name="User", email="notags@example.com")
            db.session.add(user)
            db.session.flush()
            session_obj = Session(user_id=user.user_id, stack="Python", level="Básico")
            db.session.add(session_obj)
            db.session.flush()
            question = Question(question="Q", session_id=session_obj.session_id)
            db.session.add(question)
            db.session.flush()

            card = Card(
                question_id=question.question_id, session_id=session_obj.session_id, user_id=user.user_id,
                concept="X", explanation="Y", use_case="Z",
            )
            db.session.add(card)
            db.session.commit()

            assert card.tags is None
            assert card.serialize()["tags"] == []