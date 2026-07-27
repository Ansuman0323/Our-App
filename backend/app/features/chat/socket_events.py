import logging
from functools import wraps
from flask import request
from flask_socketio import emit, join_room, leave_room
from app.extensions import socketio, db
from app.features.chat.repository import ChatRepository
from app.features.chat.service import ChatService
from app.features.chat.exceptions import ChatException
from app.features.chat.presence import PresenceManager
from app.middleware.auth import verify_supabase_token
from app.models.user import User
from app.models.space_member import SpaceMember
from flask import session
import os

logger = logging.getLogger(__name__)
presence_manager = PresenceManager()

def get_chat_service():
    return ChatService(ChatRepository(db.session), db.session)

def socket_error_handler(f):
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

def require_room(f):
    """
    Guards any handler that depends on the user already belonging to a space.
    A user with no space yet is a valid connection, just not a valid caller
    for room-scoped events.
    """
    @wraps(f)
    def wrapper(*args, **kwargs):
        if not session.get("room_name"):
            return {
                "status": "error",
                "error": {
                    "error_code": "NO_ACTIVE_SPACE",
                    "message": "You must join a Space before doing this."
                }
            }
        return f(*args, **kwargs)
    return wrapper

def authenticate_socket(auth_payload):
    if not auth_payload or 'token' not in auth_payload:
        return None
    try:
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
    logger.info("=" * 60)
    logger.info(f"[SOCKET CONNECT] SID={request.sid} PID={os.getpid()}")

    try:
        supabase_uid = authenticate_socket(auth)
        if not supabase_uid:
            logger.error("[SOCKET CONNECT] Authentication failed")
            return False

        user = User.query.filter_by(supabase_uid=supabase_uid).first()
        if not user:
            logger.error(f"[SOCKET CONNECT] User not found for UID: {supabase_uid}")
            return False

        logger.info(f"[SOCKET CONNECT] Authenticated user: {user.id}")

        session["user_id"] = str(user.id)
        session["room_name"] = None  # default: no space yet, connection is still valid

        # ---------------------------------------------------------
        # No space yet: the socket connects successfully, but there
        # is no room to join and nothing to relay. This is a normal
        # state for a brand-new user, not a rejection condition.
        # ---------------------------------------------------------
        if not user.space_membership:
            logger.info(f"[SOCKET CONNECT] User {user.id} has no space yet — connected, no room joined")
            return True

        active_space = str(user.space_membership.space_id)
        session["room_name"] = active_space
        join_room(active_space)

        logger.info(
            f"""
================ SOCKET CONNECTED ================
SID          : {request.sid}
User ID      : {session['user_id']}
Space        : {active_space}
Worker PID   : {os.getpid()}
Joined Rooms : {socketio.server.rooms(request.sid)}
==================================================
"""
        )

        became_online = presence_manager.add_connection(session["user_id"], request.sid)
        if became_online:
            emit(
                "presence_changed",
                {"user_id": session["user_id"], "status": "online"},
                room=active_space,
                include_self=False
            )

        partner = (
            SpaceMember.query.filter(
                SpaceMember.space_id == active_space,
                SpaceMember.user_id != user.id
            ).first()
        )
        if partner and presence_manager.is_online(str(partner.user_id)):
            emit(
                "presence_changed",
                {"user_id": str(partner.user_id), "status": "online"},
                to=request.sid
            )

        try:
            service = get_chat_service()
            receipt_dto = service.mark_delivered_bulk(user.id)
            if receipt_dto:
                emit("receipt_updated", receipt_dto, room=active_space, include_self=False)
        except Exception:
            logger.exception("[SOCKET CONNECT] Failed while syncing delivery receipts")

        logger.info(f"[SOCKET CONNECT] SUCCESS User={user.id}")
        return True

    except Exception:
        logger.exception("[SOCKET CONNECT] UNHANDLED EXCEPTION")
        return False

@socketio.on('disconnect')
def handle_disconnect():
    user_id = session.get("user_id")
    room_name = session.get("room_name")

    if not user_id:
        return

    is_completely_offline = presence_manager.remove_connection(user_id, request.sid)

    if room_name:
        leave_room(room_name)
        if is_completely_offline:
            emit('presence_changed', {'user_id': user_id, 'status': 'offline'}, room=room_name)

    logger.info("Socket disconnected", extra={"user_id": user_id, "sid": request.sid})

# ==========================================
# MESSAGE FLOW
# ==========================================

@socketio.on('send_message')
@socket_error_handler
@require_room
def handle_send_message(payload):
    service = get_chat_service()
    dto, is_created = service.send_message(session["user_id"], payload)

    if is_created:
        emit('receive_message', dto, room=session["room_name"], include_self=False)

        partner = service.repository.get_partner_membership(
            session["room_name"],
            session["user_id"]
        )
        if partner and presence_manager.is_online(str(partner.user_id)):
            receipt_dto = service.mark_delivered_for_message(partner.user_id, dto['id'])
            if receipt_dto:
                emit('receipt_updated', receipt_dto, room=session["room_name"])

    return {"status": "success", "data": dto}

@socketio.on('edit_message')
@socket_error_handler
@require_room
def handle_edit_message(payload):
    service = get_chat_service()
    message_id = payload.get('message_id')
    new_content = payload.get('content')

    dto = service.edit_message(session["user_id"], message_id, new_content)
    emit('message_updated', dto, room=session["room_name"], include_self=False)

    return {"status": "success", "data": dto}

@socketio.on('delete_message')
@socket_error_handler
@require_room
def handle_delete_message(payload):
    service = get_chat_service()
    message_id = payload.get('message_id')

    dto = service.soft_delete_message(session["user_id"], message_id)
    emit('message_updated', dto, room=session["room_name"], include_self=False)

    return {"status": "success", "data": dto}

# ==========================================
# READ RECEIPTS & TYPING
# ==========================================

@socketio.on('mark_read')
@socket_error_handler
@require_room
def handle_mark_read(payload):
    service = get_chat_service()
    message_id = payload.get('message_id')

    receipt_dto = service.mark_message_read(session["user_id"], message_id)
    if receipt_dto:
        emit('receipt_updated', receipt_dto, room=session["room_name"], include_self=False)

    return {"status": "success", "data": receipt_dto}

@socketio.on('typing_start')
def handle_typing_start():
    room_name = session.get("room_name")
    if room_name and presence_manager.can_emit_typing(request.sid):
        emit('typing_start', {'user_id': session["user_id"]}, room=room_name, include_self=False)

@socketio.on('typing_stop')
def handle_typing_stop():
    room_name = session.get("room_name")
    if room_name:
        presence_manager.reset_typing(request.sid)
        emit('typing_stop', {'user_id': session["user_id"]}, room=room_name, include_self=False)