// Este archivo define la barra de navegación, gestionando enlaces, temas y autenticación.

import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { getUsuario, getDisplayName, getToken } from '../services/auth';
import { Home, LayoutDashboard, Brain, Clock, Users, Calendar, Star, Shield, User, LogIn, UserPlus, Menu, X } from "lucide-react";
import isotipo from "../IMG/isotipo.png";
import ThemeSelector from './ThemeSelector';
import Tooltip from './Tooltip';
import '../pages/styles/Navbar.css';

export default function Navbar({ user, onAuthClick, onLogout, theme, setTheme }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);
  // Usamos sólo español estático en el navbar; quitamos i18n para evitar traducciones dinámicas
  // Por defecto colapsado; se expandirá solo cuando el usuario pase el mouse
  // por encima (hover) en pantallas grandes.
  const [expanded, setExpanded] = useState(false);
  const location = useLocation();

  // Si el usuario hace click en el enlace de la misma ruta, React Router no
  // cambiará `pathname` y por tanto el componente `ScrollToTop` no se
  // activará. Aquí proveemos una función auxiliar que fuerza el scroll cuando
  // el destino coincide con la ruta actual.
  const forceScrollTopIfSamePath = (targetPath, behavior = 'smooth') => {
    try {
      if (typeof window === 'undefined') return;
      // normalizar rutas: el `location.pathname` no contiene querystring
      const current = location && location.pathname ? location.pathname : '';
      // Si es la misma ruta, forzamos scroll arriba
      if (current === targetPath) {
        if (window.scrollTo) window.scrollTo({ top: 0, left: 0, behavior });
        else window.scrollTo(0, 0);
      }
    } catch (e) {
      try { window.scrollTo(0, 0); } catch (err) { /* ignore */ }
    }
  };

  // Computed user state derived from prop, localStorage or token.
  // Only trust localStorage user if there's a valid token stored.
  const [computedUser, setComputedUser] = useState(() => {
    try {
      const stored = getToken() ? getUsuario() : null;
      return user || stored || null;
    } catch (e) { return user || null; }
  });

  // On mount, ensure computedUser is accurate by checking token if needed
  useEffect(() => {
    if (!computedUser) {
      try {
        const fromStorage = getToken() ? getUsuario() : null;
        if (fromStorage) setComputedUser(fromStorage);
      } catch (e) {}
    }
    // if prop user changed, keep in sync
    if (user && user !== computedUser) setComputedUser(user);
  }, [user]);

  // Listen for global logout events (dispatched from other components)
  useEffect(() => {
    const onGlobalLogout = () => setComputedUser(null);
    try {
      window.addEventListener('synapse:logout', onGlobalLogout);
    } catch (e) {}
    return () => { try { window.removeEventListener('synapse:logout', onGlobalLogout); } catch (e) {} };
  }, []);

  // Mantiene una clase global en <body> para facilitar reglas CSS que dependan
  // del estado de la barra lateral (evita selectors frágiles entre hermanos).

  // En lugar de manipular clases globales, exponemos el ancho de la barra
  // lateral como una variable CSS `--sidebar-width`. Así el contenido puede
  // reaccionar sin depender de selectores frágiles. También forzamos ancho 0
  // en pantallas pequeñas para evitar solapamientos.
  useEffect(() => {
    try {
      const updateVar = () => {
        const isSmall = window.innerWidth <= 900;
        // Aumentamos el ancho expandido a 200px para dar un poco más de espacio horizontal
        const width = isSmall ? '0px' : (expanded ? '200px' : '64px');
        document.documentElement.style.setProperty('--sidebar-width', width);
      };

      updateVar();
      window.addEventListener('resize', updateVar);
      return () => {
        try {
          window.removeEventListener('resize', updateVar);
          // restore default variable (optional)
          document.documentElement.style.removeProperty('--sidebar-width');
        } catch (e) {}
      };
    } catch (e) {
      // ignore
    }
  }, [expanded]);

  // Escucha cambios de tamaño para forzar colapso en pantallas pequeñas
  useEffect(() => {
    const handleResize = () => {
      try {
        if (window.innerWidth <= 900 && expanded) setExpanded(false);
      } catch (e) {}
    };
    try {
      window.addEventListener('resize', handleResize);
    } catch (e) {}
    return () => { try { window.removeEventListener('resize', handleResize); } catch (e) {} };
  }, [expanded]);

  // Definir rutas estrictas por rol (etiquetas en español fijo)
  const adminNavItems = [
    { path: '/admin', label: 'Admin', icon: <Shield size={18} /> },
    { path: '/perfil', label: 'Perfil', icon: <User size={18} /> },
  ];
  const clientNavItems = [
    { path: '/bienvenida', label: 'Inicio', icon: <Home size={18} />, requiresAuth: true },
    { path: '/tecnicas', label: 'Técnicas', icon: <LayoutDashboard size={18} />, requiresAuth: true },
    { path: '/sesion-grupal', label: 'Sesión grupal', icon: <Users size={18} />, requiresAuth: true },
    { path: '/tareas', label: 'Tareas', icon: <Calendar size={18} />, requiresAuth: true },
 
  ];
  // Vistas públicas que deben mostrarse SOLO antes de iniciar sesión
  const publicNavItems = [
    { path: '/', label: 'Inicio', icon: <Home size={18} /> },
    { path: '/acerca', label: 'Acerca de', icon: <Star size={18} /> },
    { path: '/servicios', label: 'Servicios', icon: <LayoutDashboard size={18} /> },
    { path: '/caracteristicas', label: 'Características', icon: <Brain size={18} /> },
    { path: '/blog', label: 'Blog', icon: <Clock size={18} /> },
    { path: '/contacto', label: 'Contacto', icon: <Users size={18} /> },
  ];
  // Extra views que deben estar visibles para usuarios autenticados
  const extraAuthItems = [

  ];

  let navItems = [];
  if (!computedUser) {
    // Usuario NO autenticado: mostrar vistas públicas en español
    navItems = publicNavItems;
  } else {
    // Usuario autenticado: mostrar todas las vistas relevantes.
    // Incluye las vistas cliente + extras; si es admin, anteponer el menú de admin.
    navItems = [...clientNavItems, ...extraAuthItems];
    if (computedUser?.rol_id === 1) {
      // Evitar duplicados: anteponer admin items si no están ya incluidos
      const adminOnly = adminNavItems.filter(a => !navItems.some(n => n.path === a.path));
      navItems = [...adminOnly, ...navItems];
    }
  }

  const handleProfileMenuMouseLeave = () => {
    setTimeout(() => setOpenProfile(false), 150); 
  };
  
  const closeProfileMenu = () => {
    setOpenProfile(false);
    setIsMenuOpen(false); 
  }

  // Manejo local del logout: envolver la función pasada por props para
  // limpiar el estado interno `computedUser` inmediatamente y cerrar menús.
  const handleLogout = () => {
    try {
      // Llamar al callback externo (que normalmente limpia token/localStorage)
      if (onLogout) onLogout();
    } catch (e) {
      // ignore
    }
    // Asegurar que la barra lateral reaccione inmediatamente al logout
    setComputedUser(null);
    setOpenProfile(false);
    setIsMenuOpen(false);
  };
  
  // Lógica de tema: eliminamos 'dark' y mantenemos únicamente 'midnight'
  const isMidnight = theme === 'midnight';

  // Define los estilos del menú basados en el tema
  const menuStyles = {
    background: isMidnight ? '#1f2937' : '#ffffff',
    textColor: isMidnight ? '#f3f4f6' : '#111827',
    logoutColor: isMidnight ? '#f87171' : '#ef4444',
    boxShadow: isMidnight ? '0 8px 30px rgba(0,0,0,0.4)' : '0 8px 30px rgba(2,6,23,0.12)',
  };

  const selectorLiftDistance = openProfile ? '-140px' : '0';
  const profileMenuBottom = '48px'; 

  return (
    <>
  <aside
        className={`sidebar ${isMenuOpen ? 'open' : ''} ${expanded ? 'expanded' : 'collapsed'}`}
        aria-label={"Navegación principal"}
        onMouseEnter={() => { if (window && window.innerWidth > 900) setExpanded(true); }}
        onMouseLeave={() => { if (window && window.innerWidth > 900) setExpanded(false); }}
      >
        <div className="sidebar-top">
            <div className="nav-logo" role="img" aria-label="SYNAPSE">
              <img src={isotipo} alt="Logo" className="logo-img" />
              <span className="logo-text">SYNAPSE</span>
            </div>
        </div>

        <nav>
          <ul className="sidebar-menu">
                {navItems.map(item => {
              // Mostrar todos los items; la lógica de acceso se debe controlar en las rutas si es necesario.
              const isActive = location.pathname === item.path;
                  return (
                <li key={item.path}>
                  <Tooltip content={item.label}>
                    <Link
                      to={item.path}
                      className={`sidebar-link ${isActive ? 'active' : ''}`}
                      aria-current={isActive ? 'page' : undefined}
                      onClick={() => {
                        setIsMenuOpen(false);
                        forceScrollTopIfSamePath(item.path);
                      }}
                    >
                      <span className="link-icon">{item.icon}</span>
                      <span className="link-label">{item.label}</span>
                    </Link>
                  </Tooltip>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="sidebar-bottom">
          
          {!computedUser ? (
            // Usuario NO autenticado: mostrar selectores públicos y botones de acceso
            <>
              {/* Selectores para usuarios NO autenticados (compacto) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <ThemeSelector theme={theme} setTheme={setTheme} compact={!expanded} />
                </div>
              </div>
              <Tooltip content="Iniciar sesión">
                <button onClick={() => onAuthClick && onAuthClick('login')} className="btn-login">
                  <LogIn size={16} className="btn-icon" />
                  <span className="btn-label">Iniciar sesión</span>
                </button>
              </Tooltip>
              <Tooltip content="Crear cuenta">
                <button onClick={() => onAuthClick && onAuthClick('register')} className="btn-register">
                  <UserPlus size={16} className="btn-icon" />
                  <span className="btn-label">Registrar</span>
                </button>
              </Tooltip>
            </>
          ) : (
            // Bloque para usuario AUTENTICADO
            <>
              {/* 1. Selectores de Tema/Lenguaje (con animación de elevación) */}
                <div 
                  style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: 6, 
                      alignItems: 'center', 
                      marginBottom: 6,
                      transform: `translateY(${selectorLiftDistance})`, 
                      transition: 'transform 200ms ease-out', 
                  }}
              >
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <ThemeSelector theme={theme} setTheme={setTheme} compact={!expanded} />
                </div>
              </div>

              {/* 2. Botón de Perfil y Menú Desplegable (Abre con Click) */}
              <div 
                  style={{ position: 'relative' }}
                  onMouseLeave={handleProfileMenuMouseLeave} 
              >
                {/* Mostrar el tooltip a la derecha del avatar/menu en lugar de arriba */}
                <Tooltip content={"Haz clic para ver: Perfil, Configuración o Cerrar sesión"} placement={"right"}>
                  <button 
                    onClick={() => setOpenProfile(s => !s)} // Abre/Cierra con CLICK
                    className="btn-register" 
                    aria-expanded={openProfile} 
                    aria-haspopup="true" 
                    style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'flex-start' }}
                  >
                    <div style={{ width:28, height:28, borderRadius:999, background:'#7c3aed', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}>{(getDisplayName(computedUser) || 'Usuario').charAt(0).toUpperCase()}</div>
                    <span className="btn-label" style={{ textAlign: 'left' }}>{getDisplayName(computedUser) || computedUser?.username || computedUser?.Username || computedUser?.correo}</span>
                  </button>
                </Tooltip>

                {openProfile && (
                  <div 
                      style={{ 
                          position: 'absolute', 
                          // CLAVE CORREGIDA: Mantiene el borde derecho del menú dentro de la barra lateral.
                          right: expanded ? '0' : '8px', 
                          bottom: profileMenuBottom, 
                          transition: 'bottom 200ms ease-out', 
                          background: menuStyles.background, 
                          boxShadow: menuStyles.boxShadow, 
                          borderRadius:8, 
                          overflow:'hidden', 
                          minWidth:180,
                          zIndex: 1001, 
                      }}
                      onMouseEnter={() => setOpenProfile(true)} 
                      onMouseLeave={handleProfileMenuMouseLeave}
                  >
                    {/* Secciones de Perfil y Configuración */}
                    <Link
                      to="/perfil"
                      onClick={() => {
                        closeProfileMenu();
                        forceScrollTopIfSamePath('/perfil');
                      }}
                      style={{ display:'block', padding:'10px 12px', textDecoration:'none', color: menuStyles.textColor }}
                    >Perfil</Link>
                    <Link
                      to="/perfil?tab=settings"
                      onClick={() => {
                        closeProfileMenu();
                        forceScrollTopIfSamePath('/perfil');
                      }}
                      style={{ display:'block', padding:'10px 12px', textDecoration:'none', color: menuStyles.textColor }}
                    >Configuración</Link>
                    <button onClick={() => { closeProfileMenu(); handleLogout(); }} style={{ display:'block', width:'100%', textAlign:'left', padding:'10px 12px', border:'none', background:'transparent', cursor:'pointer', color: menuStyles.logoutColor }}>Cerrar sesión</button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </aside>

      {/* Hamburger fixed small square in top-right (separate from sidebar to avoid hover expanding the bar) */}
        <div className="hamburger-wrap" aria-hidden={isMenuOpen ? 'false' : 'true'}>
          <button
          className="hamburger-btn"
          aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen(prev => !prev)}
        >
          <Menu size={16} />
        </button>
      </div>

      {/* Mobile menu dropdown shown when hamburger is open */}
      <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`} aria-hidden={!isMenuOpen}>
      <div className="mobile-menu-card" role="dialog" aria-modal={isMenuOpen} tabIndex={-1}>
              <div className="mobile-menu-header">
                <div className="mobile-selectors-top">
                  <ThemeSelector theme={theme} setTheme={setTheme} compact={true} />
                </div>
                <button className="mobile-close" aria-label={'Cerrar menú'} onClick={() => setIsMenuOpen(false)}>
                  <X size={18} />
                </button>
              </div>

              <nav className="mobile-nav">
                <ul>
                  {navItems.map(item => {
                    // Mostrar todos los items también en el menú móvil; la protección de acceso
                    // debe gestionarse en las rutas (PrivateRoute) si corresponde.
                    return (
                      <li key={`mobile-${item.path}`}>
                        <Tooltip content={item.label}>
                          <Link
                            to={item.path}
                            className="mobile-link"
                            onClick={() => {
                              setIsMenuOpen(false);
                              forceScrollTopIfSamePath(item.path);
                            }}
                          >
                            <span className="link-icon">{item.icon}</span>
                            <span className="link-label">{item.label}</span>
                          </Link>
                        </Tooltip>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              <div className="mobile-actions">
                {!computedUser ? (
                  <>
                    <button onClick={() => { onAuthClick('login'); setIsMenuOpen(false); }} className="mobile-action-btn btn-login">
                      <LogIn size={16} />
                      <span>Iniciar sesión</span>
                    </button>
                    <button onClick={() => { onAuthClick('register'); setIsMenuOpen(false); }} className="mobile-action-btn btn-register">
                      <UserPlus size={16} />
                      <span>Registrar</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/perfil"
                      className="mobile-action-btn"
                      onClick={() => {
                        setIsMenuOpen(false);
                        forceScrollTopIfSamePath('/perfil');
                      }}
                    >
                      <User size={16} />
                      <span>Mi cuenta</span>
                    </Link>
                    <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="mobile-action-btn btn-logout">
                      <User size={16} />
                      <span>Cerrar sesión</span>
                    </button>
                  </>
                )}
              </div>

              <div className="mobile-footer">
                <small>Bienvenido</small>
              </div>
            </div>
      </div>


      <style>{`
        .sidebar {
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          width: 64px; /* collapsed width */
          background: #d1d5db; /* gray background as requested */
          backdrop-filter: blur(4px);
          border-right: 1px solid rgba(0,0,0,0.06);
          border-bottom: none !important;
          box-shadow: none !important;
          padding: 1rem 0.6rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 1rem;
          z-index: 1000;
          transition: width 200ms ease, background 200ms ease;
          overflow: visible; /* Mantener visible para el menú desplegable */
        }

        /* Ajuste del contenido principal para evitar solapamiento con la sidebar.
           Usamos la variable --sidebar-width (definida por el componente)
           para empujar el contenido, evitando seletores frágiles. */
        .main-with-sidebar {
          margin-left: var(--sidebar-width, 64px); /* fallback 64px */
          transition: margin-left 200ms ease, padding-top 200ms ease;
        }

        /* En pantallas pequeñas la sidebar se convierte en topbar, quitar margen lateral */
        @media (max-width: 900px) {
          .main-with-sidebar { margin-left: 0; padding-top: 86px; }
        }

        /* hide hamburger and mobile menu by default (visible only on small screens) */
        .hamburger-wrap { display: none; }
        .hamburger-btn { display: none; }
        .mobile-menu { display: none; }

          .sidebar.expanded { width: 200px; padding-left: 0.6rem; padding-right: 0.6rem; }
          /* En estado expandido: alinear icono y texto horizontalmente,
             con el icono a la izquierda y la etiqueta a la derecha.
             Esto mejora la lectura y consistencia visual. */
          .sidebar.expanded .sidebar-menu { align-items: flex-start; }
          .sidebar.expanded .sidebar-link { justify-content: flex-start; align-items: center; padding: 0.5rem 0.75rem; padding-left: 12px; }
          .sidebar.expanded .sidebar-link .link-icon { margin-right: 10px; display:inline-flex; width:28px; flex:0 0 28px; align-items:center; justify-content:center; }
          .sidebar.expanded .link-label { display: inline-block; margin-left: 6px; }
        .sidebar .nav-logo { display:flex; align-items:center; gap:0.65rem; text-decoration:none; }
        .sidebar .logo-img { width:36px; height:36px; object-fit:contain; border-radius:6px; }
          .sidebar-top { display:flex; align-items:center; justify-content:space-between; position: relative; }
        .sidebar .logo-text { font-weight:800; color: #111827; font-size:0.95rem; }
        /* hide logo text when collapsed */
        .sidebar.collapsed .logo-text { display: none; }

  /* Center icons and logo when collapsed */
  /* Cambios: alinear elementos horizontalmente al centro y asegurar
    que los iconos y los botones inferiores se centren cuando la barra
    lateral esté en modo colapsado. */
  /* Keep column layout when collapsed; center top/logo but keep menu stacked */
  .sidebar.collapsed .sidebar-top { justify-content: center; }
  .sidebar.collapsed .sidebar-menu { align-items: center; }
  /* Centrar enlaces y botones en el eje horizontal y eliminar padding izquierdo
    que puede desplazar los iconos. Incluimos los botones de login/register
    para que su icono también quede perfectamente centrado. */
  .sidebar.collapsed .sidebar-link,
  .sidebar.collapsed .btn-login,
  .sidebar.collapsed .btn-register { justify-content: center; padding-left: 0; padding-right: 0; }
  /* Hacer el área alrededor de cada icono más ancha y redondeada para
     que no se vea angosta cuando la barra está colapsada. */
  .sidebar.collapsed .sidebar-link {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    margin: 0 auto; /* centrar el bloque circular */
    background: rgba(0,0,0,0.03);
  }
  .sidebar.collapsed .link-icon {
    width: 28px; height: 28px; display:inline-flex; align-items:center; justify-content:center; margin:0;
  }
  /* Botones inferiores (login/register/avatar) también circulares en estado colapsado */
  .sidebar.collapsed .btn-login, .sidebar.collapsed .btn-register {
    width: 44px;
    height: 44px;
    padding: 0;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: rgba(0,0,0,0.03);
    transition: background 160ms ease, transform 120ms ease;
  }
  /* Color específico: Iniciar sesión (morada como el gradiente de registro previo) */
  .sidebar.collapsed .btn-login {
    background: linear-gradient(90deg,#7c3aed,#6d28d9);
  }
  .sidebar.collapsed .btn-login .btn-icon,
  .sidebar.collapsed .btn-login svg { color: #fff !important; }
  .sidebar.collapsed .btn-login:hover { transform: translateY(-3px); }

  /* Color específico: Registrar (gris oscuro) */
  .sidebar.collapsed .btn-register {
    background: rgba(55,65,81,0.12); /* slate-700 at low opacity */
  }
  .sidebar.collapsed .btn-register .btn-icon,
  .sidebar.collapsed .btn-register svg { color: #111827 !important; }
  .sidebar.collapsed .btn-register:hover { background: rgba(55,65,81,0.18); transform: translateY(-2px); }
  /* Mantener la apariencia de register cuando está expandido, pero en colapsado
     queremos solo el icono circular (por eso ocultamos la etiqueta con display:none
     ya definida en .sidebar.collapsed .btn-label). */
  .sidebar.collapsed .sidebar-bottom { align-items: center; }

        .sidebar-menu { list-style:none; padding:0; margin: 0.75rem 0; display:flex; flex-direction:column; gap:0.5rem; }
        .sidebar-link { display:flex; align-items:center; gap:0.75rem; color: #111827; text-decoration:none; padding:0.5rem 0.6rem; border-radius:10px; font-weight:600; transition: all 0.18s ease; outline: none; }
        .sidebar-link .link-icon { display:inline-flex; width:28px; height:28px; align-items:center; justify-content:center; color: #111827; }
        .sidebar-link .link-label { color: #111827; }
        /* Hide labels when collapsed */
        .sidebar.collapsed .link-label { display: none; }
        .sidebar.expanded .link-label { display: inline-block; }
        .sidebar-link:hover, .sidebar-link:focus, .sidebar-link:active { background: rgba(0,0,0,0.04); color:#111827; transform: none; outline: none; }
        .sidebar-link.active { background: transparent; color: #ffffff; }
        .sidebar-link.active { background: rgba(0,0,0,0.06); }
        .sidebar-link.active .link-icon { color: #111827; }

        .sidebar-bottom { display:flex; flex-direction:column; gap:0.5rem; }
  /* Swap styles: make Iniciar Sesión colored and Registrar neutral */
  .btn-login { background: linear-gradient(90deg,#7c3aed,#6d28d9); color: #ffffff; border: none; padding:0.55rem 0.9rem; border-radius:999px; cursor:pointer; box-shadow: 0 6px 18px rgba(0,0,0,0.12); display:flex; align-items:center; gap:0.5rem; }
  .btn-login:hover { transform: translateY(-2px); }

  /* Registrar: neutral, no gradient */
  .btn-register { background: transparent; border:1px solid transparent; color: #111827; padding:0.5rem; text-align:left; cursor:pointer; border-radius:8px; display:flex; align-items:center; gap:0.5rem; }
  .btn-register:hover { background: rgba(0,0,0,0.04); }
        .btn-icon { color: #111827; }
        .btn-label { display: inline-block; }
        /* hide labels when collapsed */
        .sidebar.collapsed .btn-label { display: none; }

        /* Keep the bottom area visually pinned on tall sidebars */
        .sidebar-bottom { margin-top: auto; }

        /* Responsive: collapse sidebar to top bar on small screens */
        @media (max-width: 900px) {
        .mobile-menu-header {
    display: flex;
    align-items: center;
    justify-content: space-between; 
    padding: 0.75rem 1rem; 
    border-bottom: 1px solid rgba(0, 0, 0, 0.04);
}
.mobile-selectors-top {
    display: flex;
    gap: 12px; 
    align-items: center;
}
          .sidebar { position: fixed; width: 100%; height: 70px; bottom: auto; left: 0; right:0; display:flex; flex-direction:row; align-items:center; padding:0.5rem 1rem; }
          .sidebar-menu { flex-direction:row; gap:1rem; margin:0; display: none; }
          .sidebar-bottom { flex-direction:row; gap:0.5rem; margin-left:auto; display: none; }
          .sidebar .logo-text { display:none; }
          .sidebar .link-label { display:none; }

          /* Disable hover expansion behavior on small screens so navbar doesn't shift left/right */
          .sidebar { width: 100% !important; }
          .sidebar.expanded, .sidebar.collapsed { width: 100% !important; }
          .sidebar .logo-img { width:32px; height:32px; }

          /* Hamburger: small fixed square in the corner. Only this small box responds to hover. */
  .hamburger-wrap { display:flex !important; position: fixed; right: 8px; top: 8px; width:34px; height:34px; align-items:center; justify-content:center; z-index:1101; border-radius:6px; background: transparent !important; box-shadow: none !important; transition: background 160ms ease, transform 120ms ease; }
        .hamburger-wrap:hover { background: linear-gradient(90deg,#7c3aed,#667eea) !important; transform: scale(1.02); }
        .hamburger-btn { display:inline-flex !important; background: transparent !important; border: none !important; width:22px; height:22px; align-items:center; justify-content:center; padding:0; cursor:pointer; color: #6b7280 !important; box-shadow: none !important; }
        .hamburger-btn svg { display:block; }
        .hamburger-wrap:hover .hamburger-btn { color: #ffffff !important; }

  /* Midnight theme overrides: make login text and register colors match midnight look */
  /* Midnight: ensure login keeps the purple gradient and register stays neutral */
  [data-theme="midnight"] .btn-login { color: #ffffff; background: linear-gradient(90deg,#7c3aed,#6d28d9); box-shadow: 0 6px 18px rgba(0,0,0,0.36); }
  [data-theme="midnight"] .btn-register { background: transparent; color: var(--text-on-primary); }

  /* Asegura que en midnight los colores colapsados sigan visibles */
  [data-theme="midnight"] .sidebar.collapsed .btn-login {
    background: linear-gradient(90deg,#8b5cf6,#7c3aed);
  }
  [data-theme="midnight"] .sidebar.collapsed .btn-register {
    background: rgba(255,255,255,0.02);
  }

          /* Lower logo slightly and ensure full visibility */
          .sidebar .logo-img { margin-top:10px; width:40px; height:40px; }

          /* Mobile menu dropdown (hidden by default) */
          .mobile-menu { display:block; position: fixed; top: 70px; left: 0; right: 0; background: transparent; max-height: 0; overflow: hidden; transition: max-height 220ms ease, opacity 200ms ease; opacity: 0; z-index: 999; display:flex; justify-content:center; }
          .mobile-menu.open { max-height: 80vh; opacity: 1; }
          .mobile-menu-card { width: 100%; max-width: 520px; background: #ffffff; border-radius: 10px; margin: 0.5rem; box-shadow: 0 8px 30px rgba(2,6,23,0.08); overflow: hidden; display:flex; flex-direction:column; }

          .mobile-menu-header {display:flex; align-items:center;justify-content:space-between; padding:0.75rem 1rem; border-bottom:1px solid rgba(0,0,0,0.04);  }
          .mobile-close { background: transparent; border:none; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; padding:6px; width:28px; height:28px; border-radius:6px; color:#374151; }
          .mobile-close:hover { background: rgba(0,0,0,0.03); }
          .mobile-selectors-top {display: flex;gap: 12px; align-items: center;}
          .mobile-nav ul { list-style:none; margin:0; padding:0.5rem 0.75rem; display:flex; flex-direction:column; gap:4px; }
          .mobile-link { display:flex; align-items:center; gap:0.75rem; padding:0.75rem 0.75rem; text-decoration:none; color:#111827; border-radius:8px; }
          .mobile-link:hover { background: rgba(0,0,0,0.04); }

          .mobile-actions { display:flex; flex-direction:column; gap:0.5rem; padding:0.75rem; }
          .mobile-action-btn { display:flex; align-items:center; gap:0.6rem; width:100%; padding:0.7rem 0.9rem; border-radius:10px; border: none; cursor:pointer; text-decoration:none; color:#111827; background: transparent; justify-content:center; }
          /* medium-light gray actions on mobile */
          .mobile-action-btn.btn-login { background: linear-gradient(90deg,#7c3aed,#6d28d9); color:#ffffff; border:none; }
          .mobile-action-btn.btn-register { background: transparent; border:1px solid #d1d5db; color:#374151; }
          .mobile-action-btn.btn-logout { background: linear-gradient(90deg,#ef4444,#f97316); color: #fff; }

          .mobile-footer { padding:0.6rem 1rem 1rem; border-top:1px solid rgba(0,0,0,0.04); color:#6b7280; font-size:0.85rem; }
        }
          /* ==================== */
  /* Corrección de Color de ÍCONOS Fijos */
  /* ==================== */

  /* Selecciona el span que contiene el ícono y fuerza su color */
  .sidebar-link .link-icon { 
      /* El color gris oscuro deseado que no debe cambiar */
      color: #374151 !important; 
  }

  /* Asegura que los íconos SVG dentro del link-icon también usen ese color */
  .sidebar-link .link-icon svg {
      color: #374151 !important;
      /* Relleno (fill) opcional si los íconos lo usan */
      fill: none !important; 
  }

  /* Manejo del color cuando el link está ACTIVO (puede ser diferente) */
  .sidebar-link.active .link-icon,
  .sidebar-link.active .link-icon svg {
      /* Si quieres que los íconos activos SÍ cambien (ej. al color primario o blanco) 
         ajusta este color. De lo contrario, mantenlo fijo. */
      color: #111827 !important; /* Ejemplo: se vuelven más oscuros cuando están activos */
  }
      `}</style>
    </>
  );
}