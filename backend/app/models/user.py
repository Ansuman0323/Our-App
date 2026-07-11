from sqlalchemy import Column, String
from sqlalchemy.orm import relationship
from app.extensions import db
from .mixins import UUIDMixin, TimestampMixin

class User(UUIDMixin, TimestampMixin, db.Model):
    __tablename__ = 'users'

    supabase_uid = Column(String(255), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    display_name = Column(String(100), nullable=False)
    avatar_url = Column(String(500), nullable=True)

    # Relationships
    profile = relationship(
        "Profile", 
        back_populates="user", 
        uselist=False, 
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    
    space_membership = relationship(
        "SpaceMember",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
        lazy="selectin"
    )

    created_spaces = relationship(
        "Space",
        back_populates="creator",
        lazy="select"
    )