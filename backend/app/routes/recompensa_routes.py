# backend/app/routes/recompensa_routes.py
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from app.services.recompensa_service import RecompensaService

recompensa_bp = Blueprint('recompensa', __name__)

@recompensa_bp.route('/seed', methods=['POST'])
@jwt_required()
def seed_recompensas():
    """Endpoint opcional: inserta las recompensas iniciales (útil en desarrollo)."""
    try:
        RecompensaService.crear_recompensas_iniciales()
        return jsonify({'message': 'Recompensas iniciales insertadas correctamente.'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@recompensa_bp.route('', methods=['GET'])
@jwt_required()
def get_recompensas():
    """Obtiene todas las recompensas del sistema."""
    try:
        recompensas = RecompensaService.obtener_todas()
        return jsonify(recompensas), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500