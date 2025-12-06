from datetime import datetime
from . import db
from ..utils import generate_uuid

class Habito(db.Model):
    __tablename__ = 'habito'

    id_habito = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    nombre = db.Column(db.String(100), nullable=False)  # Ej: "Agua", "Lectura", "Ejercicio"
    tipo = db.Column(db.String(50), nullable=False)     # Ej: "agua", "lectura", "ejercicio"
    unidad = db.Column(db.String(20), nullable=True)    # Ej: "vasos", "páginas", "minutos"

    def to_dict(self):
        return {
            'id_habito': self.id_habito,
            'nombre': self.nombre,
            'tipo': self.tipo,
            'unidad': self.unidad
        }