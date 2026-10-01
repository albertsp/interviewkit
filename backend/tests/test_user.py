"""
Tests for app/routes/user.py: GET /me/stats and GET /me/profile.

Both endpoints are JWT-protected and must only ever return data owned by
the identity embedded in the token. The stats endpoint aggregates sessions,
questions (via a Question->Session join), and cards, so most of the tests
here seed rows directly through the models using the `db` fixture.
"""
from datetime import datetime

import pytest
from flask_jwt_extended import create_access_token
from sqlalchemy import event

from app.models.user import User
from app.models.session import Session
from app.models.question import Question
from app.models.card import Card


# --- Seed helpers (module-level functions, not fixtures) ---


def _seed_session(db, user_id, stack="Python", level="Básico", created_at=None, results=()):
    """Create a session for `user_id` plus one Question per entry in `results`.

    `results` values are stored as-is (use None to leave a question without a
    result). The caller is responsible for committing.
    """
    session_obj = Session(user_id=user_id, stack=stack, level=level)
    if created_at is not None:
        session_obj.created_at = created_at
    db.session.add(session_obj)
    db.session.flush()

    for result in results:
        db.session.add(
            Question(
                question=f"Question for session {session_obj.session_id}",
                session_id=session_obj.session_id,
                result=result,
            )
        )
    db.session.flush()
    return session_obj


def _seed_card(db, user_id, session_id, tags=None, concept="Flashcard"):
    """Create a card owned by `user_id` inside `session_id` with optional tags."""
    card = Card(
        session_id=session_id,
        user_id=user_id,
        concept=concept,
        explanation="An explanation.",
        use_case="A use case.",
        tags=tags,
    )
    db.session.add(card)
    db.session.flush()
    return card


def _headers_without_user(headers):
    """Copy an auth headers dict without the non-HTTP `user_id` key.

    The fixtures stash `user_id` on the dict for seeding; passing it to the
    test client as a header is harmless but noisy, so tests strip it.
    """
    return {k: v for k, v in headers.items() if k != "user_id"}


def _deleted_user_headers(db, app):
    """Issue a still-valid JWT for a user, then delete that user.

    Returns request headers whose token identity no longer exists in the
    database -- the exact edge case both endpoints must answer with 404.
    """
    with app.app_context():
        user = User(name="Ghost User", email="ghost@example.com")
        user.password = "hashed_password_here"
        db.session.add(user)
        db.session.commit()

        token = create_access_token(identity=str(user.user_id))
        db.session.delete(user)
        db.session.commit()

    return {"Content-Type": "application/json", "Authorization": f"Bearer {token}"}


class QueryCounter:
    """Counts SQL statements actually executed on the engine.

    pytest-mock is not a dependency of this project, so instead of patching
    `db.session.execute` (which can miss queries issued through the legacy
    `Model.query` interface), we hook SQLAlchemy's `before_cursor_execute`
    event, which sees every statement regardless of the calling API.
    """

    def __init__(self, engine):
        self.engine = engine
        self.count = 0

    def _on_execute(self, conn, cursor, statement, parameters, context, executemany):
        self.count += 1

    def __enter__(self):
        event.listen(self.engine, "before_cursor_execute", self._on_execute)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        event.remove(self.engine, "before_cursor_execute", self._on_execute)
        return False


class TestGetMyStats:
    """Tests for GET /me/stats."""

    def test_returns_xp_and_level_fields_for_the_authenticated_user(self, client, db, app, auth_headers):
        """XP fields are computed from total_xp (the stored User.level column
        is ignored by the route)."""
        with app.app_context():
            user = User.query.filter_by(user_id=auth_headers["user_id"]).first()
            user.total_xp = 750  # level 2: 500 threshold already crossed
            db.session.commit()

        resp = client.get("/me/stats", headers=_headers_without_user(auth_headers))
        assert resp.status_code == 200

        data = resp.get_json()
        assert data["total_xp"] == 750
        assert data["level"] == 2
        assert data["xp_to_next_level"] == 250  # 1000 - 750
        assert data["progress_in_level"] == 250  # 750 - 500
        assert data["xp_per_level"] == 500

    def test_results_summary_counts_questions_by_result_via_session_join(self, client, db, app, auth_headers):
        """A mix of results across two sessions, plus one question with a NULL
        result that must be excluded from every bucket."""
        user_id = auth_headers["user_id"]
        with app.app_context():
            _seed_session(db, user_id, stack="Python", results=["CORRECT", "CORRECT"])
            _seed_session(db, user_id, stack="JavaScript", results=["PARTIALLY_CORRECT", "INCORRECT", None])
            db.session.commit()

        resp = client.get("/me/stats", headers=_headers_without_user(auth_headers))
        assert resp.status_code == 200

        data = resp.get_json()
        assert data["results_summary"] == {
            "correct": 2,
            "partially_correct": 1,
            "incorrect": 1,
        }

    def test_stacks_stats_groups_sessions_and_cards_by_stack(self, client, db, app, auth_headers):
        """stacks_stats is built from a GROUP BY, so row order is not
        guaranteed -- compare as a dict keyed by stack name."""
        user_id = auth_headers["user_id"]
        with app.app_context():
            py1 = _seed_session(db, user_id, stack="Python", results=["CORRECT"])
            _seed_session(db, user_id, stack="Python", results=["INCORRECT"])
            js1 = _seed_session(db, user_id, stack="JavaScript", results=["CORRECT"])
            _seed_card(db, user_id, py1.session_id, tags=["python"])
            _seed_card(db, user_id, py1.session_id, tags=["decorator"])
            _seed_card(db, user_id, js1.session_id, tags=["javascript"])
            db.session.commit()

        resp = client.get("/me/stats", headers=_headers_without_user(auth_headers))
        assert resp.status_code == 200

        data = resp.get_json()
        stacks = {s["stack"]: s for s in data["stacks_stats"]}
        assert stacks == {
            "Python": {"stack": "Python", "sessions": 2, "cards": 2},
            "JavaScript": {"stack": "JavaScript", "sessions": 1, "cards": 1},
        }
        assert data["sessions_count"] == 3

    def test_recent_sessions_returns_last_five_with_question_breakdown(self, client, db, app, auth_headers):
        """Six sessions with explicit created_at values: only the five newest
        must be returned, ordered descending, each with its own breakdown."""
        user_id = auth_headers["user_id"]
        with app.app_context():
            # Oldest (day 1) -- must be excluded (6 sessions, limit 5).
            _seed_session(db, user_id, created_at=datetime(2026, 1, 1), results=["CORRECT"])
            _seed_session(db, user_id, created_at=datetime(2026, 1, 2))
            _seed_session(db, user_id, created_at=datetime(2026, 1, 3))
            _seed_session(db, user_id, created_at=datetime(2026, 1, 4), results=["CORRECT"])
            _seed_session(db, user_id, created_at=datetime(2026, 1, 5), results=["CORRECT"])
            _seed_session(  # newest (day 6)
                db, user_id, created_at=datetime(2026, 1, 6),
                results=["CORRECT", "PARTIALLY_CORRECT", "INCORRECT"],
            )
            db.session.commit()

        resp = client.get("/me/stats", headers=_headers_without_user(auth_headers))
        assert resp.status_code == 200

        data = resp.get_json()
        recent = data["recent_sessions"]
        assert len(recent) == 5
        assert data["sessions_count"] == 6

        # Strictly descending by created_at, newest first.
        created_ats = [s["created_at"] for s in recent]
        assert created_ats == sorted(created_ats, reverse=True)
        assert created_ats[0] == datetime(2026, 1, 6).isoformat()
        assert created_ats[-1] == datetime(2026, 1, 2).isoformat()
        # The oldest session (day 1) must not appear.
        assert datetime(2026, 1, 1).isoformat() not in created_ats

        # Per-session question breakdown.
        newest = recent[0]
        assert newest["stack"] is not None
        assert newest["level"] == "Básico"
        assert newest["total_questions"] == 3
        assert newest["correct"] == 1
        assert newest["partially_correct"] == 1
        assert newest["incorrect"] == 1

        second = recent[1]  # day 5: one CORRECT question
        assert second["total_questions"] == 1
        assert second["correct"] == 1
        assert second["partially_correct"] == 0
        assert second["incorrect"] == 0

        third = recent[2]  # day 4: one CORRECT question
        assert third["total_questions"] == 1

        fourth = recent[3]  # day 3: no questions at all
        assert fourth["total_questions"] == 0
        assert fourth["correct"] == 0
        assert fourth["partially_correct"] == 0
        assert fourth["incorrect"] == 0

    def test_query_count_does_not_scale_with_number_of_sessions(self, client, db, app, auth_headers):
        """Regression test for the recent_sessions N+1 bug.

        The old implementation issued one extra query per session to build the
        question breakdown. After the fix (a single `Question.session_id.in_`
        query), the total number of SQL statements must stay effectively
        constant whether there are 2 or 6 sessions. We assert both a fixed
        upper bound and that growing the session count barely moves the
        counter -- an N+1 would add ~4 queries when going from 2 to 6.
        """
        user_id = auth_headers["user_id"]
        with app.app_context():
            for i in range(2):
                _seed_session(
                    db, user_id, created_at=datetime(2026, 3, 1 + i),
                    results=["CORRECT", "INCORRECT"],
                )
            db.session.commit()

        with QueryCounter(db.engine) as two_sessions:
            resp = client.get("/me/stats", headers=_headers_without_user(auth_headers))
        assert resp.status_code == 200
        assert two_sessions.count > 0  # the listener was actually attached

        with app.app_context():
            for i in range(4):  # grow to 6 sessions total
                _seed_session(
                    db, user_id, created_at=datetime(2026, 3, 3 + i),
                    results=["CORRECT"],
                )
            db.session.commit()

        with QueryCounter(db.engine) as six_sessions:
            resp = client.get("/me/stats", headers=_headers_without_user(auth_headers))
        assert resp.status_code == 200

        # Fixed upper bound: the endpoint issues ~9-10 queries regardless of
        # how many sessions exist; 25 leaves headroom for driver-level
        # statements (BEGIN/COMMIT) without hiding a per-session query storm.
        assert two_sessions.count <= 25
        assert six_sessions.count <= 25
        # The real regression guard: 4 extra sessions must not add 4 queries.
        assert six_sessions.count <= two_sessions.count + 1

    def test_cards_summary_returns_total_and_top_five_tags(self, client, db, app, auth_headers):
        """Six cards with strictly decreasing tag frequencies (6,5,4,3,2,1):
        top_tags must contain the five most frequent tags in order and drop
        the sixth."""
        user_id = auth_headers["user_id"]
        with app.app_context():
            sess = _seed_session(db, user_id, stack="Python")
            tag_sets = [
                ["A", "B", "C", "D", "E", "F"],
                ["A", "B", "C", "D", "E"],
                ["A", "B", "C", "D"],
                ["A", "B", "C"],
                ["A", "B"],
                ["A"],
            ]
            for i, tags in enumerate(tag_sets):
                _seed_card(db, user_id, sess.session_id, tags=tags, concept=f"Card {i}")
            db.session.commit()

        resp = client.get("/me/stats", headers=_headers_without_user(auth_headers))
        assert resp.status_code == 200

        data = resp.get_json()
        assert data["cards_summary"]["total"] == 6
        assert data["cards_summary"]["top_tags"] == ["A", "B", "C", "D", "E"]

    def test_returns_404_for_a_user_deleted_after_token_issue(self, client, db, app):
        """A cryptographically valid JWT is not enough: if the user row is
        gone (deleted after the token was issued), both stats must 404."""
        resp = client.get("/me/stats", headers=_deleted_user_headers(db, app))
        assert resp.status_code == 404
        assert resp.get_json()["msg"] == "Usuario no encontrado"

    def test_brand_new_user_gets_empty_and_zero_stats(self, client, auth_headers):
        """The fixture user has no sessions and no cards: every aggregate
        must be empty/zero rather than missing or null."""
        resp = client.get("/me/stats", headers=_headers_without_user(auth_headers))
        assert resp.status_code == 200

        data = resp.get_json()
        assert data["total_xp"] == 0
        assert data["level"] == 1
        assert data["progress_in_level"] == 0
        assert data["xp_to_next_level"] == 500
        assert data["results_summary"] == {"correct": 0, "partially_correct": 0, "incorrect": 0}
        assert data["stacks_stats"] == []
        assert data["sessions_count"] == 0
        assert data["recent_sessions"] == []
        assert data["cards_summary"] == {"total": 0, "top_tags": []}

    def test_stats_are_isolated_between_users(self, client, db, app, auth_headers, second_user_headers):
        """User B's stats must contain none of user A's sessions, questions,
        or cards -- and vice versa."""
        user_a = auth_headers["user_id"]
        user_b = second_user_headers["user_id"]
        with app.app_context():
            # Rich data for user A.
            a1 = _seed_session(db, user_a, stack="Python", results=["CORRECT", "CORRECT", "INCORRECT"])
            a2 = _seed_session(db, user_a, stack="JavaScript", results=["CORRECT"])
            _seed_card(db, user_a, a1.session_id, tags=["python"])
            _seed_card(db, user_a, a2.session_id, tags=["javascript"])
            # A little data for user B.
            b1 = _seed_session(db, user_b, stack="React", results=["INCORRECT"])
            _seed_card(db, user_b, b1.session_id, tags=["react"])
            db.session.commit()

        # User B sees exactly B's data.
        resp_b = client.get("/me/stats", headers=_headers_without_user(second_user_headers))
        assert resp_b.status_code == 200
        data_b = resp_b.get_json()
        assert data_b["sessions_count"] == 1
        assert data_b["results_summary"] == {"correct": 0, "partially_correct": 0, "incorrect": 1}
        stacks_b = {s["stack"]: s for s in data_b["stacks_stats"]}
        assert stacks_b == {"React": {"stack": "React", "sessions": 1, "cards": 1}}
        assert len(data_b["recent_sessions"]) == 1
        assert data_b["recent_sessions"][0]["stack"] == "React"
        assert data_b["cards_summary"] == {"total": 1, "top_tags": ["react"]}

        # User A sees exactly A's data (no React leakage).
        resp_a = client.get("/me/stats", headers=_headers_without_user(auth_headers))
        assert resp_a.status_code == 200
        data_a = resp_a.get_json()
        assert data_a["sessions_count"] == 2
        assert data_a["results_summary"] == {"correct": 3, "partially_correct": 0, "incorrect": 1}
        stacks_a = {s["stack"] for s in data_a["stacks_stats"]}
        assert stacks_a == {"Python", "JavaScript"}
        assert data_a["cards_summary"] == {"total": 2, "top_tags": ["python", "javascript"]}

    def test_stats_requires_authentication(self, client):
        """No JWT -> 401 before any database work happens."""
        resp = client.get("/me/stats")
        assert resp.status_code == 401


class TestGetMyProfile:
    """Tests for GET /me/profile."""

    def test_returns_404_for_a_user_deleted_after_token_issue(self, client, db, app):
        """Same edge case as stats: valid JWT, but the user row is gone."""
        resp = client.get("/me/profile", headers=_deleted_user_headers(db, app))
        assert resp.status_code == 404
        assert resp.get_json()["msg"] == "Usuario no encontrado"

    def test_returns_profile_fields_for_existing_user(self, client, db, app, auth_headers):
        """All expected keys with values computed from total_xp."""
        with app.app_context():
            user = User.query.filter_by(user_id=auth_headers["user_id"]).first()
            user.total_xp = 750
            db.session.commit()

        resp = client.get("/me/profile", headers=_headers_without_user(auth_headers))
        assert resp.status_code == 200

        data = resp.get_json()
        assert data["name"] == "Test User"
        assert data["email"] == "test@example.com"
        assert data["total_xp"] == 750
        assert data["level"] == 2
        assert data["progress_in_level"] == 250
        assert data["xp_per_level"] == 500
        assert data["xp_to_next_level"] == 250
        assert set(data.keys()) == {
            "name", "email", "total_xp", "level",
            "progress_in_level", "xp_per_level", "xp_to_next_level",
        }

    def test_requires_authentication(self, client):
        """No JWT -> 401."""
        resp = client.get("/me/profile")
        assert resp.status_code == 401


class TestPatchMyProfile:
    """Tests for PATCH /me/profile (name-only update)."""

    def test_updates_name_and_returns_name_email(self, client, auth_headers):
        """Happy path: 200 with exactly {name, email}; email is never
        part of the writable payload."""
        resp = client.patch(
            "/me/profile",
            json={"name": "Nuevo Nombre"},
            headers=_headers_without_user(auth_headers),
        )
        assert resp.status_code == 200

        data = resp.get_json()
        assert set(data.keys()) == {"name", "email"}
        assert data["name"] == "Nuevo Nombre"
        assert data["email"] == "test@example.com"

    def test_updated_name_is_persisted(self, client, auth_headers):
        """A subsequent GET must return the name written by the PATCH."""
        resp = client.patch(
            "/me/profile",
            json={"name": "Persisted Name"},
            headers=_headers_without_user(auth_headers),
        )
        assert resp.status_code == 200

        resp = client.get("/me/profile", headers=_headers_without_user(auth_headers))
        assert resp.status_code == 200
        assert resp.get_json()["name"] == "Persisted Name"

    def test_name_is_stripped_of_whitespace(self, client, auth_headers):
        """Leading/trailing whitespace is removed before saving."""
        resp = client.patch(
            "/me/profile",
            json={"name": "  Ada Lovelace  "},
            headers=_headers_without_user(auth_headers),
        )
        assert resp.status_code == 200
        assert resp.get_json()["name"] == "Ada Lovelace"

    def test_long_name_is_truncated_to_80_chars(self, client, auth_headers):
        """The model column is String(80) and the handler slices with [:80]."""
        name_80 = "a" * 80
        resp = client.patch(
            "/me/profile",
            json={"name": name_80},
            headers=_headers_without_user(auth_headers),
        )
        assert resp.status_code == 200
        assert resp.get_json()["name"] == name_80  # exactly 80: kept as-is

        resp = client.patch(
            "/me/profile",
            json={"name": "b" * 90},
            headers=_headers_without_user(auth_headers),
        )
        assert resp.status_code == 200
        assert resp.get_json()["name"] == "b" * 80  # 90 -> truncated to 80

    @pytest.mark.parametrize(
        "payload",
        [
            {},  # no body fields at all
            {"other": "x"},  # name key missing
            {"name": None},
            {"name": ""},
            {"name": "   "},  # whitespace-only strips to empty
        ],
        ids=["empty-body", "missing-key", "null", "empty-string", "whitespace"],
    )
    def test_invalid_name_returns_400(self, client, auth_headers, payload):
        """Any payload whose stripped name is empty is rejected with the
        Spanish validation message from the handler."""
        resp = client.patch(
            "/me/profile",
            json=payload,
            headers=_headers_without_user(auth_headers),
        )
        assert resp.status_code == 400
        assert resp.get_json()["msg"] == "El campo name es obligatorio"

    def test_missing_json_content_type_returns_415(self, client, auth_headers):
        """No Content-Type: Flask 3's get_json() rejects the request with
        415 before the handler's `or {}` fallback ever runs."""
        headers = {"Authorization": auth_headers["Authorization"]}
        resp = client.patch("/me/profile", headers=headers)
        assert resp.status_code == 415

    def test_email_in_body_is_ignored(self, client, db, app, auth_headers):
        """Only `name` is read from the payload: an email sent along must
        not overwrite the stored email (response and DB both)."""
        resp = client.patch(
            "/me/profile",
            json={"name": "Updated", "email": "hacker@example.com"},
            headers=_headers_without_user(auth_headers),
        )
        assert resp.status_code == 200
        assert resp.get_json()["email"] == "test@example.com"

        with app.app_context():
            user = User.query.filter_by(user_id=auth_headers["user_id"]).first()
            assert user.email == "test@example.com"
            assert user.name == "Updated"

    def test_returns_404_for_a_user_deleted_after_token_issue(self, client, db, app):
        """Valid JWT whose identity no longer exists -> 404, no update."""
        resp = client.patch(
            "/me/profile",
            json={"name": "Ghost"},
            headers=_deleted_user_headers(db, app),
        )
        assert resp.status_code == 404
        assert resp.get_json()["msg"] == "Usuario no encontrado"

    def test_requires_authentication(self, client):
        """No JWT -> 401 before any body validation runs."""
        resp = client.patch("/me/profile", json={"name": "X"})
        assert resp.status_code == 401

    def test_update_is_isolated_between_users(self, client, db, app, auth_headers, second_user_headers):
        """User A's PATCH must not touch user B, and B can still update
        their own name independently."""
        resp_a = client.patch(
            "/me/profile",
            json={"name": "User A Renamed"},
            headers=_headers_without_user(auth_headers),
        )
        assert resp_a.status_code == 200

        # B still sees their original name.
        resp_b = client.get("/me/profile", headers=_headers_without_user(second_user_headers))
        assert resp_b.status_code == 200
        assert resp_b.get_json()["name"] == "User B"

        # B can rename themselves without affecting A.
        resp_b2 = client.patch(
            "/me/profile",
            json={"name": "User B Renamed"},
            headers=_headers_without_user(second_user_headers),
        )
        assert resp_b2.status_code == 200
        assert resp_b2.get_json()["name"] == "User B Renamed"

        resp_a2 = client.get("/me/profile", headers=_headers_without_user(auth_headers))
        assert resp_a2.get_json()["name"] == "User A Renamed"
