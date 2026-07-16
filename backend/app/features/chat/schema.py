from datetime import timezone
from app.utils.storage import get_public_url

class ChatSchema:
    @staticmethod
    def dump_message(message):
        if not message:
            return None
            
        # Serialize the single attachment if it exists
        attachments = getattr(message, 'attachments', [])
        attachment_data = None
        if attachments and len(attachments) > 0:
            att = attachments[0]
            attachment_data = {
                "storage_key": att.storage_key,
                "file_name": getattr(att, "file_name", None),
                "url": get_public_url(att.storage_key),
                "mime_type": att.mime_type,
                "file_size": getattr(att, "file_size", 0),
                "thumbnail_url": getattr(att, "thumbnail_url", None)
            }
            
        return {
            "id": str(message.id),
            "client_message_id": str(message.client_message_id),
            "space_id": str(message.space_id),
            "sender_id": str(message.sender_id) if message.sender_id else None,
            "sender_name": message.sender.display_name if message.sender else None,
            "type": message.type.name if hasattr(message.type, 'name') else message.type,
            "status": message.status.name if hasattr(message.status, 'name') else message.status,
            "content": message.content,
            
            # --- ATTACHMENT ---
            "attachment": attachment_data,
            
            "reactions": [
                {
                    "user_id": str(reaction.user_id),
                    "sender_name": reaction.user.display_name if reaction.user else "User",
                    "emoji": reaction.emoji
                } for reaction in getattr(message, 'reactions', [])
            ],
            
            "reply_to_id": str(message.reply_to_id) if message.reply_to_id else None,
            "reply": {
                "id": str(message.replied_to.id),
                "sender_id": str(message.replied_to.sender_id),
                "sender_name": message.replied_to.sender.display_name if getattr(message.replied_to, 'sender', None) else None,
                "content": message.replied_to.content,
                "status": message.replied_to.status.name if hasattr(message.replied_to.status, 'name') else message.replied_to.status,
                "type": message.replied_to.type.name if hasattr(message.replied_to.type, 'name') else message.replied_to.type,
            } if getattr(message, 'replied_to', None) else None,
            
            "created_at": message.created_at.replace(tzinfo=timezone.utc).isoformat() if message.created_at else None,
            "updated_at": message.updated_at.replace(tzinfo=timezone.utc).isoformat() if message.updated_at else None,
        }

    @staticmethod
    def dump_message_list(messages):
        return [ChatSchema.dump_message(msg) for msg in messages if msg]

    @staticmethod
    def dump_receipt(receipt, kind=None):
        if not receipt:
            return None

        return {
            "user_id": str(receipt.user_id),
            "space_id": str(receipt.space_id),
            "last_delivered_message_id": (
                str(receipt.last_delivered_message_id)
                if receipt.last_delivered_message_id else None
            ),
            "last_read_message_id": (
                str(receipt.last_read_message_id)
                if receipt.last_read_message_id else None
            ),
            "delivered_at": (
                receipt.delivered_at.replace(tzinfo=timezone.utc).isoformat()
                if receipt.delivered_at else None
            ),
            "read_at": (
                receipt.read_at.replace(tzinfo=timezone.utc).isoformat()
                if receipt.read_at else None
            ),
            "kind": kind
        }