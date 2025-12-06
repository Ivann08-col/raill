from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.metrics_service import get_overview, get_weekly, get_habits, get_recent, get_mood_distribution
from flask import request
from app.models import db, EstadoAnimo

dashboard_bp = Blueprint('dashboard', __name__)


@dashboard_bp.route('/overview', methods=['GET'])
@jwt_required()
def overview():
    usuario_id = get_jwt_identity()
    resp = {}
    ov = get_overview(usuario_id)
    if ov:
        resp.update(ov)

    mood = get_mood_distribution(usuario_id)
    if mood:
        resp['mood'] = mood

    # Si no hay nada de actividad, devolver objeto vacío para que frontend lo oculte
    return jsonify(resp), 200


@dashboard_bp.route('/weekly', methods=['GET'])
@jwt_required()
def weekly():
    usuario_id = get_jwt_identity()
    data = get_weekly(usuario_id)
    return jsonify(data or {}), 200


@dashboard_bp.route('/habits', methods=['GET'])
@jwt_required()
def habits():
    usuario_id = get_jwt_identity()
    data = get_habits(usuario_id)
    return jsonify(data or []), 200


@dashboard_bp.route('/recent', methods=['GET'])
@jwt_required()
def recent():
    usuario_id = get_jwt_identity()
    data = get_recent(usuario_id)
    return jsonify(data or {}), 200



@dashboard_bp.route('/mood', methods=['POST'])
@jwt_required()
def post_mood():
    usuario_id = get_jwt_identity()
    data = request.get_json() or {}
    valor = data.get('valor')
    nota = data.get('nota')

    if valor is None:
        return jsonify({'error': 'Campo "valor" requerido (1-5)'}), 400
    try:
        valor = int(valor)
    except Exception:
        return jsonify({'error': 'Valor debe ser un entero entre 1 y 5'}), 400

    if valor < 1 or valor > 5:
        return jsonify({'error': 'Valor debe estar entre 1 y 5'}), 400

    entrada = EstadoAnimo(usuario_id=usuario_id, valor=valor, nota=nota)
    try:
        db.session.add(entrada)
        db.session.commit()
        return jsonify(entrada.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500



@dashboard_bp.route('/mood', methods=['GET'])
@jwt_required()
def get_moods():
    """Devuelve entradas de estado de ánimo del usuario y una distribución agregada.

    Query params opcionales:
      - days (int): ventana en días hacia atrás (default 30)
      - limit (int): límite de entradas (default 50)
    """
    usuario_id = get_jwt_identity()
    try:
        days = int(request.args.get('days', 30))
    except Exception:
        days = 30
    try:
        limit = int(request.args.get('limit', 50))
    except Exception:
        limit = 50

    from datetime import datetime, timedelta
    since = datetime.utcnow() - timedelta(days=days)

    entradas = EstadoAnimo.query.filter(
        EstadoAnimo.usuario_id == usuario_id,
        EstadoAnimo.creado_en >= since
    ).order_by(EstadoAnimo.creado_en.desc()).limit(limit).all()
    lista = [e.to_dict() for e in entradas]

    # Agregar distribución simple
    counts = {'Excelente': 0, 'Bien': 0, 'Regular': 0, 'Bajo': 0}
    total = 0
    for e in entradas:
        v = e.valor
        total += 1
        if v >= 5:
            counts['Excelente'] += 1
        elif v == 4:
            counts['Bien'] += 1
        elif v == 3:
            counts['Regular'] += 1
        else:
            counts['Bajo'] += 1

    if total == 0:
        distribution = {}
    else:
        distribution = {k: int((v / total) * 100) for k, v in counts.items()}

    # Always return arrays/objects (no nulls) so frontend doesn't error; frontend can hide when empty
    return jsonify({'entries': lista or [], 'distribution': distribution}), 200
