"""
Tests for the ai_call table: one metadata row per real Groq call, retries and
failures included. Groq is never reached: `client.chat.completions.create` is
stubbed, so the real `_call_groq` / `_record_call` path runs.
"""
import itertools
import json
from types import SimpleNamespace
from unittest.mock import MagicMock

import groq
import httpx
import pytest

from app import limiter
from app.models.ai_call import AICall
from app.models.session import Session
from app.services import ai_service
from app.services.ai_service import (
    AIUnavailableError,
    MAX_QUESTION_ATTEMPTS,
    ai_call_context,
    generate_feedback,
    generate_questions,
)

GOOD_QUESTIONS = {"theory": ["T1", "T2"], "code": ["C1", "C2", "C3"]}
GOOD_FEEDBACK = {"result": "CORRECT", "feedback": "Bien.", "card": {}}


def _completion(content, usage=True):
    completion = SimpleNamespace(
        choices=[SimpleNamespace(message=SimpleNamespace(content=content))]
    )
    if usage:
        completion.usage = SimpleNamespace(prompt_tokens=11, completion_tokens=22, total_tokens=33)
    return completion


def _stub_create(monkeypatch, create):
    mock = MagicMock(side_effect=create)
    monkeypatch.setattr(ai_service.client.chat.completions, "create", mock)
    return mock


def _request():
    return httpx.Request("POST", "https://api.groq.com/openai/v1/chat/completions")


def _rate_limit_error():
    response = httpx.Response(429, headers={"retry-after": "5"}, request=_request())
    return groq.RateLimitError("provider error", response=response, body=None)


def _raiser(error):
    def boom(**kwargs):
        raise error
    return boom


def _rows():
    return AICall.query.order_by(AICall.id).all()


@pytest.fixture(autouse=True)
def _reset_rate_limits():
    limiter.reset()
    yield
    limiter.reset()


class TestRecordedRows:
    def test_ok_call_stores_latency_tokens_and_context(self, db, monkeypatch):
        _stub_create(monkeypatch, lambda **kw: _completion(json.dumps(GOOD_FEEDBACK)))

        with ai_call_context(user_id=None, session_id=7):
            generate_feedback("Python", "Q?", "A")

        (row,) = _rows()
        assert row.kind == "feedback"
        assert row.model == ai_service.MODEL
        assert row.status == "ok"
        assert row.stack == "Python"
        assert row.session_id == 7
        assert row.attempt == 1
        assert (row.prompt_tokens, row.completion_tokens, row.total_tokens) == (11, 22, 33)
        assert row.latency_ms >= 0
        assert row.created_at is not None
        assert row.http_status is None and row.error_type is None

    def test_ok_call_without_usage_leaves_tokens_null(self, db, monkeypatch):
        _stub_create(monkeypatch, lambda **kw: _completion(json.dumps(GOOD_FEEDBACK), usage=False))

        generate_feedback("Python", "Q?", "A")

        (row,) = _rows()
        assert row.status == "ok"
        assert row.total_tokens is None

    def test_rate_limited_call_is_recorded_with_429(self, db, monkeypatch):
        _stub_create(monkeypatch, _raiser(_rate_limit_error()))

        with pytest.raises(AIUnavailableError) as exc_info:
            generate_feedback("Python", "Q?", "A")

        assert exc_info.value.status == 429
        (row,) = _rows()
        assert row.status == "rate_limited"
        assert row.http_status == 429
        assert row.error_type == "RateLimitError"
        assert row.total_tokens is None

    def test_timeout_is_recorded_as_timeout_not_connection_error(self, db, monkeypatch):
        _stub_create(monkeypatch, _raiser(groq.APITimeoutError(request=_request())))

        with pytest.raises(AIUnavailableError):
            generate_feedback("Python", "Q?", "A")

        (row,) = _rows()
        assert row.status == "timeout"
        assert row.error_type == "APITimeoutError"

    def test_connection_error_is_recorded(self, db, monkeypatch):
        _stub_create(monkeypatch, _raiser(groq.APIConnectionError(request=_request())))

        with pytest.raises(AIUnavailableError):
            generate_feedback("Python", "Q?", "A")

        assert _rows()[0].status == "connection_error"

    def test_api_error_keeps_the_http_status(self, db, monkeypatch):
        response = httpx.Response(500, request=_request())
        _stub_create(monkeypatch, _raiser(groq.APIStatusError("boom", response=response, body=None)))

        with pytest.raises(AIUnavailableError):
            generate_feedback("Python", "Q?", "A")

        (row,) = _rows()
        assert row.status == "api_error"
        assert row.http_status == 500

    def test_unexpected_error_is_recorded(self, db, monkeypatch):
        _stub_create(monkeypatch, _raiser(RuntimeError("groq down")))

        with pytest.raises(AIUnavailableError):
            generate_feedback("Python", "Q?", "A")

        (row,) = _rows()
        assert row.status == "unexpected_error"
        assert row.error_type == "RuntimeError"

    def test_unreadable_feedback_json_downgrades_an_http_ok_call(self, db, monkeypatch):
        _stub_create(monkeypatch, lambda **kw: _completion("not json at all"))

        with pytest.raises(AIUnavailableError) as exc_info:
            generate_feedback("Python", "Q?", "A")

        assert exc_info.value.status == 502
        (row,) = _rows()
        assert row.status == "unreadable_json"
        assert row.total_tokens == 33  # the HTTP call did go fine

    def test_feedback_json_that_is_not_an_object_is_unreadable(self, db, monkeypatch):
        _stub_create(monkeypatch, lambda **kw: _completion("[1, 2, 3]"))

        with pytest.raises(AIUnavailableError):
            generate_feedback("Python", "Q?", "A")

        assert _rows()[0].status == "unreadable_json"


class TestQuestionAttempts:
    def test_each_retry_gets_its_own_row_with_its_attempt_number(self, db, monkeypatch):
        _stub_create(monkeypatch, lambda **kw: _completion("garbage"))

        with pytest.raises(AIUnavailableError) as exc_info:
            generate_questions("Python", "Básico", "async")

        assert exc_info.value.status == 502
        rows = _rows()
        assert [r.attempt for r in rows] == list(range(1, MAX_QUESTION_ATTEMPTS + 1))
        assert {r.status for r in rows} == {"unreadable_json"}
        assert {(r.kind, r.stack, r.level, r.topic) for r in rows} == {
            ("questions", "Python", "Básico", "async")
        }

    def test_second_attempt_success_leaves_a_failed_and_an_ok_row(self, db, monkeypatch):
        outputs = iter(["garbage", json.dumps(GOOD_QUESTIONS)])
        _stub_create(monkeypatch, lambda **kw: _completion(next(outputs)))

        assert generate_questions("Python", "Básico", None) == GOOD_QUESTIONS

        assert [(r.attempt, r.status) for r in _rows()] == [(1, "unreadable_json"), (2, "ok")]

    def test_valid_json_that_is_not_an_object_is_unreadable(self, db, monkeypatch):
        _stub_create(monkeypatch, lambda **kw: _completion("[1, 2]"))

        with pytest.raises(AIUnavailableError):
            generate_questions("Python", "Básico", None)

        assert {r.status for r in _rows()} == {"unreadable_json"}

    def test_incomplete_but_readable_output_stays_ok(self, db, monkeypatch):
        _stub_create(monkeypatch, lambda **kw: _completion(json.dumps({"theory": ["T1"], "code": []})))

        generate_questions("Python", "Básico", None)

        assert {r.status for r in _rows()} == {"ok"}


class TestRecordingNeverBreaksTheRequest:
    def test_a_failing_write_does_not_break_the_call(self, db, monkeypatch, caplog):
        def broken_row(**kwargs):
            raise RuntimeError("ai_call table is gone")

        monkeypatch.setattr(ai_service, "AICall", broken_row)
        _stub_create(monkeypatch, lambda **kw: _completion(json.dumps(GOOD_FEEDBACK)))

        with caplog.at_level("WARNING", logger="app.services.ai_service"):
            data = generate_feedback("Python", "Q?", "A")

        assert data["result"] == "CORRECT"
        assert "Could not record the AI call" in caplog.text

    def test_a_failing_commit_is_rolled_back_and_the_session_stays_usable(self, db, monkeypatch):
        _stub_create(monkeypatch, lambda **kw: _completion(json.dumps(GOOD_FEEDBACK)))
        real_commit = db.session.commit
        calls = {"n": 0}

        def flaky_commit():
            calls["n"] += 1
            if calls["n"] == 1:
                raise RuntimeError("db hiccup")
            return real_commit()

        monkeypatch.setattr(db.session, "commit", flaky_commit)

        assert generate_feedback("Python", "Q?", "A")["result"] == "CORRECT"
        assert AICall.query.count() == 0  # rolled back, not half-written

        generate_feedback("Python", "Q?", "A")
        assert AICall.query.count() == 1

    def test_failure_while_downgrading_to_unreadable_does_not_break_the_error_path(self, db, monkeypatch):
        _stub_create(monkeypatch, lambda **kw: _completion("garbage"))
        monkeypatch.setattr(
            ai_service.AICall, "query",
            SimpleNamespace(filter_by=_raiser(RuntimeError("no table"))),
        )

        with pytest.raises(AIUnavailableError) as exc_info:
            generate_feedback("Python", "Q?", "A")

        assert exc_info.value.status == 502  # still the usual API error

    def test_rollback_failing_too_is_swallowed(self, db, monkeypatch):
        _stub_create(monkeypatch, lambda **kw: _completion(json.dumps(GOOD_FEEDBACK)))
        monkeypatch.setattr(ai_service, "AICall", _raiser(RuntimeError("x")))
        monkeypatch.setattr(db.session, "rollback", _raiser(RuntimeError("y")))

        assert generate_feedback("Python", "Q?", "A")["result"] == "CORRECT"

    def test_without_an_app_context_nothing_is_written(self, monkeypatch):
        _stub_create(monkeypatch, lambda **kw: _completion(json.dumps(GOOD_FEEDBACK)))

        assert generate_feedback("Python", "Q?", "A")["result"] == "CORRECT"


class TestPrivacy:
    def test_no_user_or_generated_text_is_stored(self, db, monkeypatch):
        question = "PREGUNTA-SECRETA-123"
        answer = "RESPUESTA-SECRETA-456"
        feedback = {"result": "CORRECT", "feedback": "FEEDBACK-SECRETO-789", "card": {"concept": "CONCEPTO-SECRETO"}}
        generated = json.dumps({"theory": ["PREG-GENERADA-1"], "code": []})
        outputs = itertools.chain([json.dumps(feedback)], itertools.repeat(generated))
        _stub_create(monkeypatch, lambda **kw: _completion(next(outputs)))

        generate_feedback("Python", question, answer)
        generate_questions("Python", "Básico", "async")

        rows = _rows()
        assert rows
        dumped = json.dumps(
            [{c.name: str(getattr(r, c.name)) for c in AICall.__table__.columns} for r in rows]
        )
        for secret in (question, answer, "FEEDBACK-SECRETO", "CONCEPTO-SECRETO", "PREG-GENERADA"):
            assert secret not in dumped

    def test_schema_only_has_metadata_columns(self, app):
        assert {c.name for c in AICall.__table__.columns} == {
            "id", "created_at", "kind", "model", "stack", "level", "topic", "user_id",
            "session_id", "attempt", "latency_ms", "prompt_tokens", "completion_tokens",
            "total_tokens", "status", "http_status", "error_type",
        }

    def test_session_id_has_no_foreign_key_and_user_id_sets_null(self, app):
        assert not AICall.__table__.c.session_id.foreign_keys
        (fk,) = AICall.__table__.c.user_id.foreign_keys
        assert fk.ondelete == "SET NULL"


class TestThroughTheRoutes:
    PAYLOAD = {"stack": "JavaScript", "level": "Básico", "topic": "General / Mixto"}

    def test_create_session_records_the_user_and_session(self, client, auth_headers, monkeypatch):
        _stub_create(monkeypatch, lambda **kw: _completion(json.dumps(GOOD_QUESTIONS)))

        resp = client.post("/sessions/", json=self.PAYLOAD, headers=auth_headers)

        assert resp.status_code == 201
        (row,) = _rows()
        assert row.user_id == auth_headers["user_id"]
        assert row.session_id == resp.get_json()["session_id"]
        assert (row.kind, row.status, row.attempt) == ("questions", "ok", 1)

    def test_failed_create_session_keeps_the_record_after_deleting_the_session(
        self, client, auth_headers, monkeypatch
    ):
        _stub_create(monkeypatch, _raiser(_rate_limit_error()))

        resp = client.post("/sessions/", json=self.PAYLOAD, headers=auth_headers)

        assert resp.status_code == 429
        assert resp.headers["Retry-After"] == "5"
        assert Session.query.count() == 0  # create_session still cleans up
        (row,) = _rows()
        assert row.status == "rate_limited"
        assert row.user_id == auth_headers["user_id"]
        assert row.session_id is not None  # kept for correlation, no FK

    def test_a_broken_ai_call_table_does_not_change_the_api_response(
        self, client, auth_headers, monkeypatch
    ):
        _stub_create(monkeypatch, lambda **kw: _completion(json.dumps(GOOD_QUESTIONS)))
        monkeypatch.setattr(ai_service, "AICall", _raiser(RuntimeError("table is gone")))

        resp = client.post("/sessions/", json=self.PAYLOAD, headers=auth_headers)

        assert resp.status_code == 201
        assert len(resp.get_json()["questions"]) == 5

    def test_answer_question_records_a_feedback_row(self, client, auth_headers, monkeypatch):
        _stub_create(monkeypatch, lambda **kw: _completion(json.dumps(GOOD_QUESTIONS)))
        created = client.post("/sessions/", json=self.PAYLOAD, headers=auth_headers).get_json()
        _stub_create(monkeypatch, lambda **kw: _completion(json.dumps(GOOD_FEEDBACK)))

        resp = client.patch(
            f"/sessions/{created['session_id']}/questions/{created['questions'][0]['question_id']}",
            json={"answer": "mi respuesta"},
            headers=auth_headers,
        )

        assert resp.status_code == 200
        row = _rows()[-1]
        assert (row.kind, row.status) == ("feedback", "ok")
        assert row.user_id == auth_headers["user_id"]
        assert row.session_id == created["session_id"]
