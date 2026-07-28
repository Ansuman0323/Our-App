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

    logger.info(
        f"[CALL RECONCILE] user={user_id} room={room} socket_sid={socket_sid} "
        f"incoming_session_id={session_id} client_call_state={call_state} "
        f"active_call_id={active_call_id} "
        f"registry_call_id={call.call_id if call else None} "
        f"registry_state={call.state.value if call else None}"
    )

    if call_state == 'IDLE' or not active_call_id:
        if call and registry.has_participant(room, user_id):
            participant = registry.get_participant(room, user_id)
            # A None stored session_id means this participant was never
            # bound to a real session (e.g. pre-registered callee, or a
            # participant whose accept-time binding hasn't landed yet).
            # That is NOT evidence of a competing session — only a genuine
            # mismatch against a previously-bound session_id counts.
            if participant.session_id is not None and participant.session_id != session_id:
                logger.info(
                    f"[CALL RECONCILE] Stale/replaced session for user={user_id} room={room} "
                    f"stored_session_id={participant.session_id} incoming_session_id={session_id}. "
                    f"Cleaning up call_id={call.call_id}."
                )
                emit('call:failed', {'call_id': call.call_id, 'reason': 'session_replaced'}, room=room, include_self=False)
                registry.remove_call(room)
        return

    if not call or call.call_id != active_call_id:
        emit('call:failed', {'call_id': active_call_id, 'reason': 'session_replaced'}, to=socket_sid)
        return

    participant = registry.get_participant(room, user_id)
    if not participant:
        return

    # Treat this as the participant's own reconnect unless we have positive
    # evidence of a different, already-bound session_id for this user.
    # participant.session_id == None happens whenever nothing has bound a
    # real session_id to this participant yet (e.g. the callee's session_id/
    # socket_sid were never persisted after call:accept in older behavior) —
    # that must never be treated as "another device is using this call".
    is_same_session = participant.session_id is None or participant.session_id == session_id

    if is_same_session:
        logger.info(
            f"[CALL RECONCILE] Seamless reconnect: user={user_id} room={room} "
            f"call_id={active_call_id} session_id={session_id} socket_sid={socket_sid} "
            f"prior_socket_sid={participant.socket_sid}"
        )
        registry.update_participant(
            room_name=room, 
            user_id=user_id, 
            session_id=session_id, 
            socket_sid=socket_sid,
            state=participant.state
        )
        socketio.server.enter_room(socket_sid, room)
    else:
        logger.info(
            f"[CALL RECONCILE] Duplicate session detected for user={user_id} room={room}: "
            f"stored_session_id={participant.session_id} incoming_session_id={session_id}. "
            f"Invoking Last-In-Wins for call_id={active_call_id}."
        )
        emit('call:failed', {'call_id': active_call_id, 'reason': 'session_replaced'}, room=room, include_self=False)
        emit('call:failed', {'call_id': active_call_id, 'reason': 'session_replaced'}, to=socket_sid)
        registry.remove_call(room)

@socketio.on("call:start")
def handle_call_start(payload):
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

    logger.info(
        f"[CALL START] room={room} caller={sender_id} callee={callee_id} "
        f"call_type={call_type} call_id={call_id} session_id={session_id} socket_sid={socket_sid}"
    )

    # Fix 4: a stale/terminal call left in the registry must never
    # permanently block the room. Evict it up front so a genuinely idle
    # room is always available for a new call, instead of only checking
    # raw presence of an entry.
    existing = registry.get_call(room)
    if existing and existing.state in {CallState.ENDED, CallState.FAILED}:
        logger.info(
            f"[CALL START] Evicting stale terminal call call_id={existing.call_id} "
            f"state={existing.state.value} room={room} before creating new call"
        )
        registry.remove_call(room)
        existing = None

    if existing:
        logger.warning(
            f"[CALL] Room busy. Existing call_id={existing.call_id} state={existing.state.value} room={room}"
        )
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
    if not validate_base_payload(payload):
        logger.warning("[CALL] Invalid call:accept payload")
        return

    room = session.get("room_name")
    sender_id = session.get("user_id")  # this is the callee: the person accepting
    socket_sid = request.sid
    call_id = payload.get("call_id")
    session_id = payload.get("session_id")

    if not room or not sender_id:
        logger.warning("[CALL] call:accept missing room or sender_id")
        return

    call = registry.get_call(room)
    if not call or call.call_id != call_id:
        logger.warning(
            f"[CALL] call:accept for unknown/mismatched call. payload_call_id={call_id} "
            f"registry_call_id={call.call_id if call else None} room={room}"
        )
        return

    # Fix 1: persist the accepting participant's REAL session_id/socket_sid.
    # Without this, the callee's participant record keeps the None/None
    # placeholders from call:start's pre-registration for the entire call,
    # which later makes every reconcile() comparison against this
    # participant spuriously fail.
    existing_participant = registry.get_participant(room, sender_id)
    role = existing_participant.role if existing_participant else ParticipantRole.CALLEE

    updated_call = registry.update_participant(
        room_name=room,
        user_id=sender_id,
        session_id=session_id,
        socket_sid=socket_sid,
        role=role,
        state=ParticipantState.CONNECTED,
    )
    if not updated_call:
        logger.warning(f"[CALL] Failed to persist participant on accept: user={sender_id} room={room} call_id={call_id}")
        return

    updated_call = registry.update_state(room, CallState.CONNECTING)
    if not updated_call:
        logger.warning(f"[CALL] Illegal state transition on call:accept for call_id={call_id} room={room}")
        return

    relay_payload = {
        **payload,
        "sender_id": sender_id,
        "caller_id": updated_call.caller_id
    }

    log_call(
        'call:accept', updated_call.call_id, updated_call.caller_id, room, updated_call.state.value,
        f"accepted_by={sender_id} session_id={session_id} socket_sid={socket_sid}"
    )
    emit('call:accept', relay_payload, room=room, include_self=False)

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
    if not call or call.call_id != call_id:
        logger.info(
            f"[CALL DISCONNECT TIMEOUT] room={room} call_id={call_id} user={user_id} "
            f"no-op: call already gone or replaced"
        )
        return
        
    participant = registry.get_participant(room, user_id)
    if not participant: return
        
    if participant.socket_sid != disconnected_sid:
        logger.info(
            f"[CALL DISCONNECT TIMEOUT] room={room} call_id={call_id} user={user_id} "
            f"no-op: participant reconnected with new socket_sid={participant.socket_sid} "
            f"(disconnected_sid={disconnected_sid})"
        )
        return 

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
    logger.info(f"[CALL DISCONNECT TIMEOUT] room={room} call_id={call_id} removed after grace period")

@socketio.on('disconnect')
def handle_call_disconnect():
    room = session.get("room_name")
    user_id = session.get("user_id")
    socket_sid = request.sid

    call = registry.get_call(room)
    if call:
        logger.info(
            f"[CALL] disconnect scheduling timeout check: room={room} call_id={call.call_id} "
            f"user={user_id} socket_sid={socket_sid} grace={DISCONNECT_GRACE_SECONDS}s"
        )
        socketio.start_background_task(
            _handle_disconnect_timeout, 
            room, 
            call.call_id, 
            user_id, 
            socket_sid
        )