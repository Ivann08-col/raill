import React from 'react';

/**
 * Header adaptable a modo claro y midnight.
 * Props:
 *  - title: string
 *  - subtitle: string
 *  - children: (opcional) nodos extra (botones, etc)
 *  - style: estilos extra opcionales
 */
export default function PageHeader({ title, subtitle, children, style }) {
  // Detectar modo actual
  const theme = document.documentElement.getAttribute('data-theme') || 'light';
  // Colores adaptativos
  const bg = theme === 'midnight' ? '#23263a' : '#f5f6fa';
  const color = theme === 'midnight' ? '#fff' : '#222';
  const subColor = theme === 'midnight' ? '#bdbde6' : '#6b7280';
  return (
    <header
      style={{
        background: bg,
        color,
        borderRadius: 24,
        padding: 40,
        marginBottom: 32,
        boxShadow: theme === 'midnight' ? '0 20px 60px rgba(0,0,0,0.18)' : '0 20px 60px rgba(0,0,0,0.08)',
        border: '1px solid ' + (theme === 'midnight' ? '#23263a' : '#f5f6fa'),
        ...style
      }}
    >
      <h1 style={{ margin: 0, fontSize: '2.2rem', fontWeight: 800, color }}>{title}</h1>
      {subtitle && <p style={{ margin: '8px 0 0', color: subColor, fontSize: '1.1rem' }}>{subtitle}</p>}
      {children}
    </header>
  );
}