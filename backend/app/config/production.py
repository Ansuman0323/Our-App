from .base import Config

class ProductionConfig(Config):
    DEBUG = False
    TESTING = False
    # Ensure secure cookies and stricter CORS in production
    SESSION_COOKIE_SECURE = True