import React, { useState, useEffect } from 'react';
import api from '../services/api';
import cfg from '../services/config';

export default function TaskModal({ open, onClose, onCreated, initialTask = null, editingId = null }) {
  const MAX_TITLE = 35;
  const MAX_DESCRIPTION = 100;

  const [form, setForm] = useState({
    titulo: '', descripcion: '', prioridad: 'media', categoria: 'Personal', fecha_vencimiento: '', tiempo_estimado: '30'
  });
    const [estado, setEstado] = useState('Pendiente');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Compute today's date in Colombia timezone (YYYY-MM-DD) to use as min for date input
  const todayIsoBogota = (() => {
    try {
      // 'en-CA' yields YYYY-MM-DD which matches the value format of <input type="date">
      return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());
    } catch (e) { return new Date().toISOString().slice(0,10); }
  })();

  // When opening for edit, prefill form
  useEffect(() => {
    if (open && initialTask) {
      setForm({
        titulo: initialTask.titulo || '',
        descripcion: initialTask.descripcion || '',
        prioridad: initialTask.prioridad || 'media',
        categoria: initialTask.categoria || 'Personal',
        fecha_vencimiento: initialTask.fecha_vencimiento || '',
        tiempo_estimado: initialTask.tiempo_estimado || '30'
      });
      setEstado(initialTask.estado || 'Pendiente');
    }
    if (!open) {
      // reset on close
      setForm({ titulo: '', descripcion: '', prioridad: 'media', categoria: 'Personal', fecha_vencimiento: '', tiempo_estimado: '30' });
      setEstado('Pendiente');
      setError('');
      setLoading(false);
    }
  }, [open, initialTask]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Enforce client-side limits defensively (maxlength attribute also set in inputs)
    if (name === 'titulo' && value.length > MAX_TITLE) return;
    if (name === 'descripcion' && value.length > MAX_DESCRIPTION) return;
    setForm(prev => ({ ...prev, [name]: value }));
    if (name === 'estado') setEstado(value);
    if (name === 'fecha_vencimiento') {
      // clear previous error when user updates the date
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.titulo || !form.fecha_vencimiento) {
      setError('El título y la fecha límite son obligatorios');
      return;
    }

    // Validar longitud
    if ((form.titulo || '').trim().length > MAX_TITLE) {
      setError(`El título no puede exceder ${MAX_TITLE} caracteres`);
      return;
    }
    if ((form.descripcion || '').trim().length > MAX_DESCRIPTION) {
      setError(`La descripción no puede exceder ${MAX_DESCRIPTION} caracteres`);
      return;
    }

    // If we're creating a new task (no editing id), prevent selecting a past date
    const isEditMode = Boolean(editingId || (initialTask && initialTask.id_tarea));
    if (!isEditMode) {
      try {
        // form.fecha_vencimiento expected in 'YYYY-MM-DD' (value from input date)
        const selected = form.fecha_vencimiento;
        if (selected && selected < todayIsoBogota) {
          setError('La fecha límite no puede ser anterior a hoy');
          setLoading(false);
          return;
        }
      } catch (e) {
        // ignore parse errors and let server validate if needed
      }
    }
    setLoading(true);
    try {
      let result = null;
      if (editingId || (initialTask && initialTask.id_tarea)) {
        // Edit mode -> PUT
        const id = editingId || initialTask.id_tarea;
        result = await api.put(`${cfg.paths.tareas}/${id}`, {
          titulo: form.titulo.trim(),
          descripcion: form.descripcion.trim(),
          prioridad: form.prioridad,
          fecha_vencimiento: form.fecha_vencimiento,
          tiempo_estimado: form.tiempo_estimado,
          categoria: form.categoria,
          estado: estado
        });
      } else {
        // Create mode -> POST
        result = await api.post(cfg.paths.tareas, {
          titulo: form.titulo.trim(),
          descripcion: form.descripcion.trim(),
          prioridad: form.prioridad,
          fecha_vencimiento: form.fecha_vencimiento,
          tiempo_estimado: form.tiempo_estimado,
          categoria: form.categoria,
          estado: estado
        });
      }
      setLoading(false);
      // Try to pass created/updated task back to parent so UI can reflect category immediately
      const returned = result?.data || null;
      if (onCreated) onCreated(returned || { titulo: form.titulo.trim(), categoria: form.categoria, estado });
      onClose && onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.message || 'Error al crear tarea');
      setLoading(false);
    }
  };

  return (
    <div className="task-modal-overlay" role="dialog" aria-modal="true">
      <div className="task-modal-card">
        <button className="task-close" onClick={onClose} aria-label="Cerrar">×</button>
        <h3 style={{ marginTop: 0 }}>Nueva Tarea</h3>
        <form onSubmit={handleSubmit} className="task-form-grid">
          <div className="field full">
            <label>Título *</label>
            <input name="titulo" value={form.titulo} onChange={handleChange} placeholder="Ingresa el título de la tarea" required maxLength={MAX_TITLE} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
              <small style={{ color: form.titulo.length > MAX_TITLE ? 'crimson' : 'var(--text-tertiary)' }}>{form.titulo.length}/{MAX_TITLE}</small>
            </div>
          </div>

          <div className="field full">
            <label>Descripción</label>
            <textarea name="descripcion" value={form.descripcion} onChange={handleChange} placeholder="Describe los detalles de la tarea" maxLength={MAX_DESCRIPTION} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
              <small style={{ color: form.descripcion.length > MAX_DESCRIPTION ? 'crimson' : 'var(--text-tertiary)' }}>{form.descripcion.length}/{MAX_DESCRIPTION}</small>
            </div>
          </div>

          <div className="field col">
            <label>Prioridad</label>
            <select name="prioridad" value={form.prioridad} onChange={handleChange}>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
          </div>

          <div className="field col">
            <label>Categoría</label>
            <select name="categoria" value={form.categoria} onChange={handleChange}>
              <option value="Personal">Personal</option>
              <option value="Trabajo">Trabajo</option>
              <option value="Estudio">Estudio</option>
            </select>
          </div>

          <div className="field full">
            <label>Estado</label>
            <select name="estado" value={estado} onChange={handleChange}>
              <option value="Pendiente">Pendiente</option>
              <option value="EnProgreso">En Progreso</option>
              <option value="EnEspera">En Espera</option>
              <option value="Completado">Completado</option>
            </select>
          </div>

          <div className="field date">
            <label>Fecha límite</label>
            <input name="fecha_vencimiento" type="date" value={form.fecha_vencimiento} onChange={handleChange} min={todayIsoBogota} />
          </div>



          {error && <div className="error-row">{error}</div>}

          <div className="actions">
            <button type="button" onClick={onClose} className="btn ghost">Cancelar</button>
            <button type="submit" className="submit-btn" disabled={loading}>{loading ? (editingId || initialTask ? 'Guardando...' : 'Creando...') : (editingId || initialTask ? 'Guardar cambios' : 'Crear Tarea')}</button>
          </div>
        </form>
      </div>

      <style>{`
        .task-modal-overlay{ position:fixed; inset:0; display:flex; align-items:center; justify-content:center; z-index:3000; background: rgba(7,10,25,0.45); padding:20px; }
        .task-modal-card{ width: 680px; max-width: 96%; background: var(--bg-primary); border-radius: 12px; padding: 20px 22px; box-shadow: 0 20px 60px rgba(0,0,0,0.5); position: relative; }
        .task-modal-card h3{ margin:0 0 12px 0; color: var(--text-primary); }
        .task-modal-card label{ display:block; margin-top: 12px; font-weight:600; color: var(--text-secondary); }
        .task-modal-card input[type="text"], .task-modal-card input[type="date"], .task-modal-card input[type="number"], .task-modal-card textarea, .task-modal-card select { width:100%; padding:10px 12px; border-radius:8px; border:1px solid var(--border-default); background: var(--bg-secondary); color: var(--text-primary); box-sizing:border-box; }
        .task-modal-card textarea{ min-height: 90px; resize: vertical; }
        .task-modal-card .char-counter { font-size: 12px; color: var(--text-tertiary); }
        .task-close{ position:absolute; right:12px; top:12px; background:transparent; border:none; font-size:18px; cursor:pointer; color:var(--text-tertiary); }
        .task-modal-card .btn.ghost{ background: transparent; border: 1px solid var(--border-default); color: var(--text-secondary); padding:8px 12px; border-radius:10px; }
        .task-modal-card .submit-btn{ padding:10px 16px; border-radius:12px; }
        /* Grid layout for the form */
        .task-form-grid{ display: grid; grid-template-columns: 1fr 1fr; gap: 12px 12px; }
        .task-form-grid .field.full{ grid-column: 1 / -1; }
        .task-form-grid .field.col{ grid-column: auto; }
        .task-form-grid .field.date{ grid-column: 1 / 1; }
        .task-form-grid .field.small{ grid-column: 2 / 2; max-width: 160px; }
        .task-form-grid .error-row{ grid-column: 1 / -1; color: crimson; margin-top: 6px; }
        .task-form-grid .actions{ grid-column: 1 / -1; display:flex; gap:12px; align-items:center; margin-top: 8px; }
        .task-form-grid .actions .btn.ghost{ padding:10px 14px; }
        .task-form-grid .actions .submit-btn{ flex: 1; padding:12px 18px; border-radius:10px; }
      `}</style>
    </div>
  );
}
