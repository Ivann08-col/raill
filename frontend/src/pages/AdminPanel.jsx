import React, { useState, useEffect } from 'react';
import api from '../services/api';
import cfg from '../services/config';
import { getUsuario } from '../services/auth';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function AdminPanel() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [expandedUsers, setExpandedUsers] = useState(new Set());
  const navigate = useNavigate();
  const usuario = getUsuario();

  useEffect(() => {
    async function loadUsuarios() {
      try {
  const response = await api.get(cfg.paths.usuarios);
        setUsuarios(response.data || []);
        setError('');
      } catch (e) {
        console.error('Error loading users:', e);
        setError('No se pudieron cargar los usuarios');
      } finally {
        setLoading(false);
      }
    }
    loadUsuarios();
  }, []);

  async function handleDeactivateUser(userId) {
    if (!window.confirm('¿Seguro que deseas desactivar este usuario?')) return;
    try {
  // El backend implementa soft-delete con DELETE en /api/usuarios/:id
  await api.delete(`/usuarios/${userId}`);
      setUsuarios(usuarios.map(u => (u.id_usuario === userId || u.id === userId) ? { ...u, activo: false } : u));
      setError('');
    } catch (e) {
      console.error('Error desactivando usuario:', e);
      setError('Error al desactivar usuario');
    }
  }

  function handleEditClick(user) {
    setEditUser(user);
    // Normalizar campos para el formulario de edición
    setEditForm({
      username: user.username || user.Username || '',
      correo: user.correo || '',
      celular: user.celular || user.telefono || '',
      rol_id: user.rol_id || user.rolId || '',
      activo: typeof user.activo === 'boolean' ? user.activo : (user.activo === 'true' || user.activo === '1')
    });
  }

  function toggleTasks(userId) {
    setExpandedUsers(prev => {
      const s = new Set(prev);
      if (s.has(userId)) s.delete(userId); else s.add(userId);
      return s;
    });
  }

  function handleEditChange(e) {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  }

  async function handleEditSave() {
    try {
      const id = editUser.id_usuario || editUser.id;
  await api.put(`/usuarios/${id}`, editForm);
      setUsuarios(usuarios.map(u => ((u.id_usuario === id || u.id === id) ? { ...u, ...editForm } : u)));
      setEditUser(null);
      setError('');
    } catch (e) {
      setError('Error al editar usuario');
    }
  }

  const generarReportePDF = () => {
    const doc = new jsPDF();

    // Título del reporte
    doc.setFontSize(18);
    doc.text('Reporte de Usuarios', 14, 20);

    // Fecha del reporte
    doc.setFontSize(10);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 30);

    // Datos para la tabla
    const tableData = usuarios.map(user => [
      user.id_usuario || user.id || 'N/A',
      user.username || user.Username || 'N/A',
      user.correo || 'N/A',
      Number(user.rol_id) === 1 ? 'Admin' : 'Cliente',
      user.activo ? 'Activo' : 'Inactivo',
      user.celular || user.telefono || 'N/A'
    ]);

    // Columnas de la tabla
    const tableHeaders = [
      ['ID', 'Nombre de Usuario', 'Correo', 'Rol', 'Estado', 'Teléfono']
    ];

    // Generar la tabla
    doc.autoTable({
      head: tableHeaders,
      body: tableData,
      startY: 40,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
      styles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 40 },
        2: { cellWidth: 50 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
        5: { cellWidth: 35 }
      }
    });

    // Guardar el PDF
    doc.save(`reporte_usuarios_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  // Redirigir si no es admin (soportar rol_id numérico o string, o propiedad rol.nombre)
  useEffect(() => {
    const isAdmin = !!usuario && (
      Number(usuario.rol_id) === 1 ||
      usuario.rol === 'admin' ||
      (usuario.rol && usuario.rol.nombre === 'admin')
    );
    if (!isAdmin) {
      navigate('/');
    }
  }, [navigate, usuario]);

  const nombreAdmin = usuario?.username || usuario?.nombre_completo || usuario?.correo;

  return (
    <div className="admin-panel">
      <h1>Bienvenido administrador {nombreAdmin}</h1>
      <button onClick={generarReportePDF} className="generate-pdf-btn">
        Generar Reporte PDF
      </button>
      {error && <div className="error-message">{error}</div>}
      {loading ? (
        <div>Cargando usuarios...</div>
      ) : (
        <div className="users-table">
          <h2>Usuarios Registrados</h2>
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(user => (
                <React.Fragment key={user.id_usuario}>
                  <tr>
                    <td>{user.username || user.Username || user.username}</td>
                    <td>{user.correo}</td>
                    <td>{Number(user.rol_id) === 1 ? 'Admin' : 'Cliente'}</td>
                    <td>{user.activo ? 'Activo' : 'Inactivo'}</td>
                    <td>
                      <button 
                        onClick={() => handleDeactivateUser(user.id_usuario)}
                        className="deactivate-btn"
                        disabled={!user.activo}
                      >
                        Desactivar
                      </button>
                      <button onClick={() => toggleTasks(user.id_usuario)} className="edit-btn" style={{ marginLeft: 8 }}>
                        {expandedUsers.has(user.id_usuario) ? 'Ocultar tareas' : 'Ver tareas'}
                      </button>
                      <button 
                        onClick={() => handleEditClick(user)}
                        className="edit-btn"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                  {expandedUsers.has(user.id_usuario) && (
                    <tr className="expanded-row">
                      <td colSpan={5}>
                        <div className="expanded-row-inner">
                          <strong>Tareas:</strong>
                          {user.tareas && user.tareas.length > 0 ? (
                            <ul>
                              {user.tareas.map(t => (
                                <li key={t.id_tarea}>{t.titulo} - {t.estado} {t.fecha_vencimiento ? ` (vence: ${t.fecha_vencimiento})` : ''}</li>
                              ))}
                            </ul>
                          ) : (
                            <div>No hay tareas</div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editUser && (
        <div className="edit-modal">
          <h3>Editar usuario</h3>
          <div className="edit-form">
            <label>Username: <input name="username" value={editForm.username || ''} onChange={handleEditChange} /></label>
            <label>Email: <input name="correo" value={editForm.correo || ''} onChange={handleEditChange} /></label>
            <label>Teléfono: <input name="celular" value={editForm.celular || ''} onChange={handleEditChange} /></label>
            <label>Rol: <select name="rol_id" value={editForm.rol_id} onChange={handleEditChange}>
              <option value={1}>Admin</option>
              <option value={2}>Cliente</option>
            </select></label>
            <label>Activo: <select name="activo" value={editForm.activo ? 'true' : 'false'} onChange={e => setEditForm({ ...editForm, activo: e.target.value === 'true' })}>
              <option value="true">Sí</option>
              <option value="false">No</option>
            </select></label>
            <div style={{ marginTop: 12 }}>
              <button onClick={handleEditSave} className="save-btn">Guardar</button>
              <button onClick={() => setEditUser(null)} className="cancel-btn">Cancelar</button>
            </div>
          </div>
        </div>
      )}
      <style>{`
       .h2 { color: black; }
       .h3 { color: black; }
        .admin-panel { padding: 2rem; }
  .users-table { margin-top: 2rem; background: linear-gradient(180deg,#fff,#fbfbff); padding: 16px; border-radius: 12px; box-shadow: 0 8px 24px rgba(16,24,40,0.06); }
  /* Forzar color del título para que sea legible en modo oscuro */
  .users-table h2 { color: #0b0b0b !important; margin-bottom: 12px; }
        .table-wrapper { overflow: auto; border-radius: 8px; }
        table { width: 100%; border-collapse: separate; border-spacing: 0; min-width: 720px; }
        thead th { position: sticky; top: 0; background: linear-gradient(90deg,#f8f5ff,#f5fbff); color:#374151; font-weight:700; padding:12px 16px; text-align:left; border-bottom: none; }
        tbody td { background: white; padding:12px 16px; border-bottom: 1px solid #eef2ff; color:#374151; }
        tbody tr:nth-child(even) td { background: #fbfbff; }
        tbody tr:hover td { background: #f3f4f6; transform: translateY(-2px); box-shadow: 0 6px 14px rgba(16,24,40,0.03); }
        .expanded-row td { background: linear-gradient(90deg,#fffaf6,#fff); border-top:1px solid #f3e8ff; }
        .expanded-row-inner { padding: 12px 8px; }
        .deactivate-btn { background: linear-gradient(90deg,#fb923c,#f97316); color: white; border: none; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; margin-right: 8px; box-shadow: 0 6px 18px rgba(249,115,22,0.12); }
        .deactivate-btn:disabled { opacity: 0.6; cursor:not-allowed; box-shadow:none; }
        .deactivate-btn:hover:not(:disabled) { filter: brightness(0.95); }
        .edit-btn { background: linear-gradient(90deg,#60a5fa,#2563eb); color: white; border:none; padding:0.5rem 1rem; border-radius:8px; cursor:pointer; box-shadow:0 8px 20px rgba(37,99,235,0.12); }
        .edit-btn:hover { filter: brightness(0.95); }
        .error-message { color:#b91c1c; background: #fff5f5; padding: 1rem; margin:1rem 0; border-radius:8px; border:1px solid #fecaca; }
        .edit-modal { position: fixed; top:0; left:0; right:0; bottom:0; background: rgba(0,0,0,0.35); display:flex; align-items:center; justify-content:center; z-index:1000; }
        .edit-form { background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 8px 32px rgba(2,6,23,0.16); min-width: 340px; }
        .edit-form label { display:block; margin-bottom:10px; color:#374151; }
        .save-btn { background: linear-gradient(90deg,#60a5fa,#2563eb); color:white; border:none; padding:0.5rem 1rem; border-radius:8px; cursor:pointer; margin-right:8px; }
        .save-btn:hover { filter: brightness(0.95); }
        .cancel-btn { background:#f3f4f6; color:#374151; border:1px solid #e5e7eb; padding:0.5rem 1rem; border-radius:8px; cursor:pointer; }
        .cancel-btn:hover { background:#e9eefb; }
        .generate-pdf-btn {
          background: linear-gradient(90deg, #10b981, #059669);
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          margin-bottom: 1rem;
          font-weight: 600;
          box-shadow: 0 6px 18px rgba(16, 185, 129, 0.12);
        }
        .generate-pdf-btn:hover {
          filter: brightness(0.95);
        }
      `}</style>
    </div>
  );
}