from datetime import datetime, date, timedelta
from collections import defaultdict
from app.models import db, Sesion, Tecnica, SesionTecnicaParam, Progreso, Tarea
from sqlalchemy import or_


def _start_of_day(dt: datetime):
    return datetime(dt.year, dt.month, dt.day)


def get_overview(usuario_id):
    """Retorna las métricas principales del día para el usuario.

    - Usa `Progreso` como fuente primaria para tareas y minutos de estudio diarios.
    - Calcula minutos de meditación del día consultando sesiones con técnicas de categoría 'Meditacion' o nombre que contenga 'Medit'.
    - Calcula conteos de med/pomo mediante técnicas categorizadas o por nombre.
    """
    hoy = date.today()
    inicio_hoy = datetime(hoy.year, hoy.month, hoy.day)

    # Progreso diario (si existe)
    progreso = Progreso.query.filter_by(usuario_id=usuario_id, fecha=hoy).first()

    minutos_concentracion = progreso.minutos_estudio if progreso else 0
    tareas_completadas = progreso.tareas_completadas if progreso else 0

    # Meditación: sumar duraciones de sesiones completadas hoy donde la técnica parezca meditación
    meditacion_minutos = 0
    meditacion_count = 0
    pomodoro_count = 0

    sesiones_hoy = Sesion.query.join(Tecnica).filter(
        Sesion.usuario_id == usuario_id,
        Sesion.fecha_inicio >= inicio_hoy,
        Sesion.estado == 'Completado'
    ).all()

    for s in sesiones_hoy:
        nombre = s.tecnica_sesion.nombre.lower() if s.tecnica_sesion and s.tecnica_sesion.nombre else ''
        cat = (s.tecnica_sesion.categoria or '').lower() if s.tecnica_sesion else ''
        dur = s.duracion_real or 0
        if 'medit' in nombre or 'medit' in cat or cat == 'meditacion' or 'meditation' in nombre:
            meditacion_minutos += dur
            meditacion_count += 1
        if 'pomodoro' in nombre or cat == 'pomodoro' or 'pomodor' in nombre:
            pomodoro_count += 1

    # If user has no activity at all today, return None so frontend can hide the widget
    if (minutos_concentracion == 0 and meditacion_minutos == 0 and tareas_completadas == 0
            and meditacion_count == 0 and pomodoro_count == 0):
        return None

    return {
        'concentracion_hoy_min': minutos_concentracion,
        'meditacion_hoy_min': meditacion_minutos,
        'tareas_completadas_hoy': tareas_completadas,
        'med_count_today': meditacion_count,
        'pomo_count_today': pomodoro_count
    }


def get_weekly(usuario_id, days=7):
    """Genera datos diarios para la última semana (incluye hoy).
    Devuelve listas de valores para concentración, meditación y tareas.
    """
    today = date.today()
    start = today - timedelta(days=days - 1)

    labels = []
    concentracion = []
    meditacion = []
    tareas = []

    for i in range(days):
        d = start + timedelta(days=i)
        labels.append(d.strftime('%a'))

        # Progreso diario
        prog = Progreso.query.filter_by(usuario_id=usuario_id, fecha=d).first()
        minutos = prog.minutos_estudio if prog else 0
        tareas_c = prog.tareas_completadas if prog else 0

        # Meditación: sumar sesiones completadas ese día
        inicio = datetime(d.year, d.month, d.day)
        fin = inicio + timedelta(days=1)
        medit_min = db.session.query(db.func.coalesce(db.func.sum(Sesion.duracion_real), 0)).join(Tecnica).filter(
                Sesion.usuario_id == usuario_id,
                Sesion.fecha_inicio >= inicio,
                Sesion.fecha_inicio < fin,
                Sesion.estado == 'Completado',
                or_(Tecnica.categoria.ilike('%medit%'), Tecnica.nombre.ilike('%medit%'))
        ).scalar() or 0

        concentracion.append(int(minutos))
        meditacion.append(int(medit_min))
        tareas.append(int(tareas_c))

    # If there's no activity in the window, return None so frontend can skip charting
    if sum(concentracion) + sum(meditacion) + sum(tareas) == 0:
        return None

    return {'labels': labels, 'concentracion': concentracion, 'meditacion': meditacion, 'tareas': tareas}


def get_mood_distribution(usuario_id, lookback_days=30):
    """Construye una distribución de estado de ánimo consultando parámetros 'calificacion' en sesiones.

    Mapeo simple:
      5 -> Excelente
      4 -> Bien
      3 -> Regular
      <=2 -> Bajo
    """
    since = datetime.utcnow() - timedelta(days=lookback_days)
    params = SesionTecnicaParam.query.join(Sesion).filter(
        Sesion.usuario_id == usuario_id,
        Sesion.fecha_inicio >= since,
        SesionTecnicaParam.parametro.ilike('calificacion')
    ).all()

    counts = defaultdict(int)
    total = 0
    for p in params:
        try:
            val = int(p.valor)
        except Exception:
            continue
        total += 1
        if val >= 5:
            counts['Excelente'] += 1
        elif val == 4:
            counts['Bien'] += 1
        elif val == 3:
            counts['Regular'] += 1
        else:
            counts['Bajo'] += 1

    # Si no hay datos, devolver None para indicar que no debe mostrarse
    if total == 0:
        return None

    return {k: int((v / total) * 100) for k, v in counts.items()}


def get_habits(usuario_id):
    """Calcula progreso aproximado y racha para hábitos comunes en la última semana.

    Objetivos por defecto (pueden parametrizarse en el futuro):
      - Concentración: 4 sesiones / semana
      - Meditación: 7 sesiones / semana
      - Lectura: 7 sesiones / semana (aprox)
      - Ejercicio: 3 sesiones / semana
    """
    today = date.today()
    start = today - timedelta(days=6)
    inicio = datetime(start.year, start.month, start.day)
    fin = datetime(today.year, today.month, today.day) + timedelta(days=1)

    sesiones = Sesion.query.join(Tecnica).filter(
        Sesion.usuario_id == usuario_id,
        Sesion.fecha_inicio >= inicio,
        Sesion.fecha_inicio < fin,
        Sesion.estado == 'Completado'
    ).all()

    counters = {'concentracion': 0, 'meditacion': 0, 'lectura': 0, 'ejercicio': 0}

    for s in sesiones:
        nombre = (s.tecnica_sesion.nombre or '').lower()
        cat = (s.tecnica_sesion.categoria or '').lower()
        if 'medit' in nombre or 'medit' in cat:
            counters['meditacion'] += 1
        if 'pomodoro' in nombre or cat == 'pomodoro' or 'concentr' in nombre or 'focus' in nombre:
            counters['concentracion'] += 1
        if 'lect' in nombre or 'read' in nombre:
            counters['lectura'] += 1
        if 'ejercicio' in nombre or 'exercise' in nombre or 'workout' in nombre:
            counters['ejercicio'] += 1

    goals = {'concentracion': 4, 'meditacion': 7, 'lectura': 7, 'ejercicio': 3}

    habits = []
    for key in ['concentracion', 'meditacion', 'lectura', 'ejercicio']:
        done = counters[key]
        goal = goals[key]
        percent = min(100, int((done / goal) * 100)) if goal > 0 else 0
        habits.append({
            'habit': key.capitalize(),
            'done': done,
            'goal': goal,
            'progress_percent': percent,
            'streak_days': done  # aproximación básica: cantidad de días con actividad
        })

    # If all habits show zero progress, return None so frontend can hide the habits card
    if all(h['done'] == 0 for h in habits):
        return None

    return habits


def get_recent(usuario_id, limit=10):
    """Devuelve actividad reciente: últimas sesiones y tareas completadas."""
    sesiones = Sesion.query.filter_by(usuario_id=usuario_id).order_by(Sesion.fecha_inicio.desc()).limit(limit).all()
    sesiones_list = []
    for s in sesiones:
        sesiones_list.append({
            'type': 'sesion',
            'id': s.id_sesion,
            'tecnica': s.tecnica_sesion.nombre if s.tecnica_sesion else None,
            'fecha': s.fecha_inicio.isoformat(),
            'duracion_min': s.duracion_real,
            'estado': s.estado
        })

    tareas = Tarea.query.filter_by(usuario_id=usuario_id, completada=True).order_by(Tarea.fecha_creacion.desc()).limit(5).all()
    tareas_list = [{'type': 'tarea', 'id': t.id_tarea, 'titulo': t.titulo, 'fecha': t.fecha_creacion.isoformat()} for t in tareas]

    # Intercalar o concatenar
    if not sesiones_list and not tareas_list:
        return None

    return {'sesiones': sesiones_list, 'tareas': tareas_list}
