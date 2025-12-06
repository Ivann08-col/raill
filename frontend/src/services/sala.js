import api from './api';

export const getMySalas = () => api.get('/salas').then(res => res.data);

export const getPublicSalas = () => api.get('/salas/publicas').then(res => res.data);

export const getSalaDetalle = (salaId) => api.get(`/salas/${salaId}`).then(res => res.data);

export const createSala = (payload) => api.post('/salas', payload).then(res => res.data);

export const unirseSala = (salaId, codigo_acceso) => api.post('/salas/unirse', { sala_id: salaId, codigo_acceso }).then(res => res.data);

export const salirSala = (salaId) => api.post(`/salas/${salaId}/salir`).then(res => res.data);

export default {
    getMySalas,
    getPublicSalas,
    getSalaDetalle,
    createSala,
    unirseSala,
    salirSala
};
