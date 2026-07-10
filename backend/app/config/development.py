from .base import Config

class DevelopmentConfig(Config):
    DEBUG = True
    TESTING = False
    # Additional dev-specific overrides here