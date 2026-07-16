import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Index, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.extensions import db
from app.features.chat.constants import MessageType, MessageStatus

class Message(db.Model):
    __tablename__ = 'messages'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_message_id = Column(UUID(as_uuid=True), unique=True, nullable=False)
    
    # Cascades on space deletion
    space_id = Column(UUID(as_uuid=True), ForeignKey('spaces.id', ondelete='CASCADE'), nullable=False)
    # Indexed for faster queries (e.g., finding all messages by a user)
    sender_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True) 
    
    type = Column(Enum(MessageType), nullable=False, default=MessageType.TEXT)
    status = Column(Enum(MessageStatus), nullable=False, default=MessageStatus.NORMAL)
    
    content = Column(Text, nullable=True)
    # Replies remain even if the original message is deleted (SET NULL) and are indexed for fast lookups
    reply_to_id = Column(UUID(as_uuid=True), ForeignKey('messages.id', ondelete='SET NULL'), nullable=True, index=True)
    replied_to = db.relationship(
        'Message', 
        remote_side='Message.id', 
        foreign_keys=[reply_to_id],
        backref='replies'
    )

    # Timezone-aware timestamps
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    space = relationship('Space', backref=db.backref('messages', lazy='dynamic', cascade='all, delete-orphan'))
    sender = relationship('User', backref=db.backref('messages', lazy='dynamic'))
    attachments = relationship('MessageAttachment', back_populates='message', cascade='all, delete-orphan', lazy='select')

    __table_args__ = (
        Index('ix_messages_space_id_created_at_desc', 'space_id', 'created_at', postgresql_ops={'created_at': 'DESC'}),
    )