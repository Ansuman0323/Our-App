"""
ARCHITECTURAL RESPONSIBILITY:
- ALLOWED: Manage in-memory, ephemeral state (online status, typing throttles).
- PROHIBITED: Database access, business logic, message validation, emitting socket events.
- NOTE: Designed for easy replacement with Redis (SETEX / Hash maps) when scaling to multi-worker WSGI.
"""
import threading
import time

class PresenceManager:
    def __init__(self):
        self._users = {}  # Format: user_id -> set(socket_ids)
        self._typing_timestamps = {}  # Format: socket_id -> float (timestamp)
        self._lock = threading.Lock()

    def add_connection(self, user_id: str, socket_id: str) -> bool:
        user_id = str(user_id)
        with self._lock:
            if user_id not in self._users:
                self._users[user_id] = set()
            is_newly_online = len(self._users[user_id]) == 0
            self._users[user_id].add(socket_id)
            return is_newly_online

    def remove_connection(self, user_id: str, socket_id: str) -> bool:
        user_id = str(user_id)
        with self._lock:
            self._typing_timestamps.pop(socket_id, None)  # Prevents memory leaks
            if user_id in self._users:
                self._users[user_id].discard(socket_id)
                if len(self._users[user_id]) == 0:
                    del self._users[user_id]
                    return True
        return False

    def is_online(self, user_id: str) -> bool:
        with self._lock:
            return str(user_id) in self._users

    def can_emit_typing(self, socket_id: str, throttle_seconds: float = 2.0) -> bool:
        with self._lock:
            current_time = time.time()
            last_time = self._typing_timestamps.get(socket_id, 0)
            if current_time - last_time > throttle_seconds:
                self._typing_timestamps[socket_id] = current_time
                return True
            return False

    def reset_typing(self, socket_id: str):
        with self._lock:
            self._typing_timestamps.pop(socket_id, None)