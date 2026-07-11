from sqlalchemy import Column, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, timezone
from app.extensions import db
from .mixins import UUIDMixin, TimestampMixin

class SpaceMember(UUIDMixin, TimestampMixin, db.Model):
    __tablename__ = 'space_members'

    space_id = Column(UUID(as_uuid=True), ForeignKey('spaces.id', ondelete='CASCADE'), nullable=False, index=True)
    # user_id is unique: A user can only be in one space at a time
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True)
    
    role = Column(String(50), default='member', nullable=False)
    joined_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    space = relationship("Space", back_populates="members")
    user = relationship("User", back_populates="space_membership")