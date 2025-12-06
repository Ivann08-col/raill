//codigo 1 
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, Clock, Calendar, Zap, Star, Trophy, Play, Droplet } from 'lucide-react';
import cfg from '../services/config';
import api from '../services/api';
import { getUsuario, logout, getToken, saveUsuario, getDisplayName } from '../services/auth';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, LineChart, Line, AreaChart, Area, CartesianGrid, Legend } from 'recharts';
import '../pages/styles/HomePageLogueado.css';
import Tooltip from '../components/Tooltip';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

function colorForId(id) {
    const s = id?.toString() || '';
    let hash = 0;
    for (let i = 0; i < s.length; i++) hash = (hash << 5) - hash + s.charCodeAt(i);
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue} 70% 50%)`;

}

export default function HomePageLogueado() {
    // Mantener la lógica y estados existentes del HomePage original
    const usuario = getUsuario();
    const navigate = useNavigate();
    const [tareas, setTareas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        titulo: '', descripcion: '', fecha_vencimiento: '', prioridad: 'baja', comentario: '', sala_id: ''
    });
    const [editingId, setEditingId] = useState(null);
    const [stats, setStats] = useState(null);
    const safeStats = stats || {};
    const [moodHistory, setMoodHistory] = useState([]);
    const [filters, setFilters] = useState({ estado: '', prioridad: '' });
    const [showForm, setShowForm] = useState(false);
    const [habitsModalOpen, setHabitsModalOpen] = useState(false);
    const [habitForm, setHabitForm] = useState({ madrugar: '06:00', ejercicio_min: 30, lectura_paginas: 20, agua_vasos: 4 });
    const [savingHabits, setSavingHabits] = useState(false);
    const [habitSaveError, setHabitSaveError] = useState('');
    const [habitSaveSuccess, setHabitSaveSuccess] = useState('');
    const [habitDelta, setHabitDelta] = useState({ agua: 0, meditacion: 0, lectura: 0, ejercicio: 0 });

    // Estados adicionales que venían del HomePage original
    const [proximasTareas, setProximasTareas] = useState([]);
    const [ultimasSesiones, setUltimasSesiones] = useState([]);
    const [weeklyChartData, setWeeklyChartData] = useState([]);

    // ----------------- Helpers originales del HomePage que el usuario pidió mantener -----------------
    const getTecnicaIcon = (tecnica) => {
        const lower = tecnica?.toLowerCase() || '';
        if (lower.includes('meditacion') || lower.includes('meditación')) return <Heart size={18} />;
        if (lower.includes('pomodoro')) return <Clock size={18} />;
        return <Zap size={18} />;
    };

    const getTecnicaColor = (tecnica) => {
        const lower = tecnica?.toLowerCase() || '';
        if (lower.includes('meditacion') || lower.includes('meditación')) return '#f3e8ff';
        if (lower.includes('pomodoro')) return 'var(--tech-pomodoro-bg)';
        return 'var(--tech-default-bg)';
    };

    const getTecnicaTextColor = (tecnica) => {
        const lower = tecnica?.toLowerCase() || '';
        if (lower.includes('meditacion') || lower.includes('meditación')) return '#7e22ce';
        if (lower.includes('pomodoro')) return 'var(--tech-pomodoro-text)';
        return 'var(--tech-default-text)';
    };

    const getPrioridadColor = (prioridad) => {
        switch (prioridad) {
            case 'alta': return 'border-l-red-500';
            case 'media': return 'border-l-amber-500';
            default: return 'border-l-green-500';
        }
    };

    const getPrioridadBg = (prioridad) => {
        switch (prioridad) {
            case 'alta': return 'bg-red-50';
            case 'media': return 'bg-amber-50';
            default: return 'bg-green-50';
        }
    };

    const getPrioridadBadgeBg = (prioridad) => {
        switch (prioridad) {
            case 'alta': return 'bg-red-100 text-red-800';
            case 'media': return 'bg-amber-100 text-amber-800';
            default: return 'bg-green-100 text-green-800';
        }
    };

    function formatDateIsoToDisplay(dateStr) {
        if (!dateStr) return '';
        try {
            const timeZone = 'America/Bogota';
            let d;
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                const [y, m, day] = dateStr.split('-').map(Number);
                d = new Date(Date.UTC(y, m - 1, day, 12, 0, 0));
            } else {
                d = new Date(dateStr);
            }
            if (isNaN(d)) return dateStr.slice(0,10);

            const fmt = new Intl.DateTimeFormat('es-CO', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
            const parts = fmt.formatToParts(d).reduce((acc, p) => (acc[p.type] = p.value, acc), {});
            const dd = parts.day || '';
            const mm = parts.month || '';
            const yyyy = parts.year || '';
            const hh = parts.hour || '00';
            const min = parts.minute || '00';

            const nowParts = new Intl.DateTimeFormat('es-CO', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()).reduce((acc, p) => (acc[p.type] = p.value, acc), {});
            const isToday = nowParts.year === yyyy && nowParts.month === mm && nowParts.day === dd;
            if (isToday) return `Hoy ${hh}:${min}`;
            return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
        } catch (e) { return dateStr.slice(0,10); }
    }

    // Devuelve la fecha de creación de una tarea, probando varias claves posibles
    function getCreatedDateDisplay(t) {
        if (!t) return '';
        const candidates = [
            t.created_at, t.createdAt, t.fecha_creacion, t.fecha_creado, t.creado_en, t.inserted_at, t.created
        ];
        for (const c of candidates) {
            if (c) {
                const v = formatDateIsoToDisplay(c);
                if (v) return v;
            }
        }
        return '';
    }

    // ----------------- Fetchers (combinando lo que venía en ambos archivos) -----------------
    useEffect(() => {
        fetchAll();
        if (getToken()) fetchStats();
        if (getToken()) fetchMoodHistory();
        if (getToken()) fetchSessionsAndProgreso();

        let intervalId = null;
        if (getToken()) {
            intervalId = setInterval(() => {
                fetchStats();
            }, 60000);
        }
        return () => { if (intervalId) clearInterval(intervalId); };
    }, []);

    async function fetchMoodHistory(days = 14) {
        try {
            const res = await api.get(cfg.paths.estadoAnimoHistory + `?days=${days}`);
            const hist = res.data?.history || [];
            const chart = hist.map(h => ({ date: h.date.slice(5), avg: h.avg }));
            setMoodHistory(chart);
        } catch (e) {
            console.error('Error cargando historial de estado de ánimo', e);
            setMoodHistory([]);
            setError(prev => prev || 'No se pudo cargar historial de estado de ánimo');
        }
    }

    async function fetchAll() {
        setLoading(true);
        setError('');
        try {
            const q = new URLSearchParams(filters).toString();
            const path = cfg.paths.tareas + (q ? ('?' + q) : '');
            const res = await api.get(path);
            setTareas(Array.isArray(res.data) ? res.data : res.data.results || []);
            // también actualizar próximas tareas si la API regresa algo limitado
            if (Array.isArray(res.data)) setProximasTareas(res.data.slice(0,5));
        } catch (e) {
            console.error(e);
            setError('Error cargando tareas: ' + (e.response?.data?.message || e.response?.data?.error || e.message));
        }
        setLoading(false);
    }

    async function fetchStats() {
        try {
            const res = await api.get(cfg.paths.estadisticas);
            // Merge server stats with any saved user preferencias (habits) stored in /auth/me
            let merged = res.data || {};
            try {
                const localUser = getUsuario();
                const userHab = localUser?.preferencias?.habitos;
                if (userHab) {
                    // Keep server 'habits' but expose a 'habitos' object with user's configured targets
                    merged = { ...(merged || {}), habitos: { ...(merged.habitos || {}), ...(userHab || {}) } };
                }
            } catch (e) { /* ignore */ }
            setStats(merged);
            // limpiar deltas locales una vez que tenemos datos autoritativos del servidor
            setHabitDelta({ agua: 0, meditacion: 0, lectura: 0, ejercicio: 0 });
        } catch (e) {
            if (e?.response?.status === 401) return;
            console.error(e);
        }
    }

    async function fetchSessionsAndProgreso() {
        try {
            const [sesionesRes, progresoRes] = await Promise.all([
                api.get(cfg.paths.sesiones + '?limit=5'),
                api.get(cfg.paths.progresoSemana)
            ]);
            setUltimasSesiones(Array.isArray(sesionesRes.data) ? sesionesRes.data : []);
            // mapear progreso semana a weeklyChartData si aplica
            const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            const data = diasSemana.map((name, index) => {
                const diaData = progresoRes.data?.dias?.[index];
                return { name, sesiones: diaData ? diaData.sesiones_realizadas || 0 : 0 };
            });
            setWeeklyChartData(data);
        } catch (e) {
            console.warn('No se pudieron cargar sesiones/progreso', e);
        }
    }

    async function handleCreateOrUpdate(e) {
        e.preventDefault();
        setError('');
        if (!form.fecha_vencimiento) { setError('La fecha de vencimiento es requerida'); return; }
        try {
            const payload = {
                titulo: form.titulo.trim(),
                descripcion: form.descripcion?.trim() || '',
                fecha_vencimiento: form.fecha_vencimiento,
                prioridad: form.prioridad,
                comentario: form.comentario?.trim() || ''
            };
            if (form.sala_id && form.sala_id.trim() !== '') payload.sala_id = form.sala_id.trim();
            if (editingId) {
                payload.estado = form.estado;
                await api.put(`${cfg.paths.tareas}/${editingId}`, payload);
            } else {
                await api.post(cfg.paths.tareas, payload);
            }
            setForm({ titulo: '', descripcion: '', fecha_vencimiento: '', prioridad: 'baja', comentario: '', sala_id: '' });
            setEditingId(null);
            setShowForm(false);
            await fetchAll();
            await fetchStats();
        } catch (e) {
            console.error('Error completo:', e);
            const errorMsg = e.response?.data?.error || e.response?.data?.message || e.message || 'Error desconocido al guardar la tarea';
            setError('Error guardando tarea: ' + errorMsg);
        }
    }

    function startEdit(t) {
        setEditingId(t.id_tarea);
        setForm({
            titulo: t.titulo || '',
            descripcion: t.descripcion || '',
            fecha_vencimiento: t.fecha_vencimiento || '',
            prioridad: t.prioridad || 'baja',
            estado: t.estado || 'Pendiente',
            comentario: t.comentario || '',
            sala_id: t.sala_id || ''
        });
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    async function handleDelete(id) {
        if (!window.confirm('¿Eliminar tarea?')) return;
        try {
            await api.delete(`${cfg.paths.tareas}/${id}`);
            await fetchAll();
            await fetchStats();
        } catch (e) { console.error(e); setError('Error eliminando: ' + (e.response?.data?.message || e.response?.data?.error || e.message)); }
    }

    // ----------------- Helpers de visualización del snippet (estadísticas) -----------------
    const monthlyData = Array.isArray(safeStats.monthly) ? safeStats.monthly : [];
    const recientesData = Array.isArray(safeStats.recientes) ? safeStats.recientes : [];
    const porPrioridad = safeStats.por_prioridad || { alta: 0, media: 0, baja: 0 };
    const safeTareas = Array.isArray(tareas) ? tareas : [];

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

    const sampleChart = [
        { name: 'lunes', conexion: 60, meditacion: 10, tareas: 6 },
        { name: 'martes', conexion: 75, meditacion: 8, tareas: 5 },
        { name: 'miércoles', conexion: 50, meditacion: 12, tareas: 8 },
        { name: 'jueves', conexion: 95, meditacion: 18, tareas: 12 },
        { name: 'viernes', conexion: 70, meditacion: 10, tareas: 9 },
        { name: 'sábado', conexion: 85, meditacion: 14, tareas: 7 },
        { name: 'domingo', conexion: 60, meditacion: 12, tareas: 6 }
    ];

    const chartData = (Array.isArray(monthlyData) && monthlyData.length > 0)
        ? (() => {
                const daysEs = ['lunes','martes','miércoles','jueves','viernes','sábado','domingo'];
                const byWeekday = daysEs.map((day, i) => {
                    let entry = monthlyData.find(m => {
                        const label = (m.label || m.dia || '').toString().toLowerCase();
                        if (label && label.includes(day)) return true;
                        const raw = m.date || m.fecha || m.label;
                        if (raw) {
                            const d = new Date(raw);
                            if (!isNaN(d)) {
                                const wk = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'][d.getDay()];
                                if (wk === day) return true;
                            }
                        }
                        return false;
                    });
                    if (!entry && monthlyData[i]) entry = monthlyData[i];
                    const conexion = entry ? (entry.conexion ?? entry.conexion_hoy ?? entry.pomodoro_minutos_hoy ?? entry.pomodoro_minutos ?? entry.value ?? 0) : 0;
                    const meditacion = entry ? (entry.meditacion ?? entry.meditacion_minutos ?? entry.value ?? 0) : 0;
                    const tareas = entry ? (entry.tareas ?? entry.tareas_completadas ?? 0) : 0;
                    return { name: day, conexion, meditacion, tareas };
                });
                return byWeekday;
            })()
        : sampleChart;

    const moodSample = [
        { name: 'Excelente', value: 35, color: '#10B981' },
        { name: 'Bien', value: 40, color: '#3B82F6' },
        { name: 'Regular', value: 20, color: '#FBBF24' },
        { name: 'Bajo', value: 5, color: '#EF4444' }
    ];

    let moodData = moodSample.map(s => ({ name: s.name, count: s.value, color: s.color, pct: s.value }));
    if (safeStats && safeStats.estado_animo) {
        const rawItems = [];
        if (Array.isArray(safeStats.estado_animo) && safeStats.estado_animo.length > 0) {
            safeStats.estado_animo.forEach((e, i) => {
                const count = Number(e.value ?? e.count ?? e.count_total ?? 0) || 0;
                rawItems.push({ name: e.label || e.name || `L${i+1}`, count, color: e.color || COLORS[i % COLORS.length] });
            });
        } else if (typeof safeStats.estado_animo === 'object') {
            const keys = Object.keys(safeStats.estado_animo);
            keys.forEach((k, i) => { const count = Number(safeStats.estado_animo[k] ?? 0) || 0; rawItems.push({ name: k, count, color: COLORS[i % COLORS.length] }); });
        }
        if (rawItems.length > 0) {
            const totalCount = rawItems.reduce((s, r) => s + r.count, 0) || 0;
            if (totalCount === 0) {
                moodData = moodSample.map(s => ({ name: s.name, value: s.value, pct: s.value, count: s.value, color: s.color }));
            } else {
                let withPct = rawItems.map(r => ({ ...r, pct: Math.round((r.count / totalCount) * 100) }));
                const pctSum = withPct.reduce((s, r) => s + r.pct, 0);
                if (pctSum !== 100) {
                    const idxMax = withPct.reduce((imax, cur, idx, arr) => (cur.count > arr[imax].count ? idx : imax), 0);
                    withPct[idxMax].pct += (100 - pctSum);
                }
                moodData = withPct.map(r => ({ name: r.name, value: r.pct, pct: r.pct, count: r.count, color: r.color }));
            }
        }
    }

    function CustomPieTooltip({ active, payload }) {
        if (!active || !payload || !payload.length) return null;
        const p = payload[0].payload;
        return (
        <div
        style={{
            background: 'var(--primary-purple-vibrant)',
            border: '1px solid var(--border-default)',
            padding: 8,
            borderRadius: 6,
            boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
        }}
        >
        <div style={{ fontWeight: 700, marginBottom: 4 }}>{p.name}</div>
        <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
            {p.pct}% • {p.count} registro{p.count !== 1 ? 's' : ''}
        </div>
        </div>
        );
    }

    const preferredOrder = ['Excelente', 'Bien', 'Regular', 'Bajo'];
    const orderedMoodData = [];
    preferredOrder.forEach(name => { moodData.forEach(m => { if ((m.name || '').toString().toLowerCase() === name.toLowerCase()) orderedMoodData.push(m); }); });
    moodData.forEach(m => { if (!orderedMoodData.includes(m)) orderedMoodData.push(m); });
    const dominantMood = orderedMoodData.length ? orderedMoodData[0] : (moodData.length ? moodData[0] : null);

    // StatCard, formatters, habits helpers, saveHabits are kept from the snippet
    function formatMinutesToHuman(v) {
        if (v === undefined || v === null) return '0m';
        const n = Number(v);
        if (isNaN(n)) return String(v);
        const minutes = Math.floor(n);
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    }

    function formatTimeToHuman(t) {
        if (!t) return '';
        try {
            // expect 'HH:MM' (24h)
            const parts = ('' + t).split(':');
            if (parts.length < 2) return t;
            let hh = Number(parts[0]); const mm = parts[1];
            const ampm = hh >= 12 ? 'p.m.' : 'a.m.';
            hh = hh % 12 || 12;
            return `${String(hh).padStart(2,'0')}:${mm} ${ampm}`;
        } catch (e) { return t; }
    }

    function computePercentFromMinutes(value, goalMinutes) {
        const n = Number(value);
        if (!n || !goalMinutes) return 0;
        return Math.min(100, Math.round((n / goalMinutes) * 100));
    }

    function computePercentSimple(value, goal) {
        const n = Number(value);
        if (!n || !goal) return 0;
        return Math.min(100, Math.round((n / goal) * 100));
    }

    function computePercentTasks(statsObj) {
        if (!statsObj) return 0;
        const completed = Number(statsObj.tareas_completadas_dia) || 0;
        const total = Number(statsObj.tareas_planificadas_dia ?? statsObj.tareas_total_dia ?? statsObj.tareas_objetivo) || 0;
        if (total === 0) return completed > 0 ? 80 : 0;
        return Math.min(100, Math.round((completed / total) * 100));
    }

    function formatTasksProgress(v) {
        if (!v) return '0/0';
        if (typeof v === 'object') {
            const c = Number(v.completed) || 0;
            const t = Number(v.total) || 0;
            if (t > 0) return `${c}/${t}`;
            return `${c}`;
        }
        return String(v);
    }

    function StatCard({ icon, color, title, value, rawValue, formatter, percent }) {
        const pct = typeof percent === 'number' ? percent : 0;
        const display = formatter ? formatter(rawValue ?? value) : (value ?? '-');
        return (
            <div className="stat-card">
                <div className="stat-header">
                    <div className={`stat-icon ${color}`}>{icon}</div>
                    <span className="stat-badge">{pct > 0 ? `${pct}%` : ''}</span>
                </div>
                <p className="stat-value">{display}</p>
                <p className="stat-label">{title}</p>
                <div className="progress-bar"><div className={`progress-fill ${color}`} style={{width:`${pct}%`}}/></div>
            </div>
        );
    }

    function openHabitsModal() {
        const fromStats = (safeStats && (safeStats.habitos || safeStats.habits || safeStats.habits_config || safeStats.habitos_config)) || (getUsuario()?.preferencias?.habitos) || {};
        setHabitForm({
            madrugar: fromStats.madrugar_hora || fromStats.madrugar || habitForm.madrugar || '06:00',
            ejercicio_min: fromStats.ejercicio_minutos || fromStats.ejercicio_min || habitForm.ejercicio_min || 30,
            lectura_paginas: fromStats.lectura_paginas || fromStats.lectura || habitForm.lectura_paginas || 20,
            agua_vasos: fromStats.agua_vasos || fromStats.agua || habitForm.agua_vasos || 4
        });
        setHabitsModalOpen(true);
    }

    function closeHabitsModal() { setHabitsModalOpen(false); }

    async function savePreferences(preferencesPayload) {
        // helper to persist preferencias via available user endpoints
        if (!usuario || !usuario.id) { throw new Error('No hay usuario válido para guardar la configuración.'); }
        const possibleId = usuario?.id || usuario?.usuario_id || usuario?.id_usuario || usuario?.uuid || usuario?._id;
        if (!possibleId) throw new Error('No se encontró id de usuario en el cliente.');
        const userUrl = (typeof cfg.paths.usuarioById === 'function') ? cfg.paths.usuarioById(possibleId) : `/usuarios/${possibleId}`;
        let res;
        try {
            try { res = await api.put(userUrl, { preferencias: preferencesPayload }); }
            catch (errPut) {
                try { res = await api.patch(userUrl, { preferencias: preferencesPayload }); }
                catch (errPatch) {
                    const prefUrl = `/usuarios/${possibleId}/preferencias`;
                    res = await api.put(prefUrl, preferencesPayload);
                }
            }
        } catch (e) {
            throw e;
        }
        try { const me = await api.get(cfg.paths.me); if (me && me.data) { try { saveUsuario(me.data); } catch (e) { console.warn('No se pudo guardar usuario localmente', e); } } }
        catch (e) { console.debug('GET /auth/me falló:', e?.response?.status || e?.message); }
        return res;
    }

    async function saveHabits() {
        if (!usuario || !usuario.id) { setError('No hay usuario válido para guardar la configuración.'); return; }
        setSavingHabits(true); setError(''); setHabitSaveError(''); setHabitSaveSuccess('');
        try { 
            const payload = { preferencias: { habitos: {
                madrugar_hora: habitForm.madrugar,
                ejercicio_minutos: Number(habitForm.ejercicio_min) || 0,
                lectura_paginas: Number(habitForm.lectura_paginas) || 0,
                agua_vasos: Number(habitForm.agua_vasos) || 0
            } } };
            const possibleId = usuario?.id || usuario?.usuario_id || usuario?.id_usuario || usuario?.uuid || usuario?._id;
            if (!possibleId) throw new Error('No se encontró id de usuario en el cliente.');
            // persist preferences
            await savePreferences(payload.preferencias || payload);

            // Actualización optimista: actualizar el estado local de stats con los nuevos hábitos
            try {
                const existing = stats || {};
                const oldHab = existing.habitos || existing.habits || existing.habits_config || {};
                const newHab = { ...oldHab, ...(payload.preferencias?.habitos || {}) };
                setStats(prev => ({ ...(prev || {}), habitos: newHab }));
            } catch (e) { /* ignore optimistic merge errors */ }

            await fetchStats(); setHabitSaveSuccess('Guardado correctamente'); setSavingHabits(false);
            // cerrar modal inmediatamente al confirmar guardado
            setHabitsModalOpen(false); setHabitSaveSuccess('');
            return true;
        } catch (e) {
            console.error('Error guardando hábitos', e);
            const serverMsg = e.response?.data?.message || e.response?.data?.error || JSON.stringify(e.response?.data) || e.message || 'error';
            setError('Error guardando hábitos: ' + serverMsg); setHabitSaveError(serverMsg); setSavingHabits(false); return null;
        }
    }

    async function markHabitToday(type) {
        // type: 'agua' | 'meditacion' | 'lectura' | 'ejercicio'
        // assumptions: increments by sensible defaults (agua: +1 vaso, meditacion: +5min, lectura: +5p, ejercicio: +10min)
        const incMap = { agua: 1, meditacion: 5, lectura: 5, ejercicio: 10 };
        const fieldMap = { agua: 'agua_vasos_hoy', meditacion: 'meditacion_minutos_hoy', lectura: 'lectura_paginas_hoy', ejercicio: 'ejercicio_minutos_hoy' };
        const delta = incMap[type] || 1;
        const field = fieldMap[type];
        try {
            // increment local delta immediately so UI grows per click even if backend is slow/fails
            const deltaLocalKey = type === 'agua' ? 'agua' : type === 'meditacion' ? 'meditacion' : type === 'lectura' ? 'lectura' : 'ejercicio';
            setHabitDelta(prev => ({ ...prev, [deltaLocalKey]: (prev[deltaLocalKey] || 0) + delta }));

            const existingHab = (stats && (stats.habitos || stats.habits || stats.habits_config || stats.habitos_config)) || {};
            const current = Number(existingHab[field] || existingHab[type + '_hoy'] || 0);
            const objetivoKey = (type === 'agua') ? 'agua_vasos' : (type === 'lectura' ? 'lectura_paginas' : (type === 'ejercicio' ? 'ejercicio_minutos' : (type === 'meditacion' ? 'meditacion_minutos' : null)));
            const objetivo = Number(existingHab[objetivoKey] || existingHab[type + '_objetivo'] || 0);
            let nuevo = current + delta;

            // If objetivo is defined and we reached or exceeded it, show full bar then reset to 0
            if (objetivo > 0 && nuevo >= objetivo) {
                // show full bar optimistically
                setStats(prev => {
                    const prevHab = (prev && (prev.habitos || prev.habits || prev.habits_config || {})) || {};
                    const newHab = { ...prevHab, [field]: objetivo };
                    return { ...(prev || {}), habitos: newHab };
                });

                // persist the 'full' state briefly so server sees it (optional)
                try {
                    const prefsFull = { ...(getUsuario()?.preferencias || {}), habitos: { ...(getUsuario()?.preferencias?.habitos || {}), [field]: objetivo } };
                    await savePreferences(prefsFull);
                } catch (e) {
                    console.debug('No se pudo persistir estado full antes del reset', e?.message || e);
                }

                // wait a moment so user sees the 100% fill animation
                await new Promise(r => setTimeout(r, 700));

                // reset to 0 visually
                nuevo = 0;
                setStats(prev => {
                    const prevHab = (prev && (prev.habitos || prev.habits || prev.habits_config || {})) || {};
                    const newHab = { ...prevHab, [field]: nuevo };
                    return { ...(prev || {}), habitos: newHab };
                });

                // persist the reset so it survives reloads
                try {
                    const prefsReset = { ...(getUsuario()?.preferencias || {}), habitos: { ...(getUsuario()?.preferencias?.habitos || {}), [field]: nuevo } };
                    await savePreferences(prefsReset);
                } catch (e) { console.error('Error al persistir reinicio de hábito', e); }

                // refresh authoritative stats
                await fetchStats();
                return;
            }

            // normal optimistic update (didn't reach objective yet)
            setStats(prev => {
                const prevHab = (prev && (prev.habitos || prev.habits || prev.habits_config || {})) || {};
                const newHab = { ...prevHab, [field]: nuevo };
                return { ...(prev || {}), habitos: newHab };
            });

            // persist into preferencias so it survives reloads
            const prefsPayload = { ...(getUsuario()?.preferencias || {}), habitos: { ...(getUsuario()?.preferencias?.habitos || {}), [field]: nuevo } };
            await savePreferences(prefsPayload);
            // refresh authoritative stats
            await fetchStats();
        } catch (e) {
            console.error('Error marcando hábito hoy', e);
        }
    }

    // ----------------- UI del WellnessDashboard (contenido tal cual del snippet) -----------------
    // greeting / displayName
    function getGreeting() {
        try {
            // Use Colombia time for greeting
            const tz = 'America/Bogota';
            const parts = new Intl.DateTimeFormat('es-CO', { timeZone: tz, hour: '2-digit', hour12: false }).formatToParts(new Date()).reduce((acc, p) => (acc[p.type] = p.value, acc), {});
            const hour = Number(parts.hour || new Date().getHours());
            if (hour >= 6 && hour < 12) return '¡Buenos días';
            if (hour >= 12 && hour < 19) return '¡Buenas tardes';
            return '¡Buenas noches';
        } catch (e) { return '¡Hola'; }
    }
    const displayName = getDisplayName(usuario) || 'Usuario';
    const [greeting, setGreeting] = useState(getGreeting());

    // Recalcula el saludo cada minuto para que cambie dinámicamente si la página queda abierta
    useEffect(() => {
        const tick = () => setGreeting(getGreeting());
        const id = setInterval(tick, 60 * 1000);
        // también forzamos una comprobación inmediata por si se cargó justo en el cambio de hora
        const timeout = setTimeout(tick, 500);
        return () => { clearInterval(id); clearTimeout(timeout); };
    }, []);

    const streakActivities = (() => {
        if (!safeStats) return 0;
        let count = 0; const tryGet = (keys) => keys.some(k => { const v = Number(safeStats[k]); return !isNaN(v) && v >= 2; });
        if (tryGet(['racha_pomodoro', 'pomodoro_racha', 'pomodoro_days', 'pomodoro_consecutivos', 'pomodoro_dias'])) count++;
        if (tryGet(['racha_meditacion', 'meditacion_racha', 'meditacion_days', 'meditacion_consecutivos', 'meditacion_minutos_dias'])) count++;
        if (tryGet(['racha', 'practica_continua_dias', 'consecutivos'])) count++;
        return count;
    })();
    const showStreakBadge = streakActivities >= 2 || (Number(safeStats?.racha) >= 2 && streakActivities > 0);

    function isFocused(statsObj) {
        if (!statsObj) return false;
        const positive = (keys) => keys.some(k => { const v = statsObj[k]; return v !== undefined && v !== null && Number(v) > 0; });
        return positive(['meditacion_minutos', 'meditacion_minutos_hoy', 'pomodoro_minutos', 'pomodoro_hoy', 'conexion_hoy', 'tareas_completadas_dia', 'pomodoro_sessions_today']);
    }
    const focused = isFocused(safeStats);

    const [selectedMetric, setSelectedMetric] = useState('conexion');

    // Detect theme global attribute to apply same light/midnight behavior
    // Mantener estado y observar cambios para reaccionar en runtime
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

    return (
        <div className="min-h-screen p-4 md:p-8 dashboard-container" data-theme={theme}>
            <div className="max-w-[1400px] mx-auto space-y-5">
                <div className="header-card">
                    <div className="header-content">
                        <div className="header-left">
                            <h1 className="header-title">{greeting}, {displayName}!<span className="text-3xl"></span></h1>
                            <p className="header-subtitle">Tu bienestar mental es nuestra prioridad. Aquí tienes tu resumen del día.</p>
                            <div className="header-buttons">
                                
                                
                                <button onClick={() => navigate('/tareas')} className="btn-header">➕ {editingId ? 'Editar tarea' : 'Crear tarea'}</button>
                            </div>
                        </div>
                        <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
                            {showStreakBadge && (
                                <div className="streak-badge">
                                    <p className="streak-label">Racha</p>
                                    <p className="streak-value">🔥 <span>{safeStats?.racha ?? 0}</span></p>
                                </div>
                            )}
                            <div className="streak-badge" style={{minWidth: '180px', display: 'flex', gap: '0.75rem', alignItems: 'center'}}>
                                <div style={{textAlign:'left', width: '100%'}}>
                                    <p style={{fontSize:'0.80rem',opacity:0.95}}>Estado emocional</p>
                                    <div style={{textAlign: 'center', marginTop: 8}} aria-hidden="true">
                                        <span style={{fontSize: 40, lineHeight: 1}}>🧘‍♀️</span>
                                        <p style={{fontWeight:700}}>{focused ? 'Enfocado' : 'Desenfocado'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="stats-grid">
                    <StatCard icon={<Clock className="w-5 h-5" />} color="purple" title="Concentración hoy" value={safeStats?.conexion_hoy} rawValue={safeStats?.pomodoro_minutos_hoy ?? safeStats?.pomodoro_minutos ?? safeStats?.conexion_hoy_minutos ?? safeStats?.conexion_hoy} formatter={(v) => formatMinutesToHuman(v)} percent={computePercentFromMinutes(safeStats?.pomodoro_minutos_hoy ?? safeStats?.pomodoro_minutos ?? safeStats?.conexion_hoy_minutos ?? safeStats?.conexion_hoy, 180)} />
                    <StatCard icon={<Heart className="w-5 h-5" />} color="green" title="Meditación hoy" value={safeStats?.meditacion_minutos} rawValue={safeStats?.meditacion_minutos ?? safeStats?.meditacion_minutos_hoy} formatter={(v) => formatMinutesToHuman(v)} percent={computePercentSimple(safeStats?.meditacion_minutos ?? safeStats?.meditacion_minutos_hoy, 20)} />
                    <StatCard icon={<Calendar className="w-5 h-5" />} color="blue" title="Tareas completadas" value={(Array.isArray(safeTareas) ? safeTareas.filter(t => /complet/i.test((t.estado || ''))).length : 0) || Number(safeStats?.tareas_completadas_dia ?? 0)} rawValue={{ completed: (Array.isArray(safeTareas) ? safeTareas.filter(t => /complet/i.test((t.estado || ''))).length : 0) || Number(safeStats?.tareas_completadas_dia ?? 0), total: safeStats?.tareas_planificadas_dia ?? safeStats?.tareas_total_dia ?? safeStats?.tareas_objetivo ?? (Array.isArray(safeTareas) ? safeTareas.length : 0) }} formatter={(v) => `${Number(v?.completed ?? v ?? 0)} tareas`} percent={(() => { const comp = Number((Array.isArray(safeTareas) ? safeTareas.filter(t => /complet/i.test((t.estado || ''))).length : 0) || (Number(safeStats?.tareas_completadas_dia ?? 0))); const tot = Number((safeStats?.tareas_planificadas_dia ?? safeStats?.tareas_total_dia ?? safeStats?.tareas_objetivo ?? (Array.isArray(safeTareas) ? safeTareas.length : 0)) || 0); if (tot <= 0) return comp > 0 ? 80 : 0; return Math.min(100, Math.round((comp / tot) * 100)); })()} />
                    <StatCard icon={<Zap className="w-5 h-5" />} color="orange" title="Práctica continua (med · pomo)" value={safeStats?.practica_continua_dias ?? 0} rawValue={{ racha_meditacion: safeStats?.racha_meditacion ?? safeStats?.meditacion_racha ?? 0, racha_pomodoro: safeStats?.racha_pomodoro ?? safeStats?.pomodoro_racha ?? 0 }} formatter={(v) => `${Number(v?.racha_meditacion ?? 0)} med · ${Number(v?.racha_pomodoro ?? 0)} pomo`} percent={computePercentSimple(safeStats?.practica_continua_dias, 30)} />
                </div>

                <div className="charts-grid">
                    <div className="chart-card">
                        <div className="chart-header">
                            <h2 className="chart-title">Actividad Semanal</h2>
                            <div className="chart-filters">
                                <button className={`filter-btn ${selectedMetric === 'conexion' ? 'active' : ''}`} onClick={() => setSelectedMetric('conexion') }><span className="filter-dot purple"/>Conexión día</button>
                                <button className={`filter-btn ${selectedMetric === 'meditacion' ? 'active' : ''}`} onClick={() => setSelectedMetric('meditacion') }><span className="filter-dot pink"/>Meditación</button>
                                <button className={`filter-btn ${selectedMetric === 'tareas' ? 'active' : ''}`} onClick={() => setSelectedMetric('tareas') }><span className="filter-dot blue"/>Tareas</button>
                            </div>
                        </div>
                        <div className="area-chart">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorPurple" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#7C3AED" stopOpacity={0.9}/><stop offset="95%" stopColor="#7C3AED" stopOpacity={0.35}/></linearGradient>
                                        <linearGradient id="colorPink" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#EC4899" stopOpacity={0.85}/><stop offset="95%" stopColor="#EC4899" stopOpacity={0.28}/></linearGradient>
                                        <linearGradient id="colorBlue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3B82F6" stopOpacity={0.95}/><stop offset="95%" stopColor="#3B82F6" stopOpacity={0.32}/></linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF2FF" />
                                    <XAxis dataKey="name" tick={{ fill: '#6B7280' }} />
                                    <YAxis tick={{ fill: '#9CA3AF' }} />
                                    <RechartsTooltip />
                                    {selectedMetric === 'conexion' && (<Area type="monotone" dataKey="conexion" stroke="none" fill="url(#colorPurple)" fillOpacity={1} />)}
                                    {selectedMetric === 'meditacion' && (<Area type="monotone" dataKey="meditacion" stroke="none" fill="url(#colorPink)" fillOpacity={1} />)}
                                    {selectedMetric === 'tareas' && (<Area type="monotone" dataKey="tareas" stroke="none" fill="url(#colorBlue)" fillOpacity={1} />)}
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="chart-card">
                        <h2 className="chart-title">Estado de Ánimo</h2>
                        <div className="pie-chart-container" style={{flexDirection:'column',alignItems:'center', position: 'relative'}}>
                            <div style={{width: '100%', maxWidth: 280, height: 280, position: 'relative'}}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={moodData}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={85}
                                            outerRadius={135}
                                            paddingAngle={3}
                                            cornerRadius={0}
                                            startAngle={90}
                                            endAngle={450}
                                            stroke="white"
                                            strokeWidth={4}
                                        >
                                            {moodData.map((entry, index) => {
                                                const fill = entry.color || COLORS[index % COLORS.length];
                                                return <Cell key={`cell-${index}`} fill={fill} />;
                                            })}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                {/* Center content: emoji and dominant mood */}
                                <div style={{position:'absolute', left:'50%', top:'50%', transform:'translate(-50%, -50%)', textAlign:'center', pointerEvents:'none'}}>
                                    <div style={{fontSize: 48, lineHeight: 1, marginBottom: 4}}>
                                        {dominantMood?.name === 'Excelente' ? '😊' : 
                                         dominantMood?.name === 'Bien' ? '🙂' : 
                                         dominantMood?.name === 'Regular' ? '😐' : 
                                         dominantMood?.name === 'Bajo' ? '😔' : '🧘‍♀️'}
                                    </div>
                                    <div style={{fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', opacity: 0.9}}>
                                        {dominantMood?.name || 'Estado'}
                                    </div>
                                    <div style={{fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', marginTop: 2}}>
                                        {dominantMood?.pct || 0}%
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mood-legend" style={{marginTop: '1.5rem'}}>
                            {orderedMoodData.map((m, i) => (
                                <div className="legend-item" key={m.name} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0', borderBottom: i < orderedMoodData.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none'}}>
                                    <div style={{display:'flex',alignItems:'center',gap:12}}>
                                        <div style={{width:14,height:14,borderRadius:3,background: m.color || COLORS[i % COLORS.length], flexShrink: 0}} />
                                        <span className="legend-label" style={{fontWeight: 600}}>{m.name}</span>
                                    </div>
                                    <div style={{minWidth:50,textAlign:'right', display: 'flex', alignItems: 'center', gap: 8}}>
                                        <span className="legend-value" style={{fontSize: '0.95rem', fontWeight: 700}}>{m.pct}%</span>
                                        <span style={{fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 500}}>({m.count})</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="habits-card">
                    <div className="habits-header">
                        <h2 className="text-lg font-bold text-gray-900">Seguimiento de Hábitos</h2>
                        <button className="configure-btn" onClick={() => openHabitsModal()}>⚙️ Configurar</button>
                    </div>
                    <div className="habits-grid">
                            {/* Cards de hábitos: adaptables a theme via CSS */}
                            <div className="habit-item habit-card">
                                <div className="habit-left">
                                    <div className="habit-icon blue"><Droplet className="w-5 h-5" /></div>

                                    <div>
                                        <div>
                                            <div className="habit-name">Agua</div>
                                            <div className="habit-desc">Vasos de agua diarios</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="habit-meta">
                                    {(() => {
                                        const hc = safeStats && (safeStats.habitos || safeStats.habits || safeStats.habits_config || safeStats.habitos_config) || {};
                                        const objetivoVasos = Number(hc.agua_vasos || hc.agua_objetivo || 8);
                                        const vasosHoy = Number(hc.agua_vasos_hoy || hc.agua_hoy || hc.agua_vasos || 0) + (habitDelta.agua || 0);
                                        const pct = objetivoVasos ? Math.min(100, Math.round((vasosHoy / objetivoVasos) * 100)) : 0;
                                        return (
                                            <>
                                                <div className="habit-progress"><div className="habit-progress-fill blue" style={{ width: `${pct}%` }} /></div>
                                                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                                                    <div className="habit-stats">{pct}% • {vasosHoy}/{objetivoVasos} vasos</div>
                                                    <Tooltip content="Marcar vaso de agua como completado" placement="top">
                                                        <button className="btn-small" onClick={(e)=>{ e.stopPropagation(); markHabitToday('agua'); }}>Marcar hoy</button>
                                                    </Tooltip>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>

                            <div className="habit-item habit-card">
                                <div className="habit-left">
                                    <div className="habit-icon blue"><Calendar className="w-5 h-5" /></div>
                                    <div>
                                        <div className="habit-name">Lectura</div>
                                        <div className="habit-desc">Páginas leídas al día</div>
                                    </div>
                                </div>
                                <div className="habit-meta">
                                    {(() => {
                                        const hc = safeStats && (safeStats.habitos || safeStats.habits || safeStats.habits_config || safeStats.habitos_config) || {};
                                        const objetivoPag = Number(hc.lectura_paginas || hc.lectura_objetivo || 20);
                                        const leidas = Number(hc.lectura_paginas_hoy || hc.lectura_hoy || 0) + (habitDelta.lectura || 0);
                                        const pct = objetivoPag ? Math.min(100, Math.round((leidas / objetivoPag) * 100)) : 0;
                                        return (
                                            <>
                                                <div className="habit-progress"><div className="habit-progress-fill blue" style={{ width: `${pct}%` }} /></div>
                                                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                                                    <div className="habit-stats">{pct}% • {leidas}/{objetivoPag} pág</div>
                                                    <Tooltip content="Agregar páginas leídas hoy" placement="top">
                                                        <button className="btn-small" onClick={(e)=>{ e.stopPropagation(); markHabitToday('lectura'); }}>Marcar hoy</button>
                                                    </Tooltip>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>

                            <div className="habit-item habit-card">
                                <div className="habit-left">
                                    <div className="habit-icon pink"><Star className="w-5 h-5" /></div>
                                    <div>
                                        <div className="habit-name">Ejercicio</div>
                                        <div className="habit-desc">Minutos de actividad física</div>
                                    </div>
                                </div>
                                <div className="habit-meta">
                                    {(() => {
                                        const hc = safeStats && (safeStats.habitos || safeStats.habits || safeStats.habits_config || safeStats.habitos_config) || {};
                                        const objetivoEj = Number(hc.ejercicio_minutos || hc.ejercicio_objetivo || 30);
                                        const hecho = Number(hc.ejercicio_minutos_hoy || hc.ejercicio_hoy || 0) + (habitDelta.ejercicio || 0);
                                        const pct = objetivoEj ? Math.min(100, Math.round((hecho / objetivoEj) * 100)) : 0;
                                        return (
                                            <>
                                                <div className="habit-progress"><div className="habit-progress-fill pink" style={{ width: `${pct}%` }} /></div>
                                                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                                                    <div className="habit-stats">{pct}% • {formatMinutesToHuman(hecho)} / {formatMinutesToHuman(objetivoEj)}</div>
                                                    <Tooltip content="Registrar minutos de ejercicio" placement="top">
                                                        <button className="btn-small" onClick={(e)=>{ e.stopPropagation(); markHabitToday('ejercicio'); }}>Marcar hoy</button>
                                                    </Tooltip>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                </div>

                <div className="action-cards-grid">
                    <div className="action-card purple large">
                        <div>
                            <h3 className="action-card-title">Pomodoro</h3>
                            <p className="action-card-description light-black-text">¡Inicia una sesión de concentración!</p>
                        </div>
                        <Tooltip content="Iniciar una sesión Pomodoro" placement="top">
                            <button type="button" onClick={() => navigate('/pomodoro')} className="action-card-btn purple">Comenzar ahora</button>
                        </Tooltip>
                    </div>

                    <div className="action-card pink large">
                        <div>
                            <h3 className="action-card-title">Meditación</h3>
                            <p className="action-card-description light-black-text">Disfruta nuestra meditación</p>
                        </div>
                        <Tooltip content="Abrir meditaciones guiadas" placement="top">
                            <button type="button" onClick={() => navigate('/meditacion')} className="action-card-btn pink">Meditar ahora</button>
                        </Tooltip>
                    </div>

                    <div className="action-card blue large">
                        <div>
                            <h3 className="action-card-title">Nuevas Tareas</h3>
                            <p className="action-card-description light-black-text">Organiza tus actividades diarias con gratitud.</p>
                        </div>
                        <Tooltip content="Crear o ver tus tareas" placement="top">
                            <button onClick={() => navigate('/tareas')} className="action-card-btn blue">Crear Tareas</button>
                        </Tooltip>
                    </div>


                </div>

                <div className="activity-card">
                    <div className="activity-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                        <h2 className="text-lg font-bold text-gray-900">Actividad Reciente</h2>
                        {safeTareas.length > 3 && (
                            <div style={{marginLeft: '1rem'}}>
                                <button onClick={() => navigate('/tareas')} className="btn-header">Ver todas las tareas</button>
                            </div>
                        )}
                    </div>
                    <div className="activity-list">
                        {safeTareas.length === 0 ? (
                            <>
                                <div className="activity-item blue"><div className="activity-avatar blue"><Calendar className="w-5 h-5" /></div><div className="activity-content"><h4 className="activity-title">Sesión de Concentración Completada</h4><p className="activity-description">Pomodoro Clásico · 25 minutos · Hace 1 hora</p></div></div>
                                <div className="activity-item blue"><div className="activity-avatar blue"><Calendar className="w-5 h-5" /></div><div className="activity-content"><h4 className="activity-title">Meditación Matutina</h4><p className="activity-description">Respiración Consciente · 15 minutos · Hace 3 horas</p></div></div>
                                <div className="activity-item blue"><div className="activity-avatar blue"><Calendar className="w-5 h-5" /></div><div className="activity-content"><h4 className="activity-title">5 Tareas Completadas</h4><p className="activity-description">Proyecto de matemáticas, Lectura, Ejercicio · Hoy</p></div></div>
                            </>
                        ) : (
                            safeTareas.slice(0,3).map(t => {
                                const colorClass = 'blue';
                                const IconComp = Calendar;
                                const displayDate = getCreatedDateDisplay(t) || formatDateIsoToDisplay(t.fecha_vencimiento);
                                return (
                                    <Tooltip key={t.id_tarea} content={displayDate} placement="top">
                                        <div className={`activity-item ${colorClass} clickable`} role={t.id_tarea ? 'button' : undefined} tabIndex={t.id_tarea ? 0 : -1} onClick={() => { if (t.id_tarea) navigate(`/tareas/${t.id_tarea}`); }} onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && t.id_tarea) navigate(`/tareas/${t.id_tarea}`); }}>
                                            <div className={`activity-avatar ${colorClass}`}><IconComp className="w-5 h-5" /></div>
                                            <div className="activity-content"><h4 className="activity-title">{t.titulo || 'Tarea sin título'}</h4><p className="activity-description">{t.descripcion?.slice(0,100) || ''}{t.descripcion && t.descripcion.length>100 ? '…' : ''}</p></div>
                                            <div className="activity-meta"><div className="text-xs text-gray-500">{t.estado || 'Pendiente'} • {t.prioridad || 'media'}</div><div className="text-xs text-gray-400">{displayDate}</div></div>
                                        </div>
                                    </Tooltip>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {habitsModalOpen && (
                <div className="habits-modal-backdrop" onClick={closeHabitsModal}>
                    <div className="habits-modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
                        <h3 className="habits-modal-title">Configurar Seguimiento de Hábitos</h3>
                        <div className="habits-modal-grid">
                           
                            <label className="habits-field"><span className="field-label">Minutos de ejercicio</span><input className="habits-input" type="number" min={0} value={habitForm.ejercicio_min} onChange={(e)=>setHabitForm({...habitForm,ejercicio_min: e.target.value})} /></label>
                            <label className="habits-field"><span className="field-label">Páginas de lectura</span><input className="habits-input" type="number" min={0} value={habitForm.lectura_paginas} onChange={(e)=>setHabitForm({...habitForm,lectura_paginas: e.target.value})} /></label>
                            <label className="habits-field"><span className="field-label">Vasos de agua</span><input className="habits-input" type="number" min={0} value={habitForm.agua_vasos} onChange={(e)=>setHabitForm({...habitForm,agua_vasos: e.target.value})} /></label>
                        </div>
                        {habitSaveError && <div className="habits-modal-error" role="alert">{habitSaveError}</div>}
                        {habitSaveSuccess && <div className="habits-modal-success" role="status">{habitSaveSuccess}</div>}
                        <div className="habits-modal-actions">
                            <button onClick={closeHabitsModal} className="btn-header cancel">Cancelar</button>
                            <button onClick={saveHabits} className="btn-header primary" disabled={savingHabits}>{savingHabits ? 'Guardando...' : 'Guardar'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* El botón 'Ver todas las tareas' se muestra ahora dentro del header a la derecha */}

        </div>
    );

}
