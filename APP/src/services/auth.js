import api from './api';

export function saveToken(token) {
  localStorage.setItem('synapse_token', token);
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}
export function getToken() { return localStorage.getItem('synapse_token'); }
export function saveUsuario(u) { localStorage.setItem('synapse_usuario', JSON.stringify(u)); }
export function getUsuario() { try { const r = localStorage.getItem('synapse_usuario'); return r ? JSON.parse(r) : null; } catch { return null; } }
export function logout() { localStorage.removeItem('synapse_token'); localStorage.removeItem('synapse_usuario'); delete api.defaults.headers.common['Authorization']; window.location.href = '/'; }
