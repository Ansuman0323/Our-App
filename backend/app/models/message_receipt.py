import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.extensions import db

class MessageReceipt(db.Model):
    __tablename__ = 'message_receipts'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Cascades correctly
    space_id = Column(UUID(as_uuid=True), ForeignKey('spaces.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    
    last_delivered_message_id = Column(UUID(as_uuid=True), ForeignKey('messages.id', ondelete='SET NULL'), nullable=True)
    last_read_message_id = Column(UUID(as_uuid=True), ForeignKey('messages.id', ondelete='SET NULL'), nullable=True)
    
    # Timezone-aware timestamps
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    read_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    space = relationship('Space', backref=db.backref('receipts', lazy='dynamic', cascade='all, delete-orphan'))
    user = relationship('User', backref=db.backref('receipts', lazy='dynamic', cascade='all, delete-orphan'))

    __table_args__ = (
        # Enforces exactly one receipt row per user per space
        UniqueConstraint('space_id', 'user_id', name='uq_space_user_receipt'),
    )