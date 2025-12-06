import React from 'react';
import { Star, Clock, CheckCircle } from 'lucide-react';

export default function Caracteristicas({ onAuthClick }) {
  const handleAuth = (mode) => { if (typeof onAuthClick === 'function') return onAuthClick(mode); };

  return (
    <div style={{ minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <section style={{ padding: '3.5rem 1.5rem', background: 'linear-gradient(180deg, rgba(124,58,237,0.04), transparent)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h1 style={{ fontSize: 'clamp(2rem,4vw,2.75rem)', fontWeight: 800 }}>Características</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>Herramientas diseñadas para aumentar tu productividad y bienestar mental.</p>
        </div>
      </section>

      <section style={{ padding: '3rem 1.5rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          <div style={{ padding: 20, borderRadius: 16, background: 'var(--bg-primary)', boxShadow: '0 8px 30px rgba(2,6,23,0.06)' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}><Star /><h4 style={{ margin: 0 }}>Técnicas avanzadas</h4></div>
            <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>Protocolos de concentración y meditación probados.</p>
          </div>

          <div style={{ padding: 20, borderRadius: 16, background: 'var(--bg-primary)', boxShadow: '0 8px 30px rgba(2,6,23,0.06)' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}><Clock /><h4 style={{ margin: 0 }}>Pomodoro integrado</h4></div>
            <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>Timers y rachas para mantener el foco.</p>
          </div>

          <div style={{ padding: 20, borderRadius: 16, background: 'var(--bg-primary)', boxShadow: '0 8px 30px rgba(2,6,23,0.06)' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}><CheckCircle /><h4 style={{ margin: 0 }}>Tareas y seguimiento</h4></div>
            <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>Organiza, prioriza y revisa tus avances diarios.</p>
          </div>
        </div>
      </section>

      <section style={{ padding: '3rem 1.5rem', background: 'var(--bg-accent)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', color: 'var(--text-on-primary)' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Detalles</h2>
          <p style={{ marginTop: 8, opacity: 0.95 }}>Cada característica está diseñada para integrarse en tu rutina: técnicas cortas, timers y tareas que puedes adaptar a tu día.</p>
          <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
            <div style={{ padding: 12, background: 'rgba(255,255,255,0.04)', borderRadius: 10 }}>
              <strong>Técnicas</strong>
              <div style={{ color: 'var(--text-secondary)' }}>Protocolos paso a paso para distintas duraciones y objetivos.</div>
            </div>
            <div style={{ padding: 12, background: 'rgba(255,255,255,0.04)', borderRadius: 10 }}>
              <strong>Pomodoro</strong>
              <div style={{ color: 'var(--text-secondary)' }}>Temporizadores configurables y métricas de racha.</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
