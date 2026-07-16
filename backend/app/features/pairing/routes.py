import logging
from flask import Blueprint, jsonify, g
from app.middleware.auth import require_auth
from app.features.pairing.service import PairingService
from app.features.pairing.repository import PairingRepository
from app.features.pairing.exceptions import (
    SpaceNotFoundException,
    SpaceFullException,
    ForbiddenException
)
from app.extensions import db
from flask import request

logger = logging.getLogger(__name__)

# Assuming your blueprint is already defined somewhere like this:
pairing_bp = Blueprint('pairing', __name__, url_prefix='/api/v1/pairing')

# Instantiate repository and service
repository = PairingRepository(db.session)
service = PairingService(repository)


@pairing_bp.route('/invite', methods=['GET'])
@require_auth
def get_invite():
    """
    Returns the current invite status for the authenticated user's space.
    Used by the Dashboard to determine if it should show the waiting screen.
    """
    try:
        result = service.get_invite_details(g.current_user.id)
        
        if not result:
            logger.warning(f"User {g.current_user.id} requested invite details but is not in a space.")
            return jsonify({"error": "You do not belong to a Space."}), 404
            
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Error fetching invite details: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@pairing_bp.route('/invite/regenerate', methods=['POST'])
@require_auth
def regenerate_invite():
    """
    Generates a new invite code for the space.
    Strictly restricted to the owner while the space has only 1 member.
    """
    try:
        logger.info(f"User {g.current_user.id} attempting to regenerate invite code.")
        result = service.regenerate_invite_code(g.current_user.id)
        
        if not result:
            return jsonify({"error": "You do not belong to a Space."}), 404
            
        # Commit the transaction because the service flushed a database change
        db.session.commit()
        logger.info(f"User {g.current_user.id} successfully regenerated invite code.")
        
        return jsonify(result), 200

    except ForbiddenException as e:
        logger.warning(f"Forbidden: {str(e)}")
        return jsonify({"error": str(e)}), 403
        
    except SpaceFullException as e:
        logger.warning(f"Space Full: {str(e)}")
        return jsonify({"error": str(e)}), 400
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error regenerating invite code: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

# ... (Keep your existing /create, /join, and /status routes intact below this)
@pairing_bp.route('/status', methods=['GET'])
@require_auth
def get_status():
    """Returns the pairing status for the Auth middleware."""
    try:
        return jsonify(service.get_pairing_status(g.current_user.id)), 200
    except Exception as e:
        logger.error(f"Error in status: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@pairing_bp.route('/create', methods=['POST'])
@require_auth
def create_space():
    """Creates a new space for the user."""
    try:
        result = service.create_space(g.current_user.id)
        db.session.commit()
        return jsonify(result), 201
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating space: {str(e)}")
        return jsonify({"error": str(e)}), 400

@pairing_bp.route('/join', methods=['POST'])
@require_auth
def join_space():
    """Joins an existing space using an invite code."""
    try:
        data = request.get_json()
        invite_code = data.get('invite_code')
        
        if not invite_code:
            return jsonify({"error": "Invite code is required"}), 400
            
        result = service.join_space(g.current_user.id, invite_code)
        db.session.commit()
        return jsonify(result), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error joining space: {str(e)}")
        return jsonify({"error": str(e)}), 400
    
