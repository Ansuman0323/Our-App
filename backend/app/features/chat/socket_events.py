import logging
import time
from functools import wraps
from flask import request, current_app
from flask_socketio import emit, join_room, leave_room, disconnect
from app.extensions import socketio, db
from app.features.chat.repository import ChatRepository
from app.features.chat.service import ChatService
from app.features.chat.exceptions import ChatException
from app.features.chat.presence import PresenceManager
import jwt
#from app.middleware.auth import decode_auth_token

logger = logging.getLogger(__name__)
presence_manager = PresenceManager()

def get_chat_service():
    """Instantiates the service with the current request's DB session."""
    return ChatService(ChatRepository(db.session), db.session)

def socket_error_handler(f):
    """Standardizes socket errors to match REST error payloads perfectly."""
    @wraps(f)
    def wrapper(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except ChatException as e:
            return {
                "status": "error",
                "error": {
                    "error_code": e.error_code,
                    "message": str(e),
                    "details": e.details
                }
            }
        except Exception as e:
            logger.error("Unexpected socket error", exc_info=True)
            return {
                "status": "error", 
                "error": {
                    "error_code": "INTERNAL_SERVER_ERROR", 
                    "message": "An internal error occurred."
                }
            }
    return wrapper

def authenticate_socket(auth_payload):
    """Authenticate the socket connection."""

    if not auth_payload or "token" not in auth_payload:
        logger.warning("Socket auth failed: No token provided.")
        return None

    try:
        # Get token from frontend
        token = auth_payload["token"]

        # Print JWT header for debugging
        header = jwt.get_unverified_header(token)
        print("JWT Header:", header)

        # Decode token
        payload = jwt.decode(
            token,
            current_app.config["SECRET_KEY"],
            algorithms=["HS256"]
        )

        print("JWT Payload:", payload)

        return payload.get("sub")

    except Exception as e:
        logger.warning(f"Socket auth failed: {e}")
        return None

# ==========================================
# CONNECTION LIFECYCLE
# ==========================================

@socketio.on('connect')
def handle_connect(auth):
    user_id = authenticate_socket(auth)
    if not user_id:
        logger.warning("Socket connection rejected: Unauthorized", extra={"sid": request.sid})
        return False  # Disconnects immediately
        
    try:
        service = get_chat_service()
        # Verifies membership; throws if not in a space
        space_id = service._verify_space_membership(user_id) 
        
        # Save securely to socket session context
        request.user_id = str(user_id)
        request.space_id = str(space_id)
        request.room_name = f"space_{space_id}"
        request.last_typing_time = 0  # Initialize throttle state
        
        join_room(request.room_name)
        logger.info("Socket connected & room joined", extra={"user_id": request.user_id, "room": request.room_name})
        
        # Presence Tracking
        is_newly_online = presence_manager.add_connection(request.user_id, request.sid)
        if is_newly_online:
            emit('presence_changed', {'user_id': request.user_id, 'status': 'online'}, room=request.room_name, include_self=False)
            
    except ChatException:
        return False

@socketio.on('disconnect')
def handle_disconnect():
    if hasattr(request, 'user_id'):
        is_completely_offline = presence_manager.remove_connection(request.user_id, request.sid)
        leave_room(request.room_name)
        
        if is_completely_offline:
            emit('presence_changed', {'user_id': request.user_id, 'status': 'offline'}, room=request.room_name)
            
        logger.info("Socket disconnected", extra={"user_id": request.user_id, "sid": request.sid})

# ==========================================
# MESSAGE FLOW
# ==========================================

@socketio.on('send_message')
@socket_error_handler
def handle_send_message(payload):
    service = get_chat_service()
    dto, is_created = service.send_message(request.user_id, payload)
    
    if is_created:
        # Broadcast newly created message to room
        emit('receive_message', dto, room=request.room_name, include_self=False)
        
    return {"status": "success", "data": dto}

@socketio.on('edit_message')
@socket_error_handler
def handle_edit_message(payload):
    service = get_chat_service()
    message_id = payload.get('message_id')
    new_content = payload.get('content')
    
    dto = service.edit_message(request.user_id, message_id, new_content)
    emit('message_updated', dto, room=request.room_name, include_self=False)
    
    return {"status": "success", "data": dto}

@socketio.on('delete_message')
@socket_error_handler
def handle_delete_message(payload):
    service = get_chat_service()
    message_id = payload.get('message_id')
    
    dto = service.soft_delete_message(request.user_id, message_id)
    emit('message_updated', dto, room=request.room_name, include_self=False)
    
    return {"status": "success", "data": dto}

# ==========================================
# READ RECEIPTS & TYPING
# ==========================================

@socketio.on('mark_read')
@socket_error_handler
def handle_mark_read(payload):
    service = get_chat_service()
    message_id = payload.get('message_id')
    
    receipt_dto = service.mark_message_read(request.user_id, message_id)
    emit('receipt_updated', receipt_dto, room=request.room_name, include_self=False)
    
    return {"status": "success", "data": receipt_dto}

@socketio.on('typing_start')
def handle_typing_start():
    if hasattr(request, 'room_name'):
        if presence_manager.can_emit_typing(request.sid):
            emit('typing_start', {'user_id': request.user_id}, room=request.room_name, include_self=False)

@socketio.on('typing_stop')
def handle_typing_stop():
    if hasattr(request, 'room_name'):
        presence_manager.reset_typing(request.sid)
        emit('typing_stop', {'user_id': request.user_id}, room=request.room_name, include_self=False)