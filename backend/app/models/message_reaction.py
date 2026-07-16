import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.extensions import db

class MessageReaction(db.Model):
    __tablename__ = 'message_reactions'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    message_id = Column(UUID(as_uuid=True), ForeignKey('messages.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    emoji = Column(String(50), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship('User', lazy='joined')
    message = relationship('Message', backref=db.backref('reactions', lazy='selectin', cascade='all, delete-orphan'))

    __table_args__ = (
        # Enforces one reaction per user per message
        UniqueConstraint('message_id', 'user_id', name='uq_message_user_reaction'),
    )