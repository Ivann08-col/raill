// frontend/src/pages/Pomodoro.jsx
import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, Coffee, Flame, Settings, Clock, Calendar, Droplet, Star } from 'lucide-react';
import Tooltip from '../components/Tooltip';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';
import pomodoroService from '../services/pomodoro'; // Importar el nuevo servicio
import api from '../services/api'; // Mantener api para finalizar si es necesario
import cfg from '../services/config'; // Mantener cfg para finalizar si es necesario
import './styles/Pomodoro.css';

export default function Pomodoro() {
    const { t } = useTranslation();

    // Estado para pestaña activa (timer / analysis / progress / history)
    const [activeTab, setActiveTab] = useState('timer');

    // UI-only states para modales y sliders (presentación)
    const [techModalOpen, setTechModalOpen] = useState(false);
    const [goalsModalOpen, setGoalsModalOpen] = useState(false);
    const [dailyGoal, setDailyGoal] = useState(120); // minutos
    const [weeklyGoal, setWeeklyGoal] = useState(840); // minutos
    const [monthlyGoal, setMonthlyGoal] = useState(3600); // minutos

    // Estados para el temporizador y la sesión
    const [timer, setTimer] = useState(25 * 60); // 25 minutos en segundos por defecto
    const [isRunning, setIsRunning] = useState(false);
    const [sessionId, setSessionId] = useState(null);

    // Estados para la configuración del Pomodoro
    const [tipo, setTipo] = useState('clasico'); // 'clasico', 'extendido', 'micro', 'personalizado'
    const [config, setConfig] = useState({
        duracion_trabajo: 25,
        duracion_descanso: 5,
        duracion_descanso_largo: 15,
        ciclos_objetivo: 4,
        ciclosCompletados: 0,
        faseActual: 'trabajo',
        modo_no_distraccion: false
    });

    // Estados para estadísticas y progreso
    const [stats, setStats] = useState({
        weekSessions: 0, // Sesiones esta semana
        completedCycles: 0, // Ciclos completados totales
        streak: 0, // Racha de días
        effectiveness: 0 // Efectividad
    });
    const [progressData, setProgressData] = useState([]);
    const [loadingStats, setLoadingStats] = useState(true);

    // Estados para personalización
    const [customConfig, setCustomConfig] = useState({
        duracion_trabajo: 25,
        duracion_descanso: 5,
        ciclos_objetivo: 4
    });

    // Lista canónica de técnicas (usada para modal y para mostrar beneficios/detalles)
    const techniques = [
        { key: 'clasico', title: 'Pomodoro Clásico', desc: 'La técnica más popular para mantener la concentración', times: { work:25, short:5, long:15, cycles:4 }, tags:['Principiante','Tareas generales'], level: 'Principiante', benefits: ['Mejora el enfoque','Reduce la fatiga mental','Aumenta la productividad'] },
        { key: 'extendido', title: 'Pomodoro Extendido', desc: 'Para trabajo profundo que requiere más tiempo de concentración', times: { work:45, short:15, long:30, cycles:3 }, tags:['Intermedio','Trabajo complejo'], level: 'Intermedio', benefits: ['Trabajo profundo','Menos interrupciones','Alta concentración'] },
        { key: '5217', title: 'Técnica 52-17', desc: 'Basada en estudios de productividad', times: { work:52, short:17, long:30, cycles:3 }, tags:['Avanzado','Alto rendimiento'], level: 'Avanzado', benefits: ['Máximo rendimiento','Recuperación óptima','Sostenibilidad'] },
        { key: '90-20', title: 'Técnica 90-20', desc: 'Para proyectos que requieren concentración profunda y sostenida', times: { work:90, short:20, long:45, cycles:2 }, tags:['Experto','Proyectos largos'], level: 'Experto', benefits: ['Concentración sostenida','Flujo profundo'] },
        { key: 'micro', title: 'Micro Pomodoros', desc: 'Ideal para personas con TDAH o dificultades de concentración', times: { work:15, short:5, long:15, cycles:6 }, tags:['TDAH','Principiante'], level: 'Principiante', benefits: ['Fácil de mantener','Menos abrumador'] },
        { key: 'flex', title: 'Timeboxing Flexible', desc: 'Combina estructura y flexibilidad para diferentes tipos de trabajo', times: { work:30, short:10, long:25, cycles:4 }, tags:['Intermedio','Trabajo variado'], level: 'Intermedio', benefits: ['Adaptabilidad','Equilibrio'] }
    ];

    // Técnica seleccionada actualmente (clave). Inicializada desde tipo por defecto
    const [selectedTechniqueKey, setSelectedTechniqueKey] = useState(tipo || 'clasico');
    // Estados para datos calculados desde historial
    const [monthlyTrend, setMonthlyTrend] = useState([0, 0, 0, 0]); // Sem 1..4
    const [techniquesUsageState, setTechniquesUsageState] = useState([]);
    const [recentSessions, setRecentSessions] = useState([]);

    // Cargar historial y calcular estadísticas al montar (desde localStorage)
    useEffect(() => {
        const cargarDatos = () => {
            try {
                const historial = JSON.parse(localStorage.getItem('pomodoro_historial') || '[]');
                // ordenar por fecha descendente
                historial.sort((a,b)=> new Date(b.fecha || b.fecha_inicio || b.tiempo_inicio) - new Date(a.fecha || a.fecha_inicio || a.tiempo_inicio));

                // Filtrar solo sesiones completadas
                const sesionesCompletadas = historial.filter(s => s.completada === true);

                // Calcular racha simple (días consecutivos con sesión completada)
                const computeStreak = (completed) => {
                    if (!completed || completed.length === 0) return 0;
                    const uniqueDates = [...new Set(completed.map(s => new Date(s.fecha || s.fecha_inicio || s.tiempo_inicio).toDateString()))]
                        .map(d => new Date(d)).sort((a,b)=> b - a);
                    let streak = 0;
                    let prev = new Date();
                    for (const d of uniqueDates) {
                        const diff = Math.round((prev - d) / (1000*60*60*24));
                        if (streak === 0) {
                            // first match: if today or yesterday
                            if (diff <= 1) { streak = 1; prev = d; } else break;
                        } else {
                            if (diff === 1) { streak++; prev = d; } else break;
                        }
                    }
                    return streak;
                };

                const hoy = new Date();
                const hace7dias = new Date();
                hace7dias.setDate(hoy.getDate() - 7);

                const completadasEstaSemana = sesionesCompletadas.filter(s => {
                    const fecha = new Date(s.fecha || s.fecha_inicio || s.tiempo_inicio);
                    return fecha >= hace7dias && fecha <= hoy;
                });

                const ciclosCompletados = sesionesCompletadas.reduce((total, s) => total + (s.ciclos_completados || 0), 0);
                const racha = computeStreak(sesionesCompletadas);

                setStats({
                    weekSessions: completadasEstaSemana.length,
                    completedCycles: ciclosCompletados,
                    streak: racha,
                    effectiveness: historial.length > 0 ? Math.round((sesionesCompletadas.length / historial.length) * 100) : 0
                });

                // Datos para el gráfico semanal (últimos 7 días)
                const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
                const data = dias.map((dia, i) => {
                    const fecha = new Date(hace7dias);
                    fecha.setDate(hace7dias.getDate() + i);
                    const sesionesDelDia = completadasEstaSemana.filter(s => {
                        const sDate = new Date(s.fecha || s.fecha_inicio || s.tiempo_inicio);
                        return sDate.toDateString() === fecha.toDateString();
                    }).length;
                    return { day: dia, sessions: sesionesDelDia };
                });
                setProgressData(data);

                // Recent sessions (últimas completadas)
                setRecentSessions(sesionesCompletadas.slice(0,5));

                // Tendencia mensual: sumar minutos por semana (4 semanas)
                const monthly = [0,0,0,0]; // Sem1..Sem4 (Sem1 = más antigua)
                const today = new Date();
                sesionesCompletadas.forEach(s => {
                    const sDate = new Date(s.fecha || s.fecha_inicio || s.tiempo_inicio);
                    const daysAgo = Math.floor((today - sDate) / (1000*60*60*24));
                    const weeksAgo = Math.floor(daysAgo / 7);
                    if (weeksAgo < 4) {
                        const idx = 3 - weeksAgo; // 0 = oldest, 3 = this week
                        monthly[idx] += (s.duracion_trabajo || 0);
                    }
                });
                setMonthlyTrend(monthly);

                // Técnicas más usadas: contar por título
                const counts = {};
                sesionesCompletadas.forEach(s => {
                    const name = s.titulo || s.tecnica || 'Desconocida';
                    counts[name] = (counts[name] || 0) + 1;
                });
                const total = Object.values(counts).reduce((a,b)=>a+b,0) || 1;
                const usage = Object.entries(counts).map(([name, count]) => {
                    // buscar color por coincidencia en techniques
                    const t = techniques.find(x => x.title === name || x.key === name);
                    const color = t ? (t.key === 'extendido' ? '#10b981' : t.key === 'micro' ? '#f59e0b' : t.key === '5217' ? '#ec4899' : '#a855f7') : '#a855f7';
                    return { name, pct: Math.round((count/total)*100), color };
                }).sort((a,b)=> b.pct - a.pct);
                setTechniquesUsageState(usage);

            } catch (err) {
                console.error('Error al cargar historial de Pomodoro:', err);
                setStats({ weekSessions: 0, completedCycles: 0, streak: 0, effectiveness: 0 });
                setProgressData([
                    { day: 'Lun', sessions: 0 },
                    { day: 'Mar', sessions: 0 },
                    { day: 'Mié', sessions: 0 },
                    { day: 'Jue', sessions: 0 },
                    { day: 'Vie', sessions: 0 },
                    { day: 'Sáb', sessions: 0 },
                    { day: 'Dom', sessions: 0 }
                ]);
                setRecentSessions([]);
                setMonthlyTrend([0,0,0,0]);
                setTechniquesUsageState([]);
            } finally {
                setLoadingStats(false);
            }
        };

        cargarDatos();
    }, []); // Se ejecuta una vez al montar


    // Efecto para el temporizador
    useEffect(() => {
        let interval = null;
        if (isRunning && timer > 0) {
            interval = setInterval(() => setTimer(t => t - 1), 1000);
        } else if (timer === 0 && isRunning) {
            manejarFinFase(); // Cambiado de finalizarSesion a manejarFinFase
        }
        return () => clearInterval(interval);
    }, [isRunning, timer]);

    // Función para manejar el fin de una fase (trabajo o descanso)
    const manejarFinFase = async () => {
        if (!isRunning) return;

        const durTrabajo = config.duracion_trabajo || 25;
        const durDesc = config.duracion_descanso || 5;
        const durDescLargo = config.duracion_descanso_largo || 15;
        const ciclosObj = config.ciclos_objetivo || 4;
        const ciclosDone = config.ciclosCompletados || 0;

        if (config.faseActual === 'trabajo') {
            const nuevosCiclos = ciclosDone + 1;
            // Si alcanzamos el objetivo de ciclos, pasar a descanso largo
            if (nuevosCiclos >= ciclosObj) {
                setConfig(prev => ({ ...prev, ciclosCompletados: nuevosCiclos, faseActual: 'descanso_largo' }));
                setTimer(durDescLargo * 60);
            } else {
                // descanso corto entre ciclos
                setConfig(prev => ({ ...prev, ciclosCompletados: nuevosCiclos, faseActual: 'descanso' }));
                setTimer(durDesc * 60);
            }
        } else if (config.faseActual === 'descanso') {
            // Volver a trabajo
            setConfig(prev => ({ ...prev, faseActual: 'trabajo' }));
            setTimer(durTrabajo * 60);
        } else if (config.faseActual === 'descanso_largo') {
            // Tras descanso largo, consideramos la sesión completada
            await finalizarSesion(true);
        }
    };

    // Función para calcular la racha
    const calcularRacha = (historial) => {
        if (historial.length === 0) return 0;
        const fechasCompletadas = [...new Set(
            historial
                .filter(s => s.estado === 'Completado')
                .map(s => new Date(s.fecha_inicio).toDateString()) // Ajusta el campo de fecha
        )].sort((a, b) => new Date(b) - new Date(a));

        let racha = 0;
        let fechaAnterior = new Date();

        for (const fechaStr of fechasCompletadas) {
            const fecha = new Date(fechaStr);
            const diffDias = Math.floor((fechaAnterior - fecha) / (1000 * 60 * 60 * 24));
            if (diffDias === 1) {
                racha++;
            } else if (diffDias > 1) {
                break;
            }
            fechaAnterior = fecha;
        }
        return racha;
    };

    // Formatear tiempo para mostrar
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Iniciar sesión de Pomodoro (simplificado sin backend)
    const startPomodoro = () => {
        // Iniciar temporizador y estado directamente
        setConfig(prev => ({ ...prev, faseActual: 'trabajo', ciclosCompletados: 0 }));
        setTimer(config.duracion_trabajo * 60);
        setIsRunning(true);

        // Guardar estado en localStorage
        const estado = {
            duracion_trabajo: config.duracion_trabajo,
            duracion_descanso: config.duracion_descanso,
            ciclos_objetivo: config.ciclos_objetivo,
            ciclos_completados: 0,
            fase_actual: 'trabajo',
            tiempo_inicio: new Date().toISOString()
        };
        localStorage.setItem('pomodoro_estado', JSON.stringify(estado));
    };

    // Finalizar sesión de Pomodoro (simplificado sin backend)
    const finalizarSesion = (completada = false) => {
        // Actualizar estado local
        setIsRunning(false);
        setConfig(prev => ({ ...prev, faseActual: 'trabajo', ciclosCompletados: 0 }));
        setTimer(config.duracion_trabajo * 60);

        // Limpiar estado en localStorage
        localStorage.removeItem('pomodoro_estado');

        // Si la sesión se completó, guardar en historial local
        if (completada) {
            const historial = JSON.parse(localStorage.getItem('pomodoro_historial') || '[]');
            historial.unshift({
                fecha: new Date().toISOString(),
                duracion_trabajo: config.duracion_trabajo,
                duracion_descanso: config.duracion_descanso,
                ciclos_completados: config.ciclosCompletados,
                completada: true
            });
            localStorage.setItem('pomodoro_historial', JSON.stringify(historial));
        }
    };

    // Reiniciar temporizador (y posiblemente sesión)
    const resetTimer = () => {
        if (isRunning && sessionId) {
            // Opción 1: Finalizar sesión actual si se reinicia mientras corre
            // finalizarSesion(false);
            // Opción 2: Simplemente reiniciar el timer local y estado sin tocar la sesión en backend
            // Esta opción es más segura si no se quiere interrumpir la sesión en backend
            setIsRunning(false);
            setConfig(prev => ({ ...prev, faseActual: 'trabajo', ciclosCompletados: 0 }));
            setTimer(config.duracion_trabajo * 60);
        } else {
            // Si no está corriendo, solo reiniciar el timer local
            setConfig(prev => ({ ...prev, faseActual: 'trabajo', ciclosCompletados: 0 }));
            setTimer(config.duracion_trabajo * 60);
        }
    };

    // Manejar cambio de tipo de Pomodoro
    const handleTipoChange = (e) => {
        const newTipo = e.target.value;
        setTipo(newTipo);

        let newConfig = {};
        switch (newTipo) {
            case 'clasico':
                newConfig = { duracion_trabajo: 25, duracion_descanso: 5, ciclos_objetivo: 4 };
                break;
            case 'extendido':
                newConfig = { duracion_trabajo: 50, duracion_descanso: 10, ciclos_objetivo: 3 };
                break;
            case '5217':
                newConfig = { duracion_trabajo: 52, duracion_descanso: 17, duracion_descanso_largo: 30, ciclos_objetivo: 3 };
                break;
            case '90-20':
                newConfig = { duracion_trabajo: 90, duracion_descanso: 20, duracion_descanso_largo: 45, ciclos_objetivo: 2 };
                break;
            case 'micro':
                newConfig = { duracion_trabajo: 15, duracion_descanso: 3, ciclos_objetivo: 5 };
                break;
            case 'flex':
                newConfig = { duracion_trabajo: 30, duracion_descanso: 10, duracion_descanso_largo: 25, ciclos_objetivo: 4 };
                break;
            case 'personalizado':
                // Mantener la configuración personalizada actual
                newConfig = { ...customConfig };
                break;
            default:
                newConfig = { duracion_trabajo: 25, duracion_descanso: 5, ciclos_objetivo: 4 };
        }
        // Actualizar la configuración principal y el timer si no está corriendo
        setConfig(prev => ({ ...prev, ...newConfig }));
        if (!isRunning) {
            setTimer(newConfig.duracion_trabajo * 60);
        }
        // actualizar técnica seleccionada en estado (para UI: badges, selected card)
        setSelectedTechniqueKey(newTipo);
    };

    // Manejar cambio en la configuración personalizada
    const handleCustomChange = (e) => {
        const { name, value } = e.target;
        const val = Number(value);
        setCustomConfig(prev => ({ ...prev, [name]: val }));
        // Si está en modo personalizado, actualizar la config principal también
        if (tipo === 'personalizado' && !isRunning) {
            setConfig(prev => ({ ...prev, [name]: val }));
            if (name === 'duracion_trabajo') {
                setTimer(val * 60);
            }
        }
    };

    // Manejar cambio de modo no distracción
    const handleModoChange = (e) => {
        const checked = e.target.checked;
        setConfig(prev => ({ ...prev, modo_no_distraccion: checked }));
    };

    // Determinar si es fase de trabajo o descanso para estilos
    const isWorkPhase = config.faseActual === 'trabajo' || !sessionId; // Si no hay sesión activa, mostrar como trabajo

    // Detectar tema global si existe (soporta ambos: 'midnight' y 'light')
    // Usamos estado local y un MutationObserver para reaccionar si el atributo data-theme cambia en runtime
    const [theme, setTheme] = useState((typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme')) || 'midnight');

    useEffect(() => {
        if (typeof document === 'undefined') return;
        const root = document.documentElement;
        const observer = new MutationObserver((mutations) => {
            for (const m of mutations) {
                if (m.attributeName === 'data-theme') {
                    setTheme(root.getAttribute('data-theme') || 'midnight');
                }
            }
        });
        observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
        return () => observer.disconnect();
    }, []);

    // Etiquetas legibles para las técnicas
    const techniqueLabels = {
        'clasico': 'Pomodoro Clásico',
        'extendido': 'Pomodoro Extendido',
        'micro': 'Micro Pomodoros',
        '5217': 'Técnica 52-17',
        '90-20': 'Técnica 90-20',
        'flex': 'Timeboxing Flexible',
        'personalizado': 'Personalizado'
    };

    return (
    <div className="pomodoro-app" data-theme={theme}>
            <div className="page-wrapper container">
                <header className="pom-header">
                    <div>
                        <h1 className="title">Técnica Pomodoro</h1>
                        <p className="subtitle">Fortalece tu capacidad de atención con técnicas probadas y mejora tu productividad</p>
                    </div>

                </header>

                {/* Top metrics */}
                <section className="metrics-row top-metrics">
                    <div className="metric">
                        <small>Hoy</small>
                        <div className="value">{/* intentar mostrar minutos de hoy si existe */}{(() => {
                            try {
                                const historial = JSON.parse(localStorage.getItem('pomodoro_historial')||'[]');
                                const hoy = new Date().toDateString();
                                const minutosHoy = historial.filter(s=> new Date(s.fecha).toDateString()===hoy).reduce((acc,s)=> acc + (s.duracion_trabajo || 0),0);
                                return minutosHoy ? `${minutosHoy}min` : '0min';
                            } catch(e){ return '0min'; }
                        })()}</div>
                        <div className="trend positive">Hoy</div>
                    </div>
                    <div className="metric">
                        <small>Sesiones completadas</small>
                        <div className="value">{stats.weekSessions}</div>
                        <div className="trend positive">+{Math.max(0, Math.round((stats.weekSessions||0)/1))}% esta semana</div>
                    </div>
                    <div className="metric">
                        <small>Días consecutivos</small>
                        <div className="value">{stats.streak}</div>
                        <div className="trend neutral">Racha</div>
                    </div>
                    <div className="metric">
                        <small>Productividad</small>
                        <div className="value">{stats.effectiveness}%</div>
                        <div className="trend positive">{stats.effectiveness >= 75 ? 'Alto' : 'Medio'}</div>
                    </div>
                </section>



                {/* Top centered card header and tabs (visible for all tabs) */}
                <div className="center-card card">
                    <div className="center-card-header gradient">
                        <div className="header-left">
                            <h3 className="center-title">Centro de Concentración</h3>
                            <p className="center-sub">Gestiona tus sesiones de entrenamiento mental</p>
                        </div>
                    </div>

                    <div className="center-card-body">
                        <div className="pills-nav">
                            <button className={`pill-tab ${activeTab==='timer'?'selected':''}`} onClick={()=>setActiveTab('timer')}>Pomodoro Timer</button>
                            <button className={`pill-tab ${activeTab==='analysis'?'selected':''}`} onClick={()=>setActiveTab('analysis')}>Análisis</button>
                            <button className={`pill-tab ${activeTab==='progress'?'selected':''}`} onClick={()=>setActiveTab('progress')}>Progreso</button>
                            <button className={`pill-tab ${activeTab==='history'?'selected':''}`} onClick={()=>setActiveTab('history')}>Historial</button>
                        </div>
                    </div>
                </div>

                <main className="tab-content">
                    {activeTab === 'timer' && (
                        <section>
                            <div className="timer-area">
                                <h4 className="tech-selected">Técnica Seleccionada</h4>
                                <h2 className="tech-name">{techniqueLabels[tipo] || tipo}</h2>
                                <p className="tech-desc muted">La técnica seleccionada determina la duración de trabajo/descanso y el número de ciclos.</p>

                                <div className="timer-card">
                                    <div className={`timer-ring ${isWorkPhase?'work':'break'}`}>
                                        <div className="timer-count-large">{formatTime(timer)}</div>
                                        <div className="timer-meta">Concentración · Ciclo {config.ciclosCompletados || 1} de {config.ciclos_objetivo}</div>
                                    </div>

                                    <div className="counters-row">
                                        <div className="counter-box pastel"><small>Completados</small><div className="counter-value">0</div></div>
                                        <div className="counter-box pastel"><small>Tiempo enfocado</small><div className="counter-value">0m</div></div>
                                        <div className="counter-box pastel"><small>Sesión total</small><div className="counter-value">0m</div></div>
                                        <div className="counter-box pastel"><small>Eficiencia</small><div className="counter-value">0%</div></div>
                                    </div>

                                    <div className="play-row">
                                        {!isRunning ? (
                                            <Tooltip label="Iniciar sesión" placement="bottom">
                                              <button className="play-circle" onClick={startPomodoro}><Play/></button>
                                            </Tooltip>
                                        ) : (
                                            <Tooltip label="Detener sesión" placement="bottom">
                                              <button className="play-circle stop" onClick={()=>finalizarSesion(false)}><RotateCcw/></button>
                                            </Tooltip>
                                        )}
                                    </div>

                                    <div className="bottom-pills">
                                        <div className="pill-left">
                                            <Tooltip label="Abrir selector de técnicas" placement="top">
                                              <button className="pill-btn" onClick={()=>setTechModalOpen(true)}>Técnicas</button>
                                            </Tooltip>
                                        </div>
                                        <div className="pill-right">
                                            <Tooltip label="Iniciar Pomodoro" placement="top">
                                              <button className="btn start small" onClick={startPomodoro}>Iniciar</button>
                                            </Tooltip>
                                        </div>
                                    </div>
                                </div>

                                <div className="benefits card small">
                                    {(techniques.find(t=>t.key===tipo) || techniques[0]).benefits.map((b, idx)=> (
                                        <div className="benefit" key={idx}><span className="benefit-dot">✓</span><span className="benefit-text">{b}</span></div>
                                    ))}
                                </div>

                                <div className="details card small">
                                    <h5>Detalles de la Técnica</h5>
                                    <div className="details-grid">
                                        <div className="detail-pill detail-work"><div className="time-value">{config.duracion_trabajo}min</div><span className="muted">Concentración</span></div>
                                        <div className="detail-pill detail-short"><div className="time-value">{config.duracion_descanso}min</div><span className="muted">Descanso</span></div>
                                        <div className="detail-pill detail-long"><div className="time-value">{config.duracion_descanso_largo}min</div><span className="muted">Descanso largo</span></div>
                                        <div className="detail-pill detail-cycles"><div className="time-value">{config.ciclos_objetivo}</div><span className="muted">Ciclos</span></div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {activeTab === 'analysis' && (
                        <section className="analysis-area">
                            <div className="metrics-row">
                                
                            </div>

                            <div className="analysis-grid">
                                <div className="card">
                                    <h4>Progreso por Técnica</h4>
                                        <div className="progress-list">
                                        <div className="progress-row"><span>Pomodoro Clásico</span><div className="progress-bar"><div className="progress-bar-fill w-70"/></div></div>
                                        <div className="progress-row"><span>Pomodoro Extendido</span><div className="progress-bar"><div className="progress-bar-fill w-20"/></div></div>
                                        <div className="progress-row"><span>Técnica 52-17</span><div className="progress-bar"><div className="progress-bar-fill w-10"/></div></div>
                                    </div>
                                </div>

                                <div className="card">
                                    <h4>Sesiones Recientes</h4>
                                    <div className="recent-list">
                                        {recentSessions.length === 0 && <div className="muted">No hay sesiones recientes completadas.</div>}
                                        {recentSessions.map((s,i)=> (
                                            <Tooltip key={i} label={`${(s.duracion_trabajo||0)}min · ${(s.titulo || 'Pomodoro')}`} placement="top">
                                              <div className="recent-item">
                                                  <div className="recent-item-icon"><Clock size={18} /></div>
                                                  <div className="recent-item-content">
                                                      <div className="recent-item-title">{s.titulo || 'Pomodoro Clásico'}</div>
                                                      <div className="recent-item-meta">{(s.duracion_trabajo||0)}min · {s.completada? 'Completada':''} · {s.efectividad || '—'}%</div>
                                                  </div>
                                                  <div className="recent-item-date muted">{s.fecha ? new Date(s.fecha).toLocaleDateString() : ''}</div>
                                              </div>
                                            </Tooltip>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="trend-row">
                                <div className="trend-item positive">+15%<div className="muted">Mejora esta semana</div></div>
                                <div className="trend-item days">7<div className="muted">Días consecutivos</div></div>
                                <div className="trend-item avg">4.8<div className="muted">Promedio ciclos/día</div></div>
                            </div>
                        </section>
                    )}

                    {activeTab === 'progress' && (
                        <section className="card progress-area">
                            <div className="metrics-row">
                                <div className="metric">
                                    <small>Sesiones</small>
                                    <div className="value">{stats.weekSessions}</div>
                                    <div className="trend positive">+{Math.round((stats.weekSessions||0)/1)}% vs mes anterior</div>
                                </div>
                                <div className="metric">
                                    <small>Tiempo total</small>
                                    <div className="value">{(stats.completedCycles * (config.duracion_trabajo||0))? Math.round(stats.completedCycles * (config.duracion_trabajo||0)/60)+'h' : '0h'}</div>
                                    <div className="trend positive">+{Math.max(0,5)}% vs mes anterior</div>
                                </div>
                                <div className="metric">
                                    <small>Efectividad</small>
                                    <div className="value">{stats.effectiveness}%</div>
                                    <div className="trend positive">+{Math.max(0,3)}% vs mes anterior</div>
                                </div>
                            </div>

                            <div className="mt-16">
                                <h4>Progreso Semanal</h4>
                                <ResponsiveContainer width="100%" height={260}>
                                    <LineChart data={progressData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1b2a3a" />
                                        <XAxis dataKey="day" stroke="#9ca3af" />
                                        <YAxis stroke="#9ca3af" />
                                        <RechartsTooltip />
                                        <Line type="monotone" dataKey="sessions" stroke="#c084fc" strokeWidth={3} dot={{ fill: '#c084fc', r:6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="grid-2 mt-20">
                                <div className="card">
                                    <h4>Tendencia Mensual</h4>
                                    <div className="chart-wrap">
                                        {(() => {
                                            const max = Math.max(...monthlyTrend, 1);
                                            return monthlyTrend.map((v, idx) => {
                                                const heightPct = Math.round((v / max) * 100);
                                                return (
                                                    <div key={idx} className={`monthly-bar ${idx % 2 === 1 ? 'alt' : ''}`} style={{ height: `${Math.max(12, heightPct)}%` }}>
                                                        <div>
                                                            <div className="bar-value">{v}</div>
                                                            <div className="bar-label">Sem {idx+1}</div>
                                                        </div>
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </div>
                                </div>
                                <div className="card">
                                    <h4>Técnicas Más Usadas</h4>
                                    <div className="mt-8">
                                        {techniquesUsageState.length === 0 && <div className="muted">No hay datos de uso de técnicas.</div>}
                                        {techniquesUsageState.map((t, i) => (
                                            <div key={i} className="tech-row">
                                                <span>{t.name}</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '60%' }}>
                                                    <div className="progress-bar" style={{ flex: 1 }}>
                                                        <div className="progress-bar-fill" style={{ width: `${t.pct}%`, background: `linear-gradient(90deg, ${t.color}, #fb7185)` }} />
                                                    </div>
                                                    <div className="percent">{t.pct}%</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {activeTab === 'history' && (
                        <section className="card history-area">
                            <div className="filters-row">
                                <select className="control-select">
                                    <option>Todas las técnicas</option>
                                    <option>Pomodoro Clásico</option>
                                </select>
                                <div className="flex-grow" />
                            </div>

                            <table className="table mt-12">
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Técnica</th>
                                        <th>Duración</th>
                                        <th>Estado</th>
                                        <th>Efectividad</th>
                                        <th>Notas</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(JSON.parse(localStorage.getItem('pomodoro_historial')||'[]')).slice(0,10).map((s, i)=> (
                                        <tr key={i}>
                                            <td>{new Date(s.fecha).toLocaleString()}</td>
                                            <td>{s.titulo || 'Pomodoro Clásico'}</td>
                                            <td>{s.duracion_trabajo} min</td>
                                            <td>{s.completada? 'Completada':'Interrumpida'}</td>
                                            <td>{s.efectividad || '—'}</td>
                                            <td>{s.notas || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="pagination">
                                <button className="btn ghost">Anterior</button>
                                <button className="btn ghost">Siguiente</button>
                            </div>
                        </section>
                    )}
                </main>

                {/* Modales UI-only */}
                {techModalOpen && (
                    <div className="modal-overlay" onClick={()=>setTechModalOpen(false)}>
                        <div className="modal-techniques" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-tech-header">
                                <div>
                                    <h2>Seleccionar Técnica de Concentración</h2>
                                    <p className="modal-subtitle">Elige la técnica que mejor se adapte a tu estilo de trabajo</p>
                                </div>
                            </div>
                            
                            <div className="techniques-grid">
                                        {techniques.map(tc => (
                                    <div key={tc.key} className={`technique-card ${tipo === tc.key ? 'highlighted' : ''}`}>
                                        <div className={`tech-icon ${tc.key === 'extendido' ? 'green' : tc.key === 'micro' ? 'orange' : tc.key === '5217' ? 'pink' : 'purple'}`}>
                                            {tc.key === 'micro' ? <Coffee size={24} /> : tc.key === '5217' ? <Flame size={24} /> : tc.key === 'flex' ? <Star size={24} /> : <Clock size={24} />}
                                        </div>
                                        <h3>{tc.title}</h3>
                                        <p className="tech-description">{tc.desc}</p>
                                        
                                        <div className="tech-badges">
                                            <span className="badge">{tc.level}</span>
                                            {tc.tags.map((tg,i)=>(<span className={`badge tag-${i}`} key={i}>{tg}</span>))}
                                        </div>
                                        
                                        <div className="tech-times-grid">
                                            <div className="time-box">
                                                <div className="time-value">{tc.times.work}min</div>
                                                <div className="time-label">Concentración</div>
                                            </div>
                                            <div className="time-box">
                                                <div className="time-value">{tc.times.short}min</div>
                                                <div className="time-label">Descanso</div>
                                            </div>
                                            <div className="time-box">
                                                <div className="time-value">{tc.times.long}min</div>
                                                <div className="time-label">Descanso largo</div>
                                            </div>
                                            <div className="time-box">
                                                <div className="time-value">{tc.times.cycles}</div>
                                                <div className="time-label">Ciclos</div>
                                            </div>
                                        </div>
                                        
                                        <div className="tech-benefits">
                                            <h4>Beneficios:</h4>
                                            <ul>
                                                {tc.benefits.map((b, idx) => (<li key={idx}>{b}</li>))}
                                            </ul>
                                        </div>
                                        
                                                                                <Tooltip label={tipo === tc.key ? 'Técnica seleccionada' : 'Seleccionar técnica'} placement="top">
                                                                                    <button className={`select-btn ${tipo === tc.key ? 'highlighted-btn' : ''}`} onClick={() => { setTipo(tc.key); handleTipoChange({target:{value:tc.key}}); setTechModalOpen(false); }}>
                                                                                            {tipo === tc.key ? 'Seleccionado' : 'Seleccionar'}
                                                                                    </button>
                                                                                </Tooltip>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {goalsModalOpen && (
                    <div className="modal-overlay" onClick={()=>setGoalsModalOpen(false)}>
                        <div className="modal card modal-small" onClick={(e)=>e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>Configurar Objetivos</h3>
                                <button className="close" onClick={()=>setGoalsModalOpen(false)}>×</button>
                            </div>
                            <div className="modal-body">
                                <label>Objetivo diario: {dailyGoal} minutos</label>
                                <input type="range" min="30" max="480" value={dailyGoal} onChange={(e)=>setDailyGoal(Number(e.target.value))} />
                                <div className="range-labels"><span>30 min</span><span>8 horas</span></div>

                                <label>Objetivo semanal: {weeklyGoal} minutos</label>
                                <input type="range" min="210" max="3360" value={weeklyGoal} onChange={(e)=>setWeeklyGoal(Number(e.target.value))} />
                                <div className="range-labels"><span>3.5 horas</span><span>56 horas</span></div>

                                <label>Objetivo mensual: {monthlyGoal} minutos</label>
                                <input type="range" min="900" max="14400" value={monthlyGoal} onChange={(e)=>setMonthlyGoal(Number(e.target.value))} />
                                <div className="range-labels"><span>15 horas</span><span>240 horas</span></div>

                                <div className="modal-actions">
                                    <button className="btn primary" onClick={()=>{ localStorage.setItem('pomodoro_goals', JSON.stringify({daily:dailyGoal, weekly:weeklyGoal, monthly:monthlyGoal})); setGoalsModalOpen(false); }}>Guardar Objetivos</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>

            
        </div>
    );
}