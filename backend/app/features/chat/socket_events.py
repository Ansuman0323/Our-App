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
from app.middleware.auth import verify_supabase_token
from app.models.user import User
from app.models.space_member import SpaceMember

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
    """Authenticates the socket using the shared REST JWT helper."""
    if not auth_payload or 'token' not in auth_payload:
        return None
    try:
        # Rely entirely on the shared helper for validation and error raising
        payload = verify_supabase_token(auth_payload['token'])
        return payload.get('sub')
    except Exception as e:
        logger.warning(f"Socket auth failed: {str(e)}")
        return None
    
# ==========================================
# CONNECTION LIFECYCLE
# ==========================================

@socketio.on("connect")
def handle_connect(auth):
    supabase_uid = authenticate_socket(auth)
    if not supabase_uid:
        return False

    user = User.query.filter_by(supabase_uid=supabase_uid).first()
    if not user or not user.space_membership:
        return False

    active_space = user.space_membership.space_id
    
    # 1 & 2. Authenticate and Join Room (Restoring vital request context)
    request.user_id = str(user.id)
    request.room_name = str(active_space)
    join_room(request.room_name)
    
    # 3. Register connection in PresenceManager
    is_newly_online = presence_manager.add_connection(request.user_id, request.sid)
    
    # 4. Notify existing users that this user is online
    if is_newly_online:
        emit('presence_changed', {'user_id': request.user_id, 'status': 'online'}, room=request.room_name, include_self=False)
        
    # 5. Immediately determine whether the partner is already online
    partner = SpaceMember.query.filter(
        SpaceMember.space_id == active_space, 
        SpaceMember.user_id != user.id
    ).first()
    
    # 6. Send the current partner status ONLY to the newly connected client
    if partner and presence_manager.is_online(partner.user_id):
        emit('presence_changed', {'user_id': str(partner.user_id), 'status': 'online'}, to=request.sid)

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
    print("SEND_MESSAGE EVENT RECEIVED")
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