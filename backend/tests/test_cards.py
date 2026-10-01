"""
Tests for app/routes/cards.py: GET /cards/, POST /cards/, PATCH
/cards/<id>, DELETE /cards/<id>.

All endpoints are protected with @jwt_required() and filter by user_id, so
this file focuses on:
  1. Cross-user isolation (security).
  2. Required-field validation.
  3. Referential integrity (session/question must exist and match).
  4. Edge case for `difficulty` when session.level is not in LEVEL_TO_DIFFICULTY.

Uses the shared `auth_headers` / `second_user_headers` fixtures from
conftest.py (each carries a `user_id` key alongside the HTTP headers).
"""
import pytest
from app.models.session import Session
from app.models.question import Question
from app.models.card import Card


@pytest.fixture
def session_and_question(app, db, auth_headers):
    """Creates a valid Session + Question, owned by the auth_headers user."""
    with app.app_context():
        session_obj = Session(
            user_id=auth_headers["user_id"], stack="JavaScript", level="Básico", topic="General / Mixto"
        )
        db.session.add(session_obj)
        db.session.commit()

        question_obj = Question(
            question="Explain closures", session_id=session_obj.session_id, question_type="code"
        )
        db.session.add(question_obj)
        db.session.commit()

        return {"session_id": session_obj.session_id, "question_id": question_obj.question_id}


VALID_CARD_PAYLOAD_EXTRA = {
    "definition": "A function that remembers its lexical scope.",
    "avoid_when": "",
    "mnemonic": "Closure = backpack with variables",
    "tags": ["javascript", "closures"],
    "code": "function outer() { let x = 1; return () => x; }",
    "code_language": "javascript",
}


def _valid_card_payload(session_id, question_id):
    return {
        "session_id": session_id,
        "question_id": question_id,
        "concept": "Closures",
        "explanation": "A closure captures variables from the enclosing scope.",
        "use_case": "Encapsulating private state inside a module.",
        **VALID_CARD_PAYLOAD_EXTRA,
    }


# ---------------------------------------------------------------------------
# POST /cards/
# ---------------------------------------------------------------------------

class TestCreateCard:
    def test_create_card_success(self, client, auth_headers, session_and_question):
        payload = _valid_card_payload(**session_and_question)
        resp = client.post("/cards/", json=payload, headers=auth_headers)
        assert resp.status_code == 201
        data = resp.get_json()
        assert data["concept"] == "Closures"
        assert "card_id" in data

    def test_create_card_missing_required_fields_returns_400(self, client, auth_headers, session_and_question):
        payload = _valid_card_payload(**session_and_question)
        del payload["use_case"]
        resp = client.post("/cards/", json=payload, headers=auth_headers)
        assert resp.status_code == 400
        assert "msg" in resp.get_json()

    def test_create_card_with_session_of_another_user_returns_404(
        self, client, auth_headers, second_user_headers, session_and_question
    ):
        """Security: you cannot create a card attached to another user's
        session, even if that session_id/question_id genuinely exist in the
        database."""
        payload = _valid_card_payload(**session_and_question)
        resp = client.post("/cards/", json=payload, headers=second_user_headers)
        assert resp.status_code == 404

    def test_create_card_with_nonexistent_session_returns_404(self, client, auth_headers):
        payload = _valid_card_payload(session_id=999999, question_id=1)
        resp = client.post("/cards/", json=payload, headers=auth_headers)
        assert resp.status_code == 404

    def test_create_card_with_question_from_different_session_returns_404(
        self, client, db, app, auth_headers, session_and_question
    ):
        """The question must belong to the SAME session named in the payload,
        not merely exist in the database (this is what
        Question.query.filter_by(question_id=..., session_id=...) enforces)."""
        with app.app_context():
            other_session = Session(user_id=auth_headers["user_id"], stack="Python", level="Básico")
            db.session.add(other_session)
            db.session.commit()
            other_question = Question(question="Q", session_id=other_session.session_id, question_type="code")
            db.session.add(other_question)
            db.session.commit()
            mismatched_question_id = other_question.question_id

        payload = _valid_card_payload(
            session_id=session_and_question["session_id"], question_id=mismatched_question_id
        )
        resp = client.post("/cards/", json=payload, headers=auth_headers)
        assert resp.status_code == 404

    def test_create_card_requires_auth(self, client, db, session_and_question):
        payload = _valid_card_payload(**session_and_question)
        resp = client.post("/cards/", json=payload)
        assert resp.status_code == 401

    def test_create_card_difficulty_is_none_for_an_unrecognized_level(
        self, client, db, app, auth_headers
    ):
        """Real edge case in the code: LEVEL_TO_DIFFICULTY only knows
        'Básico'/'Intermedio'/'Avanzado'. If session.level ever held any
        other value, difficulty silently ends up None instead of raising.
        This shouldn't happen thanks to validation in /sessions/, but if it
        did, the endpoint must not break."""
        with app.app_context():
            weird_session = Session(user_id=auth_headers["user_id"], stack="Python", level="Weird-Level")
            db.session.add(weird_session)
            db.session.commit()
            weird_question = Question(question="Q", session_id=weird_session.session_id, question_type="code")
            db.session.add(weird_question)
            db.session.commit()
            payload = _valid_card_payload(weird_session.session_id, weird_question.question_id)

        resp = client.post("/cards/", json=payload, headers=auth_headers)
        assert resp.status_code == 201
        created = Card.query.filter_by(card_id=resp.get_json()["card_id"]).first()
        assert created.difficulty is None

    def test_create_card_truncates_concept_over_120_chars(self, client, auth_headers, session_and_question):
        payload = _valid_card_payload(**session_and_question)
        payload["concept"] = "x" * 200
        resp = client.post("/cards/", json=payload, headers=auth_headers)
        assert resp.status_code == 201
        created = Card.query.filter_by(card_id=resp.get_json()["card_id"]).first()
        assert len(created.concept) == 120


# ---------------------------------------------------------------------------
# GET /cards/
# ---------------------------------------------------------------------------

class TestGetCards:
    def test_get_cards_returns_only_own_cards(
        self, client, db, app, auth_headers, second_user_headers, session_and_question
    ):
        """Isolation: user B must not see user A's cards."""
        payload = _valid_card_payload(**session_and_question)
        client.post("/cards/", json=payload, headers=auth_headers)

        resp_a = client.get("/cards/", headers=auth_headers)
        resp_b = client.get("/cards/", headers=second_user_headers)

        assert resp_a.status_code == 200
        assert len(resp_a.get_json()) == 1
        assert resp_b.status_code == 200
        assert len(resp_b.get_json()) == 0

    def test_get_cards_requires_auth(self, client, db):
        resp = client.get("/cards/")
        assert resp.status_code == 401

    def test_get_cards_empty_list_when_no_cards(self, client, auth_headers):
        resp = client.get("/cards/", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.get_json() == []


# ---------------------------------------------------------------------------
# PATCH /cards/<id>
# ---------------------------------------------------------------------------

class TestUpdateCard:
    def _create_card(self, client, auth_headers, session_and_question):
        payload = _valid_card_payload(**session_and_question)
        resp = client.post("/cards/", json=payload, headers=auth_headers)
        return resp.get_json()["card_id"]

    def test_update_card_success(self, client, auth_headers, session_and_question):
        card_id = self._create_card(client, auth_headers, session_and_question)
        resp = client.patch(f"/cards/{card_id}", json={"concept": "Updated closures"}, headers=auth_headers)
        assert resp.status_code == 200
        assert resp.get_json()["concept"] == "Updated closures"

    def test_update_nonexistent_card_returns_404(self, client, auth_headers):
        resp = client.patch("/cards/999999", json={"concept": "x"}, headers=auth_headers)
        assert resp.status_code == 404

    def test_update_card_of_another_user_returns_404(
        self, client, auth_headers, second_user_headers, session_and_question
    ):
        """Security: user B cannot edit user A's card. The endpoint returns
        404 (not 403) so it doesn't confirm whether the other user's card
        exists -- documented as a design decision, not a bug."""
        card_id = self._create_card(client, auth_headers, session_and_question)
        resp = client.patch(f"/cards/{card_id}", json={"concept": "Hacked"}, headers=second_user_headers)
        assert resp.status_code == 404

        untouched = Card.query.filter_by(card_id=card_id).first()
        assert untouched.concept != "Hacked"

    def test_update_card_requires_auth(self, client, auth_headers, session_and_question):
        card_id = self._create_card(client, auth_headers, session_and_question)
        resp = client.patch(f"/cards/{card_id}", json={"concept": "x"})
        assert resp.status_code == 401


# ---------------------------------------------------------------------------
# DELETE /cards/<id>
# ---------------------------------------------------------------------------

class TestDeleteCard:
    def _create_card(self, client, auth_headers, session_and_question):
        payload = _valid_card_payload(**session_and_question)
        resp = client.post("/cards/", json=payload, headers=auth_headers)
        return resp.get_json()["card_id"]

    def test_delete_card_success(self, client, auth_headers, session_and_question):
        card_id = self._create_card(client, auth_headers, session_and_question)
        resp = client.delete(f"/cards/{card_id}", headers=auth_headers)
        assert resp.status_code == 200
        assert Card.query.filter_by(card_id=card_id).first() is None

    def test_delete_nonexistent_card_returns_404(self, client, auth_headers):
        resp = client.delete("/cards/999999", headers=auth_headers)
        assert resp.status_code == 404

    def test_delete_card_of_another_user_returns_404_and_does_not_delete(
        self, client, auth_headers, second_user_headers, session_and_question
    ):
        card_id = self._create_card(client, auth_headers, session_and_question)
        resp = client.delete(f"/cards/{card_id}", headers=second_user_headers)
        assert resp.status_code == 404
        assert Card.query.filter_by(card_id=card_id).first() is not None

    def test_delete_card_requires_auth(self, client, auth_headers, session_and_question):
        card_id = self._create_card(client, auth_headers, session_and_question)
        resp = client.delete(f"/cards/{card_id}")
        assert resp.status_code == 401