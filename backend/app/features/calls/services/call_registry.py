import time
import threading
import logging
from enum import Enum
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional, Dict

logger = logging.getLogger(__name__)

class CallState(str, Enum):
    RINGING = "RINGING"
    CONNECTING = "CONNECTING"
    CONNECTED = "CONNECTED"
    ENDING = "ENDING"
    ENDED = "ENDED"
    FAILED = "FAILED"

class ParticipantRole(str, Enum):
    CALLER = "CALLER"
    CALLEE = "CALLEE"

class ParticipantState(str, Enum):
    JOINING = "JOINING"
    CONNECTED = "CONNECTED"
    RECONNECTING = "RECONNECTING"
    LEFT = "LEFT"

ALLOWED_TRANSITIONS = {
    CallState.RINGING: {CallState.CONNECTING, CallState.ENDED, CallState.FAILED},
    CallState.CONNECTING: {CallState.CONNECTED, CallState.ENDED, CallState.FAILED},
    CallState.CONNECTED: {CallState.ENDING, CallState.ENDED, CallState.FAILED},
    CallState.ENDING: {CallState.ENDED, CallState.FAILED},
    CallState.ENDED: set(),
    CallState.FAILED: set()
}

@dataclass
class CallParticipant:
    user_id: str
    session_id: Optional[str]
    socket_sid: Optional[str]
    role: ParticipantRole
    state: ParticipantState
    joined_at: float = field(default_factory=time.time)
    # PHASE 3: Polling timestamps removed. Routing correctness is now 
    # strictly dictated by FSM shifts and cryptographic session_ids.

@dataclass
class ActiveCall:
    call_id: str
    room_name: str
    state: CallState
    caller_id: str  # PHASE 3: Preserved for legacy module backward compatibility
    participants: Dict[str, CallParticipant] = field(default_factory=dict)
    version: int = 0
    created_at: float = field(default_factory=time.time)


class CallRegistryBase(ABC):
    """Abstract interface enforcing strict mutation boundaries and OCC versioning."""
    
    # --- Call Lifecycle ---
    @abstractmethod
    def create_call(self, call_id: str, caller_id: str, room_name: str, caller_session_id: Optional[str] = None, caller_sid: Optional[str] = None) -> Optional[ActiveCall]: pass
    @abstractmethod
    def get_call(self, room_name: str) -> Optional[ActiveCall]: pass
    @abstractmethod
    def update_state(self, room_name: str, new_state: CallState) -> Optional[ActiveCall]: pass
    @abstractmethod
    def remove_call(self, room_name: str) -> Optional[ActiveCall]: pass
    @abstractmethod
    def is_busy(self, room_name: str) -> bool: pass
    
    # --- Participant Lifecycle (Strict Accessors) ---
    @abstractmethod
    def update_participant(self, room_name: str, user_id: str, session_id: str, socket_sid: str, role: Optional[ParticipantRole] = None, state: Optional[ParticipantState] = None) -> Optional[ActiveCall]: pass
    @abstractmethod
    def remove_participant(self, room_name: str, user_id: str) -> Optional[ActiveCall]: pass
    @abstractmethod
    def get_participant(self, room_name: str, user_id: str) -> Optional[CallParticipant]: pass
    @abstractmethod
    def has_participant(self, room_name: str, user_id: str) -> bool: pass


class MemoryCallRegistry(CallRegistryBase):
    """Thread-safe, in-memory implementation. Contract: External modules MUST NOT mutate returned objects."""
    def __init__(self):
        self._calls: Dict[str, ActiveCall] = {}
        self._lock = threading.Lock()

    def create_call(self, call_id: str, caller_id: str, room_name: str, caller_session_id: Optional[str] = None, caller_sid: Optional[str] = None) -> Optional[ActiveCall]:
        with self._lock:
            if self._is_busy_unsafe(room_name):
                return None
            
            call = ActiveCall(call_id=call_id, room_name=room_name, state=CallState.RINGING, caller_id=caller_id)
            
            call.participants[caller_id] = CallParticipant(
                user_id=caller_id,
                session_id=caller_session_id,
                socket_sid=caller_sid,
                role=ParticipantRole.CALLER,
                state=ParticipantState.JOINING
            )
            
            self._calls[room_name] = call
            return call

    def get_call(self, room_name: str) -> Optional[ActiveCall]:
        with self._lock:
            return self._calls.get(room_name)

    def update_state(self, room_name: str, new_state: CallState) -> Optional[ActiveCall]:
        with self._lock:
            call = self._calls.get(room_name)
            if not call: return None
            
            allowed = ALLOWED_TRANSITIONS.get(call.state, set())
            if new_state not in allowed:
                logger.warning(f"Illegal FSM transition blocked: {call.state.name} -> {new_state.name}")
                return None
                
            call.state = new_state
            call.version += 1
            return call

    def update_participant(self, room_name: str, user_id: str, session_id: str, socket_sid: str, role: Optional[ParticipantRole] = None, state: Optional[ParticipantState] = None) -> Optional[ActiveCall]:
        with self._lock:
            call = self._calls.get(room_name)
            if not call: return None
            
            if user_id in call.participants:
                p = call.participants[user_id]
                
                # PHASE 3: Deterministic replacement of routing IDs during socket reconciliation
                p.session_id = session_id
                p.socket_sid = socket_sid
                
                if role: p.role = role
                if state: p.state = state
            else:
                if role is None or state is None:
                    logger.error(f"Failed to insert participant {user_id}. Role and state are strictly required for new insertions.")
                    return None
                    
                call.participants[user_id] = CallParticipant(
                    user_id=user_id,
                    session_id=session_id,
                    socket_sid=socket_sid,
                    role=role,
                    state=state
                )
            
            call.version += 1
            return call

    def remove_participant(self, room_name: str, user_id: str) -> Optional[ActiveCall]:
        with self._lock:
            call = self._calls.get(room_name)
            if not call or user_id not in call.participants:
                return call
                
            del call.participants[user_id]
            call.version += 1
            return call

    def get_participant(self, room_name: str, user_id: str) -> Optional[CallParticipant]:
        with self._lock:
            call = self._calls.get(room_name)
            return call.participants.get(user_id) if call else None

    def has_participant(self, room_name: str, user_id: str) -> bool:
        with self._lock:
            call = self._calls.get(room_name)
            return user_id in call.participants if call else False

    def remove_call(self, room_name: str) -> Optional[ActiveCall]:
        with self._lock:
            return self._calls.pop(room_name, None)

    def is_busy(self, room_name: str) -> bool:
        with self._lock:
            return self._is_busy_unsafe(room_name)

    def _is_busy_unsafe(self, room_name: str) -> bool:
        call = self._calls.get(room_name)
        if not call: return False
        return call.state in {CallState.RINGING, CallState.CONNECTING, CallState.CONNECTED}