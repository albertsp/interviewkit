"""
Tests for app/routes/sessions.py: POST /sessions/, PATCH
/sessions/<id>/questions/<id>, POST /sessions/<id>/complete.

The AI service (Groq) is always mocked (see the autouse `_mock_ai` fixture
below) -- no test in this file, or in the whole suite, should ever reach
the real Groq API. Rate limiting is real (flask-limiter, in-memory storage)
and reset before/after every test so tests don't bleed into each other.
"""
import pytest
from app import limiter


FAKE_QUESTIONS = {
    "theory": ["t1", "t2"],
    "code": ["q1", "q2", "q3"],
}

FAKE_FEEDBACK = {
    "result": "CORRECT",
    "feedback": "Well done.",
    "card": {
        "concept": "Closures", "definition": "...", "explanation": "...",
        "use_case": "...", "avoid_when": "", "mnemonic": "", "code": "",
        "code_language": "javascript", "tags": [],
    },
}

VALID_PAYLOAD = {"stack": "JavaScript", "level": "Básico", "topic": "General / Mixto"}


@pytest.fixture(autouse=True)
def _mock_ai(monkeypatch):
    """No test should ever call the real Groq API."""
    monkeypatch.setattr("app.routes.sessions.generate_questions", lambda stack, level, topic: dict(FAKE_QUESTIONS))
    monkeypatch.setattr(
        "app.routes.sessions.generate_feedback",
        lambda stack, question, answer, question_type="code": dict(FAKE_FEEDBACK),
    )


@pytest.fixture(autouse=True)
def _reset_rate_limits():
    """Each test gets a fresh `db` fixture (so user ids are reused across
    tests), but the limiter's in-memory storage persists for the whole
    pytest session. Without this reset, an earlier test's counters would
    leak into the next one via the recycled user_id."""
    limiter.reset()
    yield
    limiter.reset()


def _create_session(client, headers, payload=None):
    return client.post("/sessions/", json=payload or VALID_PAYLOAD, headers=headers)


class TestCreateSession:
    def test_create_session_success_returns_theory_then_code_questions(self, client, auth_headers):
        resp = _create_session(client, auth_headers)
        assert resp.status_code == 201
        data = resp.get_json()
        assert len(data["questions"]) == 5
        assert [q["type"] for q in data["questions"]] == ["theory", "theory", "code", "code", "code"]

    def test_create_session_invalid_stack_returns_400_before_calling_ai(self, client, auth_headers, monkeypatch):
        """An invalid stack must be rejected before the AI service is ever
        called -- verified here by making the mock raise if it's reached."""
        def fail_if_called(*args, **kwargs):
            raise AssertionError("generate_questions should not be called for an invalid stack")
        monkeypatch.setattr("app.routes.sessions.generate_questions", fail_if_called)

        resp = client.post("/sessions/", json={"stack": "not-a-stack", "level": "Básico"}, headers=auth_headers)
        assert resp.status_code == 400

    def test_create_session_invalid_level_returns_400(self, client, auth_headers):
        resp = client.post(
            "/sessions/", json={"stack": "JavaScript", "level": "not-a-level"}, headers=auth_headers
        )
        assert resp.status_code == 400

    def test_create_session_without_topic_defaults_to_general(self, client, auth_headers):
        """Backwards compatibility: a client that doesn't send 'topic' (an
        older frontend build, predating this feature) must not break --
        it falls back to the stack's catch-all topic."""
        resp = client.post(
            "/sessions/", json={"stack": "JavaScript", "level": "Básico"}, headers=auth_headers
        )
        assert resp.status_code == 201
        assert resp.get_json()["topic"] == "General / Mixto"

    def test_create_session_with_topic_invalid_for_that_stack_falls_back_to_general(self, client, auth_headers):
        """A topic that exists for a different stack (but not this one)
        must also fall back, not be silently accepted."""
        resp = client.post(
            "/sessions/",
            json={"stack": "JavaScript", "level": "Básico", "topic": "Joins y subqueries"},  # an SQL topic
            headers=auth_headers,
        )
        assert resp.status_code == 201
        assert resp.get_json()["topic"] == "General / Mixto"

    def test_create_session_accepts_the_accented_topic_name(self, client, auth_headers, monkeypatch):
        seen = {}
        monkeypatch.setattr(
            "app.routes.sessions.generate_questions",
            lambda stack, level, topic: seen.update(topic=topic) or dict(FAKE_QUESTIONS),
        )
        resp = client.post(
            "/sessions/",
            json={"stack": "React", "level": "Básico", "topic": "Gestión de estado"},
            headers=auth_headers,
        )
        assert resp.status_code == 201
        assert resp.get_json()["topic"] == "Gestión de estado"
        assert seen["topic"] == "Gestión de estado"

    @pytest.mark.parametrize("stack, old_name, new_name", [
        ("React", "Gestion de estado", "Gestión de estado"),
        ("SQL", "Indices y performance", "Índices y performance"),
        ("SQL", "Normalizacion", "Normalización"),
        ("Java", "Concurrencia basica (threads, synchronized)", "Concurrencia básica (threads, synchronized)"),
        ("Java", "Spring basico", "Spring básico"),
    ])
    def test_create_session_maps_the_old_unaccented_topic_names(self, client, auth_headers, monkeypatch, stack, old_name, new_name):
        """Topic names were corrected to carry their accents. A browser tab
        opened before the change still sends the old name; it must map to the
        right topic instead of silently falling back to 'General / Mixto'."""
        seen = {}
        monkeypatch.setattr(
            "app.routes.sessions.generate_questions",
            lambda stack, level, topic: seen.update(topic=topic) or dict(FAKE_QUESTIONS),
        )
        resp = client.post(
            "/sessions/",
            json={"stack": stack, "level": "Básico", "topic": old_name},
            headers=auth_headers,
        )
        assert resp.status_code == 201
        assert resp.get_json()["topic"] == new_name
        assert seen["topic"] == new_name

    def test_create_session_requires_auth(self, client, db):
        resp = client.post("/sessions/", json=VALID_PAYLOAD)
        assert resp.status_code == 401

    def test_create_session_when_ai_returns_no_questions_is_rolled_back(self, client, auth_headers, monkeypatch):
        """If the AI service returns empty theory AND empty code blocks
        (its documented failure mode -- see ai_service._safe_questions),
        the just-created Session row must be deleted again (no orphan
        session with zero questions left behind) and the endpoint must
        respond with a controlled 503, not a 500 or a fake 201."""
        monkeypatch.setattr(
            "app.routes.sessions.generate_questions", lambda stack, level, topic: {"theory": [], "code": []}
        )
        resp = _create_session(client, auth_headers)
        assert resp.status_code == 503
        assert "error" in resp.get_json()

        from app.models.session import Session
        assert Session.query.count() == 0


class TestAnswerQuestion:
    def test_answer_question_success_saves_answer_and_returns_ai_feedback(self, client, auth_headers):
        created = _create_session(client, auth_headers)
        session_id = created.get_json()["session_id"]
        question_id = created.get_json()["questions"][0]["question_id"]

        resp = client.patch(
            f"/sessions/{session_id}/questions/{question_id}",
            json={"answer": "my answer"},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["result"] == "CORRECT"
        assert data["card"]["concept"] == "Closures"

        from app.models.question import Question
        saved_question = Question.query.filter_by(question_id=question_id).first()
        assert saved_question.answer == "my answer"
        assert saved_question.result == "CORRECT"

    def test_answer_question_over_max_length_returns_400_without_calling_ai(self, client, auth_headers, monkeypatch):
        def fail_if_called(*args, **kwargs):
            raise AssertionError("generate_feedback should not be called for an oversized answer")
        monkeypatch.setattr("app.routes.sessions.generate_feedback", fail_if_called)
        created = _create_session(client, auth_headers)
        session_id = created.get_json()["session_id"]
        question_id = created.get_json()["questions"][0]["question_id"]

        resp = client.patch(
            f"/sessions/{session_id}/questions/{question_id}",
            json={"answer": "a" * 4001},
            headers=auth_headers,
        )

        assert resp.status_code == 400

    def test_answer_question_nonexistent_session_returns_404(self, client, auth_headers):
        resp = client.patch(
            "/sessions/99999/questions/1", json={"answer": "x"}, headers=auth_headers
        )
        assert resp.status_code == 404

    def test_answer_question_session_of_another_user_returns_404(self, client, auth_headers, second_user_headers):
        """Security: user B cannot submit an answer into user A's session."""
        created = _create_session(client, auth_headers)
        session_id = created.get_json()["session_id"]
        question_id = created.get_json()["questions"][0]["question_id"]

        resp = client.patch(
            f"/sessions/{session_id}/questions/{question_id}",
            json={"answer": "hijacked"},
            headers=second_user_headers,
        )
        assert resp.status_code == 404

    def test_answer_question_nonexistent_question_returns_404(self, client, auth_headers):
        created = _create_session(client, auth_headers)
        session_id = created.get_json()["session_id"]

        resp = client.patch(
            f"/sessions/{session_id}/questions/999999", json={"answer": "x"}, headers=auth_headers
        )
        assert resp.status_code == 404

    def test_answer_question_requires_auth(self, client, auth_headers):
        created = _create_session(client, auth_headers)
        session_id = created.get_json()["session_id"]
        question_id = created.get_json()["questions"][0]["question_id"]

        resp = client.patch(f"/sessions/{session_id}/questions/{question_id}", json={"answer": "x"})
        assert resp.status_code == 401


class TestCompleteSession:
    def _create_and_answer_all(self, client, auth_headers, result="CORRECT"):
        created = _create_session(client, auth_headers)
        session_id = created.get_json()["session_id"]
        question_ids = [q["question_id"] for q in created.get_json()["questions"]]
        for qid in question_ids:
            client.patch(
                f"/sessions/{session_id}/questions/{qid}", json={"answer": "x"}, headers=auth_headers
            )
        return session_id, question_ids

    def test_complete_session_awards_xp_and_completion_bonus(self, client, auth_headers):
        """5 questions, all mocked as CORRECT (100 XP each) = 500 XP, plus
        the completion bonus (50 XP) since every question was answered."""
        session_id, _ = self._create_and_answer_all(client, auth_headers)

        resp = client.post(f"/sessions/{session_id}/complete", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["xp_earned"] == 5 * 100 + 50
        assert data["bonus_applied"] is True
        assert data["total_xp"] == data["xp_earned"]
        assert len(data["breakdown"]) == 5

    def test_complete_session_without_answering_everything_gets_no_bonus(self, client, auth_headers):
        created = _create_session(client, auth_headers)
        session_id = created.get_json()["session_id"]
        first_question_id = created.get_json()["questions"][0]["question_id"]

        # Only answer one of the five questions
        client.patch(
            f"/sessions/{session_id}/questions/{first_question_id}",
            json={"answer": "x"},
            headers=auth_headers,
        )

        resp = client.post(f"/sessions/{session_id}/complete", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["bonus_applied"] is False
        assert data["xp_earned"] == 100  # just the one CORRECT answer, no bonus

    def test_complete_session_twice_returns_409_and_does_not_award_xp_again(self, client, auth_headers):
        """Idempotency guard: completing an already-completed session must
        not double-award XP."""
        session_id, _ = self._create_and_answer_all(client, auth_headers)
        first = client.post(f"/sessions/{session_id}/complete", headers=auth_headers)
        xp_after_first = first.get_json()["total_xp"]

        second = client.post(f"/sessions/{session_id}/complete", headers=auth_headers)
        assert second.status_code == 409

        from app.models.user import User
        user_id = auth_headers["user_id"]
        user = User.query.filter_by(user_id=user_id).first()
        assert user.total_xp == xp_after_first

    def test_complete_nonexistent_session_returns_404(self, client, auth_headers):
        resp = client.post("/sessions/99999/complete", headers=auth_headers)
        assert resp.status_code == 404

    def test_complete_session_of_another_user_returns_404(self, client, auth_headers, second_user_headers):
        session_id, _ = self._create_and_answer_all(client, auth_headers)
        resp = client.post(f"/sessions/{session_id}/complete", headers=second_user_headers)
        assert resp.status_code == 404

    def test_complete_session_requires_auth(self, client, auth_headers):
        session_id, _ = self._create_and_answer_all(client, auth_headers)
        resp = client.post(f"/sessions/{session_id}/complete")
        assert resp.status_code == 401


class TestRateLimiting:
    """The Groq free tier budget is shared across the whole app (see
    AUDIT.md F0-2), so on top of the per-user limit there's a global
    'groq_global' limit applied to both create_session and answer_question.
    Only the per-user limit is exercised here, since it's the one reachable
    with a single test client."""

    def test_create_session_blocked_after_per_user_limit(self, client, auth_headers):
        """After 5 session creations within the same hour, the 6th must
        return 429 with the rate-limit error message."""
        for _ in range(5):
            resp = _create_session(client, auth_headers)
            assert resp.status_code == 201

        resp = _create_session(client, auth_headers)
        assert resp.status_code == 429
        assert "limite" in resp.get_json()["error"]

    def test_answer_question_blocked_after_per_user_limit(self, client, auth_headers):
        """answer_question has its own, higher per-user limit (15/hour)."""
        created = _create_session(client, auth_headers)
        session_id = created.get_json()["session_id"]
        question_id = created.get_json()["questions"][0]["question_id"]

        for _ in range(15):
            resp = client.patch(
                f"/sessions/{session_id}/questions/{question_id}",
                json={"answer": "x"},
                headers=auth_headers,
            )
            assert resp.status_code == 200

        resp = client.patch(
            f"/sessions/{session_id}/questions/{question_id}",
            json={"answer": "x"},
            headers=auth_headers,
        )
        assert resp.status_code == 429

    def test_rate_limit_is_scoped_per_user(self, client, auth_headers, second_user_headers):
        """User A hitting their per-user limit must not block user B."""
        for _ in range(5):
            resp = _create_session(client, auth_headers)
            assert resp.status_code == 201
        blocked = _create_session(client, auth_headers)
        assert blocked.status_code == 429

        still_allowed = _create_session(client, second_user_headers)
        assert still_allowed.status_code == 201