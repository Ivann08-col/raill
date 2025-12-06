import React, { useEffect, useState } from 'react';
import { X, Upload, Trash2 } from 'lucide-react';
import api from '../services/api';

export default function EditProfileModal({ open, onClose, usuario, onUpdated }) {
  const [form, setForm] = useState({});
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (open && usuario) {
      setForm({
        Username: usuario.Username || '',
        nombre_completo: usuario.nombre_completo || usuario.Username || '',
        correo: usuario.correo || '',
        telefono: usuario.telefono || '',
        ubicacion: usuario.ubicacion || '',
        fecha_nacimiento: usuario.fecha_nacimiento || '',
        descripcion: usuario.descripcion || ''
      });
      setAvatarPreview(usuario.avatar_url || null);
    }
  }, [open, usuario]);

  if (!open) return null;

  const handleFile = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) {
      alert('La imagen es demasiado grande. Máximo 2MB.');
      return;
    }
    setForm(prev => ({ ...prev, avatar: f }));
    setAvatarPreview(URL.createObjectURL(f));
  };

  const handleRemoveNow = async () => {
    if (!window.confirm('¿Eliminar la foto de perfil?')) return;
    try {
      setSaving(true);
      const fd = new FormData();
      fd.append('remove_avatar', '1');
      const res = await api.put('/auth/me', fd);
      setAvatarPreview(null);
      setForm(f => ({ ...f, avatar: null, remove_avatar: false }));
      try { localStorage.setItem('synapse_usuario', JSON.stringify(res.data)); } catch (e) {}
      onUpdated && onUpdated(res.data);
    } catch (e) {
      console.error('Error removing avatar:', e);
      alert('No se pudo eliminar la foto');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Validate ubicación: must be in format "País, Ciudad" (country first, then city/town)
      if (form.ubicacion) {
        const parts = form.ubicacion.split(',').map(p => p.trim()).filter(Boolean);
        if (parts.length !== 2) {
          setSaving(false);
          alert('La ubicación debe tener el formato: País, Ciudad (ej. Colombia, Bogotá)');
          return;
        }
        const [country, city] = parts;
        // Basic validation: only letters, spaces, accents, hyphens, dots and minimum length
        const placeRe = /^[\p{L}\s.'-]{2,}$/u;
        if (!placeRe.test(country) || !placeRe.test(city)) {
          setSaving(false);
          alert('La ubicación no parece válida. Escribe primero el país, luego la ciudad, por ejemplo: Colombia, Bogotá');
          return;
        }
      }
      const fd = new FormData();
      if (form.nombre_completo) fd.append('nombre_completo', form.nombre_completo);
      if (form.Username) fd.append('Username', form.Username);
      if (form.correo) fd.append('correo', form.correo);
      if (form.telefono) fd.append('telefono', form.telefono);
      if (form.ubicacion) fd.append('ubicacion', form.ubicacion);
      if (form.fecha_nacimiento) fd.append('fecha_nacimiento', form.fecha_nacimiento);
      // Always send `descripcion` field so the user can clear their bio (empty string should clear it server-side)
      if (typeof form.descripcion !== 'undefined') fd.append('descripcion', form.descripcion ?? '');
      if (form.avatar) fd.append('avatar', form.avatar);
      if (form.remove_avatar) fd.append('remove_avatar', '1');

      const res = await api.put('/auth/me', fd);
      let fresh = res.data;
      try {
        const meRes = await api.get('/auth/me');
        if (meRes && meRes.data) fresh = meRes.data;
      } catch (e) {}
      // If server returned an avatar URL, update the preview (add cache-busting param)
      try {
        if (fresh && fresh.avatar_url) {
          const url = `${fresh.avatar_url}${fresh.avatar_url.includes('?') ? '&' : '?'}t=${Date.now()}`;
          setAvatarPreview(url);
        }
      } catch (e) { /* ignore */ }

      try { localStorage.setItem('synapse_usuario', JSON.stringify(fresh)); } catch (e) {}
      onUpdated && onUpdated(fresh);
      // Show temporary success message, then close modal automatically
      try {
        setSuccessMessage('Tus cambios se guardaron exitosamente');
        setTimeout(() => {
          setSuccessMessage('');
          onClose && onClose();
        }, 1600);
      } catch (e) { onClose && onClose(); }
    } catch (e) {
      console.error('Error saving profile:', e);
      if (e?.response?.status === 409) alert('El correo ya está en uso');
      else alert('No se pudo actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (nameOrUser) => {
    if (!nameOrUser) return 'U';
    let str = '';
    if (typeof nameOrUser === 'string') str = nameOrUser;
    else if (typeof nameOrUser === 'object') str = nameOrUser.nombre_completo || nameOrUser.name || nameOrUser.Username || nameOrUser.username || nameOrUser.email || '';
    else str = String(nameOrUser || '');
    if (!str) return 'U';
    return String(str).split(' ').map(n => (n && n[0]) ? n[0] : '').join('').substring(0,2).toUpperCase();
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-card" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>Editar Perfil</h2>
          <button onClick={onClose} className="close-btn" aria-label="Cerrar"><X size={20} /></button>
        </div>

        <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
          {successMessage && (
            <div style={{ marginBottom: 12, padding: '10px 12px', borderRadius: 8, background: 'rgba(46, 204, 113, 0.12)', color: '#128a37', fontWeight: 600, textAlign: 'center' }} role="status">
              {successMessage}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Nombre completo</label>
                <input className="auth-input" type="text" value={form.nombre_completo || ''} onChange={e => setForm(f => ({ ...f, nombre_completo: e.target.value }))} placeholder="Ingresa tu nombre completo" style={{ width: '100%', padding: '10px 12px', borderRadius: 8 }} />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Teléfono</label>
                <input className="auth-input" type="text" value={form.telefono || ''} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} placeholder="+34 612 345 678" style={{ width: '100%', padding: '10px 12px', borderRadius: 8 }} />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Ubicación</label>
                <input className="auth-input" type="text" value={form.ubicacion || ''} onChange={e => setForm(f => ({ ...f, ubicacion: e.target.value }))} placeholder="País, Ciudad — ej. Colombia, Bogotá" style={{ width: '100%', padding: '10px 12px', borderRadius: 8 }} />
              </div>
            </div>

            <div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Foto de perfil</label>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 20, border: '2px dashed var(--input-border)', borderRadius: 12, background: 'var(--bg-secondary)' }}>
                  <div style={{ width: 110, height: 110, borderRadius: '50%', overflow: 'hidden', background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontWeight: 800, color: 'white', border: '4px solid rgba(255,255,255,0.07)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{getInitials(form.nombre_completo || usuario?.nombre_completo || usuario?.Username)}</div>
                      )}
                      {(avatarPreview || usuario?.avatar_url) && (
                        <button type="button" onClick={handleRemoveNow} disabled={saving} style={{ position: 'absolute', top: 8, right: 8, background: 'var(--bg-primary)', color: 'var(--primary-purple-dark)', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '50%', width: 30, height: 30, padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.06)' }} title="Eliminar foto"><Trash2 size={14} /></button>
                      )}
                    </div>
                  </div>

                  <label htmlFor="avatar-upload" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'var(--bg-primary)', border: '1px solid var(--input-border)', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', transition: 'all 0.2s' }}>
                    <Upload size={16} /> Seleccionar archivo
                  </label>
                  <input id="avatar-upload" type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 12, textAlign: 'center' }}>PNG, JPG — máximo 2MB</p>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Biografía</label>
                <textarea className="auth-input" value={form.descripcion || ''} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} placeholder="Cuéntanos sobre ti..." style={{ width: '100%', minHeight: 120, padding: '10px 12px', borderRadius: 8 }} />
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-light)', display: 'flex', gap: 12, justifyContent: 'flex-end', background: 'transparent' }}>
          <button onClick={onClose} disabled={saving} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--input-border)', background: 'var(--bg-primary)', color: 'var(--text-secondary)', fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.5 : 1, transition: 'all 0.2s' }}>Cancelar</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--primary-gradient)', color: 'var(--text-on-primary)', fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(102, 126, 234, 0.12)' }}>{saving ? 'Guardando...' : 'Guardar Cambios'}</button>
        </div>
      </div>
    </div>
  );
}