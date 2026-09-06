import os
from datetime import timedelta
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv(usecwd=True))


def _get_database_url():
    url = os.getenv("DATABASE_URL")
    if url and url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    return url


class Config:
    SQLALCHEMY_DATABASE_URI = _get_database_url()
    SECRET_KEY = os.getenv("SECRET_KEY", os.getenv("JWT_SECRET_KEY", "dev-secret-key"))

    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
    if not JWT_SECRET_KEY:
        raise RuntimeError("JWT_SECRET_KEY is required. Set it in .env or the environment variables.")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        hours=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_HOURS", "1"))
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # JWT via httpOnly cookies and Authorization headers (for cross-origin OAuth)
    JWT_TOKEN_LOCATION = ["cookies", "headers"]
    JWT_HEADER_NAME = "Authorization"
    JWT_HEADER_TYPE = "Bearer"
    JWT_COOKIE_SECURE = os.getenv("FLASK_ENV") == "production"
    JWT_COOKIE_CSRF_PROTECT = False
    JWT_ACCESS_COOKIE_PATH = "/"
    JWT_COOKIE_SAMESITE = "None" if os.getenv("FLASK_ENV") == "production" else "Lax"

    # Flask's session cookie (used by Authlib to store the OAuth handshake's
    # state/nonce). Like the JWT, this is cross-site in production (frontend
    # on Vercel, backend on Fly.io), so it needs explicit SameSite=None +
    # Secure; Flask's defaults aren't enough and cause the state to get lost
    # on the redirect back from Google/GitHub.
    SESSION_COOKIE_SAMESITE = "None" if os.getenv("FLASK_ENV") == "production" else "Lax"
    SESSION_COOKIE_SECURE = os.getenv("FLASK_ENV") == "production"

    GROQ_API_KEY = os.getenv("GROQ_API_KEY")

    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

    GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
    GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")

    # Comma-separated CORS origins.
    # Dev example: "http://localhost:3000"
    # Prod example: "https://your-app.vercel.app,https://*.vercel.app"
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "")

    # Public frontend URL (used to redirect after OAuth)
    FRONTEND_URL = os.getenv("FRONTEND_URL", "")

    # App mode: "development" | "production" | "test"
    FLASK_ENV = os.getenv("FLASK_ENV", "production")

    # Behind a proxy in production, force HTTPS in generated URLs
    PREFERRED_URL_SCHEME = "https" if FLASK_ENV == "production" else "http"

    @staticmethod
    def parse_cors_origins():
        """Turns 'a,b,c' into ['a','b','c']. Returns an empty list if blank."""
        raw = (Config.CORS_ORIGINS or "").strip()
        if not raw:
            return []
        return [origin.strip() for origin in raw.split(",") if origin.strip()]