// frontend/src/services/api.jsx
import axios from 'axios';

const api = axios.create({
	baseURL: '/api',
	timeout: 10000,
	headers: {
		'Content-Type': 'application/json',
	}
});

// Interceptor para agregar token a las peticiones
api.interceptors.request.use(config => {
	const token = localStorage.getItem('synapse_token');
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

// Interceptor para manejar respuestas de error
api.interceptors.response.use(
	response => response,
	error => {
		if (error.response?.status === 401) {
			// Token expirado o inválido: limpiar credenciales pero NO redirigir
			localStorage.removeItem('synapse_token');
			localStorage.removeItem('synapse_usuario');
			delete api.defaults.headers.common['Authorization'];
			// Devolver el error para que el caller (p.ej. el modal) muestre el mensaje
		}
		return Promise.reject(error);
	}
);

export default api;