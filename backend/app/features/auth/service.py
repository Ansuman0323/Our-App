class AuthService:
    def __init__(self, repository):
        self.repository = repository

    def synchronize_user(self, supabase_uid, payload):
        email = payload.get("email")
        
        if not email:
            raise ValueError("Email is required for synchronization")
            
        display_name = payload.get("display_name", email.split("@")[0])
        avatar_url = payload.get("avatar_url")
        
        return self.repository.sync_user(supabase_uid, email, display_name, avatar_url)