import api from './api';

export async function createSala(data) {
    return api.post('/salas', data).then(r => r.data);
}

export async function getMySalas() {
    return api.get('/salas').then(r => r.data);
}

export async function getPublicSalas() {
    return api.get('/salas/publicas').then(r => r.data);
}

export async function getSalaDetalle(salaId) {
    return api.get(`/salas/${salaId}`).then(r => r.data);
}

export async function unirseSala(salaId, codigo) {
    return api.post('/salas/unirse', { sala_id: salaId, codigo_acceso: codigo }).then(r => r.data);
}

export async function salirSala(salaId) {
    return api.post(`/salas/${salaId}/salir`).then(r => r.data);
}