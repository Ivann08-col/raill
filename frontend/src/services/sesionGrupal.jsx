import api from './api';

const sesionGrupalService = {
    // GET /api/salas/publicas
    getSalasPublicas: () => {
        return api.get('/salas/publicas').then(res => res.data);
    },

    // GET /api/salas/mis-salas
    getMisSalas: () => {
        return api.get('/salas/mis-salas').then(res => res.data);
    },

    // POST /api/salas
    crearSala: (data) => {
        return api.post('/salas', data).then(res => res.data);
    },

    // POST /api/salas/unirse
    unirseASala: (data) => {
        return api.post('/salas/unirse', data).then(res => res.data);
    },

    // POST /api/sesiones
    iniciarSesionGrupal: (data) => {
        return api.post('/sesiones', data).then(res => res.data);
    }
};

export default sesionGrupalService;