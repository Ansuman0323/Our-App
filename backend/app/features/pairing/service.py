import string
import secrets
from app.models.space import Space
from app.models.space_member import SpaceMember
from app.features.pairing.exceptions import (
    SpaceNotFoundException,
    SpaceFullException,
    ForbiddenException
)

class PairingService:
    def __init__(self, repository):
        self.repository = repository

    def _generate_invite_code(self, length=8):
        """Generates a unique uppercase alphanumeric code."""
        characters = string.ascii_uppercase + string.digits
        while True:
            code = ''.join(secrets.choice(characters) for _ in range(length))
            if not self.repository.check_invite_code_exists(code):
                return code

    # -------------------------------------------------------------------------
    # CORE PAIRING METHODS (Restored)
    # -------------------------------------------------------------------------

    def get_pairing_status(self, user_id):
        """Returns true/false if the user is paired. Used by Auth Middleware."""
        membership = self.repository.get_user_membership(user_id)
        # Strictly returns boolean paired status, keeping invite logic separate
        return {"is_paired": membership is not None}

    def create_space(self, user_id):
        """Creates a new space and pairs the owner."""
        if self.repository.get_user_membership(user_id):
            raise ForbiddenException("You are already in a Space.")

        invite_code = self._generate_invite_code()
        new_space = Space(invite_code=invite_code, created_by=user_id)
        self.repository.add_space(new_space)
        
        new_member = SpaceMember(space_id=new_space.id, user_id=user_id, role='owner')
        self.repository.add_member(new_member)
        
        self.repository.session.flush()
        return {"message": "Space created successfully", "invite_code": invite_code}

    def join_space(self, user_id, invite_code):
        """Joins an existing space."""
        if self.repository.get_user_membership(user_id):
            raise ForbiddenException("You are already in a Space.")
            
        space = self.repository.get_space_by_invite_code_for_update(invite_code)
        if not space:
            raise SpaceNotFoundException("Invalid invite code.")
            
        member_count = self.repository.get_space_member_count(space.id)
        if member_count >= 2:
            raise SpaceFullException("This space is already full.")
            
        new_member = SpaceMember(space_id=space.id, user_id=user_id, role='partner')
        self.repository.add_member(new_member)
        
        self.repository.session.flush()
        return {"message": "Successfully joined space"}


    # -------------------------------------------------------------------------
    # DASHBOARD CONSUMED METHODS (New)
    # -------------------------------------------------------------------------

    def get_invite_details(self, user_id):
        """Retrieves the invite status for the dashboard."""
        membership = self.repository.get_user_membership(user_id)
        if not membership:
            return {"status": "not_paired"}

        member_count = self.repository.get_space_member_count(membership.space_id)

        if member_count == 1:
            space = self.repository.get_space_by_id(membership.space_id)
            return {
                "status": "waiting",
                "invite_code": space.invite_code
            }

        return {"status": "connected"}

    def regenerate_invite_code(self, user_id):
        """Generates a new invite code (Owner only, 1 member max)."""
        membership = self.repository.get_user_membership(user_id)
        if not membership:
            return None  
            
        if membership.role != 'owner':
            raise ForbiddenException("Only the space owner can regenerate the invite code.")

        member_count = self.repository.get_space_member_count(membership.space_id)
        if member_count > 1:
            raise SpaceFullException("Cannot regenerate invite code. Your partner has already joined.")

        space = self.repository.get_space_by_id(membership.space_id)
        new_code = self._generate_invite_code()
        space.invite_code = new_code
        
        self.repository.session.flush()

        return {
            "status": "waiting",
            "invite_code": space.invite_code
        }
    
    def delete_message_for_me(self, user_id, message_id):
        message = self.repository.get_message_by_id(message_id)
        if not message:
            raise ValidationError("Message not found.")
            
        # Ensure user is actually in this space before allowing them to hide it
        membership = self.repository.get_space_membership(user_id)
        if not membership or str(membership.space_id) != str(message.space_id):
            raise UnauthorizedError("Not authorized to modify messages in this space.")

        self.repository.hide_message_for_user(user_id, message_id)
        self.session.commit()
        return {"success": True, "message_id": message_id}