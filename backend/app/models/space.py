from sqlalchemy import Column, String, Date, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from app.extensions import db
from .mixins import UUIDMixin, TimestampMixin

class Space(UUIDMixin, TimestampMixin, db.Model):
    __tablename__ = 'spaces'

    # Reduced to 8 characters. index=True removed because unique=True handles it.
    invite_code = Column(String(8), unique=True, nullable=False)
    relationship_started_on = Column(Date, nullable=True)
    status = Column(String(20), nullable=False, server_default='active')

    # SET NULL applied: Space survives even if the creator deletes their account.
    created_by = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='SET NULL'), nullable=True)

    __table_args__ = (
        CheckConstraint(status.in_(['active', 'archived']), name='chk_spaces_status'),
    )

    creator = relationship("User", back_populates="created_spaces")
    members = relationship("SpaceMember", back_populates="space", cascade="all, delete-orphan", lazy="selectin")