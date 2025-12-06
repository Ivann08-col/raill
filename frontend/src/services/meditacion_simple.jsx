// frontend/src/services/meditacion_simple.jsx
const meditacionService = {
  // Iniciar meditación (sin backend)
  iniciar: async (config) => {
    const sesion = {
      duracion: config.duracion || 10,
      tipo: config.tipo || 'mindfulness',
      musica: config.musica || false,
      guiada: config.guiada || false,
      inicio: new Date().toISOString(),
      completada: false
    };
    localStorage.setItem('meditacion_estado', JSON.stringify(sesion));
    return { message: 'Meditación iniciada', meditacion: sesion };
  },

  // Finalizar meditación (sin backend)
  finalizar: () => {
    const estado = JSON.parse(localStorage.getItem('meditacion_estado') || '{}');
    estado.completada = true;
    estado.fin = new Date().toISOString();

    // Guardar en historial
    const historial = JSON.parse(localStorage.getItem('meditacion_historial') || '[]');
    historial.unshift(estado);
    if (historial.length > 10) historial.pop(); // Mantener solo las últimas 10 sesiones
    localStorage.setItem('meditacion_historial', JSON.stringify(historial));
    
    // Limpiar estado actual
    localStorage.removeItem('meditacion_estado');
    return { message: 'Meditación finalizada' };
  },

  // Obtener estado actual
  getEstado: () => {
    const estado = localStorage.getItem('meditacion_estado');
    return estado ? JSON.parse(estado) : null;
  },

  // Obtener historial
  getHistorial: () => {
    const historial = localStorage.getItem('meditacion_historial');
    return historial ? JSON.parse(historial) : [];
  }
};

export default meditacionService;