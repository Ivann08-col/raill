from datetime import datetime
from . import db


class PasswordResetCode(db.Model):
    __tablename__ = 'password_reset_code'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True) 
    usuario_id = db.Column(db.String(36), db.ForeignKey('usuario.id_usuario'), nullable=False)
    code = db.Column(db.String(6), nullable=False)  
    expires_at = db.Column(db.DateTime, nullable=False)
    used = db.Column(db.Boolean, default=False, nullable=False)

    def is_expired(self):
        return datetime.utcnow() > self.expires_at

    def to_dict(self):
        return {
            'id': self.id,
            'usuario_id': self.usuario_id,
            'code': self.code,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'used': self.used
        }