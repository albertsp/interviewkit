"""
Tests for app/routes/auth.py: POST /auth/register, POST /auth/login, POST /auth/logout.

Covers input validation, password hashing behavior, duplicate-email
handling, cookie-based JWT issuance on login, and the OAuth-only-user edge
case (a user created via Google/GitHub has password=None and must not be
able to log in with a password).
"""


class TestRegister:
    def test_register_success(self, client, db):
        payload = {"name": "New User", "email": "new@example.com", "password": "password123"}
        resp = client.post("/auth/register", json=payload)
        assert resp.status_code == 201
        data = resp.get_json()
        assert "success" in data

    def test_register_duplicate_email_returns_409(self, client, registered_user):
        payload = {"name": "Another User", "email": registered_user["email"], "password": "anotherpass1"}
        resp = client.post("/auth/register", json=payload)
        assert resp.status_code == 409
        assert "error" in resp.get_json()

    def test_register_missing_fields_returns_400(self, client, db):
        resp = client.post("/auth/register", json={"name": "", "email": "", "password": ""})
        assert resp.status_code == 400

    def test_register_invalid_email_format_returns_400(self, client, db):
        payload = {"name": "User", "email": "not-an-email", "password": "password123"}
        resp = client.post("/auth/register", json=payload)
        assert resp.status_code == 400

    def test_register_password_below_minimum_length_returns_400(self, client, db):
        """MIN_PASSWORD_LENGTH is 8; a 7-character password must be rejected."""
        payload = {"name": "User", "email": "user@example.com", "password": "1234567"}
        resp = client.post("/auth/register", json=payload)
        assert resp.status_code == 400

    def test_register_password_at_minimum_length_succeeds(self, client, db):
        payload = {"name": "User", "email": "minlen@example.com", "password": "12345678"}
        resp = client.post("/auth/register", json=payload)
        assert resp.status_code == 201

    def test_register_non_json_body_returns_400(self, client, db):
        resp = client.post("/auth/register", data="not json", content_type="text/plain")
        assert resp.status_code in (400, 415)

    def test_register_password_is_hashed_not_stored_in_plaintext(self, client, db):
        """The stored password must be a bcrypt hash, never the raw password."""
        from app.models.user import User
        payload = {"name": "Hash Check", "email": "hashcheck@example.com", "password": "password123"}
        client.post("/auth/register", json=payload)

        saved = User.query.filter_by(email="hashcheck@example.com").first()
        assert saved.password != "password123"
        assert saved.password.startswith("$2b$")  # bcrypt hash prefix

    def test_register_strips_whitespace_from_name_and_email(self, client, db):
        """name/email are .strip()-ped before validation, so surrounding
        whitespace must not block registration nor be persisted."""
        from app.models.user import User
        payload = {"name": "  Padded Name  ", "email": "  padded@example.com  ", "password": "password123"}
        resp = client.post("/auth/register", json=payload)
        assert resp.status_code == 201

        saved = User.query.filter_by(email="padded@example.com").first()
        assert saved is not None
        assert saved.name == "Padded Name"


class TestLogin:
    def test_login_success_sets_jwt_cookie_and_returns_token(self, client, registered_user):
        payload = {"email": registered_user["email"], "password": registered_user["password"]}
        resp = client.post("/auth/login", json=payload)
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["name"] == registered_user["name"]
        assert data["token"]
        assert "access_token_cookie" in resp.headers.get("Set-Cookie", "")

    def test_login_wrong_password_returns_400(self, client, registered_user):
        payload = {"email": registered_user["email"], "password": "wrongpassword1"}
        resp = client.post("/auth/login", json=payload)
        assert resp.status_code == 400
        assert "error" in resp.get_json()

    def test_login_nonexistent_user_returns_400(self, client, db):
        payload = {"email": "noone@example.com", "password": "password123"}
        resp = client.post("/auth/login", json=payload)
        assert resp.status_code == 400

    def test_login_oauth_only_user_cannot_log_in_with_password(self, client, db):
        """A user created via OAuth has password=None. Logging in with any
        password must fail cleanly (400), not raise on .encode('utf-8') against None."""
        from app.models.user import User
        user = User(name="OAuth User", email="oauth@example.com")
        db.session.add(user)
        db.session.commit()

        payload = {"email": "oauth@example.com", "password": "anypassword"}
        resp = client.post("/auth/login", json=payload)
        assert resp.status_code == 400
        assert "error" in resp.get_json()

    def test_login_missing_fields_returns_400(self, client, db):
        resp = client.post("/auth/login", json={"email": "", "password": ""})
        assert resp.status_code == 400

    def test_login_non_json_body_returns_400(self, client, db):
        resp = client.post("/auth/login", data="not json", content_type="text/plain")
        assert resp.status_code in (400, 415)

    def test_login_does_not_leak_whether_email_exists(self, client, registered_user):
        """Both 'wrong password' and 'user does not exist' should return the
        same generic error message, so the API doesn't help an attacker
        enumerate registered emails."""
        wrong_password_resp = client.post(
            "/auth/login", json={"email": registered_user["email"], "password": "wrongpassword1"}
        )
        nonexistent_user_resp = client.post(
            "/auth/login", json={"email": "nobody@example.com", "password": "wrongpassword1"}
        )
        assert wrong_password_resp.get_json()["error"] == nonexistent_user_resp.get_json()["error"]


class TestLogout:
    def test_logout_clears_access_cookie(self, client, db):
        resp = client.post("/auth/logout")
        assert resp.status_code == 200
        # unset_access_cookies expires the cookie by setting Max-Age=0 / a past Expires
        set_cookie_header = resp.headers.get("Set-Cookie", "")
        assert "access_token_cookie" in set_cookie_header