"""
Tests for app/routes/debug.py: GET /debug/db.

The endpoint runs Postgres-only SQL (information_schema), so the 200 path
must mock `db.session.execute` -- on the SQLite test database the real
query would hit the handler's except branch and return 500.
"""
from unittest.mock import MagicMock


class _FakeResult:
    """Minimal stand-in for a SQLAlchemy Result: iterable for the tables
    query, .scalar() for the COUNT(*) queries."""

    def __init__(self, rows=None, scalar_value=None):
        self._rows = rows or []
        self._scalar_value = scalar_value

    def __iter__(self):
        return iter(self._rows)

    def scalar(self):
        return self._scalar_value


def _headers_without_user(headers):
    """Strip the non-HTTP `user_id` key the auth fixture stashes on the dict."""
    return {k: v for k, v in headers.items() if k != "user_id"}


class TestDbStatus:
    """Tests for GET /debug/db."""

    def test_returns_200_with_exact_json_shape(self, client, auth_headers, monkeypatch):
        """With a valid JWT and (mocked) DB responses, the endpoint must
        return exactly the documented shape -- no extra or missing keys."""
        execute = MagicMock(side_effect=[
            _FakeResult(rows=[("user",), ("session",), ("card",)]),
            _FakeResult(scalar_value=1),
            _FakeResult(scalar_value=2),
            _FakeResult(scalar_value=3),
        ])
        monkeypatch.setattr("app.routes.debug.db.session.execute", execute)

        resp = client.get("/debug/db", headers=_headers_without_user(auth_headers))
        assert resp.status_code == 200

        data = resp.get_json()
        assert data == {
            "db": "connected",
            "tables": ["user", "session", "card"],
            "counts": {"user": 1, "session": 2, "card": 3},
        }
        assert execute.call_count == 4  # 1 tables query + 3 COUNT(*)

    def test_returns_401_without_jwt(self, client):
        """No Authorization header -> rejected before any DB work."""
        resp = client.get("/debug/db")
        assert resp.status_code == 401
