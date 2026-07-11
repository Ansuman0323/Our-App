from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from app.extensions import db
from .mixins import UUIDMixin, TimestampMixin

class Space(UUIDMixin, TimestampMixin, db.Model):
    __tablename__ = 'spaces'

    invite_code = Column(String(50), unique=True, index=True, nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='SET NULL'), nullable=True)

    # Relationships
    creator = relationship("User", back_populates="created_spaces")
    
    members = relationship(
        "SpaceMember", 
        back_populates="space",
        cascade="all, delete-orphan",
        lazy="selectin"
    )