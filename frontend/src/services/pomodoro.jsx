// frontend/src/services/perfil.jsx
import api from './api';

const perfilService = {
    // Obtener la información del perfil del usuario actual
    getPerfil: async () => {
        try {
            const response = await api.get('/auth/me'); // Endpoint existente
            return response.data;
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

    // Opcional: Obtener tareas (si se prefiere tenerlo aquí)
    getTareas: async () => {
        try {
            const response = await api.get('/tareas'); // Ajusta la ruta si es necesario
            return response.data;
        } catch (error) {
            console.error('Error al obtener tareas:', error);
            throw error;
        }
    },
};

export default perfilService;