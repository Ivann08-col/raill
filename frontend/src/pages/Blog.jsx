import React from 'react';

const posts = [
  { title: 'Cómo entrenar tu atención en 4 semanas', excerpt: 'Un plan paso a paso para mejorar tu capacidad de enfoque.' },
  { title: 'Meditaciones para reducir la ansiedad', excerpt: 'Técnicas breves para momentos de alta presión.' },
  { title: 'Rutinas de productividad basadas en la atención', excerpt: 'Integrando prácticas diarias para mantener el foco.' }
];

export default function Blog() {
  return (
    <div style={{ minHeight: '100vh', padding: '3rem 1.5rem', background: 'var(--bg-primary)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Blog</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>Artículos, guías y entrevistas sobre concentración, bienestar y productividad.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          {posts.map((p, i) => (
            <article key={i} style={{ padding: 18, borderRadius: 12, background: 'var(--bg-primary)', boxShadow: '0 6px 18px rgba(2,6,23,0.04)' }}>
              <h3 style={{ margin: '0 0 8px' }}>{p.title}</h3>
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{p.excerpt}</p>
              <div style={{ marginTop: 12 }}>
                <a href="#" style={{ color: 'var(--primary-purple-vibrant)', fontWeight: 700, textDecoration: 'none' }}>Leer artículo →</a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
