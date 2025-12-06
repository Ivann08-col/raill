from datetime import datetime, date
from . import db
from ..utils import generate_uuid

class EstadoAnimo(db.Model):
    __tablename__ = 'estado_animo'

    id_estado = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    usuario_id = db.Column(db.String(36), db.ForeignKey('usuario.id_usuario'), nullable=False)
    valor = db.Column(db.Integer, nullable=False)  
    nota = db.Column(db.Text, nullable=True)
    creado_en = db.Column(db.DateTime(6), default=datetime.utcnow, nullable=False)
    fecha = db.Column(db.Date, default=date.today, nullable=False) 

    def to_dict(self):
        return {
            'id_estado': self.id_estado,
            'usuario_id': self.usuario_id,
            'valor': self.valor,
            'nota': self.nota,
            'creado_en': self.creado_en.isoformat() if self.creado_en else None,
            'fecha': self.fecha.isoformat() if self.fecha else None  
        }