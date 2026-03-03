"""Configuration de test — utilise SQLite en mémoire."""
import pytest
from app import create_app, db as _db, bcrypt, socketio


@pytest.fixture(scope='session')
def app():
    """Créer l'app Flask de test (une seule fois)."""
    import app as app_module

    # Monkey-patch pour utiliser threading au lieu de eventlet (Python 3.14)
    original_create = app_module.create_app

    def create_test_app():
        from flask import Flask
        from flask_cors import CORS
        from config import get_config

        flask_app = Flask(__name__)
        flask_app.config.from_object(get_config())
        flask_app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite://'
        flask_app.config['TESTING'] = True

        _db.init_app(flask_app)
        app_module.migrate.init_app(flask_app, _db)
        app_module.jwt.init_app(flask_app)
        app_module.bcrypt.init_app(flask_app)
        CORS(flask_app)
        socketio.init_app(flask_app, cors_allowed_origins='*', async_mode='threading')

        from app.models import user, follow, conversation, message  # noqa
        from app.sockets import messaging_events  # noqa
        from app.routes.messaging import messaging_bp
        from app.routes.search import search_bp
        flask_app.register_blueprint(messaging_bp, url_prefix='/api')
        flask_app.register_blueprint(search_bp, url_prefix='/api')

        return flask_app

    flask_app = create_test_app()
    yield flask_app


@pytest.fixture(scope='function')
def db(app):
    """Créer les tables avant chaque test, les nettoyer après."""
    with app.app_context():
        _db.create_all()
        yield _db
        _db.session.rollback()
        _db.drop_all()


@pytest.fixture(scope='function')
def client(app, db):
    """Client HTTP de test."""
    return app.test_client()


@pytest.fixture(scope='function')
def two_users(app, db):
    """Créer deux utilisateurs de test et retourner (user1, user2, token1, token2)."""
    from app.models.user import User, NiveauEnum
    from flask_jwt_extended import create_access_token

    u1 = User(
        student_id='TEST001', email_univ='alice@test.fr',
        nom='Dupont', prenom='Alice',
        password_hash=bcrypt.generate_password_hash('test123').decode(),
        niveau=NiveauEnum.L1, specialite='Web'
    )
    u2 = User(
        student_id='TEST002', email_univ='bob@test.fr',
        nom='Martin', prenom='Bob',
        password_hash=bcrypt.generate_password_hash('test123').decode(),
        niveau=NiveauEnum.L2, specialite='IA'
    )
    db.session.add_all([u1, u2])
    db.session.commit()

    with app.app_context():
        t1 = create_access_token(identity=u1.id)
        t2 = create_access_token(identity=u2.id)

    return u1, u2, t1, t2
