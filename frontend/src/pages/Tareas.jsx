import React, { useEffect, useState } from 'react';
import cfg from '../services/config';
import api from '../services/api';
import { getUsuario, logout, getToken } from '../services/auth';
import Tooltip from '../components/Tooltip';
import {
    PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, LineChart, Line
} from 'recharts';
import TaskModal from '../components/TaskModal';
import './styles/Tareas.css';
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

function colorForId(id) {
    const s = id?.toString() || '';
    let hash = 0;
    for (let i = 0; i < s.length; i++) hash = (hash << 5) - hash + s.charCodeAt(i);
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue} 70% 50%)`;
}

export default function Dashboard() {
    const usuario = getUsuario();
    // Detect theme global attribute to apply same light/midnight behavior
    const [theme, setTheme] = useState((typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme')) || 'light');

    useEffect(() => {
        if (typeof document === 'undefined') return;
        const root = document.documentElement;
        const observer = new MutationObserver((mutations) => {
            for (const m of mutations) {
                if (m.attributeName === 'data-theme') {
                    setTheme(root.getAttribute('data-theme') || 'light');
                }
            }
        });
        observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
        return () => observer.disconnect();
    }, []);
    const [tareas, setTareas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        titulo: '', descripcion: '', fecha_vencimiento: '',
        prioridad: 'baja', comentario: '', sala_id: ''
    });
    const [editingId, setEditingId] = useState(null);
    const [stats, setStats] = useState(null);
    const [filters, setFilters] = useState({
        id_sala: '',
        estado: '',
        prioridad: ''
    });
    const [showNewTaskModal, setShowNewTaskModal] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [selectedTaskIds, setSelectedTaskIds] = useState([]);
    // Overrides to display categories immediately after create/edit when backend response
    // doesn't include the category field as expected.
    const [categoryOverrides, setCategoryOverrides] = useState({});
    // Pending overrides for created tasks where we didn't receive an id from the modal/API.
    // Each item: { titulo, fecha_vencimiento?, categoria }
    const [pendingCategoryOverrides, setPendingCategoryOverrides] = useState([]);
    const [activeTab, setActiveTab] = useState('Todas');
    const [viewMode, setViewMode] = useState('tareas'); // 'tareas' o 'estadisticas'

    useEffect(() => {
        fetchAll();
        if (getToken()) fetchStats();
    }, []);

    async function fetchAll() {
        setLoading(true);
        setError('');
        try {
            const queryParams = new URLSearchParams();
            if (filters.id_sala) queryParams.append('id_sala', filters.id_sala);
            if (filters.estado) queryParams.append('estado', filters.estado);
            if (filters.prioridad) queryParams.append('prioridad', filters.prioridad);

            const queryString = queryParams.toString();
            const path = cfg.paths.tareas + (queryString ? ('?' + queryString) : '');

            console.log("Petición a:", path);

            const res = await api.get(path);
            setTareas(Array.isArray(res.data) ? res.data : res.data.results || []);
        } catch (e) {
            console.error('Error fetching tareas:', e);
            setError('Error cargando tareas: ' + (e.response?.data?.message || e.response?.data?.error || e.message));
        }
        setLoading(false);
    }

    async function fetchStats() {
        try {
            const res = await api.get(cfg.paths.estadisticas);
            setStats(res.data);
        } catch (e) {
            if (e?.response?.status === 401) return;
            console.error(e);
        }
    }

    async function handleCreateOrUpdate(e) {
        e.preventDefault();
        setError('');

        if (!form.fecha_vencimiento) {
            setError('La fecha de vencimiento es requerida');
            return;
        }

        try {
            const payload = {
                titulo: form.titulo.trim(),
                descripcion: form.descripcion?.trim() || '',
                fecha_vencimiento: form.fecha_vencimiento,
                prioridad: form.prioridad,
                comentario: form.comentario?.trim() || '',
            };

            if (form.sala_id && form.sala_id.trim() !== '') {
                payload.sala_id = form.sala_id.trim();
            }

            if (editingId) {
                payload.estado = form.estado;
                await api.put(`${cfg.paths.tareas}/${editingId}`, payload);
            } else {
                await api.post(cfg.paths.tareas, payload);
            }

            setForm({
                titulo: '',
                descripcion: '',
                fecha_vencimiento: '',
                prioridad: 'baja',
                comentario: '',
                sala_id: ''
            });
            setEditingId(null);
            await fetchAll();
            await fetchStats();
        } catch (e) {
            console.error('Error completo:', e);
            const errorMsg =
                e.response?.data?.error ||
                e.response?.data?.message ||
                e.message ||
                'Error desconocido al guardar la tarea';
            setError('Error guardando tarea: ' + errorMsg);
        }
    }

    const handleNewTaskCreated = async (createdTask) => {
        // If modal returned the created/updated task, store an override so the UI shows the
        // selected category immediately even if the GET endpoint doesn't include it.
        try {
            if (createdTask) {
                const id = createdTask.id_tarea || createdTask.id || null;
                const manualCat = createdTask.categoria || createdTask.category || createdTask.categoria_nombre || createdTask.categoriaName || (createdTask.categoria && (createdTask.categoria.nombre || createdTask.categoria.name)) || null;
                if (id && manualCat) {
                    setCategoryOverrides(prev => ({ ...prev, [id]: manualCat }));
                } else if (manualCat) {
                    // No id: keep a pending override to match after refresh using title + optional date
                    setPendingCategoryOverrides(prev => ([...prev, { titulo: createdTask.titulo, fecha_vencimiento: createdTask.fecha_vencimiento, categoria: manualCat }]));
                }
            }
        } catch (e) {
            console.warn('No override applied for created task', e);
        }
        await fetchAll();
        await fetchStats();
    };

    // Reconcile pending overrides after tareas list updates: match by title and optional date.
    useEffect(() => {
        if (!pendingCategoryOverrides || pendingCategoryOverrides.length === 0) return;
        if (!safeTareas || safeTareas.length === 0) return;
        let changed = false;
        const remaining = [];
        const newOverrides = { ...categoryOverrides };
        for (const p of pendingCategoryOverrides) {
            const match = safeTareas.find(t => {
                if (!t) return false;
                if (!t.titulo || !p.titulo) return false;
                const sameTitle = (t.titulo || '').trim() === (p.titulo || '').trim();
                if (!sameTitle) return false;
                if (p.fecha_vencimiento && t.fecha_vencimiento) return (t.fecha_vencimiento === p.fecha_vencimiento);
                return true;
            });
            if (match && match.id_tarea) {
                newOverrides[match.id_tarea] = p.categoria;
                changed = true;
            } else {
                remaining.push(p);
            }
        }
        if (changed) setCategoryOverrides(newOverrides);
        if (remaining.length !== pendingCategoryOverrides.length) setPendingCategoryOverrides(remaining);
    }, [tareas, pendingCategoryOverrides]);

    function startEdit(t) {
        setEditingTask(t);
        setShowNewTaskModal(true);
    }

    async function handleDelete(id) {
        if (!window.confirm('¿Eliminar tarea?')) return;
        try {
            await api.delete(`${cfg.paths.tareas}/${id}`);
            await fetchAll();
            await fetchStats();
        } catch (e) {
            console.error(e);
            setError('Error eliminando: ' + (e.response?.data?.message || e.response?.data?.error || e.message));
        }
    }

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleApplyFilters = () => {
        fetchAll();
    };

    const handleClearFilters = () => {
        setFilters({ id_sala: '', estado: '', prioridad: '' });
        fetchAll();
    };

    const safeStats = stats || {};
    const monthlyData = Array.isArray(safeStats.monthly) ? safeStats.monthly : [];
    const recientesData = Array.isArray(safeStats.recientes) ? safeStats.recientes : [];
    const porPrioridad = safeStats.por_prioridad || { alta: 0, media: 0, baja: 0 };
    const safeTareas = Array.isArray(tareas) ? tareas : [];

    // Si el backend no devuelve 'por_prioridad', calcularlo localmente a partir de las tareas
    const porPrioridadFromTasks = safeTareas.reduce((acc, t) => {
        const p = (t.prioridad || 'baja').toLowerCase();
        if (p === 'alta') acc.alta += 1;
        else if (p === 'media') acc.media += 1;
        else acc.baja += 1;
        return acc;
    }, { alta: 0, media: 0, baja: 0 });

    const porPrioridadFinal = ((porPrioridad && (porPrioridad.alta || porPrioridad.media || porPrioridad.baja)) ? porPrioridad : porPrioridadFromTasks);

    const taskColors = {};
    safeTareas.forEach(t => { taskColors[t.id_tarea] = colorForId(t.id_tarea); });

    const estadoOrder = ['Pendiente', 'EnProgreso', 'EnEspera', 'Completado'];
    const prioridadKeys = ['alta', 'media', 'baja'];
    const grouped = {};
    estadoOrder.forEach(e => { grouped[e] = { estado: e, alta: 0, media: 0, baja: 0 }; });
    safeTareas.forEach(t => {
        const e = t.estado || 'Pendiente';
        const p = (t.prioridad || 'baja').toLowerCase();
        if (!grouped[e]) grouped[e] = { estado: e, alta: 0, media: 0, baja: 0 };
        if (prioridadKeys.includes(p)) grouped[e][p] = (grouped[e][p] || 0) + 1;
    });
    const groupedData = Object.values(grouped);

    const priorityRank = { alta: 0, media: 1, baja: 2 };
    const estadoRank = { Pendiente: 0, EnProgreso: 1, EnEspera: 2, Completado: 3 };
    const taskBars = safeTareas.slice().sort((a, b) => {
        const ea = estadoRank[a.estado] ?? 99; const eb = estadoRank[b.estado] ?? 99;
        if (ea !== eb) return ea - eb;
        const pa = priorityRank[(a.prioridad || 'baja').toLowerCase()] ?? 9; const pb = priorityRank[(b.prioridad || 'baja').toLowerCase()] ?? 9;
        if (pa !== pb) return pa - pb;
        return (a.titulo || '').localeCompare(b.titulo || '');
    }).map(t => ({ id: t.id_tarea, titulo: t.titulo || ('#' + t.id_tarea), count: 1, color: taskColors[t.id_tarea] }));

    // Calcular estadísticas locales
    const totalTareas = safeTareas.length;
    const completadas = safeTareas.filter(t => t.estado === 'Completado').length;
    const paraHoy = safeTareas.filter(t => {
        if (!t.fecha_vencimiento) return false;
        const hoy = new Date().toISOString().split('T')[0];
        return t.fecha_vencimiento === hoy;
    }).length;
    const efectividad = totalTareas > 0 ? Math.round((completadas / totalTareas) * 100) : 0;

    function formatDateIsoToDisplay(dateStr) {
        if (!dateStr) return '';
        try {
            const timeZone = 'America/Bogota';
            let d;
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                // Interpret YYYY-MM-DD as date in Colombia: create a UTC midday to avoid timezone shifts
                const [y, m, day] = dateStr.split('-').map(Number);
                d = new Date(Date.UTC(y, m - 1, day, 12, 0, 0));
            } else {
                d = new Date(dateStr);
            }
            if (isNaN(d)) return (dateStr || '').slice(0, 16);

            const fmt = new Intl.DateTimeFormat('es-CO', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
            const parts = fmt.formatToParts(d).reduce((acc, p) => (acc[p.type] = p.value, acc), {});
            const dd = parts.day || '';
            const mm = parts.month || '';
            const yyyy = parts.year || '';
            const hh = parts.hour || '00';
            const min = parts.minute || '00';

            // Compare with 'today' in Bogota
            const nowParts = new Intl.DateTimeFormat('es-CO', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()).reduce((acc, p) => (acc[p.type] = p.value, acc), {});
            const isToday = nowParts.year === yyyy && nowParts.month === mm && nowParts.day === dd;
            if (isToday) return `Hoy ${hh}:${min}`;
            return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
        } catch (e) { return (dateStr || '').slice(0, 16); }
    }

    function getCreatedDateDisplay(t) {
        if (!t) return '';
        const candidates = [t.created_at, t.createdAt, t.fecha_creacion, t.fecha_creado, t.creado_en, t.inserted_at, t.created];
        for (const c of candidates) if (c) return formatDateIsoToDisplay(c);
        return '';
    }

    // Filtrar tareas según el tab activo
    const tareasFiltradas = activeTab === 'Todas' 
        ? safeTareas 
        : safeTareas.filter(t => {
            if (activeTab === 'Pendientes') return t.estado === 'Pendiente';
            if (activeTab === 'Completadas') return t.estado === 'Completado';
            if (activeTab === 'Hoy') {
                const hoy = new Date().toISOString().split('T')[0];
                return t.fecha_vencimiento === hoy;
            }
            return true;
        });

    const pendientesCount = safeTareas.filter(t => t.estado === 'Pendiente').length;
    const completadasCount = safeTareas.filter(t => t.estado === 'Completado').length;

    // Agrupar tareas por categoría
    // Helper para extraer nombre de categoría de distintos formatos que el backend pueda devolver
    function getCategoriaFromTask(t) {
        if (!t) return 'Sin categoría';
        // Posibles formas: string directo, objeto { nombre } o { name }, o campos alternativos
        if (typeof t.categoria === 'string' && t.categoria.trim() !== '') return t.categoria;
        if (t.categoria && typeof t.categoria === 'object') {
            return t.categoria.nombre || t.categoria.name || t.categoria.label || 'Sin categoría';
        }
        if (typeof t.category === 'string' && t.category.trim() !== '') return t.category;
        if (t.category && typeof t.category === 'object') {
            return t.category.nombre || t.category.name || t.category.label || 'Sin categoría';
        }
        if (t.categoria_nombre) return t.categoria_nombre;
        if (t.categoriaName) return t.categoriaName;
        if (t.categoria_id && typeof t.categoria_id === 'number') return `#${t.categoria_id}`;
        if (t.categoriaId && typeof t.categoriaId === 'number') return `#${t.categoriaId}`;
        return 'Sin categoría';
    }

    const categorias = {};
    safeTareas.forEach(t => {
        const displayedCat = categoryOverrides[t.id_tarea] || getCategoriaFromTask(t) || 'Sin categoría';
        if (!categorias[displayedCat]) categorias[displayedCat] = 0;
        categorias[displayedCat]++;
    });
    // Convertir a array y ordenar por cantidad descendente para presentación
    const categoriasArray = Object.entries(categorias).sort((a, b) => b[1] - a[1]);

    return (
        <div className="min-h-screen p-4 md:p-8 dashboard-container" data-theme={theme}>
            <div className="max-w-[1400px] mx-auto space-y-5">
            {/* Header */}
            <div className="dashboard-header">
                <div className="header-content">
                    <h1 className="dashboard-title">Gestión de Tareas</h1>
                    <p className="dashboard-subtitle">Organiza y completa tus actividades de manera eficiente</p>
                </div>
                <Tooltip label="Crear nueva tarea" placement="bottom">
                  <button className="btn-nueva-tarea" onClick={() => { setEditingTask(null); setShowNewTaskModal(true); }}>
                      + Nueva Tarea
                  </button>
                </Tooltip>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card stat-card-purple">
                    <div className="stat-icon">📋</div>
                    <div className="stat-value">{totalTareas}</div>
                    <div className="stat-label">Total de tareas</div>
                </div>

                <div className="stat-card stat-card-green">
                    <div className="stat-icon">💬</div>
                    <div className="stat-value">{completadasCount}</div>
                    <div className="stat-label">Completadas</div>
                </div>

                <div className="stat-card stat-card-yellow">
                    <div className="stat-icon">⏱️</div>
                    <div className="stat-value">{paraHoy}</div>
                    <div className="stat-label">Para hoy</div>
                </div>

                <div className="stat-card stat-card-pink">
                    <div className="stat-icon">🏆</div>
                    <div className="stat-value">{efectividad}%</div>
                    <div className="stat-label">Efectividad</div>
                </div>
            </div>

            {/* Main Content with Sidebar */}
            <div className="dashboard-main-layout">
                {/* Left Side - Tasks */}
                <div className="tasks-section">
                    <div className="tabs-container">
                        <button 
                            className={`tab ${viewMode === 'tareas' ? 'tab-active' : ''}`}
                            onClick={() => setViewMode('tareas')}
                        >
                            Mis Tareas
                        </button>
                        <button 
                            className={`tab ${viewMode === 'estadisticas' ? 'tab-active' : ''}`}
                            onClick={() => setViewMode('estadisticas')}
                        >
                            Estadísticas
                        </button>
                    </div>

                    {viewMode === 'tareas' ? (
                        <>
                            {/* Bulk actions when multiple selected */}
                            {selectedTaskIds.length >= 2 && (
                                <div className="bulk-actions">
                                    <button className="btn bulk-delete" onClick={async () => {
                                        if (!window.confirm(`Eliminar ${selectedTaskIds.length} tareas seleccionadas?`)) return;
                                        try {
                                            // delete all selected tasks
                                            await Promise.all(selectedTaskIds.map(id => api.delete(`${cfg.paths.tareas}/${id}`)));
                                            setSelectedTaskIds([]);
                                            await fetchAll();
                                            await fetchStats();
                                        } catch (err) {
                                            console.error(err);
                                            setError('Error eliminando tareas seleccionadas');
                                        }
                                    }}>Eliminar {selectedTaskIds.length} tareas</button>
                                </div>
                            )}
                            <div className="filter-tabs">
                                <button 
                                    className={`filter-tab ${activeTab === 'Todas' ? 'filter-active' : ''}`}
                                    onClick={() => setActiveTab('Todas')}
                                >
                                    Todas ({totalTareas})
                                </button>
                                <button 
                                    className={`filter-tab ${activeTab === 'Pendientes' ? 'filter-active' : ''}`}
                                    onClick={() => setActiveTab('Pendientes')}
                                >
                                    Pendientes ({pendientesCount})
                                </button>
                                <button 
                                    className={`filter-tab ${activeTab === 'Completadas' ? 'filter-active' : ''}`}
                                    onClick={() => setActiveTab('Completadas')}
                                >
                                    Completadas ({completadasCount})
                                </button>

                            </div>

                            {loading ? (
                                <div className="loading">Cargando tareas...</div>
                            ) : (
                                <div className="tasks-list">
                                                                        {tareasFiltradas.map(t => {
                                                                                const isSelected = selectedTaskIds.includes(t.id_tarea);
                                                                                return (
                                                                                <Tooltip key={t.id_tarea} label={`${t.titulo || 'Tarea'} · ${t.fecha_vencimiento || 'Sin fecha'}`} placement="top">
                                                                                    <div 
                                                                                        className={`task-item ${isSelected ? 'selected' : ''}`}
                                                                                    >
                                            <div className="task-selector" onClick={(e) => { e.stopPropagation();
                                                setSelectedTaskIds(prev => prev.includes(t.id_tarea) ? prev.filter(id => id !== t.id_tarea) : [...prev, t.id_tarea]);
                                            }}>
                                                <div className={`selector-circle ${isSelected ? 'selected' : ''}`} aria-hidden>
                                                    {isSelected ? '➤' : ''}
                                                </div>
                                            </div>
                                            
                                            <div className="task-content">
                                                <h3 className={`task-title ${isSelected ? 'task-title-completed' : ''}`}>
                                                    {t.titulo}
                                                </h3>
                                                {t.descripcion && (
                                                    <p className="task-description">{t.descripcion}</p>
                                                )}
                                                <div className="task-tags">
                                                    <span className={`tag tag-priority-${(t.prioridad || 'baja').toLowerCase()}`}>
                                                        {t.prioridad || 'Baja'}
                                                    </span>
                                                    <span className="tag tag-category">
                                                        {getCategoriaFromTask(t)}
                                                    </span>
                                                    {t.tiempo_estimado && (
                                                        <span className="tag-info">⏱️ {t.tiempo_estimado}min</span>
                                                    )}
                                                    {t.fecha_vencimiento && (
                                                        <span className="tag-info">📅 {t.fecha_vencimiento}</span>
                                                    )}
                                                </div>
                                                {/* Fecha de creación mostrada debajo de las tags */}
                                                <div className="task-created" style={{marginTop:6,fontSize:12,color:'#9ca3af'}}>
                                                                    {getCreatedDateDisplay(t) ? `Creada: ${getCreatedDateDisplay(t)}` : ''}
                                                                    {/* Mostrar override de categoría debajo si existe (ayuda a debug) */}
                                                                    {categoryOverrides[t.id_tarea] ? ` · Categoría (local): ${categoryOverrides[t.id_tarea]}` : ''}
                                                </div>
                                            </div>

                                            <div className="task-actions">
                                                <Tooltip label="Editar tarea" placement="left">
                                                  <button 
                                                      className="btn-icon btn-edit" 
                                                      onClick={(e) => { e.stopPropagation(); startEdit(t); }}
                                                      title="Editar"
                                                  >
                                                      ✎
                                                  </button>
                                                </Tooltip>
                                                <Tooltip label="Eliminar tarea" placement="left">
                                                  <button 
                                                      className="btn-icon btn-delete" 
                                                      onClick={(e) => { e.stopPropagation(); handleDelete(t.id_tarea); }}
                                                      title="Eliminar"
                                                  >
                                                      🗑
                                                  </button>
                                                </Tooltip>
                                            </div>
                                            </div>
                                            </Tooltip>
                                        )
                                })}
                                </div>
                            )}
                        </>
                    ) : (
                        /* Vista de Estadísticas Completa */
                        <div className="estadisticas-full-view">
                            <div className="stats-summary-cards">
                                <div className="summary-card summary-efectividad">
                                    <div className="summary-icon">🏆</div>
                                    <div className="summary-value">{efectividad}%</div>
                                    <div className="summary-label">Tasa de Finalización</div>
                                </div>
                                <div className="summary-card summary-completadas">
                                    <div className="summary-icon">✓</div>
                                    <div className="summary-value">{completadasCount}</div>
                                    <div className="summary-label">Tareas completadas</div>
                                </div>
                                <div className="summary-card summary-pendientes">
                                    <div className="summary-icon">⏱️</div>
                                    <div className="summary-value">{pendientesCount}</div>
                                    <div className="summary-label">Tareas pendientes</div>
                                </div>
                            </div>

                            <div className="charts-grid">
                                <div className="chart-card">
                                    <h4>Por Categoría</h4>
                                    <div className="category-list">
                                        {categoriasArray.map(([cat, count]) => {
                                            const pct = totalTareas > 0 ? Math.round((count / totalTareas) * 100) : 0;
                                            return (
                                                <div key={cat} className="category-item">
                                                    <span className="category-name">{cat}</span>
                                                    <div className="category-bar-container" aria-hidden>
                                                        <div 
                                                            className="category-bar" 
                                                            style={{ width: `${pct}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="category-count">{count}/{totalTareas}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="chart-card">
                                    <h4>Por Prioridad</h4>
                                    <div className="priority-list">
                                        <div className="priority-item">
                                            <span className="priority-name">Prioridad Alta</span>
                                            <div className="priority-bar-container">
                                                <div 
                                                    className="priority-bar priority-bar-alta" 
                                                    style={{ width: `${totalTareas > 0 ? (porPrioridadFinal.alta / totalTareas) * 100 : 0}%` }}
                                                ></div>
                                            </div>
                                            <span className="priority-count">{porPrioridadFinal.alta}/{totalTareas}</span>
                                        </div>
                                        <div className="priority-item">
                                            <span className="priority-name">Prioridad Media</span>
                                            <div className="priority-bar-container">
                                                <div 
                                                    className="priority-bar priority-bar-media" 
                                                    style={{ width: `${totalTareas > 0 ? (porPrioridadFinal.media / totalTareas) * 100 : 0}%` }}
                                                ></div>
                                            </div>
                                            <span className="priority-count">{porPrioridadFinal.media}/{totalTareas}</span>
                                        </div>
                                        <div className="priority-item">
                                            <span className="priority-name">Prioridad Baja</span>
                                            <div className="priority-bar-container">
                                                <div 
                                                    className="priority-bar priority-bar-baja" 
                                                    style={{ width: `${totalTareas > 0 ? (porPrioridadFinal.baja / totalTareas) * 100 : 0}%` }}
                                                ></div>
                                            </div>
                                            <span className="priority-count">{porPrioridadFinal.baja}/{totalTareas}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {error && <div className="error-message">{error}</div>}
                </div>

                {/* Right Sidebar - Stats (solo visible en modo tareas) */}
                {viewMode === 'tareas' && (
                    <div className="stats-sidebar">

                    </div>
                )}
            </div>

            {/* Modal de nueva tarea */}
            <TaskModal 
                open={showNewTaskModal} 
                onClose={() => {
                    setShowNewTaskModal(false);
                    setEditingTask(null);
                }} 
                onCreated={handleNewTaskCreated}
                initialTask={editingTask}
                editingId={editingTask?.id_tarea}
            />
            </div>
        </div>
    );
}