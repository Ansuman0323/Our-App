import os
from flask import Flask
from .extensions import db, migrate, socketio, cors

def create_app(config_name=None):
    # Rename instance to 'flask_app' to avoid colliding with the 'app' module
    flask_app = Flask(__name__)
    
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')
    
    if config_name == 'production':
        flask_app.config.from_object('app.config.production.ProductionConfig')
    else:
        flask_app.config.from_object('app.config.development.DevelopmentConfig')

    initialize_extensions(flask_app)
    
    # Register all SQLAlchemy models immediately after DB initialization
    with flask_app.app_context():
        from app import models 
        
    register_blueprints(flask_app)
    register_error_handlers(flask_app)

    return flask_app

def initialize_extensions(flask_app):
    cors.init_app(flask_app, origins=[flask_app.config.get('CLIENT_URL', 'http://localhost:5173')], supports_credentials=True)
    db.init_app(flask_app)
    migrate.init_app(flask_app, db)
    socketio.init_app(flask_app, cors_allowed_origins=flask_app.config.get('CLIENT_URL', 'http://localhost:5173'))

def register_blueprints(flask_app):
    from app.features.auth.routes import auth_bp
    flask_app.register_blueprint(auth_bp, url_prefix='/api/v1/auth')
    from app.features.pairing.routes import pairing_bp
    flask_app.register_blueprint(pairing_bp, url_prefix='/api/v1/pairing')
    from app.features.dashboard.routes import dashboard_bp
    flask_app.register_blueprint(dashboard_bp)
    from app.features.chat.routes import chat_bp
    flask_app.register_blueprint(chat_bp)
    with flask_app.app_context():
        import app.features.chat.socket_events
        
def register_error_handlers(flask_app):
    @flask_app.errorhandler(Exception)
    def handle_exception(e):
        return {"error": "Internal Server Error", "message": str(e)}, 500