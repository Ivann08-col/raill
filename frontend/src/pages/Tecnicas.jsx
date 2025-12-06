import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Heart, Clock, Zap, X, Sparkles, ArrowRight, BookOpen, Activity, Moon, Feather } from 'lucide-react';
import Tooltip from '../components/Tooltip';
import './styles/Tecnicas.css';

export default function Tecnicas() {
  const [selectorOpen, setSelectorOpen] = useState(false);
  const navigate = useNavigate();
  const [theme, setTheme] = useState((typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme')) || 'light');
  
  // NOTE: Pomodoro/Meditación específicos se muestran en sus propias rutas (/pomodoro, /meditacion).
  // Aquí mantenemos sólo el selector modal; toda la lógica de temporizadores fue movida fuera.

  // Estado local para expandir detalles de una técnica en la vista
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.attributeName === 'data-theme') setTheme(root.getAttribute('data-theme') || 'light');
      }
    });
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  // Lista de técnicas mostradas en la vista (sin Pomodoro/Meditación/Respiración)
  const techniques = [
    {
      id: 'journaling',
      title: 'Journaling rápido',
      desc: 'Un ejercicio de 5 minutos para clarificar pensamientos y priorizar tareas. Escribe sin juzgar.',
      icon: <BookOpen size={24} />,
      color: '#7c3aed',
      gradient: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)'
    },
    {
      id: 'estiramientos',
      title: 'Estiramientos cortos',
      desc: 'Secuencia de movimientos sencillos para liberar tensión física y mejorar la postura en 3 minutos.',
      icon: <Activity size={24} />,
      color: '#059669',
      gradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
    },
    {
      id: 'visualizacion',
      title: 'Visualización guiada',
      desc: 'Imagina un lugar seguro y recorre sus detalles: luz, texturas y sonidos. Ayuda a reducir el estrés rápidamente.',
      icon: <Sparkles size={24} />,
      color: '#f97316',
      gradient: 'linear-gradient(135deg, #f97316 0%, #f43f5e 100%)'
    },
    {
      id: 'rutina_sueno',
      title: 'Rutina para dormir mejor',
      desc: 'Pequeños hábitos nocturnos que promueven el sueño profundo: luz tenue, desconexión 30 min antes y respiración lenta.',
      icon: <Moon size={24} />,
      color: '#0f172a',
      gradient: 'linear-gradient(135deg, #0f172a 0%, #374151 100%)'
    },
    {
      id: 'micro_pausas',
      title: 'Pausas de atención',
      desc: 'Micro-ejercicios de 60 segundos para reenfocar la mente durante jornadas largas: mira lejos, respira y estira.',
      icon: <Feather size={24} />,
      color: '#2563eb',
      gradient: 'linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)'
    }
  ];

  // Pomodoro/Meditación logic removed from this page — these features live in their own views.

  const styles = {
    pageContainer: {
      minHeight: '100vh',
      /* background removed to allow theme-aware CSS to control it */
      padding: '32px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    contentWrapper: {
      maxWidth: '1400px',
      margin: '0 auto'
    },
    header: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      borderRadius: '24px',
      padding: '40px',
      marginBottom: '32px',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
      border: '1px solid rgba(255, 255, 255, 0.3)'
    },
    headerTop: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '24px',
      flexWrap: 'wrap',
      gap: '20px'
    },
    headerLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    },
    iconWrapper: {
      width: '56px',
      height: '56px',
      borderRadius: '16px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)'
    },
    title: {
      margin: 0,
      fontSize: '2.5rem',
      fontWeight: '800',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      lineHeight: 1.2
    },
    subtitle: {
      margin: '8px 0 0',
      color: '#6b7280',
      fontSize: '1.1rem'
    },
    btn: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '14px',
      padding: '16px 32px',
      fontSize: '1rem',
      fontWeight: '700',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
      transition: 'all 0.3s ease'
    },
    infoCard: {
      background: 'linear-gradient(135deg, #f9fafb 0%, #ffffff 100%)',
      padding: '24px',
      borderRadius: '16px',
      border: '2px solid #e5e7eb'
    },
    techniquesGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      gap: '24px'
    },
    techniqueCard: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      borderRadius: '24px',
      padding: '32px',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'pointer'
    },
    modalBackdrop: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
      animation: 'fadeIn 0.3s ease'
    },
    modal: {
      background: 'var(--bg-primary)',
      borderRadius: '32px',
      padding: '48px',
      maxWidth: '900px',
      width: '100%',
      maxHeight: '90vh',
      overflowY: 'auto',
      boxShadow: '0 25px 80px rgba(0, 0, 0, 0.3)',
      position: 'relative',
      animation: 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
    },
    modalClose: {
      position: 'absolute',
      top: '24px',
      right: '24px',
      background: '#f3f4f6',
      border: 'none',
      borderRadius: '12px',
      width: '44px',
      height: '44px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      color: '#6b7280'
    },
    timerDisplay: {
      fontSize: '6rem',
      fontWeight: '800',
      textAlign: 'center',
      margin: '40px 0',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent'
    },
    controlsContainer: {
      display: 'flex',
      gap: '16px',
      justifyContent: 'center',
      marginTop: '32px'
    },
    controlBtn: {
      padding: '16px 32px',
      borderRadius: '16px',
      border: 'none',
      fontSize: '1rem',
      fontWeight: '700',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.3s ease'
    },
    breathingCircle: {
      width: '300px',
      height: '300px',
      borderRadius: '50%',
      margin: '40px auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '2rem',
      fontWeight: '700',
      color: 'white',
      transition: 'all 4s ease-in-out',
      boxShadow: '0 20px 60px rgba(102, 126, 234, 0.4)'
    }
  };

  const getBreathingStyle = () => {
    const base = { ...styles.breathingCircle };
    if (breathingPhase === 'inhale') {
      return { ...base, transform: 'scale(1.3)', background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)' };
    } else if (breathingPhase === 'hold') {
      return { ...base, transform: 'scale(1.3)', background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)' };
    } else {
      return { ...base, transform: 'scale(1)', background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)' };
    }
  };

  const getBreathingText = () => {
    if (breathingPhase === 'inhale') return 'Inhala...';
    if (breathingPhase === 'hold') return 'Sostén...';
    return 'Exhala...';
  };

  return (
  <div className="tecnicas-page" style={styles.pageContainer}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      
  <div className="content-wrapper">
        {/* Header */}
        <header className="tecnicas-header">
            <div className="tecnicas-header-top">
            <div className="tecnicas-header-left">
              <div className="icon-wrapper">
                <LayoutDashboard size={28} />
              </div>
              <div>
                <h1 className="title">Técnicas de Bienestar</h1>
                <p className="subtitle">Descubre herramientas para mejorar tu salud mental</p>
              </div>
            </div>
            <Tooltip label="Explorar técnicas" placement="bottom">
              <button className="explore-btn" onClick={() => setSelectorOpen(true)}>
                <Sparkles size={20} />
                Explorar Técnicas
              </button>
            </Tooltip>
          </div>

          <div className="info-card">
            <h3 className="info-title">💡 ¿Por qué usar técnicas de bienestar?</h3>
            <p className="info-desc">Estas técnicas están diseñadas para ayudarte a gestionar el estrés, mejorar tu concentración y encontrar momentos de calma en tu día a día.</p>
          </div>
        </header>

        {/* Vista creativa de técnicas (sin Pomodoro/Meditación/Respiración) */}
        <section style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          marginTop: '20px'
        }}>
          {techniques.map(t => (
            <article
              key={t.id}
              className="tecnicas-card"
              style={{ borderRadius: '16px', padding: '20px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '12px',
                  background: t.gradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white'
                }}>
                  {t.icon}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>{t.title}</h3>
                  <p className="tecnicas-card-desc" style={{ margin: '6px 0 0' }}>{t.desc}</p>
                </div>
              </div>

              <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Tooltip label={expanded === t.id ? 'Ocultar detalles' : 'Ver detalles'} placement="top">
                      <button
                        onClick={() => setExpanded(expanded === t.id ? null : t.id)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '10px',
                          border: '1px solid rgba(15,23,42,0.06)',
                          background: (expanded === t.id)
                                     ? (theme === 'midnight' ? 'linear-gradient(135deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))' : t.gradient)
                                     : 'transparent',
                          color: (expanded === t.id) ? (theme === 'midnight' ? t.color : 'white') : t.color,
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {expanded === t.id ? 'Menos detalles' : 'Ver detalles'}
                      </button>
                    </Tooltip>
                  </div>

                <div style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Duración estimada: 3–10 min</div>
              </div>

              {expanded === t.id && (
                <div className="details-box">
                  <p style={{ margin: 0, lineHeight: 1.6 }}>
                    {t.title} — {t.desc} Aquí encontrarás pasos concretos y recomendaciones rápidas para integrarla en tu rutina.
                  </p>
                  <ul style={{ marginTop: '10px', paddingLeft: '18px' }}>
                    <li>Paso 1: Empieza con intención y define 1 objetivo pequeño.</li>
                    <li>Paso 2: Aplica la técnica entre 3 y 10 minutos.</li>
                    <li>Consejo: Consistencia &gt; intensidad — prueba incorporarla 3 veces/semana.</li>
                  </ul>
                </div>
              )}
            </article>
          ))}
        </section>

        {/* Modal Selector */}
        {selectorOpen && (
          <div className="tecnicas-modal-backdrop" onClick={() => setSelectorOpen(false)}>
            <div className="tecnicas-modal" onClick={e => e.stopPropagation()}>
              <button
                className="tecnicas-modal-close"
                onClick={() => setSelectorOpen(false)}
              >
                <X size={24} />
              </button>

              <h2 style={{
                margin: '0 0 16px',
                fontSize: '2.5rem',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Elige tu técnica
              </h2>
              <p className="tecnicas-modal-desc" style={{ margin: '0 0 40px', fontSize: '1.1rem' }}>
                Selecciona la técnica que mejor se adapte a tus necesidades
              </p>

              <div className="tecnicas-modal-grid">
                {/* Pomodoro Card */}
                <Tooltip label="Ir a Pomodoro" placement="top">
                  <div className="tecnicas-select-card select-pomodoro" onClick={() => { setSelectorOpen(false); navigate('/pomodoro'); }}>
                    <div className="tecnicas-select-icon select-blue"><Clock size={28} /></div>
                    <h3 className="tecnicas-select-title">Pomodoro</h3>
                    <p className="tecnicas-select-desc">Técnica de concentración por bloques temporales. 25 minutos de trabajo + 5 de descanso.</p>
                    <button className="tecnicas-select-btn">Iniciar Pomodoro</button>
                  </div>
                </Tooltip>

                {/* Meditación Card */}
                <Tooltip label="Ir a Meditación" placement="top">
                  <div className="tecnicas-select-card select-meditacion" onClick={() => { setSelectorOpen(false); navigate('/meditacion'); }}>
                    <div className="tecnicas-select-icon select-pink"><Heart size={28} /></div>
                    <h3 className="tecnicas-select-title">Meditación</h3>
                    <p className="tecnicas-select-desc">Ejercicios de respiración y atención plena para reducir el estrés y la ansiedad.</p>
                    <button className="tecnicas-select-btn">Comenzar Meditación</button>
                  </div>
                </Tooltip>
              </div>
            </div>
          </div>
        )}

        {/* Pomodoro and Meditación full-screen modals removed from this view.
            The modal selector still exists and its buttons now navigate to /pomodoro and /meditacion.
        */}
      </div>
    </div>
  );
}