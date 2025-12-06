import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app import create_app
from app.models import db
from app.models.habito import Habito

def seed_habitos():
    app = create_app()
    with app.app_context():
        habitos = [
            {'tipo': 'agua', 'nombre': 'Agua', 'unidad': 'vasos'},
            {'tipo': 'lectura', 'nombre': 'Lectura', 'unidad': 'páginas'},
            {'tipo': 'ejercicio', 'nombre': 'Ejercicio', 'unidad': 'minutos'},
        ]
        for h in habitos:
            if not Habito.query.filter_by(tipo=h['tipo']).first():
                db.session.add(Habito(**h))
        db.session.commit()
        print("Hábitos base insertados.")

if __name__ == '__main__':
    seed_habitos()