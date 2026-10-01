import os

# Set test env vars BEFORE any app imports
os.environ["FLASK_ENV"] = "test"
os.environ["SECRET_KEY"] = "test-secret-key"
os.environ["JWT_SECRET_KEY"] = "test-jwt-secret-key"
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["CORS_ORIGINS"] = "http://localhost:3000"
os.environ["FRONTEND_URL"] = "http://localhost:3000"
os.environ["JWT_ACCESS_TOKEN_EXPIRES_HOURS"] = "1"
os.environ["GOOGLE_CLIENT_ID"] = "test-google-client-id"
os.environ["GOOGLE_CLIENT_SECRET"] = "test-google-client-secret"
os.environ["GITHUB_CLIENT_ID"] = "test-github-client-id"
os.environ["GITHUB_CLIENT_SECRET"] = "test-github-client-secret"

import pytest
from app import create_app, db as _db
from app.models.user import User
from app.models.oauth_account import OAuthAccount


@pytest.fixture(scope="session")
def app():
    app = create_app()
    app.config.update({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        "JWT_COOKIE_SECURE": False,
        "JWT_COOKIE_CSRF_PROTECT": False,
        "JWT_TOKEN_LOCATION": ["cookies", "headers"],
        "JWT_ACCESS_COOKIE_PATH": "/",
        "JWT_COOKIE_SAMESITE": "Lax",
    })
    return app


@pytest.fixture(scope="function")
def db(app):
    with app.app_context():
        _db.create_all()
        yield _db
        _db.session.remove()
        _db.drop_all()


@pytest.fixture(scope="function")
def client(app, db):
    return app.test_client()


@pytest.fixture(scope="function")
def runner(app):
    return app.test_cli_runner()


@pytest.fixture(scope="function")
def session_headers(client):
    return {"Content-Type": "application/json"}


@pytest.fixture(scope="function")
def auth_headers(app, db):
    """JWT auth headers for a fresh test user. Also exposes the created
    user_id as an attribute on the returned dict, so tests that need to seed
    other rows (sessions, cards, ...) owned by this same user don't have to
    decode the JWT themselves."""
    from flask_jwt_extended import create_access_token
    with app.app_context():
        user = User(name="Test User", email="test@example.com")
        user.password = "hashed_password_here"
        db.session.add(user)
        db.session.commit()

        user_id = user.user_id
        token = create_access_token(identity=str(user_id))

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}",
    }
    headers["user_id"] = user_id
    return headers


@pytest.fixture(scope="function")
def second_user_headers(app, db):
    """A second, distinct user -- used across the suite for cross-user
    isolation tests (user B must never see/edit/delete user A's data)."""
    from flask_jwt_extended import create_access_token
    with app.app_context():
        user = User(name="User B", email="userb@example.com")
        user.password = "hashed_password_here"
        db.session.add(user)
        db.session.commit()

        user_id = user.user_id
        token = create_access_token(identity=str(user_id))

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}",
    }
    headers["user_id"] = user_id
    return headers


@pytest.fixture(scope="function")
def registered_user(client, db):
    payload = {"name": "Test User", "email": "new@example.com", "password": "password123"}
    resp = client.post("/auth/register", json=payload)
    assert resp.status_code == 201
    return payload


@pytest.fixture(scope="function")
def logged_in_client(client, registered_user):
    payload = {"email": registered_user["email"], "password": registered_user["password"]}
    resp = client.post("/auth/login", json=payload)
    assert resp.status_code == 200
    return client
