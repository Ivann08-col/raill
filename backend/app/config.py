import os
from datetime import timedelta

class Config:
    # Configuración de base de datos MariaDB
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'mysql+pymysql://root:koal@localhost:3307/synapse_db'

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Configuración JWT
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'tu-clave-secreta-muy-segura'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    
    # Configuración CORS
    CORS_ORIGINS = ['http://localhost:3000'] # Cambiar según el frontend
    
    # Configuración general
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'otra-clave-secreta'
    # Configuración de correo (SMTP) - usar variables de entorno en producción
    MAIL_SERVER = os.environ.get('MAIL_SERVER') or ''
    MAIL_PORT = int(os.environ.get('MAIL_PORT') or 587)
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME') or ''
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD') or ''
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', 'True').lower() in ('1', 'true', 'yes')
    MAIL_USE_SSL = os.environ.get('MAIL_USE_SSL', 'False').lower() in ('1', 'true', 'yes')
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER') or MAIL_USERNAME

class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}