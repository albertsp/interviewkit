import logging

from flask import Blueprint, jsonify
from sqlalchemy import text

from .. import db, limiter

logger = logging.getLogger(__name__)

health = Blueprint('health', __name__)


@health.route('/health', methods=['GET'])
@limiter.exempt
def health_check():
    """Liveness + DB check for the platform's monitor. No auth, no rate limit,
    and no internal details in the response."""
    try:
        db.session.execute(text("SELECT 1"))
    except Exception:
        logger.warning("Health check: the database is not reachable", exc_info=True)
        try:
            db.session.rollback()
        except Exception:
            pass
        return jsonify({"status": "unavailable"}), 503
    return jsonify({"status": "ok"}), 200
