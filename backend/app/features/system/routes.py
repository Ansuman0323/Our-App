from flask import Blueprint, jsonify

system_bp = Blueprint('system', __name__)


@system_bp.route('/health', methods=['GET'])
def health_check():
    """
    Lightweight liveness probe.
    Intentionally does NOT touch the database, so it responds the
    instant the process is up — even before DB connections are warm.
    Used by the frontend splash screen to detect Render cold starts.
    """
    return jsonify({"status": "ok"}), 200