# backend/app/services/recompensa_service.py
from app.models import db, Recompensa
from datetime import datetime

class RecompensaService:

    @staticmethod
    def crear_recompensas_iniciales():
        """
        Crea recompensas realistas basadas en las funcionalidades del sistema Synapse.
        Solo inserta si no existen (evita duplicados).
        """
        recompensas_data = [
            {
                'nombre': 'Primera Sesión',
                'descripcion': '¡Bienvenido! Completa tu primera sesión de estudio o meditación.',
                'tipo': 'puntos',
                'valor': 10,
                'requisitos': {'sesiones_completadas': 1}
            },
            {
                'nombre': 'Estudiante Dedicado',
                'descripcion': '¡Sigue así! Has completado 10 sesiones de estudio.',
                'tipo': 'puntos',
                'valor': 50,
                'requisitos': {'sesiones_completadas': 10}
            },
            {
                'nombre': 'Maratonista Mental',
                'descripcion': '¡Impresionante! Has acumulado 5 horas (300 minutos) de estudio.',
                'tipo': 'puntos',
                'valor': 100,
                'requisitos': {'tiempo_total_minutos': 300}
            },
            {
                'nombre': 'Organizador Pro',
                'descripcion': '¡Eres un ejemplo! Has completado 20 tareas.',
                'tipo': 'puntos',
                'valor': 75,
                'requisitos': {'tareas_completadas': 20}
            },
            {
                'nombre': 'Constancia Diaria',
                'descripcion': '¡Racha de 7 días! Has estudiado al menos un poco durante una semana seguida.',
                'tipo': 'puntos',
                'valor': 150,
                'requisitos': {'dias_consecutivos': 7}
            },
            {
                'nombre': 'Meditador Principiante',
                'descripcion': '¡Felicitaciones! Has completado tu primera sesión de meditación.',
                'tipo': 'puntos',
                'valor': 15,
                'requisitos': {'meditaciones_completadas': 1}
            },
            {
                'nombre': 'Pomodoro Maestro',
                'descripcion': '¡Dominas la técnica! Has completado un ciclo completo de Pomodoro (4 rondas).',
                'tipo': 'puntos',
                'valor': 40,
                'requisitos': {'pomodoros_completos': 1}
            },
            {
                'nombre': 'Enfoque Total',
                'descripcion': '¡Sin distracciones! Has completado un Pomodoro con el modo "sin distracciones" activado.',
                'tipo': 'puntos',
                'valor': 60,
                'requisitos': {'pomodoros_sin_distraccion': 1}
            },
            {
                'nombre': 'Productividad Anticipada',
                'descripcion': '¡Eficiencia pura! Has completado una tarea al menos la mitad del tiempo asignado.',
                'tipo': 'puntos',
                'valor': 30,
                'requisitos': {'tareas_anticipadas_mitad_tiempo': 1}
            },
            {
                'nombre': 'Tarea en Tiempo',
                'descripcion': '¡Cumplidor! Has completado una tarea antes o en su fecha límite.',
                'tipo': 'puntos',
                'valor': 20,
                'requisitos': {'tareas_completadas_tiempo': 1}
            }
        ]

        for data in recompensas_data:
            if not Recompensa.query.filter_by(nombre=data['nombre']).first():
                recompensa = Recompensa(
                    nombre=data['nombre'],
                    descripcion=data['descripcion'],
                    tipo=data['tipo'],
                    valor=data['valor'],
                    requisitos=data['requisitos']
                )
                db.session.add(recompensa)
                print(f"✅ Recompensa creada: {data['nombre']}")
            else:
                print(f"⚠️ Recompensa ya existe: {data['nombre']}")

        db.session.commit()

    @staticmethod
    def obtener_todas():
        """Devuelve todas las recompensas en formato serializable."""
        recompensas = Recompensa.query.all()
        return [r.to_dict() for r in recompensas]