// frontend/src/pages/Meditacion.jsx
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Droplet, Star, Play, RotateCcw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';
import meditacionService from '../services/meditacion_simple';

export default function Meditacion() {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('active');
    const [timer, setTimer] = useState(600); // 10 minutos
    const [isRunning, setIsRunning] = useState(false);
    const [duracion, setDuracion] = useState(10);
    const [tipo, setTipo] = useState('mindfulness');
    const [sessionId, setSessionId] = useState(null); // Este ID ahora es temporal o no se usa hasta guardar

    // Datos dinámicos desde API
    const [stats, setStats] = useState({
        weekMinutes: 0,
        completedSessions: 0,
        streak: 0,
        effectiveness: 0
    });
    const [progressData, setProgressData] = useState([]);
    const [loadingStats, setLoadingStats] = useState(true);

    // Cargar datos desde API al montar el componente
    useEffect(() => {
        const cargarDatos = async () => {
            try {
                const res = await meditacionService.getHistorial();
                const historial = Array.isArray(res.data) ? res.data : [];
                // Calcular estadísticas
                const hoy = new Date();
                const hace7dias = new Date();
                hace7dias.setDate(hoy.getDate() - 7);

                const sesionesCompletadas = historial.filter(s => s.estado === 'Completado');
                const completadasEstaSemana = sesionesCompletadas.filter(s => {
                    const fecha = new Date(s.fecha_inicio || s.fecha); // Ajusta según el formato real
                    if (isNaN(fecha.getTime())) return false; // Manejar fechas inválidas
                    return fecha >= hace7dias && fecha <= hoy;
                });

                const totalMinutosSemana = completadasEstaSemana.reduce((sum, s) => sum + (s.duracion_real || 0), 0);
                const racha = calcularRacha(historial);

                setStats({
                    weekMinutes: Math.round(totalMinutosSemana),
                    completedSessions: sesionesCompletadas.length,
                    streak: racha,
                    effectiveness: sesionesCompletadas.length > 0 ? Math.round((sesionesCompletadas.length / historial.length) * 100) : 0
                });

                // Preparar datos para el gráfico (últimos 7 días)
                const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
                const data = dias.map((dia, i) => {
                    const fecha = new Date(hace7dias);
                    fecha.setDate(hace7dias.getDate() + i);
                    const minutos = completadasEstaSemana
                        .filter(s => {
                            const sFecha = new Date(s.fecha_inicio || s.fecha);
                            return !isNaN(sFecha.getTime()) && sFecha.toDateString() === fecha.toDateString();
                        })
                        .reduce((sum, s) => sum + (s.duracion_real || 0), 0);
                    return { day: dia, minutes: minutos };
                });
                setProgressData(data);
            } catch (err) {
                console.error('Error al cargar historial:', err);
                setStats({ weekMinutes: 0, completedSessions: 0, streak: 0, effectiveness: 0 });
                setProgressData([
                    { day: 'Lun', minutes: 0 },
                    { day: 'Mar', minutes: 0 },
                    { day: 'Mié', minutes: 0 },
                    { day: 'Jue', minutes: 0 },
                    { day: 'Vie', minutes: 0 },
                    { day: 'Sáb', minutes: 0 },
                    { day: 'Dom', minutes: 0 }
                ]);
            } finally {
                setLoadingStats(false);
            }
        };

        cargarDatos();
    }, []);

    // Función auxiliar para calcular racha
    const calcularRacha = (historial) => {
        if (historial.length === 0) return 0;
        const fechasCompletadas = [...new Set(
            historial
                .filter(s => s.estado === 'Completado' && s.fecha_inicio)
                .map(s => new Date(s.fecha_inicio).toDateString())
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

    // Temporizador
    useEffect(() => {
        let interval = null;
        if (isRunning && timer > 0) {
            interval = setInterval(() => setTimer(t => t - 1), 1000);
        } else if (timer === 0 && isRunning) {
            finalizarSesion(true); // Completada por tiempo
        }
        return () => clearInterval(interval);
    }, [isRunning, timer]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const startMeditacion = async () => {
        try {
            // Confirmar inicio con el backend (opcional, solo para validaciones)
            const payload_inicio = { duracion: duracion, tipo_meditacion: tipo };
            await meditacionService.iniciar(payload_inicio);
            // No esperamos un ID de sesión aquí
            setTimer(duracion * 60);
            setIsRunning(true);
            // No necesitamos setSessionId aquí, se generará al guardar
        } catch (err) {
            console.error('Error al iniciar meditación:', err);
            alert(err.response?.data?.error || 'No se pudo iniciar la meditación');
        }
    };

    const finalizarSesion = async (completada = false) => {
        if (!isRunning) return; // Si no está corriendo, no hacer nada

        setIsRunning(false); // Detener temporizador

        try {
            // Calcular duración real (tiempo transcurrido)
            const duracion_planificada = duracion;
            const duracion_real = duracion_planificada * 60 - timer; // Segundos transcurridos

            // Obtener tecnica_id (asumiendo que 'Meditación' tiene un ID fijo o se consulta)
            // Por simplicidad, asumiremos que el frontend conoce el ID de la técnica 'Meditación'
            // Puedes obtenerlo desde un servicio o tenerlo como constante si es fijo
            // const tecnicaId = '...'; // Obtener de forma dinámica o constante
            // Por ahora, asumiremos que se puede obtener o se pasa como parámetro
            // Lo ideal es que el backend lo asigne al encontrar la técnica por nombre
            // Modificamos el servicio para que obtenga la técnica por nombre si es necesario
            // Pero para esta implementación, lo pasamos como parte del payload o lo dejamos en el backend
            // La mejor práctica es que el backend lo asigne. Modificamos el payload para incluir el nombre o ID si es requerido.
            // Lo ideal es que el frontend solo envíe el nombre y el backend lo resuelva.
            // Pero para mantener la consistencia con el modelo, enviamos el ID.
            // Vamos a asumir que el ID de 'Meditación' se obtiene de forma estática o se consulta antes.
            // Por simplicidad, lo dejamos como un parámetro que el backend debe resolver internamente o se lo pasamos si lo tiene el frontend.
            // La opción más limpia es que el backend lo resuelva.
            // Modificamos el servicio backend para que busque la tecnica_id por nombre 'Meditación' si no se provee.
            // Pero para el payload, enviamos nombre o ID. Asumiremos que el frontend puede obtener el ID de 'Meditación'.
            // Vamos a hacer una pequeña modificación en el backend para que asigne la tecnica_id si no se provee o se provee el nombre.
            // Pero por ahora, el payload debe incluir tecnica_id.
            // Supongamos que el frontend tiene una forma de obtener el ID de la técnica 'Meditación'.
            // Por ejemplo, una llamada inicial para obtener los IDs de técnicas comunes.
            // O simplemente lo tiene como constante si no cambia.
            const tecnica_nombre = 'Meditación';
            // En el backend, podemos hacer que si tecnica_id no se provee, busque por nombre 'Meditación'
            // O el frontend debe asegurarse de tener el ID.
            // Vamos a asumir que el frontend tiene una forma de obtener el ID de 'Meditación'.
            // Supongamos que lo obtenemos al cargar la página o se lo pasamos como constante.
            // Por simplicidad en este ejemplo, lo pasamos como constante o lo obtenemos de otra manera.
            // Lo ideal es tener un servicio que obtenga las técnicas y sus IDs.
            // const tecnicaId = await getTecnicaIdByName('Meditación'); // Esta función debería existir o se usa un cache
            // Por ahora, como no tenemos un servicio dedicado, asumiremos que el ID se puede obtener o se lo pasamos.
            // Vamos a modificar el backend para que si tecnica_id no se provee, lo busque por nombre.
            // Entonces, el frontend solo envía el nombre.
            // Modificamos el backend para que acepte tecnica_nombre y resuelva el ID.
            // Opciones:
            // 1- El frontend envía tecnica_nombre y el backend lo resuelve.
            // 2- El frontend ya tiene tecnica_id y lo envía.
            // Opción 1 es más limpia para el frontend.
            // Modificamos el backend para que maneje tecnica_nombre.
            // En el backend, dentro de guardar_sesion_finalizada, si tecnica_id no está, buscar por nombre.
            // Entonces, el payload puede ser:
            const payload_guardar = {
                // tecnica_id: tecnicaId, // Opcional si se envía nombre
                tecnica_nombre: tecnica_nombre, // Enviamos nombre
                duracion_planificada: duracion_planificada,
                duracion_real: Math.floor(duracion_real / 60), // Pasar minutos
                tipo_meditacion: tipo,
                estado: completada ? 'Completado' : 'Cancelado',
                calificacion: completada ? 5 : null
            };

            // Llamar al nuevo endpoint para guardar la sesión
            await meditacionService.guardar(payload_guardar);

            // Opcional: Recargar historial/stats después de guardar
            // cargarDatos(); // Si se quiere refrescar inmediatamente

        } catch (err) {
            console.error('Error al guardar meditación:', err);
            alert(err.response?.data?.error || 'Error al guardar la sesión');
            // Opcional: manejar error, tal vez reintentar o mostrar mensaje más específico
        } finally {
            // Resetear estado de la sesión local
            setTimer(duracion * 60);
            // sessionId ya no es necesario mantenerlo como estado global para la sesión activa
        }
    };

    const resetTimer = () => {
        if (isRunning) {
            finalizarSesion(false); // Cancelar si está corriendo
        } else {
            // Si no está corriendo, solo resetear el temporizador visual
            setTimer(duracion * 60);
        }
    };

    return (
        <div className="meditacion-app">
            <div className="container">
                <div className="header">
                    <h1 className="header-title">{t('meditation')}</h1>
                    <p className="header-subtitle">
                        {t('tech_meditation.desc', 'Sesiones guiadas con biofeedback y adaptación en tiempo real.')}
                    </p>
                </div>

                {/* Mostrar loader de estadísticas si están cargando */}
                {loadingStats ? (
                    <div className="stats-grid">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="stat-card" style={{ opacity: 0.6 }}>
                                <div className="stat-value">--</div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon purple"><Clock /></div>
                            <div className="stat-value">{stats.weekMinutes}min</div>
                            <div className="stat-label">{t('this_week')}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon pink"><Calendar /></div>
                            <div className="stat-value">{stats.completedSessions}</div>
                            <div className="stat-label">Sesiones</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon blue"><Droplet /></div>
                            <div className="stat-value">{stats.streak}</div>
                            <div className="stat-label">Días seguidos</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon purple"><Star /></div>
                            <div className="stat-value">{stats.effectiveness}%</div>
                            <div className="stat-label">Efectividad</div>
                        </div>
                    </div>
                )}

                <div className="tabs-container">
                    <div className="tabs-header">
                        <button className={`tab-button ${activeTab === 'active' ? 'active' : ''}`} onClick={() => setActiveTab('active')}>
                            {t('session_active')}
                        </button>
                        <button className={`tab-button ${activeTab === 'progress' ? 'active' : ''}`} onClick={() => setActiveTab('progress')}>
                            {t('my_progress')}
                        </button>
                    </div>

                    <div className="tabs-content">
                        {activeTab === 'active' && (
                            <div className="session-active">
                                <h2 className="session-title">
                                    Meditación {tipo === 'mindfulness' ? 'Mindfulness' : tipo === 'respiracion' ? 'Respiración' : 'Body Scan'}
                                </h2>
                                <p className="session-subtitle">Relájate durante {duracion} minutos</p>

                                <div className="timer-circle">
                                    <div className="timer-time">{formatTime(timer)}</div>
                                    <div className="timer-label">{t('meditation')}</div>
                                </div>

                                <div className="session-controls">
                                    <label>Tipo de meditación</label>
                                    <select value={tipo} onChange={e => setTipo(e.target.value)} className="control-select" disabled={isRunning}>
                                        <option value="mindfulness">Mindfulness</option>
                                        <option value="respiracion">Respiración</option>
                                        <option value="body_scan">Body Scan</option>
                                    </select>
                                    <label>Duración (minutos)</label>
                                    <input
                                        type="range"
                                        min="5"
                                        max="30"
                                        value={duracion}
                                        onChange={e => {
                                            const val = Number(e.target.value);
                                            setDuracion(val);
                                            if (!isRunning) setTimer(val * 60);
                                        }}
                                        className="duration-slider"
                                        disabled={isRunning}
                                    />
                                    <span>{duracion} min</span>
                                </div>

                                <div className="button-group">
                                    {!isRunning ? (
                                        <button onClick={startMeditacion} className="button button-primary">
                                            <Play /> {t('start')}
                                        </button>
                                    ) : (
                                        <button onClick={() => finalizarSesion(false)} className="button button-secondary">
                                            Finalizar ahora
                                        </button>
                                    )}
                                    <button onClick={resetTimer} className="button button-secondary">
                                        <RotateCcw /> {t('reset')}
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'progress' && (
                            <div>
                                <h3 className="chart-title">Progreso Semanal</h3>
                                <ResponsiveContainer width="100%" height={250}>
                                    <LineChart data={progressData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="day" stroke="#666" />
                                        <YAxis stroke="#666" />
                                        <Tooltip />
                                        <Line
                                            type="monotone"
                                            dataKey="minutes"
                                            stroke="#ec4899"
                                            strokeWidth={3}
                                            dot={{ fill: '#ec4899', r: 6 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style jsx>{`
        .meditacion-app {
          min-height: 100vh;
          background: linear-gradient(135deg, #faf5ff 0%, #fef3f9 50%, #f0f9ff 100%);
          padding: 32px;
        }
        .container { max-width: 1400px; margin: 0 auto; }
        .header { margin-bottom: 24px; }
        .header-title { font-size: 28px; font-weight: 600; color: #c5c5c5; margin-bottom: 6px; letter-spacing: -0.5px; }
        .header-subtitle { font-size: 14px; color: #6b7280; font-weight: 400; }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 16px;
          margin: 24px 0;
        }
        .stat-card {
          background: white;
          padding: 16px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          text-align: center;
        }
        .stat-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 10px;
          margin-bottom: 12px;
          color: white;
        }
        .stat-icon.purple { background: #7c3aed; }
        .stat-icon.pink { background: #ec4899; }
        .stat-icon.blue { background: #3b82f6; }
        .stat-value {
          font-size: 24px;
          font-weight: 700;
          margin: 8px 0;
        }
        .stat-label {
          color: #666;
          font-size: 14px;
        }

        .tabs-container {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
        .tabs-header {
          display: flex;
          border-bottom: 2px solid #f0f0f0;
          margin-bottom: 24px;
        }
        .tab-button {
          padding: 12px 24px;
          border: none;
          background: transparent;
          color: #666;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          margin-bottom: -2px;
        }
        .tab-button:hover {
          color: #9333ea;
          background: #faf5ff;
        }
        .tab-button.active {
          color: #9333ea;
          border-bottom-color: #9333ea;
          background: transparent;
        }
        .tabs-content {
          padding: 20px 0;
        }

        .session-active {
          text-align: center;
        }
        .session-title {
          font-size: 22px;
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 6px;
        }
        .session-subtitle {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 40px;
        }
        .timer-circle {
          width: 280px;
          height: 280px;
          margin: 0 auto;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background: #f9fafb;
          border: 2px solid #e5e7eb;
          margin-bottom: 24px;
          transition: all 0.3s;
        }
        .timer-time {
          font-size: 56px;
          font-weight: 700;
          color: #111;
        }
        .timer-label {
          font-size: 18px;
          color: #555;
          margin-top: 8px;
        }

        .session-controls {
          margin: 24px 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: center;
        }
        .control-select, .duration-slider {
          width: 100%;
          max-width: 320px;
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid #ddd;
        }
        .duration-slider {
          -webkit-appearance: none;
          height: 6px;
          background: #e0e0e0;
          border-radius: 3px;
        }
        .duration-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #9333ea;
          cursor: pointer;
        }

        .button-group {
          display: flex;
          justify-content: center;
          gap: 16px;
          flex-wrap: wrap;
          margin-top: 24px;
        }
        .button {
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: none;
          cursor: pointer;
        }
        .button-primary {
          background: linear-gradient(135deg, #7c3aed, #667eea);
          color: white;
        }
        .button-secondary {
          background: #f3f4f6;
          color: #333;
        }
        .button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .chart-title {
          font-size: 18px;
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 16px;
          text-align: center;
        }

        @media (max-width: 600px) {
          .meditacion-app { padding: 16px; }
          .header-title { font-size: 24px; }
          .timer-circle { width: 220px; height: 220px; }
          
          .timer-time { font-size: 44px; }
          .stats-grid { grid-template-columns: 1fr; }
          .session-controls { max-width: 100%; }
        }
      `}</style>
        </div>
    );
}
