from flask import Blueprint, redirect, url_for, current_app, request
from flask_jwt_extended import create_access_token, set_access_cookies
from authlib.integrations.flask_client import OAuth
from sqlalchemy.exc import IntegrityError
from ..models.user import User
from ..models.oauth_account import OAuthAccount
from .. import db

oauth_bp = Blueprint("oauth", __name__, url_prefix="/auth")

oauth = OAuth()


def _get_or_create_user(provider, provider_user_id, email, name):
    existing = OAuthAccount.query.filter_by(
        provider=provider, provider_user_id=provider_user_id
    ).first()

    if existing:
        user = User.query.get(existing.user_id)
        if user is None:
            db.session.delete(existing)
            db.session.commit()
        else:
            return user

    user_by_email = User.query.filter_by(email=email).first()

    if user_by_email:
        existing_link = OAuthAccount.query.filter_by(
            user_id=user_by_email.user_id, provider=provider
        ).first()

        if not existing_link:
            return None;
        return user_by_email

    new_user = User(name=name, email=email)
    db.session.add(new_user)
    try:
        db.session.flush()
    except IntegrityError:
        db.session.rollback()
        user_by_email = User.query.filter_by(email=email).first()
        if user_by_email:
            return _get_or_create_user(provider, provider_user_id, email, name)
        raise

    link = OAuthAccount(
        user_id=new_user.user_id,
        provider=provider,
        provider_user_id=provider_user_id,
    )
    db.session.add(link)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        User.query.filter_by(user_id=new_user.user_id).delete()
        db.session.commit()
        linked = OAuthAccount.query.filter_by(
            provider=provider, provider_user_id=provider_user_id
        ).first()
        if linked:
            user = User.query.get(linked.user_id)
            if user:
                return user
        return _get_or_create_user(provider, provider_user_id, email, name)

    return new_user


def _build_login_response(user):
    expires_delta = current_app.config["JWT_ACCESS_TOKEN_EXPIRES"]
    access_token = create_access_token(
        identity=str(user.user_id), expires_delta=expires_delta
    )
    frontend_url = current_app.config.get("FRONTEND_URL", "http://localhost:3000")
    response = redirect(f"{frontend_url}/auth/callback")
    set_access_cookies(response, access_token)
    return response


@oauth_bp.route("/google")
def google_login():
    try:
        redirect_uri = url_for("oauth.google_callback", _external=True)
        return oauth.google.authorize_redirect(redirect_uri)
    except Exception:
        frontend_url = current_app.config.get("FRONTEND_URL", "http://localhost:3000")
        return redirect(f"{frontend_url}/login?error=oauth_failed")


@oauth_bp.route("/google/callback")
def google_callback():
    try:
        token = oauth.google.authorize_access_token()
    except Exception as e:
        current_app.logger.warning("google authorize_access_token failed: %s", e)
        frontend_url = current_app.config.get("FRONTEND_URL", "http://localhost:3000")
        return redirect(f"{frontend_url}/login?error=oauth_failed")

    try:
        userinfo = token.get("userinfo")
        if not userinfo:
            try:
                # Pasar el token explicitamente: en algunas versiones de Authlib el
                # token almacenado tras authorize_access_token no se adjunta solo
                # en la llamada a userinfo(), y el endpoint responde 401.
                userinfo = oauth.google.userinfo(token=token)
            except Exception as e:
                current_app.logger.warning("google userinfo fallback failed: %s", e)
                frontend_url = current_app.config.get("FRONTEND_URL", "http://localhost:3000")
                return redirect(f"{frontend_url}/login?error=oauth_failed")

        google_id = str(userinfo["sub"])
        email = userinfo.get("email", "")
        if not email:
            email = f"google_{google_id}@users.noreply.google.com"
        name = userinfo.get("name", email.split("@")[0]) or f"Google User {google_id}"

        user = _get_or_create_user(
            provider="google",
            provider_user_id=google_id,
            email=email,
            name=name,
        )

        if user is None:
            frontend_url = current_app.config.get("FRONTEND_URL", "http://localhost:3000")
            return redirect(f"{frontend_url}/login?error=email_exists")
        
        return _build_login_response(user)
    
    except Exception as e:
        current_app.logger.exception("google callback unhandled error: %s", e)
        frontend_url = current_app.config.get("FRONTEND_URL", "http://localhost:3000")
        return redirect(f"{frontend_url}/login?error=oauth_failed")


@oauth_bp.route("/github")
def github_login():
    try:
        redirect_uri = url_for("oauth.github_callback", _external=True)
        return oauth.github.authorize_redirect(redirect_uri)
    except Exception as e:
        current_app.logger.warning("github authorize_redirect failed: %s", e)
        frontend_url = current_app.config.get("FRONTEND_URL", "http://localhost:3000")
        return redirect(f"{frontend_url}/login?error=oauth_failed")


@oauth_bp.route("/github/callback")
def github_callback():
    try:
        token = oauth.github.authorize_access_token()
    except Exception as e:
        current_app.logger.warning("github authorize_access_token failed: %s", e)
        frontend_url = current_app.config.get("FRONTEND_URL", "http://localhost:3000")
        return redirect(f"{frontend_url}/login?error=oauth_failed")

    try:
        resp = oauth.github.get("user", token=token)
        profile = resp.json()

        github_id = str(profile["id"])
        name = profile.get("name") or profile.get("login", "") or f"GitHub User {github_id}"
        primary_email = None

        emails_resp = oauth.github.get("user/emails", token=token)
        if emails_resp.ok:
            for e in emails_resp.json():
                if e.get("primary"):
                    primary_email = e.get("email")
                    break

        email = primary_email or profile.get("email", "")
        if not email:
            email = f"github_{github_id}@users.noreply.github.com"

        user = _get_or_create_user(
            provider="github",
            provider_user_id=github_id,
            email=email,
            name=name,
        )

        if user is None:
            frontend_url = current_app.config.get("FRONTEND_URL", "http://localhost:3000")
            return redirect(f"{frontend_url}/login?error=email_exists")

        return _build_login_response(user)
    
    except Exception as e:
        current_app.logger.exception("github callback unhandled error: %s", e)
        frontend_url = current_app.config.get("FRONTEND_URL", "http://localhost:3000")
        return redirect(f"{frontend_url}/login?error=oauth_failed")