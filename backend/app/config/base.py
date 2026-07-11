import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "default-dev-key")
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    CLIENT_URL = os.environ.get("CLIENT_URL", "http://localhost:5173")

    SUPABASE_URL = os.environ.get("SUPABASE_URL")
    SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET")