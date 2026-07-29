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