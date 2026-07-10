import os
from flask import Flask
from .extensions import db, migrate, socketio, cors

def create_app(config_name=None):
    app = Flask(__name__)
    
    # Load configuration
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')
    
    if config_name == 'production':
        app.config.from_object('app.config.production.ProductionConfig')
    else:
        app.config.from_object('app.config.development.DevelopmentConfig')

    # Initialize Extensions
    initialize_extensions(app)
    
    # Register Blueprints
    register_blueprints(app)
    
    # Register Error Handlers
    register_error_handlers(app)

    return app

def initialize_extensions(app):
    cors.init_app(app, origins=[app.config.get('CLIENT_URL')], supports_credentials=True)
    db.init_app(app)
    migrate.init_app(app, db)
    socketio.init_app(app, cors_allowed_origins=app.config.get('CLIENT_URL'))

def register_blueprints(app):
    # Example registration for future modules
    from app.features.auth.routes import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/api/v1/auth')
    
    # Future registrations: profile_bp, pairing_bp, chat_bp, etc.

def register_error_handlers(app):
    @app.errorhandler(Exception)
    def handle_exception(e):
        # Base global error handler placeholder
        return {"error": "Internal Server Error", "message": str(e)}, 500