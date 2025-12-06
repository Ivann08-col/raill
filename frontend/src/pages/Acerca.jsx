import React from 'react';
import Tooltip from '../components/Tooltip';
import { Target, Star, CheckCircle } from 'lucide-react';

export default function Acerca({ onAuthClick }) {
  const handleAuth = (mode) => {
    if (typeof onAuthClick === 'function') return onAuthClick(mode);
    console.log('Auth mode:', mode);
  };

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <section style={{ padding: '3.5rem 1.5rem', background: 'linear-gradient(180deg, rgba(124,58,237,0.06), transparent)', color: 'var(--text-primary)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gap: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 800, margin: 0 }}>Acerca de Synapse</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 10 }}>Plataforma para entrenar la atención y el bienestar mental usando técnicas prácticas, meditaciones y seguimiento.</p>
            <div style={{ marginTop: 18 }}>
              <p style={{ color: 'var(--text-secondary)' }}>Desde 2020 hemos ayudado a miles de usuarios a mejorar su atención mediante prácticas guiadas y herramientas de seguimiento. Con un enfoque basado en evidencia, integramos protocolos simples y repetibles que se adaptan a la vida diaria.</p>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '3.5rem 1.5rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            <div style={{ padding: 20, borderRadius: 16, background: 'var(--bg-primary)', boxShadow: '0 8px 30px rgba(2,6,23,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Target />
                <h3 style={{ margin: 0 }}>Nuestra misión</h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', marginTop: 10 }}>Facilitar prácticas accesibles y medibles para mejorar atención y bienestar.</p>
            </div>

            <div style={{ padding: 20, borderRadius: 16, background: 'var(--bg-primary)', boxShadow: '0 8px 30px rgba(2,6,23,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Star />
                <h3 style={{ margin: 0 }}>Equipo</h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', marginTop: 10 }}>Psicólogos, diseñadores y desarrolladores creando experiencias efectivas.</p>
            </div>

            <div style={{ padding: 20, borderRadius: 16, background: 'var(--bg-primary)', boxShadow: '0 8px 30px rgba(2,6,23,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <CheckCircle />
                <h3 style={{ margin: 0 }}>Valores</h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', marginTop: 10 }}>Evidencia, empatía y simplicidad en cada práctica.</p>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '3rem 1.5rem', background: 'var(--bg-accent)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', color: 'var(--text-on-primary)' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Nuestra trayectoria</h2>
          <p style={{ marginTop: 8, opacity: 0.95 }}>Hemos crecido colaborando con centros educativos y profesionales del bienestar para incorporar feedback real en nuestras técnicas.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 18 }}>
            <div style={{ background: 'rgba(255,255,255,0.04)', padding: 14, borderRadius: 10 }}>
              <strong>+50k</strong>
              <div style={{ color: 'var(--text-secondary)' }}>Usuarios activos</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.04)', padding: 14, borderRadius: 10 }}>
              <strong>4.8/5</strong>
              <div style={{ color: 'var(--text-secondary)' }}>Valoración media</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
