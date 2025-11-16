// src/pages/admin/AdminEstadisticas.jsx
import "../../styles/pages/admin/admin-estadisticas.css";
import { list as listEventos } from "../../services/eventos.service";

export default function AdminEstadisticas() {
    const eventos = listEventos();

    const totalEventos = eventos.length;

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

    const maxTemaCount =
        temasArray.reduce((max, [, count]) => (count > max ? count : max), 0) || 1;
    const maxMesCount =
        mesesArray.reduce((max, [, count]) => (count > max ? count : max), 0) || 1;

    return (
        <main className="container admin-stats">
            <header className="admin-stats__header">
                <h1>Estadísticas de eventos</h1>
                <p className="admin-stats__subtitle">
                    Resumen rápido basado en el catálogo actual de eventos
                    (incluyendo los administrados).
                </p>
            </header>

            {/* métricas principales */}
            <section className="admin-stats__cards">
                <article className="stat-card">
                    <h2 className="stat-card__label">Eventos activos</h2>
                    <p className="stat-card__value">{totalEventos}</p>
                    <p className="stat-card__hint">
                        Total de eventos disponibles en el sistema.
                    </p>
                </article>

                <article className="stat-card">
                    <h2 className="stat-card__label">Temas distintos</h2>
                    <p className="stat-card__value">{totalTemas}</p>
                    <p className="stat-card__hint">
                        Se agrupan por tema o categoría declarada en el dataset.
                    </p>
                </article>

                <article className="stat-card">
                    <h2 className="stat-card__label">Tema más frecuente</h2>
                    <p className="stat-card__value stat-card__value--small">{temaTop}</p>
                    <p className="stat-card__hint">
                        El tema con mayor número de eventos registrados.
                    </p>
                </article>
            </section>

            {/* distribución por tema */}
            <section className="admin-stats__section">
                <h2>Distribución por tema</h2>
                <p className="admin-stats__section-desc">
                    Cada barra representa cuántos eventos tiene ese tema o categoría.
                </p>

                <div className="stats-list">
                    {temasArray.map(([tema, count]) => (
                        <div key={tema} className="stats-row">
                            <div className="stats-row__label">
                                <span>{tema}</span>
                                <span className="stats-row__count">{count}</span>
                            </div>
                            <div
                                className="stats-row__bar"
                                style={{
                                    "--bar-width": `${(count / maxTemaCount) * 100}%`,
                                }}
                            />
                        </div>
                    ))}

                    {temasArray.length === 0 && (
                        <p className="admin-stats__empty">No hay datos de temas todavía.</p>
                    )}
                </div>
            </section>

            {/* distribución por mes */}
            <section className="admin-stats__section">
                <h2>Distribución por mes</h2>
                <p className="admin-stats__section-desc">
                    Se agrupa por mes según la fecha del evento (YYYY-MM).
                </p>

                <div className="stats-list">
                    {mesesArray.map(([mes, count]) => (
                        <div key={mes} className="stats-row">
                            <div className="stats-row__label">
                                <span>{mes}</span>
                                <span className="stats-row__count">{count}</span>
                            </div>
                            <div
                                className="stats-row__bar stats-row__bar--secondary"
                                style={{
                                    "--bar-width": `${(count / maxMesCount) * 100}%`,
                                }}
                            />
                        </div>
                    ))}

                    {mesesArray.length === 0 && (
                        <p className="admin-stats__empty">
                            No hay fechas registradas en los eventos actuales.
                        </p>
                    )}
                </div>
            </section>
        </main>
    );
}
