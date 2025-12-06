import React from 'react';

export default function Contacto() {
  return (
    <div style={{ minHeight: '100vh', padding: '3rem 1.5rem', background: 'var(--bg-primary)' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Contacto</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>¿Tienes preguntas o quieres colaborar? Escríbenos y te responderemos lo antes posible.</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ padding: 16, borderRadius: 12, background: 'var(--bg-primary)', boxShadow: '0 6px 18px rgba(2,6,23,0.04)' }}>
            <h4 style={{ marginTop: 0 }}>Datos de contacto</h4>
            <p style={{ color: 'var(--text-secondary)' }}>Correo: soporte@synapse.com<br/>Horario: Lun-Vie 9:00 - 18:00</p>
            <h5 style={{ marginTop: 12 }}>Oficinas</h5>
            <p style={{ color: 'var(--text-secondary)' }}>Colombia, País — Calle Ejemplo 123</p>
          </div>

          <form style={{ padding: 16, borderRadius: 12, background: 'var(--bg-primary)', boxShadow: '0 6px 18px rgba(2,6,23,0.04)', display: 'grid', gap: 10 }} onSubmit={(e) => { e.preventDefault(); alert('Enviado (simulado)'); }}>
            <input placeholder="Tu nombre" className="auth-input" />
            <input placeholder="Tu correo" className="auth-input" />
            <textarea placeholder="Mensaje" rows={6} className="auth-input" />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" style={{ padding: '10px 16px', borderRadius: 8, background: 'linear-gradient(90deg,#4b5563,#6b7280)', color: '#fff', border: 'none' }}>Enviar</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
