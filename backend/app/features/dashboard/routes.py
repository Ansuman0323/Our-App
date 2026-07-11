import logging
from flask import Blueprint, jsonify, g
from app.middleware.auth import require_auth
from app.extensions import db
from app.features.dashboard.repository import DashboardRepository
from app.features.dashboard.service import DashboardService

logger = logging.getLogger(__name__)
dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api/v1/dashboard')

repository = DashboardRepository(db.session)
service = DashboardService(repository)

@dashboard_bp.route('/', methods=['GET'])
@require_auth
def get_dashboard_home():
    """Returns the aggregated dashboard state and widget placeholders."""
    try:
        data = service.get_home_data(g.current_user.id)
        if not data:
            return jsonify({"error": "User is not part of a space"}), 404
            
        return jsonify(data), 200
    except Exception as e:
        logger.error(f"Error fetching dashboard data: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500