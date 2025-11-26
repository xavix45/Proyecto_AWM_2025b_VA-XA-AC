// src/pages/admin/AdminEstadisticas.jsx
import "../../styles/pages/admin/admin-estadisticas.css";
import { list as listEventos } from "../../services/eventos.service";
import { useState, useEffect } from "react";

export default function AdminEstadisticas() {
    const [eventos, setEventos] = useState(() => listEventos({ admin: true }));
    const [selectedEventId, setSelectedEventId] = useState(null);

    useEffect(() => {
        function handler() {
            setEventos(listEventos({ admin: true }));
        }

        window.addEventListener("fm:eventos:changed", handler);
        return () => window.removeEventListener("fm:eventos:changed", handler);
    }, []);

    // Evento seleccionado para estadísticas detalladas
    const selectedEvent = selectedEventId ? eventos.find(e => e.id === selectedEventId) : null;

    const totalEventos = eventos.length;
    const eventosAprobados = eventos.filter((e) => e.status === "approved").length;
    const eventosPendientes = eventos.filter((e) => e.status === "pending").length;
    const eventosBorrador = eventos.filter((e) => e.status === "draft").length;

    // Conteo por tema/categoría
    const temasMap = {};
    for (const ev of eventos) {
        const tema = ev.tema || ev.categoria || "Sin tema";
        temasMap[tema] = (temasMap[tema] || 0) + 1;
    }
    const temasArray = Object.entries(temasMap).sort((a, b) => b[1] - a[1]);
    const totalTemas = temasArray.length;
    const temaTop = temasArray[0]?.[0] ?? "—";

    // Conteo por mes (YYYY-MM)
    const mesesMap = {};
    for (const ev of eventos) {
        if (!ev.fecha) continue;
        // asumimos formato YYYY-MM-DD, nos quedamos con YYYY-MM
        const mes = String(ev.fecha).slice(0, 7);
        mesesMap[mes] = (mesesMap[mes] || 0) + 1;
    }
    const mesesArray = Object.entries(mesesMap).sort((a, b) =>
        a[0].localeCompare(b[0])
    );

    // Conteo por región
    const regionesMap = {};
    for (const ev of eventos) {
        const region = ev.region || "Sin región";
        regionesMap[region] = (regionesMap[region] || 0) + 1;
    }
    const regionesArray = Object.entries(regionesMap).sort((a, b) => b[1] - a[1]);

    // Distribución por estado
    const estadosData = [
        { label: "Aprobados", count: eventosAprobados, color: "#10b981" },
        { label: "Pendientes", count: eventosPendientes, color: "#f59e0b" },
        { label: "Borrador", count: eventosBorrador, color: "#6b7280" },
    ];

    const maxTemaCount =
        temasArray.reduce((max, [, count]) => (count > max ? count : max), 0) || 1;
    const maxMesCount =
        mesesArray.reduce((max, [, count]) => (count > max ? count : max), 0) || 1;
    const maxRegionCount =
        regionesArray.reduce((max, [, count]) => (count > max ? count : max), 0) || 1;

    // Métricas de tráfico y engagement
    const totalVisitas = eventos.reduce((s, ev) => s + (Number(ev.visitas) || 0), 0);
    const totalAsistencias = eventos.reduce((s, ev) => s + (Number(ev.asistencias) || 0), 0);
    const ratings = eventos.map((ev) => (ev.rating ? Number(ev.rating) : null)).filter(Boolean);
    const avgRating = ratings.length ? Math.round((ratings.reduce((s, r) => s + r, 0) / ratings.length) * 10) / 10 : 0;

    // Top eventos por visitas
    const topByVisitas = eventos
        .slice()
        .sort((a, b) => (Number(b.visitas) || 0) - (Number(a.visitas) || 0))
        .slice(0, 5);

    // Top eventos por rating
    const topByRating = eventos
        .filter((ev) => ev.rating)
        .slice()
        .sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0))
        .slice(0, 5);

    // Cálculo de gráfico circular (donut) para estados
    const totalConEstado = eventosAprobados + eventosPendientes + eventosBorrador;
    const donutData = estadosData.map((item) => ({
        ...item,
        percentage: totalConEstado > 0 ? (item.count / totalConEstado) * 100 : 0,
    }));

    // SVG Donut Chart
    const donutRadius = 80;
    const donutStroke = 20;
    const donutCircumference = 2 * Math.PI * donutRadius;
    let currentOffset = 0;

    return (
        <main className="container admin-stats">
            <header className="admin-stats__header">
                <h1>📊 Dashboard de Estadísticas</h1>
                <p className="admin-stats__subtitle">
                    Análisis completo del tráfico, eventos y engagement de usuarios
                </p>
            </header>

            {/* Selector de vista: General vs Específica */}
            <section className="admin-stats__view-selector">
                <div className="view-selector">
                    <button 
                        className={`view-selector__btn ${!selectedEventId ? 'view-selector__btn--active' : ''}`}
                        onClick={() => setSelectedEventId(null)}
                    >
                        📊 Vista General
                    </button>
                    <div className="view-selector__divider"></div>
                    <select 
                        className="view-selector__dropdown"
                        value={selectedEventId || ""}
                        onChange={(e) => setSelectedEventId(e.target.value ? Number(e.target.value) : null)}
                    >
                        <option value="">🔍 Seleccionar evento específico...</option>
                        {eventos
                            .sort((a, b) => (b.visitas || 0) - (a.visitas || 0))
                            .map(ev => (
                                <option key={ev.id} value={ev.id}>
                                    {ev.name || ev.titulo || ev.nombre} ({ev.visitas || 0} visitas)
                                </option>
                            ))}
                    </select>
                </div>
            </section>

            {/* VISTA GENERAL */}
            {!selectedEventId && (
                <>
                    {/* Tarjetas de métricas principales */}
                    <section className="admin-stats__cards">
                <article className="stat-card stat-card--primary">
                    <div className="stat-card__icon">📅</div>
                    <div className="stat-card__content">
                        <h2 className="stat-card__label">Total Eventos</h2>
                        <p className="stat-card__value">{totalEventos}</p>
                        <p className="stat-card__hint">{eventosAprobados} publicados</p>
                    </div>
                </article>

                <article className="stat-card stat-card--success">
                    <div className="stat-card__icon">👥</div>
                    <div className="stat-card__content">
                        <h2 className="stat-card__label">Total Visitas</h2>
                        <p className="stat-card__value">{totalVisitas.toLocaleString()}</p>
                        <p className="stat-card__hint">Usuarios únicos</p>
                    </div>
                </article>

                <article className="stat-card stat-card--info">
                    <div className="stat-card__icon">✓</div>
                    <div className="stat-card__content">
                        <h2 className="stat-card__label">Asistencias</h2>
                        <p className="stat-card__value">{totalAsistencias.toLocaleString()}</p>
                        <p className="stat-card__hint">Confirmadas</p>
                    </div>
                </article>

                <article className="stat-card stat-card--warning">
                    <div className="stat-card__icon">⭐</div>
                    <div className="stat-card__content">
                        <h2 className="stat-card__label">Rating Promedio</h2>
                        <p className="stat-card__value">{avgRating || "—"}</p>
                        <p className="stat-card__hint">De {ratings.length} valoraciones</p>
                    </div>
                </article>
            </section>

            {/* Gráfico circular de estados + Top eventos */}
            <div className="admin-stats__grid">
                {/* Gráfico de dona - Estados */}
                <section className="admin-stats__section admin-stats__donut-section">
                    <h2>Estado de los Eventos</h2>
                    <div className="donut-chart-container">
                        <svg width="220" height="220" viewBox="0 0 220 220" className="donut-chart">
                            <g transform="translate(110, 110)">
                                {donutData.map((item, idx) => {
                                    const dashArray = `${(item.percentage / 100) * donutCircumference} ${donutCircumference}`;
                                    const dashOffset = -currentOffset;
                                    currentOffset += (item.percentage / 100) * donutCircumference;
                                    
                                    return (
                                        <circle
                                            key={idx}
                                            r={donutRadius}
                                            fill="transparent"
                                            stroke={item.color}
                                            strokeWidth={donutStroke}
                                            strokeDasharray={dashArray}
                                            strokeDashoffset={dashOffset}
                                            transform="rotate(-90)"
                                        />
                                    );
                                })}
                                <text
                                    x="0"
                                    y="0"
                                    textAnchor="middle"
                                    dominantBaseline="central"
                                    fontSize="32"
                                    fontWeight="bold"
                                    fill="#333"
                                >
                                    {totalConEstado}
                                </text>
                                <text
                                    x="0"
                                    y="20"
                                    textAnchor="middle"
                                    fontSize="12"
                                    fill="#666"
                                >
                                    eventos
                                </text>
                            </g>
                        </svg>
                        <div className="donut-legend">
                            {donutData.map((item, idx) => (
                                <div key={idx} className="donut-legend__item">
                                    <span className="donut-legend__color" style={{ backgroundColor: item.color }}></span>
                                    <span className="donut-legend__label">{item.label}</span>
                                    <span className="donut-legend__value">{item.count} ({item.percentage.toFixed(1)}%)</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Top 5 eventos por visitas */}
                <section className="admin-stats__section">
                    <h2>🔥 Top Eventos por Visitas</h2>
                    <div className="top-list">
                        {topByVisitas.length === 0 && (
                            <p className="admin-stats__empty">Aún no hay datos de visitas.</p>
                        )}
                        {topByVisitas.map((ev, idx) => {
                            const maxVisitas = Number(topByVisitas[0]?.visitas) || 1;
                            const width = ((Number(ev.visitas) || 0) / maxVisitas) * 100;
                            return (
                                <div key={ev.id} className="top-item">
                                    <span className="top-item__rank">#{idx + 1}</span>
                                    <div className="top-item__content">
                                        <span className="top-item__name">{ev.name || ev.titulo || ev.nombre}</span>
                                        <div className="top-item__bar-container">
                                            <div className="top-item__bar" style={{ width: `${width}%` }}></div>
                                        </div>
                                    </div>
                                    <span className="top-item__value">{(ev.visitas || 0).toLocaleString()}</span>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </div>

            {/* Distribución por región con barras horizontales */}
            <section className="admin-stats__section">
                <h2>🗺️ Distribución por Región</h2>
                <div className="stats-bars">
                    {regionesArray.map(([region, count]) => {
                        const width = (count / maxRegionCount) * 100;
                        return (
                            <div key={region} className="stats-bar-item">
                                <div className="stats-bar-item__label">
                                    <span>{region}</span>
                                    <span className="stats-bar-item__count">{count} eventos</span>
                                </div>
                                <div className="stats-bar-item__track">
                                    <div className="stats-bar-item__fill" style={{ width: `${width}%` }}></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Distribución por categoría/tema */}
            <section className="admin-stats__section">
                <h2>🎭 Distribución por Categoría</h2>
                <div className="stats-bars">
                    {temasArray.map(([tema, count]) => {
                        const width = (count / maxTemaCount) * 100;
                        return (
                            <div key={tema} className="stats-bar-item">
                                <div className="stats-bar-item__label">
                                    <span>{tema}</span>
                                    <span className="stats-bar-item__count">{count} eventos</span>
                                </div>
                                <div className="stats-bar-item__track">
                                    <div className="stats-bar-item__fill stats-bar-item__fill--secondary" style={{ width: `${width}%` }}></div>
                                </div>
                            </div>
                        );
                    })}
                    {temasArray.length === 0 && (
                        <p className="admin-stats__empty">No hay datos de categorías todavía.</p>
                    )}
                </div>
            </section>

            {/* Línea de tiempo - Eventos por mes */}
            <section className="admin-stats__section">
                <h2>📈 Eventos por Mes (Línea de Tiempo)</h2>
                <div className="timeline-chart">
                    {mesesArray.map(([mes, count]) => {
                        const height = (count / maxMesCount) * 100;
                        return (
                            <div key={mes} className="timeline-bar">
                                <div className="timeline-bar__fill" style={{ height: `${height}%` }}>
                                    <span className="timeline-bar__value">{count}</span>
                                </div>
                                <span className="timeline-bar__label">{mes.slice(5)}</span>
                            </div>
                        );
                    })}
                    {mesesArray.length === 0 && (
                        <p className="admin-stats__empty">No hay fechas registradas en los eventos actuales.</p>
                    )}
                </div>
            </section>

            {/* Top por rating */}
            {topByRating.length > 0 && (
                <section className="admin-stats__section">
                    <h2>⭐ Mejor Valorados</h2>
                    <div className="rating-list">
                        {topByRating.map((ev, idx) => (
                            <div key={ev.id} className="rating-item">
                                <span className="rating-item__rank">#{idx + 1}</span>
                                <span className="rating-item__name">{ev.name || ev.titulo || ev.nombre}</span>
                                <div className="rating-item__stars">
                                    {[...Array(5)].map((_, i) => (
                                        <span key={i} className={i < Math.round(ev.rating) ? "star star--filled" : "star"}>★</span>
                                    ))}
                                </div>
                                <span className="rating-item__value">{Number(ev.rating).toFixed(1)}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}
                </>
            )}

            {/* VISTA ESPECÍFICA POR EVENTO */}
            {selectedEventId && selectedEvent && (
                <div className="event-specific-stats">
                    {/* Encabezado del evento */}
                    <section className="event-header">
                        <div className="event-header__image">
                            {selectedEvent.imagen ? (
                                <img src={selectedEvent.imagen} alt={selectedEvent.name || selectedEvent.titulo} />
                            ) : (
                                <div className="event-header__placeholder">📅</div>
                            )}
                        </div>
                        <div className="event-header__info">
                            <h2>{selectedEvent.name || selectedEvent.titulo || selectedEvent.nombre}</h2>
                            <p className="event-header__meta">
                                <span className="badge badge--category">{selectedEvent.categoria}</span>
                                <span className="badge badge--type">{selectedEvent.tipo}</span>
                                <span className="badge badge--status badge--status-{selectedEvent.status}">
                                    {selectedEvent.status === 'approved' ? '✓ Aprobado' : 
                                     selectedEvent.status === 'pending' ? '⏳ Pendiente' : '📝 Borrador'}
                                </span>
                            </p>
                            <p className="event-header__desc">{selectedEvent.descripcion}</p>
                            <p className="event-header__location">
                                📍 {selectedEvent.ciudad}, {selectedEvent.provincia} • 📆 {selectedEvent.fecha}
                            </p>
                        </div>
                    </section>

                    {/* Métricas del evento específico */}
                    <section className="admin-stats__cards">
                        <article className="stat-card stat-card--info">
                            <div className="stat-card__icon">👁️</div>
                            <div className="stat-card__content">
                                <h2 className="stat-card__label">Visitas</h2>
                                <p className="stat-card__value">{selectedEvent.visitas || 0}</p>
                                <p className="stat-card__hint">Visualizaciones totales</p>
                            </div>
                        </article>

                        <article className="stat-card stat-card--success">
                            <div className="stat-card__icon">✓</div>
                            <div className="stat-card__content">
                                <h2 className="stat-card__label">Asistencias</h2>
                                <p className="stat-card__value">{selectedEvent.asistencias || 0}</p>
                                <p className="stat-card__hint">Usuarios confirmados</p>
                            </div>
                        </article>

                        <article className="stat-card stat-card--warning">
                            <div className="stat-card__icon">⭐</div>
                            <div className="stat-card__content">
                                <h2 className="stat-card__label">Rating</h2>
                                <p className="stat-card__value">{selectedEvent.rating ? Number(selectedEvent.rating).toFixed(1) : '—'}</p>
                                <p className="stat-card__hint">
                                    {selectedEvent.reviews && selectedEvent.reviews.length > 0 
                                        ? `${selectedEvent.reviews.length} valoraciones` 
                                        : 'Sin valoraciones'}
                                </p>
                            </div>
                        </article>

                        <article className="stat-card stat-card--primary">
                            <div className="stat-card__icon">💬</div>
                            <div className="stat-card__content">
                                <h2 className="stat-card__label">Comentarios</h2>
                                <p className="stat-card__value">
                                    {selectedEvent.comentarios ? selectedEvent.comentarios.length : 0}
                                </p>
                                <p className="stat-card__hint">Interacciones</p>
                            </div>
                        </article>
                    </section>

                    {/* Gráfico de engagement del evento */}
                    <div className="admin-stats__grid">
                        <section className="admin-stats__section">
                            <h2>📊 Engagement del Evento</h2>
                            <div className="engagement-bars">
                                <div className="engagement-bar-item">
                                    <span className="engagement-bar-item__label">Visitas</span>
                                    <div className="engagement-bar-item__track">
                                        <div 
                                            className="engagement-bar-item__fill engagement-bar-item__fill--visits" 
                                            style={{ width: '100%' }}
                                        >
                                            <span className="engagement-bar-item__value">{selectedEvent.visitas || 0}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="engagement-bar-item">
                                    <span className="engagement-bar-item__label">Asistencias</span>
                                    <div className="engagement-bar-item__track">
                                        <div 
                                            className="engagement-bar-item__fill engagement-bar-item__fill--attendance" 
                                            style={{ 
                                                width: `${selectedEvent.visitas > 0 
                                                    ? ((selectedEvent.asistencias || 0) / (selectedEvent.visitas || 1)) * 100 
                                                    : 0}%` 
                                            }}
                                        >
                                            <span className="engagement-bar-item__value">{selectedEvent.asistencias || 0}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="engagement-bar-item">
                                    <span className="engagement-bar-item__label">Comentarios</span>
                                    <div className="engagement-bar-item__track">
                                        <div 
                                            className="engagement-bar-item__fill engagement-bar-item__fill--comments" 
                                            style={{ 
                                                width: `${selectedEvent.visitas > 0 
                                                    ? ((selectedEvent.comentarios?.length || 0) / (selectedEvent.visitas || 1)) * 100 
                                                    : 0}%` 
                                            }}
                                        >
                                            <span className="engagement-bar-item__value">
                                                {selectedEvent.comentarios?.length || 0}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tasa de conversión */}
                            <div className="conversion-metrics">
                                <div className="conversion-item">
                                    <span className="conversion-item__label">Tasa de Asistencia</span>
                                    <span className="conversion-item__value">
                                        {selectedEvent.visitas > 0 
                                            ? `${(((selectedEvent.asistencias || 0) / selectedEvent.visitas) * 100).toFixed(1)}%`
                                            : '0%'}
                                    </span>
                                </div>
                                <div className="conversion-item">
                                    <span className="conversion-item__label">Tasa de Interacción</span>
                                    <span className="conversion-item__value">
                                        {selectedEvent.visitas > 0 
                                            ? `${(((selectedEvent.comentarios?.length || 0) / selectedEvent.visitas) * 100).toFixed(1)}%`
                                            : '0%'}
                                    </span>
                                </div>
                            </div>
                        </section>

                        {/* Gráfico circular de distribución de rating */}
                        {selectedEvent.reviews && selectedEvent.reviews.length > 0 && (
                            <section className="admin-stats__section">
                                <h2>⭐ Distribución de Valoraciones</h2>
                                <div className="rating-distribution">
                                    {[5, 4, 3, 2, 1].map(star => {
                                        const count = selectedEvent.reviews.filter(r => Math.round(r.rating) === star).length;
                                        const percentage = (count / selectedEvent.reviews.length) * 100;
                                        return (
                                            <div key={star} className="rating-dist-item">
                                                <span className="rating-dist-item__stars">
                                                    {star} ⭐
                                                </span>
                                                <div className="rating-dist-item__track">
                                                    <div 
                                                        className="rating-dist-item__fill" 
                                                        style={{ width: `${percentage}%` }}
                                                    ></div>
                                                </div>
                                                <span className="rating-dist-item__count">{count}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Lista de comentarios recientes */}
                    {selectedEvent.comentarios && selectedEvent.comentarios.length > 0 && (
                        <section className="admin-stats__section">
                            <h2>💬 Comentarios Recientes</h2>
                            <div className="comments-list">
                                {selectedEvent.comentarios.slice(0, 10).map((comentario, idx) => (
                                    <div key={idx} className="comment-item">
                                        <div className="comment-item__avatar">
                                            {comentario.usuario ? comentario.usuario.charAt(0).toUpperCase() : '?'}
                                        </div>
                                        <div className="comment-item__content">
                                            <div className="comment-item__header">
                                                <span className="comment-item__author">{comentario.usuario || 'Anónimo'}</span>
                                                <span className="comment-item__date">{comentario.fecha || 'Fecha desconocida'}</span>
                                            </div>
                                            <p className="comment-item__text">{comentario.texto}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Lista de reseñas */}
                    {selectedEvent.reviews && selectedEvent.reviews.length > 0 && (
                        <section className="admin-stats__section">
                            <h2>📝 Reseñas ({selectedEvent.reviews.length})</h2>
                            <div className="reviews-list">
                                {selectedEvent.reviews.slice(0, 10).map((review, idx) => (
                                    <div key={idx} className="review-item">
                                        <div className="review-item__header">
                                            <span className="review-item__author">{review.usuario || 'Anónimo'}</span>
                                            <div className="review-item__stars">
                                                {[...Array(5)].map((_, i) => (
                                                    <span key={i} className={i < Math.round(review.rating) ? "star star--filled" : "star"}>★</span>
                                                ))}
                                            </div>
                                        </div>
                                        {review.comentario && (
                                            <p className="review-item__text">{review.comentario}</p>
                                        )}
                                        <span className="review-item__date">{review.fecha || 'Fecha desconocida'}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </main>
    );
}
