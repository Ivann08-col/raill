from datetime import date
from . import db
from ..utils import generate_uuid

class UsuarioHabitoProgreso(db.Model):
    __tablename__ = 'usuario_habito_progreso'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    usuario_id = db.Column(db.String(36), db.ForeignKey('usuario.id_usuario'), nullable=False)
    habito_id = db.Column(db.String(36), db.ForeignKey('habito.id_habito'), nullable=False)
    fecha = db.Column(db.Date, default=date.today, nullable=False)  # Fecha del registro
    progreso = db.Column(db.Integer, default=0, nullable=False)     # Progreso alcanzado hoy (ej: 4 vasos)
    completado = db.Column(db.Boolean, default=False, nullable=False)  # ¿Se cumplió el objetivo?

    # Relación para obtener los datos del hábito
    habito = db.relationship('Habito', backref='progresos', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'usuario_id': self.usuario_id,
            'habito_id': self.habito_id,
            'fecha': self.fecha.isoformat(),
            'progreso': self.progreso,
            'completado': self.completado,
            'habito': self.habito.to_dict() if self.habito else None
        }