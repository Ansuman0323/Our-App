"""
Custom business exceptions for the Space Pairing module.
"""

class AlreadyPairedError(Exception):
    """Raised when a user attempts to create or join a space but already belongs to one."""
    pass

class SpaceFullError(Exception):
    """Raised when a user attempts to join a space that already has two members."""
    pass

class InvalidInviteCodeError(Exception):
    """Raised when a provided invite code does not match any existing space."""
    pass

class DatabaseConflictError(Exception):
    """Raised when a race condition or database constraint violation occurs."""
    pass

class NotPairedError(Exception):
    """Raised when querying the current space but the user is not in one."""
    pass

class PairingException(Exception):
    """Base exception for all Pairing module errors."""
    pass

class SpaceNotFoundException(PairingException):
    """Raised when a requested space does not exist or the user is not in one."""
    pass

class SpaceFullException(PairingException):
    """Raised when attempting to join a space that already has maximum members (2), or modifying a full space."""
    pass

class ForbiddenException(PairingException):
    """Raised when a user attempts an action they do not have permission for (e.g., a partner regenerating the invite code)."""
    pass