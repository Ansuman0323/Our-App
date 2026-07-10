import os

class Config:
    """Base configuration."""
    SECRET_KEY = os.environ.get('SECRET_KEY', 'default-dev-key')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    CLIENT_URL = os.environ.get('CLIENT_URL', 'http://localhost:5173')
    
    # Supabase setup
    SUPABASE_URL = os.environ.get('SUPABASE_URL')
    SUPABASE_JWT_SECRET = os.environ.get('SUPABASE_JWT_SECRET')