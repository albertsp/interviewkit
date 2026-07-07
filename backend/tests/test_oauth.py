import json
from unittest.mock import patch, MagicMock

from app.models.user import User
from app.models.oauth_account import OAuthAccount
from app.routes.oauth import _get_or_create_user, _build_login_response


class TestGetOrCreateUser:
    def test_creates_new_user_and_link(self, app, db):
        with app.app_context():
            user = _get_or_create_user(
                provider="google",
                provider_user_id="12345",
                email="new@example.com",
                name="New User",
            )
            assert user is not None
            assert user.name == "New User"
            assert user.email == "new@example.com"

            link = OAuthAccount.query.filter_by(
                provider="google", provider_user_id="12345"
            ).first()
            assert link is not None
            assert link.user_id == user.user_id

    def test_returns_existing_user_by_oauth_link(self, app, db):
        with app.app_context():
            first = _get_or_create_user("google", "abc", "first@example.com", "First")
            second = _get_or_create_user("google", "abc", "different@example.com", "Different")
            assert second.user_id == first.user_id

    def test_links_to_existing_user_by_email(self, app, db):
        with app.app_context():
            existing = User(name="Existing", email="existing@example.com")
            db.session.add(existing)
            db.session.commit()

            user = _get_or_create_user(
                provider="github",
                provider_user_id="gh_123",
                email="existing@example.com",
                name="Should Not Change",
            )
            assert user.user_id == existing.user_id
            assert user.name == "Existing"

            link = OAuthAccount.query.filter_by(
                provider="github", provider_user_id="gh_123"
            ).first()
            assert link is not None
            assert link.user_id == existing.user_id

    def test_handles_orphan_oauth_account(self, app, db):
        with app.app_context():
            orphan = OAuthAccount(provider="google", provider_user_id="orphan", user_id=9999)
            db.session.add(orphan)
            db.session.commit()

            user = _get_or_create_user(
                provider="google",
                provider_user_id="orphan",
                email="orphan@example.com",
                name="Orphan User",
            )
            assert user is not None
            assert user.email == "orphan@example.com"

    def test_provider_user_id_unique_per_provider(self, app, db):
        with app.app_context():
            _get_or_create_user("google", "same_id", "a@example.com", "A")
            _get_or_create_user("github", "same_id", "b@example.com", "B")

            google_count = OAuthAccount.query.filter_by(
                provider="google", provider_user_id="same_id"
            ).count()
            github_count = OAuthAccount.query.filter_by(
                provider="github", provider_user_id="same_id"
            ).count()
            assert google_count == 1
            assert github_count == 1

    def test_race_condition_duplicate(self, app, db):
        with app.app_context():
            first = _get_or_create_user("google", "race", "race@example.com", "Race")
            second = _get_or_create_user("google", "race", "race@example.com", "Race")
            assert second.user_id == first.user_id

    def test_fallback_email(self, app, db):
        with app.app_context():
            user = _get_or_create_user(
                provider="google",
                provider_user_id="no_email",
                email="google_no_email@users.noreply.google.com",
                name="No Email",
            )
            assert user.email == "google_no_email@users.noreply.google.com"

    def test_google_fallback_then_real_email(self, app, db):
        with app.app_context():
            fallback_email = "google_old@users.noreply.google.com"
            user1 = _get_or_create_user("google", "old_id", fallback_email, "Old")

            user2 = _get_or_create_user("google", "new_id", "real@example.com", "Real")
            assert user2.user_id != user1.user_id


class TestBuildLoginResponse:
    def test_sets_jwt_cookie_and_token_param(self, app, db):
        with app.app_context():
            user = User(name="Test", email="test@example.com")
            db.session.add(user)
            db.session.commit()

            resp = _build_login_response(user)
            assert resp.status_code == 302
            assert "access_token_cookie" in resp.headers.get("Set-Cookie", "")
            assert "token=" in resp.location

    def test_redirects_to_frontend_with_token(self, app, db):
        with app.app_context():
            user = User(name="Test", email="test@example.com")
            db.session.add(user)
            db.session.commit()

            resp = _build_login_response(user)
            assert "http://localhost:3000/auth/callback" in resp.location
            assert "token=" in resp.location


class TestGoogleLogin:
    def test_google_login_redirects(self, client, db):
        with patch("app.routes.oauth.oauth") as mock_oauth:
            mock_google = MagicMock()
            mock_google.authorize_redirect.return_value = MagicMock(status_code=302)
            mock_oauth.google = mock_google

            resp = client.get("/auth/google")
            assert resp.status_code in (200, 302)

    def test_google_login_error_redirects_to_frontend(self, client, db):
        with patch("app.routes.oauth.oauth") as mock_oauth:
            mock_google = MagicMock()
            mock_google.authorize_redirect.side_effect = Exception("OAuth error")
            mock_oauth.google = mock_google

            resp = client.get("/auth/google")
            assert resp.status_code == 302
            assert "error=oauth_failed" in resp.location


class TestGoogleCallback:
    def test_callback_authorize_access_token_fails(self, client, db):
        with patch("app.routes.oauth.oauth") as mock_oauth:
            mock_oauth.google.authorize_access_token.side_effect = Exception("Token error")
            resp = client.get("/auth/google/callback")
            assert resp.status_code == 302
            assert "error=oauth_failed" in resp.location

    def test_callback_userinfo_fails(self, client, db):
        mock_token = {}
        with patch("app.routes.oauth.oauth") as mock_oauth:
            mock_oauth.google.authorize_access_token.return_value = mock_token
            mock_oauth.google.userinfo.side_effect = Exception("Userinfo error")

            resp = client.get("/auth/google/callback")
            assert resp.status_code == 302
            assert "error=oauth_failed" in resp.location

    def test_callback_userinfo_passes_token_explicitly(self, client, db):
        """El fallback de userinfo() debe recibir el token para que
        Authlib lo adjunte en la peticion a Google."""
        mock_token = {"access_token": "ya29.fake-access-token"}
        with patch("app.routes.oauth.oauth") as mock_oauth:
            mock_oauth.google.authorize_access_token.return_value = mock_token
            mock_oauth.google.userinfo.return_value = {
                "sub": "google_explicit",
                "email": "explicit@example.com",
                "name": "Explicit User",
            }

            resp = client.get("/auth/google/callback")
            assert resp.status_code == 302

            mock_oauth.google.userinfo.assert_called_once()
            # Verificamos que el token se pasa como argumento keyword
            _, kwargs = mock_oauth.google.userinfo.call_args
            assert kwargs.get("token") is mock_token

    def test_callback_userinfo_missing_sub(self, client, db):
        mock_token = {"userinfo": {"name": "No Sub"}}
        with patch("app.routes.oauth.oauth") as mock_oauth:
            mock_oauth.google.authorize_access_token.return_value = mock_token

            resp = client.get("/auth/google/callback")
            assert resp.status_code == 302
            assert "error=oauth_failed" in resp.location

    def test_callback_successful_full_flow(self, client, db):
        mock_token = {
            "userinfo": {
                "sub": "google_user_1",
                "email": "googleuser@example.com",
                "name": "Google User",
            }
        }
        with patch("app.routes.oauth.oauth") as mock_oauth:
            mock_oauth.google.authorize_access_token.return_value = mock_token

            resp = client.get("/auth/google/callback")
            assert resp.status_code == 302
            assert "/auth/callback" in resp.location
            assert "token=" in resp.location
            assert "access_token_cookie" in resp.headers.get("Set-Cookie", "")

        with client.application.app_context():
            user = User.query.filter_by(email="googleuser@example.com").first()
            assert user is not None
            assert user.name == "Google User"

            link = OAuthAccount.query.filter_by(
                provider="google", provider_user_id="google_user_1"
            ).first()
            assert link is not None
            assert link.user_id == user.user_id

    def test_callback_without_email_uses_fallback(self, client, db):
        mock_token = {
            "userinfo": {
                "sub": "no_email_user",
                "name": "No Email User",
            }
        }
        with patch("app.routes.oauth.oauth") as mock_oauth:
            mock_oauth.google.authorize_access_token.return_value = mock_token

            resp = client.get("/auth/google/callback")
            assert resp.status_code == 302
            assert "/auth/callback" in resp.location
            assert "token=" in resp.location

        with client.application.app_context():
            user = User.query.filter_by(
                email="google_no_email_user@users.noreply.google.com"
            ).first()
            assert user is not None
            assert user.name == "No Email User"

    def test_callback_without_name_uses_email(self, client, db):
        mock_token = {
            "userinfo": {
                "sub": "no_name_user",
                "email": "noname@example.com",
            }
        }
        with patch("app.routes.oauth.oauth") as mock_oauth:
            mock_oauth.google.authorize_access_token.return_value = mock_token

            resp = client.get("/auth/google/callback")
            assert resp.status_code == 302

        with client.application.app_context():
            user = User.query.filter_by(email="noname@example.com").first()
            assert user is not None
            assert user.name == "noname"


class TestGitHubLogin:
    def test_github_login_error_redirects(self, client, db):
        with patch("app.routes.oauth.oauth") as mock_oauth:
            mock_github = MagicMock()
            mock_github.authorize_redirect.side_effect = Exception("GitHub error")
            mock_oauth.github = mock_github

            resp = client.get("/auth/github")
            assert resp.status_code == 302
            assert "error=oauth_failed" in resp.location


class TestGitHubCallback:
    def test_callback_authorize_fails(self, client, db):
        with patch("app.routes.oauth.oauth") as mock_oauth:
            mock_oauth.github.authorize_access_token.side_effect = Exception("Token error")
            resp = client.get("/auth/github/callback")
            assert resp.status_code == 302
            assert "error=oauth_failed" in resp.location

    def test_callback_successful(self, client, db):
        mock_token = MagicMock()
        mock_profile = {
            "id": 12345,
            "login": "githubuser",
            "name": "GitHub User",
            "email": "github@example.com",
        }
        mock_emails = [
            {"email": "github@example.com", "primary": True, "verified": True},
        ]

        def mock_get(url, **kwargs):
            resp = MagicMock()
            if url == "user/emails":
                resp.json.return_value = mock_emails
                resp.ok = True
            else:
                resp.json.return_value = mock_profile
                resp.ok = True
            return resp

        with patch("app.routes.oauth.oauth") as mock_oauth:
            mock_oauth.github.authorize_access_token.return_value = mock_token
            mock_oauth.github.get.side_effect = mock_get

            resp = client.get("/auth/github/callback")
            assert resp.status_code == 302
            assert "/auth/callback" in resp.location
            assert "token=" in resp.location
            assert "access_token_cookie" in resp.headers.get("Set-Cookie", "")

        with client.application.app_context():
            user = User.query.filter_by(email="github@example.com").first()
            assert user is not None
            assert user.name == "GitHub User"

            link = OAuthAccount.query.filter_by(
                provider="github", provider_user_id="12345"
            ).first()
            assert link is not None

    def test_callback_primary_email(self, client, db):
        mock_token = MagicMock()
        mock_profile = {"id": 67890, "login": "ghuser", "name": "GH User"}
        mock_emails = [
            {"email": "primary@example.com", "primary": True, "verified": True},
            {"email": "secondary@example.com", "primary": False, "verified": True},
        ]

        mock_user_resp = MagicMock()
        mock_user_resp.json.return_value = mock_profile
        mock_user_resp.ok = True

        mock_emails_resp = MagicMock()
        mock_emails_resp.json.return_value = mock_emails
        mock_emails_resp.ok = True

        def mock_get(url, **kwargs):
            if url == "user":
                return mock_user_resp
            if url == "user/emails":
                return mock_emails_resp
            return MagicMock()

        with patch("app.routes.oauth.oauth") as mock_oauth:
            mock_oauth.github.authorize_access_token.return_value = mock_token
            mock_oauth.github.get.side_effect = mock_get

            resp = client.get("/auth/github/callback")
            assert resp.status_code == 302

        with client.application.app_context():
            user = User.query.filter_by(email="primary@example.com").first()
            assert user is not None

    def test_callback_fallback_email(self, client, db):
        mock_token = MagicMock()
        mock_profile = {"id": 11111, "login": "noemail"}
        mock_user_resp = MagicMock()
        mock_user_resp.json.return_value = mock_profile
        mock_user_resp.ok = True

        mock_emails_resp = MagicMock()
        mock_emails_resp.json.return_value = []
        mock_emails_resp.ok = True

        def mock_get(url, **kwargs):
            if url == "user":
                return mock_user_resp
            if url == "user/emails":
                return mock_emails_resp
            return MagicMock()

        with patch("app.routes.oauth.oauth") as mock_oauth:
            mock_oauth.github.authorize_access_token.return_value = mock_token
            mock_oauth.github.get.side_effect = mock_get

            resp = client.get("/auth/github/callback")
            assert resp.status_code == 302

        with client.application.app_context():
            user = User.query.filter_by(
                email="github_11111@users.noreply.github.com"
            ).first()
            assert user is not None
