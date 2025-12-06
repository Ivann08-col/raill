// src/components/PrivateRoute.js
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getUsuario } from '../services/auth'; // Función que obtiene el usuario autenticado

// PrivateRoute now uses children so it works with <PrivateRoute><Page/></PrivateRoute>
const PrivateRoute = ({ children }) => {
  const usuario = getUsuario(); // Verifica si el usuario está autenticado (puede ser null)
  const location = useLocation();

  // Si no hay usuario autenticado, redirigimos al Home público (/) para pedir login.
  if (!usuario) {
    return <Navigate to="/" replace />;
  }

  // Si el usuario es admin, prevenimos el acceso a rutas cliente redirigiendo al panel admin.
  try {
    const isAdmin = usuario && (Number(usuario?.rol_id) === 1 || usuario?.rol === 'admin' || (usuario?.rol && usuario.rol.nombre === 'admin'));
    if (isAdmin) {
      const clientPaths = [
          '/bienvenida', '/meditacion', '/pomodoro', '/recompensas',
          '/sesion-grupal', '/tareas', '/sesiones-tareas'
        ];
      const cur = location.pathname || '/';
      const isClientPath = clientPaths.some(p => cur === p || cur.startsWith(p + '/'));
      const isAdminPath = cur === '/admin' || cur.startsWith('/admin');
      if (isClientPath && !isAdminPath) {
        // Redirigir admin a su panel
        return <Navigate to="/admin" replace />;
      }
    }
  } catch (e) {
    console.error('Error evaluando rol en PrivateRoute:', e);
  }

  // Usuario autenticado y sin conflictos de rol: renderizar children
  return children;
};

export default PrivateRoute;