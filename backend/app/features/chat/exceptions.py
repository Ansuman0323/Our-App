class ChatException(Exception):
    """Base exception with structured error formatting."""
    def __init__(self, message, error_code="CHAT_ERROR", details=None):
        super().__init__(message)
        self.error_code = error_code
        self.details = details or {}

class MessageNotFoundException(ChatException):
    def __init__(self, message="Message not found."):
        super().__init__(message, error_code="MESSAGE_NOT_FOUND")

class UnauthorizedChatActionException(ChatException):
    def __init__(self, message="You are not authorized to perform this action."):
        super().__init__(message, error_code="UNAUTHORIZED_ACTION")

class InvalidReplyException(ChatException):
    def __init__(self, message="Invalid reply target."):
        super().__init__(message, error_code="INVALID_REPLY")

class InvalidMessageException(ChatException):
    def __init__(self, message="Invalid message payload.", details=None):
        super().__init__(message, error_code="INVALID_MESSAGE", details=details)

class EditWindowExpiredException(ChatException):
    def __init__(self, message="The edit window has expired."):
        super().__init__(message, error_code="EDIT_WINDOW_EXPIRED")