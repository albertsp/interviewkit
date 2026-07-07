import pytest
from app import limiter


FAKE_QUESTIONS = [
    "q1", "q2", "q3", "q4", "q5",
]

FAKE_FEEDBACK = {
    "result": "CORRECT",
    "feedback": "Bien hecho.",
    "card": {
        "concept": "Closures", "definition": "...", "explanation": "...",
        "use_case": "...", "avoid_when": "", "mnemonic": "", "code": "",
        "code_language": "javascript", "tags": [],
    },
}

VALID_PAYLOAD = {"stack": "JavaScript", "level": "Básico"}


@pytest.fixture(autouse=True)
def _mock_ai(monkeypatch):
    """Ninguna prueba debe llamar a la API real de Groq."""
    monkeypatch.setattr("app.routes.sessions.generate_questions", lambda stack, level: list(FAKE_QUESTIONS))
    monkeypatch.setattr("app.routes.sessions.generate_feedback", lambda stack, question, answer: dict(FAKE_FEEDBACK))


@pytest.fixture(autouse=True)
def _reset_rate_limits():
    """Cada test parte de un contador limpio: la db (y por tanto el user_id)
    se recrea por test, pero el storage del limiter es compartido en toda
    la sesion de pytest, así que sin este reset un test contaminaria al
    siguiente con su mismo user_id reciclado."""
    limiter.reset()
    yield
    limiter.reset()


class TestCreateSession:
    def test_create_session_success(self, client, auth_headers):
        """Crear sesion con stack/level validos devuelve 201 y 5 preguntas (IA mockeada)."""
        resp = client.post("/sessions/", json=VALID_PAYLOAD, headers=auth_headers)
        assert resp.status_code == 201
        data = resp.get_json()
        assert len(data["questions"]) == 5

    def test_create_session_invalid_stack(self, client, auth_headers):
        """Un stack fuera de VALID_STACKS debe rechazarse con 400 antes de llamar a la IA."""
        resp = client.post("/sessions/", json={"stack": "not-a-stack", "level": "Básico"}, headers=auth_headers)
        assert resp.status_code == 400

    def test_create_session_requires_auth(self, client, db):
        """Sin JWT, el endpoint debe devolver 401 y no crear nada."""
        resp = client.post("/sessions/", json=VALID_PAYLOAD)
        assert resp.status_code == 401


class TestAnswerQuestion:
    def test_answer_question_success(self, client, auth_headers):
        """Responder una pregunta guarda la respuesta y devuelve el feedback/resultado de la IA (mockeada)."""
        created = client.post("/sessions/", json=VALID_PAYLOAD, headers=auth_headers)
        session_id = created.get_json()["session_id"]
        question_id = created.get_json()["questions"][0]["question_id"]

        resp = client.patch(
            f"/sessions/{session_id}/questions/{question_id}",
            json={"answer": "mi respuesta"},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["result"] == "CORRECT"

    def test_answer_question_wrong_session(self, client, auth_headers):
        """Responder en una sesion que no existe (o no es del usuario) debe devolver 404."""
        resp = client.patch(
            "/sessions/99999/questions/1",
            json={"answer": "x"},
            headers=auth_headers,
        )
        assert resp.status_code == 404


class TestRateLimiting:
    """F0-2: el presupuesto de Groq (free tier) es compartido por toda la app,
    asi que ademas del limite por-usuario existe un limite global ('groq_global')
    aplicado a create_session y answer_question. Aqui solo verificamos el limite
    por-usuario (mas facil de alcanzar con un solo cliente de test)."""

    def test_create_session_blocked_after_per_user_limit(self, client, auth_headers):
        """Tras 5 creaciones de sesion en la misma hora, la 6a debe devolver 429
        con el mensaje de limite, segun el limite por-usuario de create_session."""
        for _ in range(5):
            resp = client.post("/sessions/", json=VALID_PAYLOAD, headers=auth_headers)
            assert resp.status_code == 201

        resp = client.post("/sessions/", json=VALID_PAYLOAD, headers=auth_headers)
        assert resp.status_code == 429
        assert "limite" in resp.get_json()["error"]
