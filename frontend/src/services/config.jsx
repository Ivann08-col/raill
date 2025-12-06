export default {
  apiBase: '/api',
  paths: {
    // Autenticación
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    me: '/auth/me',
    changePassword: '/auth/change-password',
    requestPasswordReset: '/auth/request-password-reset',
    resetPassword: '/auth/reset-password',
    verifyResetCode: '/auth/verify-reset-code',
    
    // Usuarios
    usuarios: '/usuarios',
    usuarioById: (id) => `/usuarios/${id}`,
    
    // Tareas
    tareas: '/tareas',
    tareaById: (id) => `/tareas/${id}`,
    
    // Salas y sesiones grupales
    salas: '/salas',
    salasPublicas: '/salas/publicas',
    misSalas: '/salas/mis-salas',
    unirseSala: '/salas/unirse',
    sesiones: '/sesiones',
    
    // Recompensas
    recompensas: '/recompensas',
    recompensasDisponibles: '/recompensas/disponibles',
    misRecompensas: '/recompensas/mis-recompensas',
    otorgarRecompensa: '/recompensas/otorgar',
    
    // Meditación y Pomodoro
    meditacionIniciar: '/bienestar/meditacion/iniciar',
    meditacionFinalizar: '/bienestar/meditacion/finalizar',
    meditacionHistorial: '/bienestar/meditacion/historial',
    
    pomodoroIniciar: '/productividad/pomodoro/iniciar',
    pomodoroFinalizar: '/productividad/pomodoro/finalizar',
    pomodoroEstado: '/productividad/pomodoro/estado',
    
    // Progreso
    progreso: '/progreso',
    progresoSemana: '/progreso/semana',
    
    // Estadísticas y Estado de Ánimo
    estadisticas: '/estadisticas',
    estadoAnimoHistory: '/estado-animo/historial',
    estadoAnimo: '/estado-animo'
  },
  tokenField: 'access_token',
  usuarioField: 'usuario'
};