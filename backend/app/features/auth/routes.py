from flask import Blueprint, request, jsonify
from .service import AuthService
from .repository import AuthRepository
from app.extensions import db

auth_bp = Blueprint('auth', __name__)

# Dependency Injection setup
repository = AuthRepository(db.session)
service = AuthService(repository)

@auth_bp.route('/ping', methods=['GET'])
def ping():
    """Health check placeholder."""
    return jsonify({"message": "Auth feature module ready."}), 200