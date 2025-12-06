import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import isotipo from '../IMG/isotipo.png';

export default function Topbar({ user, onAuthClick, onLogout }){
  const [open, setOpen] = useState(false);

  const handleToggle = () => setOpen(s => !s);

  return (
    <header className="app-navbar">
      <div className="nav-inner">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/" className="nav-brand"><img src={isotipo} alt="logo" style={{ width:30, height:30, marginRight:8 }} /> <span style={{ color:'#7c3aed', fontWeight:800 }}>Synapse</span></Link>
            <nav className="nav-links" aria-label="Main navigation">
            <Link to="/bienvenida">Inicio</Link>
            <Link to="/pomodoro">Concentración</Link>
            <Link to="/meditacion">Meditación</Link>
            <Link to="/tareas">Tareas</Link>
          </nav>
        </div>

        <div className="nav-right">
          {!user ? (
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => onAuthClick && onAuthClick('login')} className="btn primary">Iniciar sesión</button>
              <button onClick={() => onAuthClick && onAuthClick('register')} className="btn ghost">Registrarse</button>
            </div>
          ) : (
            <div style={{ position:'relative' }}>
              <button onClick={handleToggle} style={{ display:'flex', gap:8, alignItems:'center', padding:'6px 10px', borderRadius:8, border:'1px solid rgba(0,0,0,0.06)', background:'#fff' }}>
                <div style={{ width:32, height:32, borderRadius:999, background:'#7c3aed', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}>{(user?.Username || user?.nombre || user?.correo || 'U').charAt(0).toUpperCase()}</div>
                <div style={{ textAlign:'left' }}>
                  <div style={{ fontSize:13, fontWeight:700 }}>{user?.Username || user?.nombre || user?.correo}</div>
                  <div style={{ fontSize:11, color:'#6b7280' }}>{user?.rol_id ? 'Estudiante Premium' : ''}</div>
                </div>
              </button>

              {open && (
                <div style={{ position:'absolute', right:0, marginTop:8, background:'#fff', borderRadius:8, boxShadow:'0 8px 30px rgba(2,6,23,0.12)', overflow:'hidden', minWidth:160 }}>
                  <Link to="/perfil" onClick={() => setOpen(false)} style={{ display:'block', padding:'10px 12px', textDecoration:'none', color:'#111827' }}>Mi Perfil</Link>
                  <Link to="/perfil?tab=settings" onClick={() => setOpen(false)} style={{ display:'block', padding:'10px 12px', textDecoration:'none', color:'#111827' }}>Configuración</Link>
                  <button onClick={() => { setOpen(false); try { if (onLogout) onLogout(); } catch(e){} try { window.dispatchEvent(new Event('synapse:logout')); } catch(e){} }} style={{ display:'block', width:'100%', textAlign:'left', padding:'10px 12px', border:'none', background:'transparent', cursor:'pointer', color:'#ef4444' }}>Cerrar Sesión</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
