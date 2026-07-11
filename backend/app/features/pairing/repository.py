from sqlalchemy.orm import selectinload, joinedload
from app.models.space import Space
from app.models.space_member import SpaceMember

class PairingRepository:
    def __init__(self, db_session):
        """
        Initializes the repository with a database session.
        Note: The repository ONLY flushes to the session. It never commits or rolls back.
        """
        self.session = db_session

    def get_user_membership(self, user_id):
        """Returns the space_member record for a user if it exists."""
        return self.session.query(SpaceMember).filter_by(user_id=user_id).first()

    def check_invite_code_exists(self, invite_code):
        """Checks if an invite code is already in use to prevent collisions."""
        return self.session.query(Space.id).filter_by(invite_code=invite_code).first() is not None

    def get_space_by_invite_code(self, invite_code):
        """Retrieves a Space by its invite code."""
        return self.session.query(Space).filter_by(invite_code=invite_code).first()

    def get_space_by_invite_code_for_update(self, invite_code):
        """
        Retrieves a Space and locks the row (SELECT ... FOR UPDATE).
        Used during the join operation to prevent concurrent users from bypassing the member limit.
        """
        return self.session.query(Space).filter_by(invite_code=invite_code).with_for_update().first()

    def get_space_member_count(self, space_id):
        """Counts how many users are currently in a specific space."""
        return self.session.query(SpaceMember).filter_by(space_id=space_id).count()

    def get_space_by_id(self, space_id):
        """Retrieves a space by its primary key."""
        return self.session.query(Space).get(space_id)

    def get_space_with_members(self, space_id):
        """
        Retrieves a space, eagerly loading its members and their user profiles.
        Prevents N+1 query performance issues when serializing the current space.
        """
        return self.session.query(Space).options(
            selectinload(Space.members).joinedload(SpaceMember.user)
        ).filter_by(id=space_id).first()

    def add_space(self, space):
        """Adds a new space to the session and flushes it to generate the ID."""
        self.session.add(space)
        self.session.flush()

    def add_member(self, member):
        """Adds a new space member to the session and flushes it."""
        self.session.add(member)
        self.session.flush()