from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from .config import Config
from flask_cors import CORS
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager, get_jwt_identity
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from authlib.integrations.flask_client import OAuth
from werkzeug.middleware.proxy_fix import ProxyFix


def _rate_limit_key():
    """Identifies the authenticated user for per-user rate limits.
    Falls back to IP if there's no valid JWT on the request (shouldn't
    happen on routes protected with @jwt_required, but avoids a 500 if it does)."""
    try:
        identity = get_jwt_identity()
        if identity:
            return f"user:{identity}"
    except Exception:
        pass
    return get_remote_address()


db = SQLAlchemy()
jwt = JWTManager()
limiter = Limiter(key_func=_rate_limit_key)

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Fix URLs behind a proxy (Fly.io terminates SSL)
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)

    db.init_app(app)
    jwt.init_app(app)

    # Rate limiting (see F0-2 in AUDIT.md): also enabled during tests so the
    # suite exercises the real behavior; tests should call limiter.reset()
    # if they need to start from a clean state.
    app.config.setdefault("RATELIMIT_ENABLED", True)
    limiter.init_app(app)

    @app.errorhandler(429)
    def _rate_limit_exceeded(e):
        return jsonify({"error": "Has alcanzado el limite de peticiones. Intentalo de nuevo mas tarde."}), 429

    from .models.user import User
    from .models.session import Session
    from .models.question import Question
    from .models.card import Card
    from .models.oauth_account import OAuthAccount
    from .routes.auth import auth
    from .routes.oauth import oauth_bp, oauth
    from .routes.stacks import stacks
    from .routes.sessions import sessions
    from .routes.cards import cards
    from .routes.user import user

    Migrate(app, db)

    # OAuth: only register providers whose credentials are actually configured
    has_oauth_provider = (
        (app.config.get("GOOGLE_CLIENT_ID") and app.config.get("GOOGLE_CLIENT_SECRET"))
        or (app.config.get("GITHUB_CLIENT_ID") and app.config.get("GITHUB_CLIENT_SECRET"))
    )

    if has_oauth_provider:
        oauth.init_app(app)

        if app.config.get("GOOGLE_CLIENT_ID") and app.config.get("GOOGLE_CLIENT_SECRET"):
            oauth.register(
                name="google",
                client_id=app.config["GOOGLE_CLIENT_ID"],
                client_secret=app.config["GOOGLE_CLIENT_SECRET"],
                server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
                client_kwargs={"scope": "openid email profile"},
            )

        if app.config.get("GITHUB_CLIENT_ID") and app.config.get("GITHUB_CLIENT_SECRET"):
            oauth.register(
                name="github",
                client_id=app.config["GITHUB_CLIENT_ID"],
                client_secret=app.config["GITHUB_CLIENT_SECRET"],
                access_token_url="https://github.com/login/oauth/access_token",
                authorize_url="https://github.com/login/oauth/authorize",
                api_base_url="https://api.github.com/",
                client_kwargs={"scope": "user:email"},
            )


    # CORS: allowed origins depend on the environment.
    # In dev, if CORS_ORIGINS is empty, fall back to localhost:3000.
    # In production there's no fallback: the app fails to start if CORS_ORIGINS isn't set.
    if Config.FLASK_ENV == "development" and not Config.parse_cors_origins():
        allowed_origins = ["http://localhost:3000"]
    else:
        allowed_origins = Config.parse_cors_origins()

    if not allowed_origins:
        raise RuntimeError(
            "CORS_ORIGINS is required in production. "
            "Set it in your .env or in Fly.io secrets."
        )

    CORS(
        app,
        resources={r"/*": {"origins": allowed_origins}},
        methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"],
        supports_credentials=True,
        max_age=3600,
    )


    app.register_blueprint(auth)
    app.register_blueprint(oauth_bp)
    app.register_blueprint(stacks)
    app.register_blueprint(sessions)
    app.register_blueprint(cards)
    app.register_blueprint(user)

    if Config.FLASK_ENV != "production":
        from .routes.debug import debug
        app.register_blueprint(debug)

    return app