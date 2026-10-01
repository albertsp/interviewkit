"""Tests for GET /stacks/: the catalogue the frontend uses to build the session selector."""


class TestStacksCatalogue:
    def test_returns_roles_levels_and_topics(self, client, db):
        resp = client.get("/stacks/")
        assert resp.status_code == 200
        body = resp.get_json()
        assert set(body) == {"rol", "level", "topic"}
        assert body["rol"]["Backend"] == ["Python", "SQL", "Java"]
        assert body["level"] == ["Básico", "Intermedio", "Avanzado"]

    def test_every_stack_starts_with_the_catch_all_topic(self, client, db):
        topics = client.get("/stacks/").get_json()["topic"]
        assert topics
        for stack, items in topics.items():
            assert items[0] == "General / Mixto", stack

    def test_topic_names_carry_their_accents(self, client, db):
        """These names are shown to the user in the selector."""
        topics = client.get("/stacks/").get_json()["topic"]
        assert "Gestión de estado" in topics["React"]
        assert "Índices y performance" in topics["SQL"]
        assert "Normalización" in topics["SQL"]
        assert "Concurrencia básica (threads, synchronized)" in topics["Java"]
        assert "Spring básico" in topics["Java"]
