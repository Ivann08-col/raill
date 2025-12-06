// src/pages/Recompensas.jsx
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Award } from 'lucide-react';
import RecompensasService from '../services/recompensasService';
import RecompensaCard from '../components/RecompensaCard';
import Loader from '../components/loader';

export default function Recompensas() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [misRecompensas, setMisRecompensas] = useState([]);
  const [disponibles, setDisponibles] = useState([]);

  useEffect(() => {
    const cargarRecompensas = async () => {
      try {
        const [respMis, respDisp] = await Promise.all([
          RecompensasService.obtenerMisRecompensas(),
          RecompensasService.obtenerDisponibles()
        ]);
        setMisRecompensas(respMis.data || []);
        setDisponibles(respDisp.data || []);
      } catch (error) {
        console.error('Error al cargar recompensas:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarRecompensas();
  }, []);

  if (loading) {
    return <Loader size={120} />;
  }

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '32px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      backgroundColor: '#f8fafc'
    }}>
      {/* Encabezado */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #7c3aed, #667eea)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          boxShadow: '0 8px 20px rgba(124, 58, 237, 0.15)'
        }}>
          <Award size={32} color="white" />
        </div>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: '#1a1a1a',
          margin: 0,
          letterSpacing: '-0.5px'
        }}>
          {t('rewards', 'Recompensas')}
        </h1>
        <p style={{
          color: '#6b7280',
          fontSize: '16px',
          marginTop: '12px',
          maxWidth: '600px',
          margin: '8px auto 0'
        }}>
          {t('rewards_subtitle', 'Gana logros y puntos por tus hábitos de estudio y bienestar.')}
        </p>
      </div>

      {/* Recompensas obtenidas */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{
          fontSize: '22px',
          fontWeight: '600',
          color: '#1a1a1a',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            background: 'linear-gradient(135deg, #f3e8ff, #e9d5ff)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#7e22ce'
          }}>
            🏆
          </div>
          {t('my_rewards', 'Mis recompensas')} ({misRecompensas.length})
        </h2>

       {misRecompensas.length === 0 ? (
  <div style={{
    textAlign: 'center',
    padding: '48px',
    backgroundColor: '#f9fafb',
    borderRadius: '16px',
    border: '1px solid #e5e7eb',
    color: '#6b7280',
    fontSize: '16px'
  }}>
    {t('no_owned_rewards', 'Aún no has desbloqueado ninguna recompensa.')}
  </div>
) : (
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px'
  }}>
    {misRecompensas.map((r) => {
      const isConsumed = r.consumida;
      const colorStyle = r.valor <= 25 
        ? { background: '#f3e8ff', color: '#7e22ce' } 
        : r.valor <= 50 
          ? { background: '#dbeafe', color: '#1e40af' } 
          : r.valor <= 75 
            ? { background: '#cffafe', color: '#0891b2' } 
            : { background: '#fef3c7', color: '#d97706' };

      return (
        <div
          key={r.id_recompensa}
          style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            border: isConsumed ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'default'
          }}
        >
          {/* Banda verde si está consumida */}
          {isConsumed && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #10b981, #059669)',
              borderRadius: '16px 16px 0 0'
            }}></div>
          )}

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{
              ...colorStyle,
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {r.tipo === 'personalizacion' ? <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg> : 
               r.tipo === 'tecnica' ? <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21L12 17.77L5.82 21L7 14.14L2 9.27L8.91 8.26L12 2Z"></path></svg> : 
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21 12 17.77 5.82 21 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '12px'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#1e293b',
                  margin: 0,
                  lineHeight: 1.3
                }}>
                  {r.nombre}
                </h3>
                {isConsumed && (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    backgroundColor: '#dcfce7',
                    color: '#16a34a',
                    fontSize: '12px',
                    fontWeight: '500',
                    borderRadius: '999px'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    {t('consumed', 'Consumida')}
                  </span>
                )}
              </div>

              <p style={{
                color: '#64748b',
                fontSize: '14px',
                marginBottom: '16px',
                minHeight: '40px',
                maxHeight: '40px',
                overflow: 'hidden',
                lineHeight: '1.5'
              }}>
                {r.descripcion || t('no_description', 'Sin descripción')}
              </p>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: '#d97706'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21 12 17.77 5.82 21 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                    <span style={{ fontWeight: '600' }}>{r.valor}</span>
                  </div>
                  {r.nivel && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: '#4f46e5'
                    }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21 12 17.77 5.82 21 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                      <span style={{ fontSize: '12px', fontWeight: '500' }}>
                        {r.nivel}
                      </span>
                    </div>
                  )}
                </div>

                {!isConsumed && (
                  <button
                    disabled={true} // Solo para mostrar, no interactivo en esta vista
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#f3f4f6',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'not-allowed',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '14px'
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4m0 16v4M2 12h4m16 0h4M5.64 5.64l2.83 2.83M15.91 15.91l2.83 2.83M5.64 18.36l2.83-2.83M15.91 8.09l2.83-2.83"></path></svg>
                    {t('consume', 'Consumir')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    })}
  </div>
)}
      </section>

      {/* Recompensas disponibles */}
      <section>
        <h2 style={{
          fontSize: '22px',
          fontWeight: '600',
          color: '#1a1a1a',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            background: 'linear-gradient(135deg, #f0f5ff, #dbeafe)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#3b82f6'
          }}>
            🎯
          </div>
          {t('available_rewards', 'Recompensas disponibles')}
        </h2>

        {disponibles.length === 0 ? (
  <div style={{
    textAlign: 'center',
    padding: '48px',
    backgroundColor: '#f9fafb',
    borderRadius: '16px',
    border: '1px solid #e5e7eb',
    color: '#6b7280',
    fontSize: '16px'
  }}>
    {t('no_available_rewards', '¡Felicidades! Has desbloqueado todas las recompensas.')}
  </div>
) : (
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px'
  }}>
    {disponibles.map((r) => {
      const colorStyle = r.valor <= 25 
        ? { background: '#f3e8ff', color: '#7e22ce' } 
        : r.valor <= 50 
          ? { background: '#dbeafe', color: '#1e40af' } 
          : r.valor <= 75 
            ? { background: '#cffafe', color: '#0891b2' } 
            : { background: '#fef3c7', color: '#d97706' };

      return (
        <div
          key={r.id_recompensa}
          style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            border: '1px solid #e2e8f0',
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'default'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{
              ...colorStyle,
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {r.tipo === 'personalizacion' ? <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg> : 
               r.tipo === 'tecnica' ? <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21L12 17.77L5.82 21L7 14.14L2 9.27L8.91 8.26L12 2Z"></path></svg> : 
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21 12 17.77 5.82 21 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '12px'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#1e293b',
                  margin: 0,
                  lineHeight: 1.3
                }}>
                  {r.nombre}
                </h3>
              </div>

              <p style={{
                color: '#64748b',
                fontSize: '14px',
                marginBottom: '16px',
                minHeight: '40px',
                maxHeight: '40px',
                overflow: 'hidden',
                lineHeight: '1.5'
              }}>
                {r.descripcion || t('no_description', 'Sin descripción')}
              </p>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: '#d97706'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21 12 17.77 5.82 21 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                    <span style={{ fontWeight: '600' }}>{r.valor}</span>
                  </div>
                  {r.nivel && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: '#4f46e5'
                    }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21 12 17.77 5.82 21 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                      <span style={{ fontSize: '12px', fontWeight: '500' }}>
                        {r.nivel}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => { /* Aquí iría la lógica de consumo */ }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#4f46e5',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '14px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4m0 16v4M2 12h4m16 0h4M5.64 5.64l2.83 2.83M15.91 15.91l2.83 2.83M5.64 18.36l2.83-2.83M15.91 8.09l2.83-2.83"></path></svg>
                  {t('consume', 'Consumir')}
                </button>
              </div>
            </div>
          </div>

          {/* Requisitos */}
          <div style={{
            marginTop: '16px',
            padding: '12px',
            background: '#f8fafc',
            borderRadius: '10px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>
              {t('requirements', 'Requisitos')}:
            </div>
            {Object.entries(r.requisitos || {}).map(([key, value]) => (
              <span
                key={key}
                style={{
                  display: 'inline-block',
                  padding: '4px 8px',
                  margin: '2px',
                  background: '#e0e7ff',
                  color: '#4f46e5',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: '500'
                }}
              >
                {value} {key.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>
      );
    })}
  </div>
)}
      </section>

      {/* Estilo de fondo suave para toda la página */}
      <style jsx>{`
        @media (max-width: 768px) {
          .container { padding: 16px; }
          h1 { font-size: 28px; }
          h2 { font-size: 20px; }
        }
      `}</style>
    </div>
  );
}