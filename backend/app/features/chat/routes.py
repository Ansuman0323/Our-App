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
    # Route determines HTTP mapping
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
    data = request.get_json()

    message_dto, is_created = service.send_message(g.current_user.id, data)

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
        dto = service.edit_message(
            g.current_user.id,
            message_id,
            new_content
        )

        socketio.emit(
            "message_updated",
            dto,
            room=str(dto["space_id"])
        )

        return jsonify(dto), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            "error": type(e).__name__,
            "message": str(e)
        }), 400

@chat_bp.route('/messages/<message_id>', methods=['DELETE'])
@require_auth
def delete_message(message_id):
    message_dto = service.soft_delete_message(g.current_user.id, message_id)
    return jsonify(message_dto), 200

@chat_bp.route('/unread', methods=['GET'])
@require_auth
def get_unread():
    summary = service.get_unread_summary(g.current_user.id)
    return jsonify(summary), 200