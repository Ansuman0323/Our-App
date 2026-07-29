import os
from flask import Flask
from .extensions import db, migrate, socketio, cors
from werkzeug.exceptions import HTTPException

def create_app(config_name=None):
    flask_app = Flask(__name__)

    if config_name is None:
        config_name = os.environ.get("FLASK_ENV", "development")

    if config_name == "production":
        flask_app.config.from_object("app.config.production.ProductionConfig")
    else:
        flask_app.config.from_object("app.config.development.DevelopmentConfig")

    initialize_extensions(flask_app)

    # Register SQLAlchemy models
    with flask_app.app_context():
        from app import models

    register_blueprints(flask_app)
    register_error_handlers(flask_app)

    return flask_app


def initialize_extensions(flask_app):
    """
    Configure all Flask extensions.

    Supports:
    - Local Vite development
    - Capacitor Android
    - Capacitor iOS
    - Future deployed frontend
    """

    allowed_origins = [
        "http://localhost:5173",     # Vite Dev
        "http://127.0.0.1:5173",
        "https://localhost",         # Capacitor Android
        "capacitor://localhost",     # Capacitor iOS
    ]

    # Optional production frontend URL
    client_url = flask_app.config.get("CLIENT_URL")
    if client_url and client_url not in allowed_origins:
        allowed_origins.append(client_url)

    print("Allowed Origins:", allowed_origins)

    cors.init_app(
        flask_app,
        resources={
            r"/*": {
                "origins": allowed_origins,
                "supports_credentials": True
            }
        }
    )

    db.init_app(flask_app)
    migrate.init_app(flask_app, db)

    socketio.init_app(
        flask_app,
        cors_allowed_origins=allowed_origins,
        async_mode="eventlet",
        logger=True,
        engineio_logger=True
    )

    print("SocketIO async mode:", socketio.async_mode)


def register_blueprints(flask_app):
    from app.features.system.routes import system_bp
    flask_app.register_blueprint(system_bp)  # no prefix -> GET /health

    from app.features.auth.routes import auth_bp
    flask_app.register_blueprint(auth_bp, url_prefix="/api/v1/auth")

    from app.features.pairing.routes import pairing_bp
    flask_app.register_blueprint(pairing_bp, url_prefix="/api/v1/pairing")

    from app.features.dashboard.routes import dashboard_bp
    flask_app.register_blueprint(dashboard_bp)

    from app.features.chat.routes import chat_bp
    flask_app.register_blueprint(chat_bp)

    with flask_app.app_context():
        import app.features.chat.socket_events
        import app.features.calls.socket_events


def register_error_handlers(flask_app):

    @flask_app.errorhandler(Exception)
    def handle_exception(e):

        if isinstance(e, HTTPException):
            return {
                "error": e.name,
                "message": e.description
            }, e.code

        import traceback
        traceback.print_exc()

        return {
            "error": "Internal Server Error",
            "message": str(e)
        }, 500