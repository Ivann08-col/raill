from datetime import datetime
from . import db
from ..utils import generate_uuid

class MensajeSala(db.Model):
    __tablename__ = 'mensajesala'

    id_mensaje = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    id_sala = db.Column(db.String(36), db.ForeignKey('sala.id_sala'), nullable=False)
    autor_id = db.Column(db.String(36), db.ForeignKey('usuario.id_usuario'), nullable=False)
    contenido = db.Column(db.Text, nullable=False)
    fecha_creacion = db.Column(db.DateTime(6), default=datetime.utcnow, nullable=False)
    editado = db.Column(db.Boolean, default=False, nullable=False)  

    def to_dict(self):
        return {
            'id_mensaje': self.id_mensaje,
            'id_sala': self.id_sala,
            'autor_id': self.autor_id,
            'contenido': self.contenido,
            'fecha_creacion': self.fecha_creacion.isoformat() if self.fecha_creacion else None,
            'editado': self.editado  
        }