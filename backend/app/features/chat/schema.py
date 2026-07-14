from datetime import timezone

class ChatSchema:
    @staticmethod
    def dump_message(message):
        if not message:
            return None
            
        return {
            "id": str(message.id),
            "client_message_id": str(message.client_message_id),
            "space_id": str(message.space_id),
            "sender_id": str(message.sender_id) if message.sender_id else None,
            
            # Safely resolves the sender's display name via SQLAlchemy
            "sender_name": message.sender.display_name if message.sender else None,
            
            "type": message.type.name if hasattr(message.type, 'name') else message.type,
            "status": message.status.name if hasattr(message.status, 'name') else message.status,
            "content": message.content,
            "reply_to_id": str(message.reply_to_id) if message.reply_to_id else None,
            "created_at": message.created_at.replace(tzinfo=timezone.utc).isoformat() if message.created_at else None,
            "updated_at": message.updated_at.replace(tzinfo=timezone.utc).isoformat() if message.updated_at else None,
        }

    @staticmethod
    def dump_message_list(messages):
        """Helper to serialize a list of messages."""
        return [ChatSchema.dump_message(msg) for msg in messages if msg]