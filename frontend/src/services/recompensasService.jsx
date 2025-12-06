// src/services/recompensasService.js
import api from './api';

const RecompensasService = {
  // Obtener todas las recompensas del sistema
  obtenerTodas: () => api.get('/recompensas'),

  // Obtener recompensas que el usuario YA ha desbloqueado
  obtenerMisRecompensas: () => api.get('/recompensas/mis-recompensas'),

  // Obtener recompensas disponibles (todavía no desbloqueadas, con progreso)
  obtenerDisponibles: () => api.get('/recompensas/disponibles'),

  // Verificar automáticamente nuevas recompensas tras una sesión/tarea
  verificarAutomaticas: () => api.post('/gamificacion/recompensas/verificar-automaticas')
};

export default RecompensasService;