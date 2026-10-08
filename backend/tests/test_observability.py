"""
Tests for /health, the logging setup and the opt-in Sentry init.
"""
import logging

import pytest

from app import _configure_logging, _init_sentry


class TestHealth:
    def test_returns_200_ok_without_authentication(self, client):
        resp = client.get("/health")

        assert resp.status_code == 200
        assert resp.get_json() == {"status": "ok"}

    def test_is_not_rate_limited(self, client):
        assert all(client.get("/health").status_code == 200 for _ in range(60))

    def test_returns_503_without_details_when_the_database_fails(self, client, db, monkeypatch, caplog):
        def boom(*args, **kwargs):
            raise RuntimeError("secret-host:5432 refused the connection")

        monkeypatch.setattr(db.session, "execute", boom)

        with caplog.at_level("WARNING", logger="app.routes.health"):
            resp = client.get("/health")

        assert resp.status_code == 503
        assert resp.get_json() == {"status": "unavailable"}
        assert "secret-host" not in resp.get_data(as_text=True)
        assert "database is not reachable" in caplog.text

    def test_503_even_if_the_rollback_fails_too(self, client, db, monkeypatch):
        def boom(*args, **kwargs):
            raise RuntimeError("down")

        monkeypatch.setattr(db.session, "execute", boom)
        monkeypatch.setattr(db.session, "rollback", boom)

        assert client.get("/health").status_code == 503


@pytest.fixture
def clean_root_logger():
    """Empties the root logger when the test body starts (pytest attaches its
    own capture handlers right before it) and restores it afterwards."""
    root = logging.getLogger()
    saved_level = root.level
    saved_handlers = root.handlers[:]

    def isolate():
        saved_handlers[:] = root.handlers
        root.handlers = []
        return root

    yield isolate
    for handler in root.handlers:
        handler.close()
    root.handlers, root.level = saved_handlers, saved_level


class TestConfigureLogging:
    def test_defaults_to_info_with_timestamp_and_logger_name(self, clean_root_logger, monkeypatch):
        monkeypatch.delenv("LOG_LEVEL", raising=False)
        root = clean_root_logger()

        _configure_logging()

        assert root.level == logging.INFO
        (handler,) = root.handlers
        fmt = handler.formatter._fmt
        assert "%(asctime)s" in fmt and "%(name)s" in fmt

    def test_level_comes_from_log_level_case_insensitive(self, clean_root_logger, monkeypatch):
        monkeypatch.setenv("LOG_LEVEL", "debug")
        root = clean_root_logger()

        _configure_logging()

        assert root.level == logging.DEBUG

    @pytest.mark.parametrize("value", ["nope", "", "  "])
    def test_invalid_level_falls_back_to_info(self, clean_root_logger, monkeypatch, value):
        monkeypatch.setenv("LOG_LEVEL", value)
        root = clean_root_logger()

        _configure_logging()

        assert root.level == logging.INFO

    def test_does_not_stack_handlers_when_the_root_already_has_one(self, clean_root_logger, monkeypatch):
        monkeypatch.delenv("LOG_LEVEL", raising=False)
        root = clean_root_logger()
        existing = logging.NullHandler()
        root.addHandler(existing)

        _configure_logging()
        _configure_logging()

        assert root.handlers == [existing]


class TestSentry:
    def test_not_initialized_without_a_dsn(self, monkeypatch):
        calls = []
        monkeypatch.delenv("SENTRY_DSN", raising=False)
        monkeypatch.setattr("app.sentry_sdk.init", lambda **kwargs: calls.append(kwargs))

        _init_sentry()

        assert calls == []

    def test_blank_dsn_counts_as_missing(self, monkeypatch):
        calls = []
        monkeypatch.setenv("SENTRY_DSN", "")
        monkeypatch.setattr("app.sentry_sdk.init", lambda **kwargs: calls.append(kwargs))

        _init_sentry()

        assert calls == []

    def test_initialized_without_pii_nor_request_bodies(self, monkeypatch):
        calls = []
        monkeypatch.setenv("SENTRY_DSN", "https://key@o0.ingest.sentry.io/1")
        monkeypatch.setattr("app.sentry_sdk.init", lambda **kwargs: calls.append(kwargs))

        _init_sentry()

        (kwargs,) = calls
        assert kwargs["dsn"] == "https://key@o0.ingest.sentry.io/1"
        assert kwargs["send_default_pii"] is False
        assert kwargs["max_request_body_size"] == "never"
