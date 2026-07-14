"""
ARCHITECTURAL RESPONSIBILITY:
- ALLOWED: Pure SQLAlchemy execution, filtering, indexing, and UPSERT logic.
- PROHIBITED: Transaction management (commit/rollback), business logic validation, HTTP context.
"""
from sqlalchemy import or_, and_
from sqlalchemy.dialects.postgresql import insert
from app.models.message import Message
from app.models.message_receipt import MessageReceipt
from app.models.space_member import SpaceMember

class ChatRepository:
    def __init__(self, db_session):
        self.session = db_session

    def get_space_membership(self, user_id):
        return self.session.query(SpaceMember).filter_by(user_id=user_id).first()

    def create_message(self, message):
        self.session.add(message)
        self.session.flush()
        return message

    def update_message(self, message, updates: dict):
        for key, value in updates.items():
            setattr(message, key, value)
        self.session.flush()
        return message

    def get_message_by_id(self, message_id):
        return self.session.query(Message).filter_by(id=message_id).first()

    def get_message_by_client_message_id(self, client_message_id):
        return self.session.query(Message).filter_by(client_message_id=client_message_id).first()

    def get_messages_before(self, space_id, before_message_id=None, limit=50):
        query = self.session.query(Message).filter(Message.space_id == space_id)
        
        if before_message_id:
            ref_msg = self.get_message_by_id(before_message_id)
            if ref_msg:
                # TODO(TechDebt): UUIDv4 is random. It acts as a deterministic tie-breaker 
                # here for exact timestamp collisions, which is sufficient for couples-chat scale. 
                # For enterprise throughput, replace UUID with a monotonic BIGINT/Snowflake ID.
                query = query.filter(
                    or_(
                        Message.created_at < ref_msg.created_at,
                        and_(
                            Message.created_at == ref_msg.created_at,
                            Message.id < ref_msg.id
                        )
                    )
                )
                
        return query.order_by(Message.created_at.desc(), Message.id.desc()).limit(limit).all()

    def get_unread_count(self, space_id, user_id):
        receipt = self.session.query(MessageReceipt).filter_by(space_id=space_id, user_id=user_id).first()
        if not receipt or not receipt.last_read_message_id:
            return self.session.query(Message).filter_by(space_id=space_id).count()
            
        last_read_msg = self.get_message_by_id(receipt.last_read_message_id)
        if not last_read_msg:
            return 0
            
        return self.session.query(Message).filter(
            Message.space_id == space_id,
            Message.created_at > last_read_msg.created_at
        ).count()

    def get_receipt(self, space_id, user_id):
        return self.session.query(MessageReceipt).filter_by(space_id=space_id, user_id=user_id).first()

    def upsert_receipt(self, space_id, user_id, updates: dict):
        stmt = insert(MessageReceipt).values(
            space_id=space_id, 
            user_id=user_id,
            **updates
        )
        stmt = stmt.on_conflict_do_update(
            index_elements=['space_id', 'user_id'],
            set_=updates
        )
        self.session.execute(stmt)
        self.session.flush()