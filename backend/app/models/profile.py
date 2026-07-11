from sqlalchemy import Column, String, Text, Date, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from app.extensions import db
from .mixins import UUIDMixin, TimestampMixin

class Profile(UUIDMixin, TimestampMixin, db.Model):
    __tablename__ = 'profiles'

    # user_id is unique: one profile per user
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True)
    
    nickname = Column(String(100), nullable=True)
    bio = Column(Text, nullable=True)
    anniversary_date = Column(Date, nullable=True)
    favorite_color = Column(String(50), nullable=True)
    timezone = Column(String(50), default='UTC', nullable=False)

    # Relationships
    user = relationship("User", back_populates="profile")