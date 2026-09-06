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
        raise RuntimeError("JWT_SECRET_KEY es obligatorio. Definir en .env o variables de entorno.")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        hours=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_HOURS", "1"))
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # JWT en cookies httpOnly y headers Authorization (para OAuth cross-origin)
    JWT_TOKEN_LOCATION = ["cookies", "headers"]
    JWT_HEADER_NAME = "Authorization"
    JWT_HEADER_TYPE = "Bearer"
    JWT_COOKIE_SECURE = os.getenv("FLASK_ENV") == "production"
    JWT_COOKIE_CSRF_PROTECT = False
    JWT_ACCESS_COOKIE_PATH = "/"
    JWT_COOKIE_SAMESITE = "None" if os.getenv("FLASK_ENV") == "production" else "Lax"

    # Cookie de sesion de Flask (usada por Authlib para guardar el state/nonce
    # del handshake OAuth). Igual que el JWT, en produccion es cross-site
    # (frontend en Vercel, backend en Fly.io), asi que necesita SameSite=None
    # + Secure explicitos; los valores por defecto de Flask no bastan y
    # provocan que el state se pierda en la primera redireccion de vuelta
    # desde Google/GitHub.
    SESSION_COOKIE_SAMESITE = "None" if os.getenv("FLASK_ENV") == "production" else "Lax"
    SESSION_COOKIE_SECURE = os.getenv("FLASK_ENV") == "production"

    GROQ_API_KEY = os.getenv("GROQ_API_KEY")

    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

    GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
    GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")

    # Orígenes permitidos por CORS, separados por comas.
    # Ejemplo dev: "http://localhost:3000"
    # Ejemplo prod: "https://tu-app.vercel.app,https://*.vercel.app"
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "")

    # URL publica del frontend (para redirigir tras OAuth)
    FRONTEND_URL = os.getenv("FRONTEND_URL", "")

    # Modo de la app: "development" | "production" | "test"
    FLASK_ENV = os.getenv("FLASK_ENV", "production")

    # En produccion detras de proxy, forzar HTTPS en las URLs generadas
    PREFERRED_URL_SCHEME = "https" if FLASK_ENV == "production" else "http"

    @staticmethod
    def parse_cors_origins():
        """Convierte 'a,b,c' en ['a','b','c']. Si esta vacio, devuelve lista vacia."""
        raw = (Config.CORS_ORIGINS or "").strip()
        if not raw:
            return []
        return [origin.strip() for origin in raw.split(",") if origin.strip()]