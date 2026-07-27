import logging
from flask import Blueprint, request, jsonify, g
from app.extensions import db
from app.middleware.auth import require_auth
from app.features.chat.repository import ChatRepository
from app.features.chat.service import ChatService
from app.features.chat.exceptions import ChatException
from app.extensions import socketio

logger = logging.getLogger(__name__)
chat_bp = Blueprint('chat', __name__, url_prefix='/api/v1/chat')

repository = ChatRepository(db.session)
service = ChatService(repository, db.session)

@chat_bp.errorhandler(ChatException)
def handle_chat_exception(e):
    error_mapping = {
        'MessageNotFoundException': 404,
        'UnauthorizedChatActionException': 403,
    }
    status_code = error_mapping.get(e.__class__.__name__, 400)
    
    return jsonify({
        "error_code": e.error_code,
        "message": str(e),
        "details": e.details
    }), status_code

@chat_bp.route('/messages', methods=['POST'])
@require_auth
def send_message():
    # --- TEMPORARY DEBUG LOGGING ---
    print("is_json:", request.is_json)
    print("form:", request.form)
    print("files:", request.files)
    # -------------------------------

    # Handle both JSON (text only) and Form-Data (media)
    if request.is_json:
        payload = request.get_json()
        file = None
    else:
        payload = request.form.to_dict()
        file = request.files.get('file')

    try:
        message_dto, is_created = service.send_message(
            g.current_user.id,
            payload,
            file
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise

    if is_created:
        socketio.emit(
            "receive_message",
            message_dto,
            room=str(message_dto["space_id"]),
            namespace="/"
        )
        print("Broadcasted to room:", message_dto["space_id"])

    status_code = 201 if is_created else 200
    return jsonify(message_dto), status_code

@chat_bp.route('/messages', methods=['GET'])
@require_auth
def get_messages():
    before_message_id = request.args.get('before_message_id')
    limit = min(int(request.args.get('limit', 50)), 100)
    
    messages_dto = service.get_messages(g.current_user.id, before_message_id, limit)
    return jsonify(messages_dto), 200

@chat_bp.route("/messages/<message_id>", methods=["PATCH"])
@require_auth
def edit_message(message_id):
    payload = request.get_json()
    new_content = payload.get("content")

    try:
        dto = service.edit_message(g.current_user.id, message_id, new_content)
        socketio.emit("message_updated", dto, room=str(dto["space_id"]))
        return jsonify(dto), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": type(e).__name__, "message": str(e)}), 400

@chat_bp.route("/messages/<message_id>", methods=["DELETE"])
@require_auth
def delete_message(message_id):
    try:
        service_local = ChatService(ChatRepository(db.session), db.session)
        dto = service_local.soft_delete_message(g.current_user.id, message_id)

        socketio.emit(
            "message_deleted",
            dto,
            room=str(dto.get("space_id")),
            namespace='/'
        )
        return jsonify(dto), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": type(e).__name__, "message": str(e)}), 400

@chat_bp.route("/messages/<message_id>/me", methods=["DELETE"])
@require_auth
def delete_message_for_me(message_id):
    try:
        dto = service.delete_message_for_me(g.current_user.id, message_id)
        return jsonify(dto), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": type(e).__name__, "message": str(e)}), 400
    
@chat_bp.route('/unread', methods=['GET'])
@require_auth
def get_unread():
    summary = service.get_unread_summary(g.current_user.id)
    return jsonify(summary), 200

@chat_bp.route("/receipts", methods=["GET"])
@require_auth
def get_receipts():
    try:
        receipt = service.get_partner_receipt(g.current_user.id)
        return jsonify(receipt), 200
    except Exception:
        import traceback
        traceback.print_exc()
        raise

@chat_bp.route("/messages/<message_id>/reaction", methods=["POST"])
@require_auth
def toggle_reaction(message_id):
    try:
        payload = request.get_json()
        emoji = payload.get("emoji")

        dto = service.toggle_reaction(g.current_user.id, message_id, emoji)
        socketio.emit("message_updated", dto, room=str(dto["space_id"]), namespace="/")
        return jsonify(dto), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": type(e).__name__, "message": str(e)}), 500

@chat_bp.route("/partner", methods=["GET"])
@require_auth
def get_partner():
    partner = service.get_partner(g.current_user.id)
    return jsonify(partner), 200