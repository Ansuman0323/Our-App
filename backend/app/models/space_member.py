from sqlalchemy import Column, String, ForeignKey, DateTime, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, timezone
from app.extensions import db
from .mixins import UUIDMixin, TimestampMixin

class SpaceMember(UUIDMixin, TimestampMixin, db.Model):
    __tablename__ = 'space_members'

    # CASCADE applied. space_id retains index=True as it is NOT unique (1:N relationship).
    space_id = Column(UUID(as_uuid=True), ForeignKey('spaces.id', ondelete='CASCADE'), nullable=False, index=True)
    # CASCADE applied. user_id is unique=True (1:1 relationship per user).
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True)
    
    role = Column(String(20), default='owner', nullable=False)
    joined_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        CheckConstraint(role.in_(['owner', 'partner']), name='chk_space_members_role'),
    )

    space = relationship("Space", back_populates="members")
    user = relationship("User", back_populates="space_membership")