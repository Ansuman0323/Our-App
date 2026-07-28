import logging
from flask import request, session
from flask_socketio import emit
from app.extensions import socketio
from app.features.calls.services.call_registry import (
    MemoryCallRegistry,
    CallState,
    ParticipantRole,
    ParticipantState,
)
from app.features.calls.config import DISCONNECT_GRACE_SECONDS
from app.extensions import db
from app.models.user import User
import os

logger = logging.getLogger(__name__)
registry = MemoryCallRegistry()

def validate_base_payload(payload):
    return isinstance(payload, dict) and isinstance(payload.get("call_id"), str)

def validate_sdp(payload):
    if not validate_base_payload(payload): return False
    sdp_obj = payload.get("sdp")
    if not isinstance(sdp_obj, dict): return False
    
    msg_type = sdp_obj.get("type")
    sdp_string = sdp_obj.get("sdp")
    
    if msg_type not in ["offer", "answer"]: return False
    if not isinstance(sdp_string, str) or not sdp_string.strip(): return False
    return True

def validate_ice(payload):
    if not validate_base_payload(payload): return False
    candidate = payload.get("candidate")
    if not isinstance(candidate, dict): return False
    
    has_candidate = isinstance(candidate.get("candidate"), str)
    has_routing = ("sdpMid" in candidate) or ("sdpMLineIndex" in candidate)
    return has_candidate and has_routing

def get_caller_display_info(user_id):
    if not user_id:
        return None, None
    user = db.session.query(User).filter_by(id=user_id).first()
    if not user:
        return None, None
    return user.display_name, user.avatar_url

def log_call(event_name, call_id, caller_id, room, state, msg=""):
    log_msg = f"[CALL] call_id={call_id} caller={caller_id} room={room} event={event_name} state={state}"
    if msg: log_msg += f" details={msg}"
    logger.info(log_msg)

def relay_call_event(event_name, payload, validator_func=None, new_state=None, terminate_call=False):
    if validator_func and not validator_func(payload):
        logger.warning(f"[CALL] event={event_name} msg=Malformed payload rejected")
        return

    room = session.get("room_name")
    sender_id = session.get("user_id")
    call_id = payload.get("call_id")

    if not room or not sender_id: return

    call = registry.get_call(room)
    if not call or call.call_id != call_id:
        return

    if new_state:
        updated_call = registry.update_state(room, new_state)
        if not updated_call: 
            return
        call = updated_call

    relay_payload = {
        **payload,
        "sender_id": sender_id,
        "caller_id": call.caller_id
    }

    log_call(event_name, call.call_id, call.caller_id, room, call.state.value)
    emit(event_name, relay_payload, room=room, include_self=False)

    if terminate_call:
        registry.remove_call(room)
        log_call("cleanup", call.call_id, call.caller_id, room, "TERMINATED", "Call safely removed")

@socketio.on('call:reconcile')
def handle_call_reconcile(payload):
    user_id = session.get("user_id")
    room = session.get("room_name")
    if not user_id or not room:
        return

    session_id = payload.get('session_id')
    call_state = payload.get('call_state', 'IDLE')
    active_call_id = payload.get('active_call_id')
    socket_sid = request.sid

    if not session_id:
        return 

    call = registry.get_call(room)
    
    if call_state == 'IDLE' or not active_call_id:
        if call and registry.has_participant(room, user_id):
            participant = registry.get_participant(room, user_id)
            if participant.session_id != session_id:
                logger.info(f"Reconciliation: Browser refresh detected for {user_id}. Cleaning up room {room}.")
                emit('call:failed', {'call_id': call.call_id, 'reason': 'session_replaced'}, room=room, include_self=False)
                registry.remove_call(room)
        return

    if not call or call.call_id != active_call_id:
        emit('call:failed', {'call_id': active_call_id, 'reason': 'session_replaced'}, to=socket_sid)
        return

    participant = registry.get_participant(room, user_id)
    if not participant:
        return

    if participant.session_id == session_id:
        logger.info(f"Reconciliation: Seamless reconnect for {user_id} in room {room}.")
        registry.update_participant(
            room_name=room, 
            user_id=user_id, 
            session_id=session_id, 
            socket_sid=socket_sid,
            state=participant.state
        )
        socketio.server.enter_room(socket_sid, room)
    else:
        logger.info(f"Reconciliation: Duplicate tab detected for {user_id}. Invoking Last-In Wins.")
        emit('call:failed', {'call_id': active_call_id, 'reason': 'session_replaced'}, room=room, include_self=False)
        emit('call:failed', {'call_id': active_call_id, 'reason': 'session_replaced'}, to=socket_sid)
        registry.remove_call(room)

@socketio.on("call:start")
def handle_call_start(payload):
    print("########################")
    print("CALL START RECEIVED")
    print(payload)
    logger.info(f"[CALL START] Caller {session.get('user_id')} triggered start on Worker PID: {os.getpid()}")
    
    if not validate_base_payload(payload):
        logger.warning("[CALL] Invalid call:start payload")
        return

    room = session.get("room_name")
    sender_id = session.get("user_id")
    socket_sid = request.sid

    call_id = payload["call_id"]
    session_id = payload.get("session_id")
    callee_id = payload.get("callee_id")
    call_type = payload.get("call_type", "video") # Ensure we extract call type

    if not room or not sender_id:
        logger.warning("[CALL] Missing room or sender_id")
        return

    logger.info(f"=== CALL START ===\nCaller: {sender_id}\nCallee: {callee_id}\nType: {call_type}\nCall ID: {call_id}\n==================")

    existing = registry.get_call(room)

    if existing:
        logger.warning(f"[CALL] Room busy. Existing: {existing.call_id}")
        emit("call:busy", {"call_id": call_id, "reason": "already_active"}, to=socket_sid)
        return

    call = registry.create_call(
        call_id=call_id,
        caller_id=sender_id,
        room_name=room,
        caller_session_id=session_id,
        caller_sid=socket_sid,
        # NOTE: If your registry supports storing the type, pass `call_type=call_type` here.
    )

    if not call:
        logger.error("[CALL] create_call() returned None unexpectedly")
        emit("call:busy", {"call_id": call_id, "reason": "already_active"}, to=socket_sid)
        return

    if callee_id:
        registry.update_participant(
            room_name=room,
            user_id=callee_id,
            session_id=None,
            socket_sid=None,
            role=ParticipantRole.CALLEE,
            state=ParticipantState.JOINING,
        )

    socketio.server.enter_room(socket_sid, room)
    caller_name, caller_avatar = get_caller_display_info(sender_id)

    relay_payload = {
        **payload,
        "sender_id": sender_id,
        "caller_id": sender_id,
        "caller_name": caller_name,
        "caller_avatar": caller_avatar,
        "caller_status": "online",
        "call_type": call_type # Relayed straight to recipient!
    }

    log_call("start", call.call_id, sender_id, room, call.state.value)

    emit("call:start", relay_payload, room=room, include_self=False)

@socketio.on('call:ringing')
def handle_call_ringing(payload):
    relay_call_event('call:ringing', payload, validate_base_payload)

@socketio.on('call:accept')
def handle_call_accept(payload):
    relay_call_event('call:accept', payload, validate_base_payload, new_state=CallState.CONNECTING)

@socketio.on('call:busy')
def handle_call_busy(payload):
    relay_call_event('call:busy', payload, validate_base_payload, new_state=CallState.FAILED, terminate_call=True)

@socketio.on('call:reject')
def handle_call_reject(payload):
    relay_call_event('call:reject', payload, validate_base_payload, new_state=CallState.ENDED, terminate_call=True)

@socketio.on('call:cancel')
def handle_call_cancel(payload):
    relay_call_event('call:cancel', payload, validate_base_payload, new_state=CallState.ENDED, terminate_call=True)

@socketio.on('call:end')
def handle_call_end(payload):
    relay_call_event('call:end', payload, validate_base_payload, new_state=CallState.ENDED, terminate_call=True)

@socketio.on('call:failed')
def handle_call_failed(payload):
    relay_call_event('call:failed', payload, validate_base_payload, new_state=CallState.FAILED, terminate_call=True)

@socketio.on('call:offer')
def handle_call_offer(payload):
    relay_call_event('call:offer', payload, validator_func=validate_sdp)

@socketio.on('call:answer')
def handle_call_answer(payload):
    relay_call_event('call:answer', payload, validator_func=validate_sdp, new_state=CallState.CONNECTED)

@socketio.on('call:ice-candidate')
def handle_call_ice_candidate(payload):
    relay_call_event('call:ice-candidate', payload, validator_func=validate_ice)

def _handle_disconnect_timeout(room, call_id, user_id, disconnected_sid):
    socketio.sleep(DISCONNECT_GRACE_SECONDS)
    
    call = registry.get_call(room)
    if not call or call.call_id != call_id: return 
        
    participant = registry.get_participant(room, user_id)
    if not participant: return
        
    if participant.socket_sid != disconnected_sid: return 

    updated_call = registry.update_state(room, CallState.FAILED)
    if not updated_call: return
    
    log_call("timeout", call_id, call.caller_id, room, updated_call.state.value, f"User {user_id} dropped permanently.")
    socketio.emit('call:failed', {
        "call_id": call_id,
        "caller_id": call.caller_id,
        "sender_id": user_id,
        "reason": "network_disconnect"
    }, room=room)
    registry.remove_call(room)

@socketio.on('disconnect')
def handle_call_disconnect():
    room = session.get("room_name")
    user_id = session.get("user_id")
    socket_sid = request.sid

    call = registry.get_call(room)
    if call:
        socketio.start_background_task(
            _handle_disconnect_timeout, 
            room, 
            call.call_id, 
            user_id, 
            socket_sid
        )