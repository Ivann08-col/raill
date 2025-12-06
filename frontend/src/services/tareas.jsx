import api from './api';
import cfg from './config';

export default {
    getAll: () => {
        return api.get(cfg.paths.tareas).then(res => {
            console.log('Tareas recibidas:', res.data);
            return res.data;
        });
    },
    create: (data) => {
        return api.post(cfg.paths.tareas, data).then(res => {
            console.log('Tarea creada:', res.data);
            return res.data;
        });
    },
    update: (id, data) => {
        return api.put(cfg.paths.tareaById(id), data).then(res => {
            console.log('Tarea actualizada:', res.data);
            return res.data;
        });
    },
    delete: (id) => {
        return api.delete(cfg.paths.tareaById(id)).then(res => {
            console.log('Tarea eliminada:', id);
            return res.data;
        });
    },
    completar: (id) => {
        return api.patch(cfg.paths.tareaById(id) + '/completar').then(res => {
            console.log('Tarea completada:', res.data);
            return res.data;
        });
    }
};