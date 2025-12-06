from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.metrics_service import get_overview, get_weekly, get_habits, get_mood_distribution

estadisticas_bp = Blueprint('estadisticas', __name__)


@estadisticas_bp.route('/estadisticas', methods=['GET'])
@jwt_required()
def estadisticas_global():
    """Endpoint único `/api/estadisticas` para compatibilidad con frontend antiguo.

    Devuelve un objeto con: overview, weekly, habits y mood distribution.
    """
    usuario_id = get_jwt_identity()

    overview = get_overview(usuario_id)
    weekly = get_weekly(usuario_id)
    habits = get_habits(usuario_id)
    mood = get_mood_distribution(usuario_id)

    return jsonify({
        'overview': overview or {},
        'weekly': weekly or {},
        'habits': habits or [],
        'mood': mood or {}
    }), 200
