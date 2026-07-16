import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from app.extensions import db

class HiddenMessage(db.Model):
    __tablename__ = 'hidden_messages'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    message_id = Column(UUID(as_uuid=True), ForeignKey('messages.id', ondelete='CASCADE'), nullable=False, index=True)
    hidden_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        UniqueConstraint('user_id', 'message_id', name='uq_user_hidden_message'),
    )