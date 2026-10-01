"""
Tests for app/routes/oauth.py: the _get_or_create_user helper (the core
account-linking logic for Google/GitHub login), _build_login_response, and
the four HTTP routes (/auth/google, /auth/google/callback, /auth/github,
/auth/github/callback).

The real oauth.google / oauth.github clients are never hit: the Authlib
`oauth` object is patched with unittest.mock so these tests run offline and
deterministically.
"""
from unittest.mock import patch, MagicMock

from app.models.user import User
from app.models.oauth_account import OAuthAccount
from app.routes.oauth import _get_or_create_user, _build_login_response


class TestGetOrCreateUser:
    def test_creates_new_user_and_link(self, app, db):
        with app.app_context():
            user = _get_or_create_user(
                provider="google", provider_user_id="12345",
                email="new@example.com", name="New User",
            )
            assert user is not None
            assert user.name == "New User"
            assert user.email == "new@example.com"

            link = OAuthAccount.query.filter_by(provider="google", provider_user_id="12345").first()
            assert link is not None
            assert link.user_id == user.user_id

    def test_returns_existing_user_by_oauth_link(self, app, db):
        with app.app_context():
            first = _get_or_create_user("google", "abc", "first@example.com", "First")
            second = _get_or_create_user("google", "abc", "different@example.com", "Different")
            assert second.user_id == first.user_id

    def test_does_not_auto_link_existing_email_without_prior_oauth_link(self, app, db):
        """Security: an email that already has a password account must NOT
        be silently linked to a new OAuth login without a prior OAuthAccount
        row -- otherwise anyone could take over an existing account just by
        knowing its email and signing in with Google/GitHub."""
        with app.app_context():
            existing = User(name="Existing", email="existing@example.com")
            db.session.add(existing)
            db.session.commit()

            user = _get_or_create_user(
                provider="github", provider_user_id="gh_123",
                email="existing@example.com", name="Should Not Change",
            )
            assert user is None

            link = OAuthAccount.query.filter_by(provider="github", provider_user_id="gh_123").first()
            assert link is None

    def test_handles_orphan_oauth_account(self, app, db):
        """An OAuthAccount whose user_id no longer points to a real User
        (e.g. the user row was deleted) must be cleaned up and a fresh user
        created, instead of crashing on User.query.get(None-ish)."""
        with app.app_context():
            orphan = OAuthAccount(provider="google", provider_user_id="orphan", user_id=9999)
            db.session.add(orphan)
            db.session.commit()

            user = _get_or_create_user(
                provider="google", provider_user_id="orphan",
                email="orphan@example.com", name="Orphan User",
            )
            assert user is not None
            assert user.email == "orphan@example.com"

    def test_provider_user_id_unique_per_provider(self, app, db):
        """The same provider_user_id string can exist once for google and
        once for github without colliding (they're scoped per-provider)."""
        with app.app_context():
            _get_or_create_user("google", "same_id", "a@example.com", "A")
            _get_or_create_user("github", "same_id", "b@example.com", "B")

            assert OAuthAccount.query.filter_by(provider="google", provider_user_id="same_id").count() == 1
            assert OAuthAccount.query.filter_by(provider="github", provider_user_id="same_id").count() == 1

    def test_calling_twice_with_same_identity_is_idempotent(self, app, db):
        with app.app_context():
            first = _get_or_create_user("google", "race", "race@example.com", "Race")
            second = _get_or_create_user("google", "race", "race@example.com", "Race")
            assert second.user_id == first.user_id

    def test_fallback_email_is_stored_as_is(self, app, db):
        with app.app_context():
            user = _get_or_create_user(
                provider="google", provider_user_id="no_email",
                email="google_no_email@users.noreply.google.com", name="No Email",
            )
            assert user.email == "google_no_email@users.noreply.google.com"

    def test_different_provider_user_id_creates_a_different_account(self, app, db):
        with app.app_context():
            fallback_email = "google_old@users.noreply.google.com"
            user1 = _get_or_create_user("google", "old_id", fallback_email, "Old")
            user2 = _get_or_create_user("google", "new_id", "real@example.com", "Real")
            assert user2.user_id != user1.user_id


class TestBuildLoginResponse:
    def test_sets_jwt_cookie(self, app, db):
        with app.app_context():
            user = User(name="Test", email="test@example.com")
            db.session.add(user)
            db.session.commit()

            resp = _build_login_response(user)
            assert resp.status_code == 302
            assert "access_token_cookie" in resp.headers.get("Set-Cookie", "")

    def test_redirect_carries_exchange_code_not_the_jwt(self, app, db):
        """The redirect URL must never contain the JWT itself (browser history,
        logs, Referer). It carries a short-lived, single-purpose exchange code
        in the URL *fragment*, which browsers do not send to any server."""
        with app.app_context():
            user = User(name="Test", email="test@example.com")
            db.session.add(user)
            db.session.commit()

            resp = _build_login_response(user)
            assert resp.location.startswith("http://localhost:3000/auth/callback#code=")
            assert "access_token" not in resp.location
            cookie = resp.headers.get("Set-Cookie", "")
            jwt_value = cookie.split("access_token_cookie=")[1].split(";")[0]
            assert jwt_value not in resp.location


def _code_from(resp):
    return resp.location.split("#code=", 1)[1]


class TestOAuthExchange:
    """Browsers that block third-party cookies (Safari/iOS, Brave, Firefox
    strict, Chrome incognito) never send the API-domain cookie from the
    frontend domain, so OAuth login ended on /login?error=oauth_failed while
    email login (token in localStorage + Authorization header) worked. The
    frontend now trades the redirect's code for a token it can store."""

    def _make_user(self, db):
        user = User(name="Exchange User", email="exchange@example.com")
        db.session.add(user)
        db.session.commit()
        return user

    def test_valid_code_returns_a_working_token(self, app, client, db):
        with app.app_context():
            user = self._make_user(db)
            code = _code_from(_build_login_response(user))

        resp = client.post("/auth/oauth/exchange", json={"code": code})
        assert resp.status_code == 200
        body = resp.get_json()
        assert body["name"] == "Exchange User"
        assert body["token"]

        # The token must authenticate API calls through the Authorization
        # header alone (no cookie), which is how the frontend sends it.
        client.delete_cookie("access_token_cookie")
        profile = client.get("/me/profile", headers={"Authorization": f"Bearer {body['token']}"})
        assert profile.status_code == 200
        assert profile.get_json()["email"] == "exchange@example.com"

    def test_garbage_code_is_rejected(self, client, db):
        resp = client.post("/auth/oauth/exchange", json={"code": "not-a-real-code"})
        assert resp.status_code == 401

    def test_missing_code_is_a_bad_request(self, client, db):
        assert client.post("/auth/oauth/exchange", json={}).status_code == 400
        assert client.post("/auth/oauth/exchange").status_code == 400

    def test_expired_code_is_rejected(self, app, client, db):
        with app.app_context():
            user = self._make_user(db)
            code = _code_from(_build_login_response(user))

        with patch("app.routes.oauth.OAUTH_CODE_MAX_AGE_SECONDS", -1):
            resp = client.post("/auth/oauth/exchange", json={"code": code})
        assert resp.status_code == 401

    def test_code_for_a_deleted_user_is_rejected(self, app, client, db):
        with app.app_context():
            user = self._make_user(db)
            code = _code_from(_build_login_response(user))
            db.session.delete(user)
            db.session.commit()

        assert client.post("/auth/oauth/exchange", json={"code": code}).status_code == 401

    def test_a_jwt_cannot_be_used_as_an_exchange_code(self, app, client, db):
        """The code is signed with a dedicated salt, so an access token (or
        any other signed value) is not accepted in its place."""
        with app.app_context():
            user = self._make_user(db)
            resp = _build_login_response(user)
            cookie = resp.headers.get("Set-Cookie", "")
            jwt_value = cookie.split("access_token_cookie=")[1].split(";")[0]

        assert client.post("/auth/oauth/exchange", json={"code": jwt_value}).status_code == 401


class TestGoogleLogin:
    def test_google_login_redirects(self, client, db):
        with patch("app.routes.oauth.oauth") as mock_oauth:
            mock_google = MagicMock()
            mock_google.authorize_redirect.return_value = MagicMock(status_code=302)
            mock_oauth.google = mock_google

            resp = client.get("/auth/google")
            assert resp.status_code in (200, 302)

    def test_google_login_error_redirects_to_frontend_with_error_flag(self, client, db):
        with patch("app.routes.oauth.oauth") as mock_oauth:
            mock_google = MagicMock()
            mock_google.authorize_redirect.side_effect = Exception("OAuth error")
            mock_oauth.google = mock_google

            resp = client.get("/auth/google")
            assert resp.status_code == 302
            assert "error=oauth_failed" in resp.location


class TestGoogleCallback:
    def test_authorize_access_token_failure_redirects_with_error(self, client, db):
        with patch("app.routes.oauth.oauth") as mock_oauth:
            mock_oauth.google.authorize_access_token.side_effect = Exception("Token error")
            resp = client.get("/auth/google/callback")
            assert resp.status_code == 302
            assert "error=oauth_failed" in resp.location

    def test_userinfo_fetch_failure_redirects_with_error(self, client, db):
        mock_token = {}  # no "userinfo" key -> forces the userinfo() fallback call
        with patch("app.routes.oauth.oauth") as mock_oauth:
            mock_oauth.google.authorize_access_token.return_value = mock_token
            mock_oauth.google.userinfo.side_effect = Exception("Userinfo error")

            resp = client.get("/auth/google/callback")
            assert resp.status_code == 302
            assert "error=oauth_failed" in resp.location

    def test_userinfo_fallback_passes_token_explicitly(self, client, db):
        """When authorize_access_token()'s response has no 'userinfo' key,
        the code falls back to oauth.google.userinfo(token=token) -- some
        Authlib versions don't attach the token to that call automatically,
        which causes a 401 unless it's passed explicitly."""
        mock_token = {"access_token": "ya29.fake-access-token"}
        with patch("app.routes.oauth.oauth") as mock_oauth:
            mock_oauth.google.authorize_access_token.return_value = mock_token
            mock_oauth.google.userinfo.return_value = {
                "sub": "google_explicit", "email": "explicit@example.com", "name": "Explicit User",
            }

            resp = client.get("/auth/google/callback")
            assert resp.status_code == 302

            mock_oauth.google.userinfo.assert_called_once()
            _, kwargs = mock_oauth.google.userinfo.call_args
            assert kwargs.get("token") is mock_token

    def test_missing_sub_in_userinfo_redirects_with_error(self, client, db):
        """'sub' (the provider's stable user id) is required; without it we
        can't reliably identify the user across logins."""
        mock_token = {"userinfo": {"name": "No Sub"}}
        with patch("app.routes.oauth.oauth") as mock_oauth:
            mock_oauth.google.authorize_access_token.return_value = mock_token

            resp = client.get("/auth/google/callback")
            assert resp.status_code == 302
            assert "error=oauth_failed" in resp.location

    def test_successful_full_flow_creates_user_and_link_and_sets_cookie(self, client, db):
        mock_token = {
            "userinfo": {"sub": "google_user_1", "email": "googleuser@example.com", "name": "Google User"}
        }
        with patch("app.routes.oauth.oauth") as mock_oauth:
            mock_oauth.google.authorize_access_token.return_value = mock_token

            resp = client.get("/auth/google/callback")
            assert resp.status_code == 302
            assert "/auth/callback" in resp.location
            assert "access_token_cookie" in resp.headers.get("Set-Cookie", "")

        with client.application.app_context():
            user = User.query.filter_by(email="googleuser@example.com").first()
            assert user is not None
            assert user.name == "Google User"

            link = OAuthAccount.query.filter_by(provider="google", provider_user_id="google_user_1").first()
            assert link is not None
            assert link.user_id == user.user_id

    def test_missing_email_falls_back_to_a_synthetic_noreply_address(self, client, db):
        mock_token = {"userinfo": {"sub": "no_email_user", "name": "No Email User"}}
        with patch("app.routes.oauth.oauth") as mock_oauth:
            mock_oauth.google.authorize_access_token.return_value = mock_token

            resp = client.get("/auth/google/callback")
            assert resp.status_code == 302
            assert "/auth/callback" in resp.location

        with client.application.app_context():
            user = User.query.filter_by(email="google_no_email_user@users.noreply.google.com").first()
            assert user is not None
            assert user.name == "No Email User"

    def test_missing_name_falls_back_to_email_local_part(self, client, db):
        mock_token = {"userinfo": {"sub": "no_name_user", "email": "noname@example.com"}}
        with patch("app.routes.oauth.oauth") as mock_oauth:
            mock_oauth.google.authorize_access_token.return_value = mock_token

            resp = client.get("/auth/google/callback")
            assert resp.status_code == 302

        with client.application.app_context():
            user = User.query.filter_by(email="noname@example.com").first()
            assert user is not None
            assert user.name == "noname"

    def test_email_already_registered_with_password_redirects_with_email_exists(self, client, db):
        """Mirrors test_does_not_auto_link_existing_email_without_prior_oauth_link,
        but through the real HTTP callback instead of calling the helper directly."""
        with client.application.app_context():
            existing = User(name="Existing", email="taken@example.com")
            existing.password = "some_hash"
            db.session.add(existing)
            db.session.commit()

        mock_token = {"userinfo": {"sub": "google_new", "email": "taken@example.com", "name": "New Google Login"}}
        with patch("app.routes.oauth.oauth") as mock_oauth:
            mock_oauth.google.authorize_access_token.return_value = mock_token

            resp = client.get("/auth/google/callback")
            assert resp.status_code == 302
            assert "error=email_exists" in resp.location


class TestGitHubLogin:
    def test_github_login_error_redirects_to_frontend_with_error_flag(self, client, db):
        with patch("app.routes.oauth.oauth") as mock_oauth:
            mock_github = MagicMock()
            mock_github.authorize_redirect.side_effect = Exception("GitHub error")
            mock_oauth.github = mock_github

            resp = client.get("/auth/github")
            assert resp.status_code == 302
            assert "error=oauth_failed" in resp.location


class TestGitHubCallback:
    def test_authorize_access_token_failure_redirects_with_error(self, client, db):
        with patch("app.routes.oauth.oauth") as mock_oauth:
            mock_oauth.github.authorize_access_token.side_effect = Exception("Token error")
            resp = client.get("/auth/github/callback")
            assert resp.status_code == 302
            assert "error=oauth_failed" in resp.location

    def test_successful_callback_creates_user_and_link(self, client, db):
        mock_token = MagicMock()
        mock_profile = {"id": 12345, "login": "githubuser", "name": "GitHub User", "email": "github@example.com"}
        mock_emails = [{"email": "github@example.com", "primary": True, "verified": True}]

        def mock_get(url, **kwargs):
            resp = MagicMock()
            if url == "user/emails":
                resp.json.return_value = mock_emails
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
            assert "access_token_cookie" in resp.headers.get("Set-Cookie", "")

        with client.application.app_context():
            user = User.query.filter_by(email="github@example.com").first()
            assert user is not None
            assert user.name == "GitHub User"

            link = OAuthAccount.query.filter_by(provider="github", provider_user_id="12345").first()
            assert link is not None

    def test_primary_email_is_preferred_over_secondary(self, client, db):
        """GitHub can return multiple emails; the primary one must win even
        if it isn't first in the list."""
        mock_token = MagicMock()
        mock_profile = {"id": 67890, "login": "ghuser", "name": "GH User"}
        mock_emails = [
            {"email": "secondary@example.com", "primary": False, "verified": True},
            {"email": "primary@example.com", "primary": True, "verified": True},
        ]

        def mock_get(url, **kwargs):
            resp = MagicMock()
            resp.json.return_value = mock_emails if url == "user/emails" else mock_profile
            resp.ok = True
            return resp

        with patch("app.routes.oauth.oauth") as mock_oauth:
            mock_oauth.github.authorize_access_token.return_value = mock_token
            mock_oauth.github.get.side_effect = mock_get

            resp = client.get("/auth/github/callback")
            assert resp.status_code == 302

        with client.application.app_context():
            user = User.query.filter_by(email="primary@example.com").first()
            assert user is not None

    def test_no_public_email_falls_back_to_synthetic_noreply_address(self, client, db):
        mock_token = MagicMock()
        mock_profile = {"id": 11111, "login": "noemail"}

        def mock_get(url, **kwargs):
            resp = MagicMock()
            resp.json.return_value = [] if url == "user/emails" else mock_profile
            resp.ok = True
            return resp

        with patch("app.routes.oauth.oauth") as mock_oauth:
            mock_oauth.github.authorize_access_token.return_value = mock_token
            mock_oauth.github.get.side_effect = mock_get

            resp = client.get("/auth/github/callback")
            assert resp.status_code == 302

        with client.application.app_context():
            user = User.query.filter_by(email="github_11111@users.noreply.github.com").first()
            assert user is not None
