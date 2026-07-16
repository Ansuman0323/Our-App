"""
ARCHITECTURAL RESPONSIBILITY:
- ALLOWED: Pure SQLAlchemy execution, filtering, indexing, and UPSERT logic.
- PROHIBITED: Transaction management (commit/rollback), business logic validation, HTTP context.
"""
from sqlalchemy import or_, and_
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import joinedload
from app.models.message import Message
from app.models.message_receipt import MessageReceipt
from app.models.space_member import SpaceMember
from app.models.hidden_message import HiddenMessage

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
        # Eager load reply relationships to support serializer
        return self.session.query(Message).options(
            joinedload(Message.sender),
            joinedload(Message.replied_to).joinedload(Message.sender)
        ).filter_by(id=message_id).first()

    def get_message_by_client_message_id(self, client_message_id):
        # Eager load reply relationships to support serializer
        return self.session.query(Message).options(
            joinedload(Message.sender),
            joinedload(Message.replied_to).joinedload(Message.sender)
        ).filter_by(client_message_id=client_message_id).first()

    def get_messages_before(self, space_id, user_id, before_message_id=None, limit=50):
        # 1. Subquery to find all message IDs hidden by this specific user
        hidden_sq = self.session.query(HiddenMessage.message_id).filter_by(user_id=user_id).subquery()
        
        # 2. Main query excluding hidden messages
        query = self.session.query(Message).filter(
            Message.space_id == space_id,
            Message.id.not_in(hidden_sq)
        )
        
        # ADDED: Eager load the sender and the replied-to message + its sender to prevent N+1 queries
        query = query.options(
            joinedload(Message.sender),
            joinedload(Message.replied_to).joinedload(Message.sender)
        )
        
        if before_message_id:
            # Avoid heavy joins just for the reference timestamp lookup
            ref_msg = self.session.query(Message).filter_by(id=before_message_id).first()
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

    def hide_message_for_user(self, user_id, message_id):
        print("5. ENTERED REPOSITORY")
        existing = self.session.query(HiddenMessage).filter_by(user_id=user_id, message_id=message_id).first()
        if not existing:
            hidden = HiddenMessage(user_id=user_id, message_id=message_id)
            print("6. ADDING NEW HIDDEN ROW")
            self.session.add(hidden)
            self.session.flush()
            print("7. FLUSH COMPLETE")
        return True

    def get_unread_count(self, space_id, user_id):
        receipt = self.session.query(MessageReceipt).filter_by(space_id=space_id, user_id=user_id).first()
        
        # Base query to count unread messages, excluding those the user has hidden
        hidden_sq = self.session.query(HiddenMessage.message_id).filter_by(user_id=user_id).subquery()
        base_query = self.session.query(Message).filter(
            Message.space_id == space_id,
            Message.id.not_in(hidden_sq)
        )
        
        if not receipt or not receipt.last_read_message_id:
            return base_query.count()
            
        last_read_msg = self.session.query(Message).filter_by(id=receipt.last_read_message_id).first()
        if not last_read_msg:
            return 0
            
        return base_query.filter(Message.created_at > last_read_msg.created_at).count()

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