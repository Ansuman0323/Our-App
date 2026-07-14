import logging
from datetime import datetime, timezone, timedelta
from sqlalchemy.exc import IntegrityError
from app.models.message import Message
from app.features.chat.constants import (
    MessageType, MessageStatus, MAX_MESSAGE_LENGTH, EDIT_WINDOW_MINUTES, DELETED_MESSAGE_TEXT
)
from app.features.chat.schema import ChatSchema
from app.features.chat.exceptions import (
    MessageNotFoundException, 
    UnauthorizedChatActionException, 
    InvalidReplyException,
    InvalidMessageException,
    EditWindowExpiredException
)

logger = logging.getLogger(__name__)

class ChatService:
    def __init__(self, repository, db_session):
        self.repository = repository
        self.session = db_session

    # --- PRIVATE HELPERS ---

    def _verify_space_membership(self, user_id):
        membership = self.repository.get_space_membership(user_id)
        if not membership:
            raise UnauthorizedChatActionException("User does not belong to a space.")
        return membership.space_id

    def _get_and_validate_message_ownership(self, user_id, message_id, action_name="modify"):
        msg = self.repository.get_message_by_id(message_id)
        if not msg:
            raise MessageNotFoundException()
            
        if str(msg.sender_id) != str(user_id):
            logger.warning("Unauthorized action attempt", extra={
                "action": action_name, "user_id": user_id, "message_id": message_id, "space_id": msg.space_id
            })
            raise UnauthorizedChatActionException(f"You can only {action_name} your own messages.")
            
        if msg.type == MessageType.SYSTEM:
            raise InvalidMessageException(f"Cannot {action_name} system messages.")
            
        if msg.status == MessageStatus.DELETED:
            raise InvalidMessageException(f"Cannot {action_name} a deleted message.")
            
        return msg

    # --- PUBLIC API ---

    def send_message(self, user_id, payload):
        space_id = self._verify_space_membership(user_id)
        client_message_id = payload.get('client_message_id')
        
        if not client_message_id:
            raise InvalidMessageException("client_message_id is required.")

        # Idempotency check
        existing_msg = self.repository.get_message_by_client_message_id(client_message_id)
        if existing_msg:
            logger.info("Idempotent message send bypassed", extra={"client_message_id": client_message_id})
            return ChatSchema.dump_message(existing_msg), False  # False = Not newly created

        content = payload.get('content', '')
        if not content or not content.strip():
            raise InvalidMessageException("Message content cannot be empty.")
        if len(content) > MAX_MESSAGE_LENGTH:
            raise InvalidMessageException("Message exceeds maximum length.")

        msg_type = payload.get('type', MessageType.TEXT.value)
        
        reply_to_id = payload.get('reply_to_id')
        if reply_to_id:
            reply_msg = self.repository.get_message_by_id(reply_to_id)
            if not reply_msg:
                raise InvalidReplyException("Reply target does not exist.")
            if str(reply_msg.space_id) != str(space_id):
                raise InvalidReplyException("Cannot reply outside current space.")

        new_message = Message(
            client_message_id=client_message_id,
            space_id=space_id,
            sender_id=user_id,
            type=MessageType(msg_type),
            status=MessageStatus.NORMAL,
            content=content.strip(),
            reply_to_id=reply_to_id
        )
        
        try:
            created_msg = self.repository.create_message(new_message)
            self.session.commit()
            logger.info("Message created", extra={
                "user_id": str(user_id), "space_id": str(space_id), "message_id": str(created_msg.id)
            })
            return ChatSchema.dump_message(created_msg), True  # True = Newly created
        except IntegrityError:
            self.session.rollback()
            existing_msg = self.repository.get_message_by_client_message_id(client_message_id)
            if existing_msg:
                return ChatSchema.dump_message(existing_msg), False
            raise

    def get_messages(self, user_id, before_message_id=None, limit=50):
        space_id = self._verify_space_membership(user_id)
        messages = self.repository.get_messages_before(space_id, before_message_id, limit)
        return ChatSchema.dump_message_list(messages[::-1])

    def edit_message(self, user_id, message_id, new_content):
        self._verify_space_membership(user_id)
        msg = self._get_and_validate_message_ownership(user_id, message_id, "edit")
            
        if not new_content or not new_content.strip():
            raise InvalidMessageException("Edited content cannot be empty.")
            
        time_elapsed = datetime.now(timezone.utc) - msg.created_at
        if time_elapsed > timedelta(minutes=EDIT_WINDOW_MINUTES):
            raise EditWindowExpiredException()

        try:
            updated_msg = self.repository.update_message(msg, {
                "content": new_content.strip(),
                "status": MessageStatus.EDITED
            })
            self.session.commit()
            logger.info("Message edited", extra={"message_id": str(message_id), "user_id": str(user_id)})
            return ChatSchema.dump_message(updated_msg)
        except Exception:
            self.session.rollback()
            raise

    def soft_delete_message(self, user_id, message_id):
        self._verify_space_membership(user_id)
        msg = self._get_and_validate_message_ownership(user_id, message_id, "delete")

        try:
            updated_msg = self.repository.update_message(msg, {
                "content": DELETED_MESSAGE_TEXT,
                "status": MessageStatus.DELETED
            })
            self.session.commit()
            logger.info("Message soft deleted", extra={"message_id": str(message_id), "user_id": str(user_id)})
            return ChatSchema.dump_message(updated_msg)
        except Exception:
            self.session.rollback()
            raise

    def get_unread_summary(self, user_id):
        space_id = self._verify_space_membership(user_id)
        count = self.repository.get_unread_count(space_id, user_id)
        return {"unread_count": count}
    
    def mark_message_read(self, user_id, message_id):
        space_id = self._verify_space_membership(user_id)
        new_msg = self.repository.get_message_by_id(message_id)
        
        if not new_msg:
            raise MessageNotFoundException("Message not found.")
        if str(new_msg.space_id) != str(space_id):
            raise InvalidMessageException("Message belongs to a different space.")
            
        current_receipt = self.repository.get_receipt(space_id, user_id)
        if current_receipt and current_receipt.last_read_message_id:
            old_msg = self.repository.get_message_by_id(current_receipt.last_read_message_id)
            if old_msg:
                # TODO(TechDebt): UUID comparison is used as a deterministic tie-breaker for 
                # identically timestamped messages. See repository.get_messages_before for details.
                is_newer = (new_msg.created_at > old_msg.created_at) or \
                           (new_msg.created_at == old_msg.created_at and str(new_msg.id) > str(old_msg.id))
                
                if not is_newer:
                    logger.info("Ignored stale read receipt", extra={"user_id": str(user_id), "stale_message_id": str(message_id)})
                    return {
                        "space_id": str(space_id), 
                        "user_id": str(user_id), 
                        "last_read_message_id": str(current_receipt.last_read_message_id)
                    }