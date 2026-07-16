import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, BigInteger, Integer, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.extensions import db

class MessageAttachment(db.Model):
    __tablename__ = 'message_attachments'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Cascades on message deletion
    message_id = Column(UUID(as_uuid=True), ForeignKey('messages.id', ondelete='CASCADE'), nullable=False)
    
    # Unique constraint ensures no duplicate file uploads and simplifies orphan cleanup
    storage_key = Column(String(255), unique=True, nullable=False)

    file_name = Column(String(255), nullable=False)
    
    mime_type = Column(String(100), nullable=False)
    
    # Changed to BigInteger for large video/audio support
    file_size = Column(BigInteger, nullable=False) 
    
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    duration = Column(Integer, nullable=True)
    thumbnail_url = Column(String(500), nullable=True)
    
    # Timezone-aware timestamp
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    message = relationship('Message', back_populates='attachments')

    # Data validation constraints
    __table_args__ = (
        CheckConstraint('file_size >= 0', name='chk_attachment_file_size_positive'),
        CheckConstraint('width >= 0', name='chk_attachment_width_positive'),
        CheckConstraint('height >= 0', name='chk_attachment_height_positive'),
        CheckConstraint('duration >= 0', name='chk_attachment_duration_positive'),
    )