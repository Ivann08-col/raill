from datetime import date
from . import db
from ..utils import generate_uuid

class UsuarioHabitoConfig(db.Model):
    __tablename__ = 'usuario_habito_config'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    usuario_id = db.Column(db.String(36), db.ForeignKey('usuario.id_usuario'), nullable=False)
    habito_id = db.Column(db.String(36), db.ForeignKey('habito.id_habito'), nullable=False)
    objetivo_diario = db.Column(db.Integer, nullable=False)  # Ej: 8 vasos, 20 páginas, 30 minutos
    fecha_inicio = db.Column(db.Date, default=date.today, nullable=False)  # Fecha desde la que se aplica esta configuración
    estado = db.Column(db.Boolean, default=True, nullable=False)  # Si esta configuración está activa o no

    # Relación para obtener los datos del hábito
    habito = db.relationship('Habito', backref='configuraciones', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'usuario_id': self.usuario_id,
            'habito_id': self.habito_id,
            'objetivo_diario': self.objetivo_diario,
            'fecha_inicio': self.fecha_inicio.isoformat(),
            'estado': self.estado,
            'habito': self.habito.to_dict() if self.habito else None
        }