import pytest
from flask import Flask
from flask_jwt_extended import JWTManager, create_access_token

from app.models import db, Rol, Usuario
from app.routes.dashboard_routes import dashboard_bp


@pytest.fixture(scope='session')
def app():
    app = Flask(__name__)
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = 'test-secret'

    # Init extensions
    db.init_app(app)
    jwt = JWTManager(app)

    # Register only the dashboard blueprint needed for tests
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')

    with app.app_context():
        db.create_all()

        # Create a role and a test user
        rol = Rol(nombre='test')
        db.session.add(rol)
        db.session.flush()

        user = Usuario(username='testuser', correo='test@example.com', password='x', rol_id=rol.id)
        db.session.add(user)
        db.session.commit()

        yield app

        db.session.remove()
        db.drop_all()


@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture()
def token(app):
    # generate access token for the single test user
    with app.app_context():
        user = Usuario.query.filter_by(username='testuser').first()
        return create_access_token(identity=user.id_usuario)
