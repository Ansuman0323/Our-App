from enum import Enum

class MessageType(str, Enum):
    TEXT = "TEXT"
    IMAGE = "IMAGE"
    VIDEO = "VIDEO"
    AUDIO = "AUDIO"
    FILE = "FILE"
    SYSTEM = "SYSTEM"
    GIF = 'GIF'
    STICKER = 'STICKER'
    
class MessageStatus(str, Enum):
    NORMAL = "NORMAL"
    EDITED = "EDITED"
    DELETED = "DELETED"
    SYSTEM = "SYSTEM"

MAX_MESSAGE_LENGTH = 2000
EDIT_WINDOW_MINUTES = 15
DELETED_MESSAGE_TEXT = "This message was deleted."