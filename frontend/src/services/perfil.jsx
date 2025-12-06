// frontend/src/services/perfil.jsx
import api from './api';

const perfilService = {
    // Obtener la información del perfil del usuario actual
    getPerfil: async () => {
        // Usar fetch directo para evitar el interceptor global de axios que redirige
        // a /login en caso de 401. De esta forma podemos manejar la ausencia de
        // autenticación y devolver null sin forzar una redirección.
        try {
            const token = (() => { try { return localStorage.getItem('synapse_token'); } catch (e) { return null; } })();
            const headers = { 'Accept': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const res = await fetch('/api/auth/me', { method: 'GET', headers });
            if (res.status === 200) {
                const data = await res.json();
                return data;
            }
            if (res.status === 401) {
                // No autenticado -> devolvemos null y el componente puede mostrar
                // una vista pública o un fallback sin redireccionar.
                return null;
            }
            // Para otros códigos de error, intentar parsear mensaje o lanzar
            const text = await res.text();
            try { return JSON.parse(text); } catch (e) { throw new Error(`Error obteniendo perfil: HTTP ${res.status}`); }
        } catch (error) {
            console.error('Error al obtener el perfil:', error);
            throw error; // Re-lanzar para que el componente lo maneje
        }
    },

    // Actualizar la información del perfil del usuario actual
    updatePerfil: async (formData) => { // formData es un FormData object para manejar archivos
        try {
            const response = await api.put('/auth/me', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data', // Importante para subir archivos
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error al actualizar el perfil:', error);
            throw error; // Re-lanzar para que el componente lo maneje
        }
    },

    // Opcional: Cambiar contraseña (si se quiere tenerlo aquí también)
    changePassword: async (currentPassword, newPassword) => {
        try {
            const response = await api.put('/auth/change-password', {
                current_password: currentPassword,
                new_password: newPassword,
            });
            return response.data;
        } catch (error) {
            console.error('Error al cambiar la contraseña:', error);
            throw error;
        }
    },

    // Opcional: Eliminar cuenta
    deleteAccount: async (password) => {
        try {
            const response = await api.post('/auth/delete-account', { password });
            return response.data;
        } catch (error) {
            console.error('Error al eliminar la cuenta:', error);
            throw error;
        }
    },

    // Opcional: Cerrar sesión en todos los dispositivos
    logoutAllDevices: async (password) => {
        try {
            const response = await api.post('/auth/logout-all-devices', { password });
            return response.data;
        } catch (error) {
            console.error('Error al cerrar sesión en otros dispositivos:', error);
            throw error;
        }
    },
};

export default perfilService;