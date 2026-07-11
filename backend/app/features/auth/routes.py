from flask import Blueprint, request, jsonify, g
from .service import AuthService
from .repository import AuthRepository
from app.extensions import db
from app.middleware.auth import require_auth

auth_bp = Blueprint('auth', __name__)

repository = AuthRepository(db.session)
service = AuthService(repository)

@auth_bp.route('/sync', methods=['POST'])
@require_auth
def sync_user():
    payload = request.get_json() or {}
    
    try:
        user = service.synchronize_user(g.supabase_uid, payload)
        return jsonify({
            "message": "User synchronized successfully",
            "user": {
                "id": str(user.id),
                "email": user.email,
                "display_name": user.display_name,
                "avatar_url": user.avatar_url
            }
        }), 200
    except ValueError as e:
        return jsonify({"error": "Bad Request", "message": str(e)}), 400
    except Exception as e:
        return jsonify({"error": "Internal Server Error", "message": "Failed to sync user"}), 500

@auth_bp.route('/me', methods=['GET'])
@require_auth
def get_current_user():
    user = g.current_user
    return jsonify({
        "id": str(user.id),
        "email": user.email,
        "display_name": user.display_name,
        "avatar_url": user.avatar_url
    }), 200