import React from 'react';
import { Clock, Target, TrendingUp } from 'lucide-react';
import Tooltip from '../components/Tooltip';

export default function Servicios({ onAuthClick }) {
  const handleAuth = (mode) => {
    if (typeof onAuthClick === 'function') return onAuthClick(mode);
  };

  return (
    <div style={{ minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <section style={{ padding: '3.5rem 1.5rem', background: 'linear-gradient(180deg, rgba(111,66,193,0.04), transparent)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h1 style={{ fontSize: 'clamp(2rem,4vw,2.75rem)', fontWeight: 800 }}>Servicios</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>Sesiones guiadas, planes y herramientas para medir tu progreso.</p>
          <div style={{ marginTop: 14 }}>
            <p style={{ color: 'var(--text-secondary)' }}>Explora nuestros servicios y elige el que mejor se adapte a tu objetivo: desde sesiones puntuales hasta planes estructurados.</p>
          </div>
        </div>
      </section>

      <section style={{ padding: '3rem 1.5rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          <div style={{ padding: 20, borderRadius: 16, background: 'var(--bg-primary)', boxShadow: '0 8px 30px rgba(2,6,23,0.06)' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}><Clock /><h4 style={{ margin: 0 }}>Sesiones guiadas</h4></div>
            <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>Meditaciones y prácticas para distintos objetivos: concentración, sueño y relajación.</p>
          </div>

          <div style={{ padding: 20, borderRadius: 16, background: 'var(--bg-primary)', boxShadow: '0 8px 30px rgba(2,6,23,0.06)' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}><Target /><h4 style={{ margin: 0 }}>Planes de entrenamiento</h4></div>
            <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>Rutas semanales que te guían paso a paso para mejorar hábitos.</p>
          </div>

          <div style={{ padding: 20, borderRadius: 16, background: 'var(--bg-primary)', boxShadow: '0 8px 30px rgba(2,6,23,0.06)' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}><TrendingUp /><h4 style={{ margin: 0 }}>Monitoreo y estadísticas</h4></div>
            <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>Reportes para visualizar tu progreso y logros a lo largo del tiempo.</p>
          </div>
        </div>
      </section>

      <section style={{ padding: '3rem 1.5rem', background: 'var(--bg-accent)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', color: 'var(--text-on-primary)' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Planes y formatos</h2>
          <p style={{ marginTop: 8, opacity: 0.95 }}>Ofrecemos planes mensuales y anuales, además de sesiones puntuales y paquetes para equipos.</p>
          <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
            <div style={{ padding: 12, background: 'rgba(255,255,255,0.04)', borderRadius: 10 }}>
              <strong>Básico — Gratis</strong>
              <div style={{ color: 'var(--text-secondary)' }}>Acceso a técnicas esenciales y estadísticas básicas.</div>
            </div>
            <div style={{ padding: 12, background: 'rgba(255,255,255,0.04)', borderRadius: 10 }}>
              <strong>Premium — Mensual</strong>
              <div style={{ color: 'var(--text-secondary)' }}>Todas las técnicas, seguimiento avanzado y sincronización.</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
