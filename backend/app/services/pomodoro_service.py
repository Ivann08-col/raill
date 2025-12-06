from datetime import datetime
from app.models import db, Sesion, Tecnica, SesionTecnicaParam


class PomodoroService:
   @staticmethod
   def iniciar_pomodoro(usuario_id, duracion_trabajo=25, duracion_descanso=5, ciclos_objetivo=4, modo_no_distraccion=False):
      """
      Crea una nueva sesión de Pomodoro para el usuario.

      Si no existe una técnica 'Pomodoro Clásico' en la tabla `tecnica`, se crea una entrada por defecto.
      Se guardan además parámetros asociados a la sesión en `sesiontecnicaparam`.
      Devuelve la sesión creada (como dict) o lanza excepción en error.
      """
      # Buscar o crear una técnica por defecto
      tecnica = Tecnica.query.filter_by(nombre='Pomodoro Clásico').first()
      if tecnica is None:
         tecnica = Tecnica(
            nombre='Pomodoro Clásico',
            descripcion='Técnica Pomodoro clásica generada automáticamente',
            duracion_estimada=duracion_trabajo,
            categoria='Pomodoro'
         )
         db.session.add(tecnica)
         db.session.flush()  # asegurar id

      # Crear la sesión
      nueva_sesion = Sesion(
         usuario_id=usuario_id,
         tecnica_id=tecnica.id_tecnica,
         fecha_inicio=datetime.utcnow(),
         estado='En Progreso'
      )
      db.session.add(nueva_sesion)
      db.session.flush()  # generar id_sesion antes de usarla en params

      # Parámetros asociados a la sesión
      parametros = [
         {'parametro': 'duracion_trabajo', 'valor': str(duracion_trabajo)},
         {'parametro': 'duracion_descanso', 'valor': str(duracion_descanso)},
         {'parametro': 'ciclos_objetivo', 'valor': str(ciclos_objetivo)},
         {'parametro': 'ciclos_completados', 'valor': '0'},
         {'parametro': 'fase_actual', 'valor': 'trabajo'},
         {'parametro': 'tiempo_inicio_fase', 'valor': datetime.utcnow().isoformat()},
         {'parametro': 'modo_no_distraccion', 'valor': str(modo_no_distraccion)}
      ]

      for param in parametros:
         sesion_param = SesionTecnicaParam(
            id_sesion=nueva_sesion.id_sesion,
            parametro=param['parametro'],
            valor=param['valor']
         )
         db.session.add(sesion_param)

      # Commit de la transacción
      db.session.commit()

      return nueva_sesion.to_dict()

