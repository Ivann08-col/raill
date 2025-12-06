import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getUsuario } from '../services/auth';

// PublicRoute: typically redirect authenticated users to /bienvenida,
// but allow certain public pages (like /tecnicas) to be viewed even when logged-in.
export default function PublicRoute({ children }) {
  const usuario = getUsuario();
  const location = useLocation();

  // If user is authenticated and is NOT requesting an explicitly allowed public page,
  // redirect them to the welcome/dashboard. This lets pages like /tecnicas remain
  // accessible to both anonymous and authenticated users.
  const allowedWhenAuth = ['/tecnicas', '/'];
  if (usuario && !allowedWhenAuth.includes(location.pathname)) {
    return <Navigate to="/bienvenida" replace />;
  }

  return children;
}
