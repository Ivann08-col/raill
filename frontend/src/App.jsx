// frontend/src/App.jsx
import React, { useState, useEffect, Suspense } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';
import Loader from './components/loader';

// Importar componentes con manejo seguro de errores
const safeLazy = (importFn, fallback = null) => {
  return React.lazy(() => 
    importFn().catch(err => {
      console.error('Error al cargar componente:', err);
      return fallback || { 
        default: () => (
          <div style={{ 
            padding: '2rem', 
            textAlign: 'center', 
            color: '#666',
            minHeight: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <p>⚠️ Componente no disponible temporalmente</p>
          </div>
        ) 
      };
    })
  );
};

// Componentes principales
const Login = safeLazy(() => import('./pages/Login'));
const Register = safeLazy(() => import('./pages/Register'));
const HomePage = safeLazy(() => import('./pages/HomePage'));
const HomePageLogueado = safeLazy(() => import('./pages/HomePageLogueado'));
const Profile = safeLazy(() => import('./pages/Profile'));
const Meditacion = safeLazy(() => import('./pages/Meditacion'));
const Pomodoro = safeLazy(() => import('./pages/Pomodoro'));
const Tecnicas = safeLazy(() => import('./pages/Tecnicas'));
const Recompensas = safeLazy(() => import('./pages/Recompensas'));
const SesionGrupal = safeLazy(() => import('./pages/SesionGrupal2'));
const Tareas = safeLazy(() => import('./pages/Tareas'));
const SesionesTareas = safeLazy(() => import('./pages/SesionesTareas'));
const AdminPanel = safeLazy(() => import('./pages/AdminPanel'));
const Acerca = safeLazy(() => import('./pages/Acerca'));
const Servicios = safeLazy(() => import('./pages/Servicios'));
const Caracteristicas = safeLazy(() => import('./pages/Caracteristicas'));
const Blog = safeLazy(() => import('./pages/Blog'));
const Contacto = safeLazy(() => import('./pages/Contacto'));


// Componentes comunes
const Navbar = safeLazy(() => import('./components/Navbar'));
const Footer = safeLazy(() => import('./components/Footer'));
const AuthModal = safeLazy(() => import('./components/AuthModal'));

// Componentes de ruta
import PrivateRoute from './components/PrivateRoute';
import PublicRoute from './components/PublicRoute';

// Servicios de autenticación
import { logout as doLogout, getUsuario, getToken } from './services/auth';
import api from './services/api';

// On app start, rehydrate Authorization header from stored token so that
// reloads don't log out the user. If no token exists, nothing changes.
try {
  const t = getToken();
  if (t && api && api.defaults && api.defaults.headers) {
    api.defaults.headers.common['Authorization'] = `Bearer ${t}`;
  }
} catch (e) {
  // ignore (non-browser env or missing service)
}

export default function App() {
  const [loadingApp, setLoadingApp] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [usuario, setUsuario] = useState(null);
  const [theme, setTheme] = useState(() => {
    try {
      const t = window.localStorage.getItem('theme') || 'light';
      // Normalizar valores antiguos: mapear 'dark' a 'midnight'
      if (t === 'dark') return 'midnight';
      return t;
    } catch (e) {
      return 'light';
    }
  });

  // Aplicar tema
  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', theme);
      window.localStorage.setItem('theme', theme);
    } catch (e) {
      console.warn('Error guardando tema:', e);
    }
  }, [theme]);

  // ALSO set the attribute synchronously to avoid a visual flash when
  // navigating between routes (prevents temporary fallback styles).
  try {
    if (typeof document !== 'undefined' && theme) document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {
    /* ignore in non-browser env */
  }

  // Loader seguro con tiempo máximo
  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      if (isMounted) {
        setLoadingApp(false);
      }
    }, 1000);

    const timeoutFallback = setTimeout(() => {
      if (isMounted) {
        console.warn('Tiempo de carga excedido, forzando renderizado');
        setLoadingApp(false);
      }
    }, 3000);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      clearTimeout(timeoutFallback);
    };
  }, []);

  const nav = useNavigate();
  const [flashMessage, setFlashMessage] = useState('');

  const openAuth = (mode = 'login') => { 
    setAuthMode(mode); 
    setAuthOpen(true); 
  };
  
  const closeAuth = () => setAuthOpen(false);

  const handleLogout = () => {
    setAuthOpen(false);
    try {
      doLogout();
      setUsuario(null);
      nav('/', { replace: true });
    } catch (e) {
      console.error('Error en logout:', e);
      // Evitar recargar la página; mostrar mensaje en su lugar
      setFlashMessage('Error al cerrar sesión. Intenta nuevamente.');
    }
  };

  const onAuthSuccess = (fromMode) => {
    if (fromMode === 'register') {
      setAuthMode('login');
      setAuthOpen(true);
      return;
    }
    
    closeAuth();
    const user = getUsuario();
    setUsuario(user);
    
    // Si es login exitoso, redirigir a página de bienvenida
    if (fromMode === 'login') {
      nav('/bienvenida', { replace: true });
    } else {
      // Dashboard eliminado: redirigir a bienvenida
      nav('/bienvenida', { replace: true });
    }
  };

  // Verificación periódica de autenticación
  useEffect(() => {
    const checkAuth = () => {
      try {
        const storedUser = getUsuario();
        if (!storedUser && usuario) {
          setUsuario(null);
        } else if (storedUser && !usuario) {
          setUsuario(storedUser);
        }
      } catch (e) {
        console.error('Error verificando autenticación:', e);
        // Evitar recargar la página: limpiar estado y mostrar mensaje
        try { doLogout(); } catch (err) { console.error(err); }
        setUsuario(null);
        setFlashMessage('Se produjo un error verificando tu sesión. Por favor, vuelve a iniciar sesión.');
      }
    };

    checkAuth();
    const interval = setInterval(checkAuth, 300000); // Verificar cada 5 minutos
    return () => clearInterval(interval);
  }, [usuario]);

  return (
    <ErrorBoundary>
      {/* Fullscreen startup loader */}
      {loadingApp && <Loader size={260} />}

      {!loadingApp && (
        <>
          {flashMessage && (
            <div style={{
              position: 'fixed',
              top: 12,
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#fff7ed',
              border: '1px solid #f59e0b',
              color: '#92400e',
              padding: '10px 16px',
              borderRadius: 8,
              zIndex: 3000,
              boxShadow: '0 6px 20px rgba(15,23,42,0.08)'
            }}>
              <span style={{ marginRight: 12 }}>{flashMessage}</span>
              <button onClick={() => setFlashMessage('')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 700 }}>✕</button>
            </div>
          )}
          <Suspense fallback={
            <div style={{ height: '60px', backgroundColor: '#f8fafc' }}></div>
          }>
            <Navbar 
              user={usuario} 
              onAuthClick={openAuth} 
              onLogout={handleLogout} 
              theme={theme} 
              setTheme={setTheme} 
            />
          </Suspense>
          
          <AuthModal 
            open={authOpen} 
            mode={authMode} 
            onClose={closeAuth} 
            onAuthSuccess={onAuthSuccess} 
            openAuth={openAuth} 
          />

          <main className="main-with-sidebar" style={{ 
            minHeight: 'calc(100vh - 60px - 150px)', 
            paddingTop: '24px',
            paddingBottom: '40px'
          }}>
            <Suspense fallback={
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                padding: '40px' 
              }}>
                <div style={{ 
                  padding: '2rem', 
                  textAlign: 'center', 
                  color: '#666',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  backgroundColor: '#f8fafc'
                }}>
                  <div style={{ marginBottom: '1rem' }}>Cargando contenido...</div>
                  <div style={{ 
                    width: '100px', 
                    height: '100px', 
                    border: '4px solid #e2e8f0',
                    borderTopColor: '#7c3aed',
                    borderRadius: '50%',
                    margin: '0 auto',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  <style>{`
                    @keyframes spin {
                      from { transform: rotate(0deg); }
                      to { transform: rotate(360deg); }
                    }
                  `}</style>
                </div>
              </div>
            }>
              <Routes>
                {/* Páginas públicas */}
                <Route path="/" element={
                  <PublicRoute>
                    <HomePage user={usuario} onAuthClick={openAuth} />
                  </PublicRoute>
                } />
                <Route path="/login" element={<Navigate to="/" replace />} />
                <Route path="/register" element={<Navigate to="/" replace />} />
                <Route path="/tecnicas" element={
                  <PublicRoute>
                    <Tecnicas />
                  </PublicRoute>
                } />
                <Route path="/acerca" element={
                  <PublicRoute>
                    <Acerca />
                  </PublicRoute>
                } />
                <Route path="/servicios" element={
                  <PublicRoute>
                    <Servicios />
                  </PublicRoute>
                } />
                <Route path="/caracteristicas" element={
                  <PublicRoute>
                    <Caracteristicas />
                  </PublicRoute>
                } />
                <Route path="/blog" element={
                  <PublicRoute>
                    <Blog />
                  </PublicRoute>
                } />
                <Route path="/contacto" element={
                  <PublicRoute>
                    <Contacto />
                  </PublicRoute>
                } />
                
                {/* Páginas privadas */}
                <Route path="/bienvenida" element={
                  <PrivateRoute>
                    <HomePageLogueado />
                  </PrivateRoute>
                } />
                {/* Ruta /dashboard eliminada */}
                <Route path="/perfil" element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                } />
                <Route path="/meditacion" element={
                  <PrivateRoute>
                    <Meditacion />
                  </PrivateRoute>
                } />
                <Route path="/pomodoro" element={
                  <PrivateRoute>
                    <Pomodoro />
                  </PrivateRoute>
                } />
                <Route path="/recompensas" element={
                  <PrivateRoute>
                    <Recompensas />
                  </PrivateRoute>
                } />
                <Route path="/sesion-grupal" element={
                  <PrivateRoute>
                    <SesionGrupal />
                  </PrivateRoute>
                } />
                <Route path="/tareas" element={
                  <PrivateRoute>
                    <Tareas />
                  </PrivateRoute>
                } />
                <Route path="/sesiones-tareas" element={
                  <PrivateRoute>
                    <SesionesTareas />
                  </PrivateRoute>
                } />
                <Route path="/admin" element={
                  <PrivateRoute>
                    <AdminPanel />
                  </PrivateRoute>
                } />
                
                {/* Redirección por defecto para usuarios logueados */}
                <Route path="/home" element={<Navigate to="/bienvenida" replace />} />
                
                {/* Ruta no encontrada */}
                <Route path="*" element={
                  <div style={{ 
                    padding: '40px', 
                    textAlign: 'center',
                    color: '#4b5563'
                  }}>
                    <h2>🔍 Página no encontrada</h2>
                    <p style={{ marginTop: '16px' }}>La página que buscas no existe</p>
                    <button 
                      onClick={() => nav('/')}
                      style={{ 
                        marginTop: '24px',
                        background: 'linear-gradient(135deg, #7c3aed, #667eea)',
                        color: 'white',
                        border: 'none',
                        padding: '10px 24px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: '600'
                      }}
                    >
                      Volver al inicio
                    </button>
                  </div>
                } />
              </Routes>
            </Suspense>
          </main>
          
          <Suspense fallback={<div style={{ height: '150px' }}></div>}>
            <Footer />
          </Suspense>
        </>
      )}
    </ErrorBoundary>
  );
}