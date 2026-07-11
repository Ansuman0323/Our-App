from app.models.user import User
from app.models.profile import Profile
from sqlalchemy.exc import IntegrityError

class AuthRepository:
    def __init__(self, db_session):
        self.session = db_session

    def get_user_by_supabase_uid(self, supabase_uid):
        return self.session.query(User).filter_by(supabase_uid=supabase_uid).first()

    def sync_user(self, supabase_uid, email, display_name, avatar_url=None):
        user = self.get_user_by_supabase_uid(supabase_uid)
        
        if not user:
            user = User(
                supabase_uid=supabase_uid,
                email=email,
                display_name=display_name,
                avatar_url=avatar_url
            )
            self.session.add(user)
            self.session.flush() # Flush to generate user.id
            
            profile = Profile(user_id=user.id)
            self.session.add(profile)
        else:
            user.email = email
            user.display_name = display_name
            if avatar_url:
                user.avatar_url = avatar_url
                
        try:
            self.session.commit()
            return user
        except IntegrityError:
            self.session.rollback()
            raise Exception("Database integrity error during user sync")