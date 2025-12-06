import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import { getUsuario } from '../services/auth';
import { createSala, getMySalas, getPublicSalas, getSalaDetalle, unirseSala, salirSala } from '../services/sala';

export default function SalaPage() {
    // Importación dinámica del componente ChatSala para el modal
    const ChatSala = React.lazy(() => import('../components/ChatSala.jsx'));
    const [showChatModal, setShowChatModal] = useState(false);
    const usuario = getUsuario();
    const [mySalas, setMySalas] = useState([]);
    const [publicSalas, setPublicSalas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ nombre: '', descripcion: '', es_privada: false, max_participantes: 0 });
    const [selectedSala, setSelectedSala] = useState(null);
    const [joinCode, setJoinCode] = useState('');
    const [error, setError] = useState('');
    const [showPublicModal, setShowPublicModal] = useState(false);
    const [showPrivateModal, setShowPrivateModal] = useState(false);
    const [privateId, setPrivateId] = useState('');
    const [privateCode, setPrivateCode] = useState('');
    const [privateErr, setPrivateErr] = useState('');

    // Modo oscuro: detecta preferencia del usuario
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    const mainBg = prefersDark ? {
        background: 'linear-gradient(135deg, #181825 0%, #312e81 100%)',
        minHeight: '100vh',
        padding: '3rem 0',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: '#e0e7ef',
        transition: 'background 0.3s'
    } : {
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e0e7ff 100%)',
        minHeight: '100vh',
        padding: '3rem 0',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: '#222',
        transition: 'background 0.3s'
    };
    const cardStyle = prefersDark ? {
        background: '#232136',
        borderRadius: '24px',
        boxShadow: '0 4px 20px rgba(80,80,120,0.18)',
        border: '1px solid #444',
        padding: '2rem',
        marginBottom: '2rem',
        color: '#e0e7ef'
    } : {
        background: 'white',
        borderRadius: '24px',
        boxShadow: '0 4px 20px rgba(124,58,237,0.08)',
        border: '1px solid #e5e7eb',
        padding: '2rem',
        marginBottom: '2rem',
        color: '#222'
    };
    const titleStyle = prefersDark ? {
        fontSize: '2rem',
        fontWeight: '800',
        color: '#a78bfa',
        marginBottom: '1rem'
    } : {
        fontSize: '2rem',
        fontWeight: '800',
        color: '#7c3aed',
        marginBottom: '1rem'
    };
    const subtitleStyle = prefersDark ? {
        fontSize: '1.1rem',
        color: '#a5b4fc',
        marginBottom: '2rem'
    } : {
        fontSize: '1.1rem',
        color: '#6366f1',
        marginBottom: '2rem'
    };
    const btnStyle = prefersDark ? {
        padding: '0.75rem 2rem',
        fontSize: '1rem',
        fontWeight: '600',
        borderRadius: '50px',
        background: 'linear-gradient(135deg, #6366f1, #a78bfa)',
        color: 'white',
        border: 'none',
        boxShadow: '0 2px 8px rgba(80,80,120,0.18)',
        cursor: 'pointer',
        marginTop: '1rem'
    } : {
        padding: '0.75rem 2rem',
        fontSize: '1rem',
        fontWeight: '600',
        borderRadius: '50px',
        background: 'linear-gradient(135deg, #7c3aed, #f093fb)',
        color: 'white',
        border: 'none',
        boxShadow: '0 2px 8px rgba(124,58,237,0.12)',
        cursor: 'pointer',
        marginTop: '1rem'
    };

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const [mine, pub] = await Promise.all([getMySalas(), getPublicSalas()]);
            setMySalas(mine || []);
            setPublicSalas(pub || []);
        } catch (e) {
            setError('Error cargando salas');
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    function handleChange(e) {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }

    async function handleCreate(e) {
        e.preventDefault();
        setError('');
        try {
            const payload = { ...form };
            if (!payload.nombre) return setError('El nombre es requerido');
            const created = await createSala(payload);
            // reload lists
            await loadData();
            // Mostrar código de acceso solo si el creador lo recibe (salas privadas)
            if (created.codigo_acceso) {
                // Mostrar en alerta y copiar al portapapeles
                try { await navigator.clipboard.writeText(created.codigo_acceso); } catch (e) { }
                alert(`Sala creada. ID: ${created.id_sala}\nCódigo de acceso (copiado al portapapeles): ${created.codigo_acceso}`);
            } else {
                alert('Sala creada');
            }
            setForm({ nombre: '', descripcion: '', es_privada: false, max_participantes: 0 });
        } catch (err) {
            setError(err.response?.data?.error || String(err));
        }
    }

    async function handleOpenSala(salaId, esPublica = false) {
        setError('');
        try {
            // Si es pública, únete automáticamente antes de mostrar el detalle
            if (esPublica) {
                try {
                    await unirseSala(salaId, '');
                } catch (e) { /* ignorar error si ya es miembro */ }
                await loadData();
            }
            const det = await getSalaDetalle(salaId);
            setSelectedSala(det);
        } catch (err) {
            setError(err.response?.data?.error || String(err));
        }
    }

    async function handleJoin(salaId) {
        setError('');
        try {
            await unirseSala(salaId, joinCode);
            await loadData();
            alert('Te uniste a la sala');
        } catch (err) {
            setError(err.response?.data?.error || String(err));
        }
    }

    async function handleLeave(salaId) {
        setError('');
        try {
            await salirSala(salaId);
            setSelectedSala(null);
            await loadData();
        } catch (err) {
            setError(err.response?.data?.error || String(err));
        }
    }

    async function copyText(text) {
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            alert('Código copiado al portapapeles');
        } catch (e) {
            // Fallback
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand('copy'); alert('Código copiado al portapapeles'); } catch (err) { prompt('Copia el código manualmente:', text); }
            ta.remove();
        }
    }

    return (
        <div style={mainBg}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
                <div style={titleStyle}>Sesión Grupal</div>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                    <button style={btnStyle} onClick={() => setShowPublicModal(true)}>Ver salas públicas</button>
                    <button style={btnStyle} onClick={() => setShowPrivateModal(true)}>Ingresar a sala privada</button>
                </div>
                <div style={subtitleStyle}>Crea, únete y gestiona tus salas de estudio o trabajo colaborativo</div>
                {error && <div style={{ color: '#ef4444', fontWeight: 600, marginBottom: 16 }}>{error}</div>}
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 400px' }}>
                        <div style={cardStyle}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#6366f1', marginBottom: '1rem' }}>Crear sala</h2>
                            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <label>Nombre<br /><input name="nombre" value={form.nombre} onChange={handleChange} style={{ padding: '0.75rem', borderRadius: 12, border: '1px solid #e5e7eb', fontSize: '1rem' }} /></label>
                                <label>Descripción<br /><input name="descripcion" value={form.descripcion} onChange={handleChange} style={{ padding: '0.75rem', borderRadius: 12, border: '1px solid #e5e7eb', fontSize: '1rem' }} /></label>
                                <label>Privada <input type="checkbox" name="es_privada" checked={form.es_privada} onChange={handleChange} /></label>
                                <label>Max participantes<br /><input name="max_participantes" type="number" value={form.max_participantes} onChange={handleChange} style={{ padding: '0.75rem', borderRadius: 12, border: '1px solid #e5e7eb', fontSize: '1rem' }} /></label>
                                <button type="submit" style={btnStyle}>Crear</button>
                            </form>
                        </div>
                        <div style={{ ...cardStyle, marginTop: 0 }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#6366f1', marginBottom: '1rem' }}>Mis salas</h2>
                            {loading ? <div>Cargando...</div> : (
                                <div>
                                    {mySalas.map(s => (
                                        <div key={s.id_sala} style={{ background: '#f3f4f6', borderRadius: 16, padding: '1rem', marginBottom: 12, boxShadow: '0 2px 8px rgba(124,58,237,0.06)' }}>
                                            <div style={{ fontWeight: 700, color: '#7c3aed', fontSize: '1.1rem' }}>{s.nombre} {s.es_privada ? <span style={{ background: '#6366f1', color: 'white', borderRadius: 8, padding: '2px 8px', fontSize: '0.85rem', marginLeft: 8 }}>Privada</span> : null}</div>
                                            <div style={{ color: '#6366f1', fontSize: '0.95rem', marginBottom: 6 }}>{s.descripcion}</div>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button style={{ ...btnStyle, padding: '0.5rem 1.2rem', fontSize: '0.95rem', background: 'linear-gradient(135deg, #6366f1, #7c3aed)' }} onClick={() => handleOpenSala(s.id_sala)}>Abrir</button>
                                                {s.creador_id === usuario?.id_usuario && s.codigo_acceso && (
                                                    <button style={{ ...btnStyle, padding: '0.5rem 1.2rem', fontSize: '0.95rem', background: 'linear-gradient(135deg, #f093fb, #7cared)' }} onClick={() => copyText(s.codigo_acceso)}>Copiar código</button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            {/* Modal Salas Públicas */}
            {showPublicModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'white', borderRadius: 24, boxShadow: '0 8px 30px rgba(124,58,237,0.18)', padding: 32, minWidth: 400, maxWidth: 600 }}>
                        <h2 style={{ color: '#7c3aed', fontWeight: 800, fontSize: '1.5rem', marginBottom: 16 }}>Salas públicas</h2>
                        {loading ? <div>Cargando...</div> : (
                            <div>
                                {publicSalas.length === 0 && <div>No hay salas públicas disponibles.</div>}
                                {publicSalas.map(s => (
                                    <div key={s.id_sala} style={{ background: '#f3f4f6', borderRadius: 16, padding: '1rem', marginBottom: 12 }}>
                                        <div style={{ fontWeight: 700, color: '#6366f1', fontSize: '1.1rem' }}>{s.nombre}</div>
                                        <div style={{ color: '#6366f1', fontSize: '0.95rem', marginBottom: 6 }}>creador: {s.creador?.username || s.creador?.correo}</div>
                                        <button style={{ padding: '0.5rem 1.2rem', fontSize: '0.95rem', borderRadius: '50px', background: 'linear-gradient(135deg, #6366f1, #7c3aed)', color: 'white', border: 'none', cursor: 'pointer', marginTop: 8 }} onClick={() => handleOpenSala(s.id_sala, true)}>Entrar</button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <button style={{ ...btnStyle, marginTop: 16 }} onClick={() => setShowPublicModal(false)}>Cerrar</button>
                    </div>
                </div>
            )}

            {/* Modal Sala Privada */}
            {showPrivateModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'white', borderRadius: 24, boxShadow: '0 8px 30px rgba(124,58,237,0.18)', padding: 32, minWidth: 400, maxWidth: 400 }}>
                        <h2 style={{ color: '#7c3aed', fontWeight: 800, fontSize: '1.5rem', marginBottom: 16 }}>Ingresar a sala privada</h2>
                        {privateErr && <div style={{ color: '#ef4444', fontWeight: 600, marginBottom: 8 }}>{privateErr}</div>}
                        <input placeholder="ID de sala" value={privateId} onChange={e => setPrivateId(e.target.value)} style={{ padding: '0.75rem', borderRadius: 12, border: '1px solid #e5e7eb', fontSize: '1rem', marginBottom: 12, width: '100%' }} />
                        <input placeholder="Código de acceso" value={privateCode} onChange={e => setPrivateCode(e.target.value)} style={{ padding: '0.75rem', borderRadius: 12, border: '1px solid #e5e7eb', fontSize: '1rem', marginBottom: 12, width: '100%' }} />
                        <button style={btnStyle} onClick={async () => {
                            setPrivateErr('');
                            if (!privateId || !privateCode) return setPrivateErr('Debes ingresar el ID y el código');
                            try {
                                await unirseSala(privateId, privateCode);
                                setShowPrivateModal(false);
                                setPrivateId('');
                                setPrivateCode('');
                                await loadData();
                                alert('Te uniste a la sala privada');
                            } catch (err) {
                                setPrivateErr(err.response?.data?.error || String(err));
                            }
                        }}>Unirse</button>
                        <button style={{ ...btnStyle, marginTop: 8 }} onClick={() => setShowPrivateModal(false)}>Cerrar</button>
                    </div>
                </div>
            )}
                {selectedSala && (
                    <div style={{ ...cardStyle, marginTop: 32 }}>
                        <h3 style={{ color: '#7c3aed', fontWeight: 700, fontSize: '1.25rem' }}>Detalle sala: {selectedSala.nombre}</h3>
                        <p style={{ color: '#6366f1', fontSize: '1rem' }}>{selectedSala.descripcion}</p>
                        <p style={{ color: '#6366f1', fontSize: '0.95rem' }}>Creada por: {selectedSala.creador_username || selectedSala.creador_id}</p>
                        <p style={{ color: '#6366f1', fontSize: '0.95rem' }}>Participantes: {selectedSala.total_participantes}</p>
                        {selectedSala.participantes && (
                            <ul style={{ listStyle: 'none', padding: 0, margin: '1rem 0' }}>
                                {selectedSala.participantes.map(p => (
                                    <li key={p.id_usuario} style={{ color: '#6366f1', fontWeight: 600 }}>{p.username || p.Username || p.correo}</li>
                                ))}
                            </ul>
                        )}
                        {selectedSala.creador_id === usuario?.id_usuario && selectedSala.codigo_acceso && (
                            <div style={{ marginTop: 12 }}>
                                <div style={{ color: '#6366f1', fontWeight: 700 }}>Código de acceso:</div>
                                <div style={{ background: '#ede9fe', color: '#7c3aed', borderRadius: 8, padding: '6px 16px', fontWeight: 700, display: 'inline-block', marginTop: 4 }}>{selectedSala.codigo_acceso}</div>
                                <button style={{ ...btnStyle, padding: '0.5rem 1.2rem', fontSize: '0.95rem', background: 'linear-gradient(135deg, #f093fb, #7cared)', marginLeft: 8 }} onClick={() => copyText(selectedSala.codigo_acceso)}>Copiar código</button>
                            </div>
                        )}
                        {selectedSala.creador_id === usuario?.id_usuario && (
                            <div style={{ marginTop: 8, color: '#6366f1' }}><em>Eres el creador/leader de esta sala.</em></div>
                        )}
                        <div style={{ marginTop: 18, display: 'flex', gap: 12 }}>
                            <button style={{ ...btnStyle, background: 'linear-gradient(135deg, #6366f1, #7c3aed)', padding: '0.5rem 1.2rem', fontSize: '0.95rem' }} onClick={() => setSelectedSala(null)}>Cerrar</button>
                            <button style={{ ...btnStyle, background: 'linear-gradient(135deg, #ef4444, #f093fb)', padding: '0.5rem 1.2rem', fontSize: '0.95rem' }} onClick={() => handleLeave(selectedSala.id_sala)}>Salir</button>
                            <button style={{ ...btnStyle, background: 'linear-gradient(135deg, #7c3aed, #6366f1)', padding: '0.5rem 1.2rem', fontSize: '0.95rem' }} onClick={() => setShowChatModal(true)}>Chatear</button>
                        </div>
                    </div>
                )}

                {/* Modal ChatSala */}
                {showChatModal && selectedSala && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ background: 'white', borderRadius: 24, boxShadow: '0 8px 30px rgba(124,58,237,0.18)', padding: 32, minWidth: 400, maxWidth: 600 }}>
                            <h2 style={{ color: '#7c3aed', fontWeight: 800, fontSize: '1.5rem', marginBottom: 16 }}>Chat: {selectedSala.nombre}</h2>
                            {/* Documentación: ChatSala.jsx maneja la conexión y lógica de mensajes */}
                            <React.Suspense fallback={<div>Cargando chat...</div>}>
                                <ChatSala salaId={selectedSala.id_sala} salaNombre={selectedSala.nombre} />
                            </React.Suspense>
                            <button style={{ ...btnStyle, marginTop: 16 }} onClick={() => setShowChatModal(false)}>Cerrar chat</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
