# backend/app/routes/estado_animo_routes.py
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import EstadoAnimo
from datetime import datetime, timedelta

estado_animo_bp = Blueprint('estado_animo', __name__, url_prefix='/api/estado-animo')

@estado_animo_bp.route('/historial', methods=['GET'])
@jwt_required()
def get_historial():
    """
    Obtiene el historial de estado de ánimo del usuario.
    
    Query params:
      - days (int): ventana en días hacia atrás (default 30)
      - limit (int): límite de entradas (default 50)
    """
    usuario_id = get_jwt_identity()
    try:
        days = int(request.args.get('days', 30))
    except (ValueError, TypeError):
        days = 30
    try:
        limit = int(request.args.get('limit', 50))
    except (ValueError, TypeError):
        limit = 50

    fecha_desde = datetime.utcnow() - timedelta(days=days)

    try:
        entradas = EstadoAnimo.query.filter(
            EstadoAnimo.usuario_id == usuario_id,
            EstadoAnimo.creado_en >= fecha_desde
        ).order_by(EstadoAnimo.creado_en.desc()).limit(limit).all()

        # Calcular distribución diaria (para gráfico)
        history = []
        for entrada in reversed(entradas):  # Ordenar de más viejo a más nuevo
            history.append({
                'date': entrada.creado_en.strftime('%Y-%m-%d'),
                'avg': entrada.valor,
                'nota': entrada.nota
            })

        # Agregar por día y promediar
        diarios = {}
        for h in history:
            d = h['date']
            if d not in diarios:
                diarios[d] = []
            diarios[d].append(h['avg'])
        
        chart_data = [
            {'date': d, 'avg': sum(vals) / len(vals)}
            for d, vals in sorted(diarios.items())
        ]

        return jsonify({
            'history': chart_data,
            'entries': [e.to_dict() for e in entradas],
            'count': len(entradas)
        }), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@estado_animo_bp.route('', methods=['POST'])
@jwt_required()
def crear():
    """Crear una nueva entrada de estado de ánimo."""
    usuario_id = get_jwt_identity()
    data = request.get_json() or {}
    valor = data.get('valor')
    nota = data.get('nota')

    if valor is None:
        return jsonify({'error': 'Campo "valor" requerido (1-5)'}), 400
    
    try:
        valor = int(valor)
    except (ValueError, TypeError):
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


@estado_animo_bp.route('/<entrada_id>', methods=['GET'])
@jwt_required()
def obtener(entrada_id):
    """Obtener una entrada específica de estado de ánimo."""
    usuario_id = get_jwt_identity()
    entrada = EstadoAnimo.query.filter_by(id_estado=entrada_id, usuario_id=usuario_id).first()
    
    if not entrada:
        return jsonify({'error': 'Entrada no encontrada'}), 404
    
    return jsonify(entrada.to_dict()), 200


@estado_animo_bp.route('/<entrada_id>', methods=['PUT'])
@jwt_required()
def actualizar(entrada_id):
    """Actualizar una entrada de estado de ánimo."""
    usuario_id = get_jwt_identity()
    entrada = EstadoAnimo.query.filter_by(id_estado=entrada_id, usuario_id=usuario_id).first()
    
    if not entrada:
        return jsonify({'error': 'Entrada no encontrada'}), 404
    
    data = request.get_json() or {}
    
    if 'valor' in data:
        try:
            valor = int(data['valor'])
            if valor < 1 or valor > 5:
                return jsonify({'error': 'Valor debe estar entre 1 y 5'}), 400
            entrada.valor = valor
        except (ValueError, TypeError):
            return jsonify({'error': 'Valor inválido'}), 400
    
    if 'nota' in data:
        entrada.nota = data['nota']
    
    try:
        db.session.commit()
        return jsonify(entrada.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@estado_animo_bp.route('/<entrada_id>', methods=['DELETE'])
@jwt_required()
def eliminar(entrada_id):
    """Eliminar una entrada de estado de ánimo."""
    usuario_id = get_jwt_identity()
    entrada = EstadoAnimo.query.filter_by(id_estado=entrada_id, usuario_id=usuario_id).first()
    
    if not entrada:
        return jsonify({'error': 'Entrada no encontrada'}), 404
    
    try:
        db.session.delete(entrada)
        db.session.commit()
        return jsonify({'message': 'Entrada eliminada'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
