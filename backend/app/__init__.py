from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from flask_socketio import SocketIO

from config import get_config

# Extensions — initialisées sans app (pattern Application Factory)
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
bcrypt = Bcrypt()
socketio = SocketIO()


def create_app():
    app = Flask(__name__)
    app.config.from_object(get_config())

    # Init des extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    bcrypt.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})
    # threading = compatible Python 3.13+ (eventlet ne l'est pas)
    socketio.init_app(app, cors_allowed_origins="*", async_mode="threading", allow_upgrades=False)

    # Import modèles — nécessaire pour que Flask-Migrate les détecte
    from app.models import user, follow, quiz, question, quiz_result  # noqa: F401 (M2)
    from app.models import resource  # noqa: F401 (M2 — Resources)
    from app.models import conversation, message  # noqa: F401 (M3)
    from app.models import post, swipe, match  # noqa: F401 (M1 — Feed)

    # Import socket events
    from app.sockets import messaging_events  # noqa: F401

    # JWT blacklist — vérifie chaque token entrant (M1)
    from app.services.auth_service import is_token_revoked

    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(_jwt_header, jwt_payload):
        return is_token_revoked(jwt_payload)

    # JWT error handlers (M1)
    from app.routes.auth import register_jwt_error_handlers
    register_jwt_error_handlers(jwt)

    # Blueprints
    from app.routes.auth import auth_bp
    from app.routes.messaging import messaging_bp
    from app.routes.search import search_bp
    from app.routes.feed import feed_bp
    from app.routes.quiz import quiz_bp
    from app.routes.resources import resources_bp
    app.register_blueprint(auth_bp)
    app.register_blueprint(feed_bp)
    app.register_blueprint(messaging_bp, url_prefix='/api')
    app.register_blueprint(search_bp, url_prefix='/api')
    app.register_blueprint(quiz_bp)
    app.register_blueprint(resources_bp)

    return app
