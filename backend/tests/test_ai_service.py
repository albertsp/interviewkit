import json
from unittest.mock import MagicMock

from app.services import ai_service


def _completion_with(content):
    completion = MagicMock()
    completion.choices = [MagicMock(message=MagicMock(content=content))]
    return completion


class TestGenerateQuestions:
    def test_returns_valid_response_on_first_try(self, monkeypatch):
        valid = json.dumps({"theory": ["t1", "t2"], "code": ["c1", "c2"]})
        mock_create = MagicMock(return_value=_completion_with(valid))
        monkeypatch.setattr(ai_service.client.chat.completions, "create", mock_create)

        result = ai_service.generate_questions("Java", "Básico", "OOP")

        assert result == {"theory": ["t1", "t2"], "code": ["c1", "c2"]}
        assert mock_create.call_count == 1

    def test_retries_once_when_a_block_is_missing(self, monkeypatch):
        incomplete = json.dumps({"theory": ["t1", "t2"], "code": []})
        valid = json.dumps({"theory": ["t1", "t2"], "code": ["c1", "c2"]})
        mock_create = MagicMock(
            side_effect=[_completion_with(incomplete), _completion_with(valid)]
        )
        monkeypatch.setattr(ai_service.client.chat.completions, "create", mock_create)

        result = ai_service.generate_questions("Java", "Básico", "OOP")

        assert result == {"theory": ["t1", "t2"], "code": ["c1", "c2"]}
        assert mock_create.call_count == 2

    def test_falls_back_after_exhausting_retries(self, monkeypatch):
        mock_create = MagicMock(side_effect=Exception("Groq is down"))
        monkeypatch.setattr(ai_service.client.chat.completions, "create", mock_create)

        result = ai_service.generate_questions("Java", "Básico", "OOP")

        assert result == ai_service.FALLBACK_QUESTIONS
        assert mock_create.call_count == ai_service.MAX_QUESTION_ATTEMPTS

    def test_fills_only_the_missing_block_from_the_last_attempt(self, monkeypatch):
        """Si tras agotar reintentos solo falta un bloque, no se descarta el
        bloque que si vino bien en el ultimo intento."""
        incomplete = json.dumps({"theory": ["t1 real", "t2 real"], "code": []})
        mock_create = MagicMock(
            side_effect=[Exception("boom"), _completion_with(incomplete)]
        )
        monkeypatch.setattr(ai_service.client.chat.completions, "create", mock_create)

        result = ai_service.generate_questions("Java", "Básico", "OOP")

        assert result["theory"] == ["t1 real", "t2 real"]
        assert result["code"] == ai_service.FALLBACK_CODE_QUESTIONS
