// src/components/EventCard.jsx
// COMPONENT: EventCard
// Search token: COMPONENT:EventCard
// Tarjeta de evento reutilizable para listados y home.
// Props:
//  - `event`: objeto con campos { id, titulo/nombre, ciudad, fecha, descripcion, tema, categoria, region, imagen }
// Uso: buscar `COMPONENT:EventCard` para localizar rápidamente este componente.
import { Link } from "react-router-dom";
import "../styles/pages/home.css";

/**
 * Tarjeta de evento reutilizable.
 * Recibe un objeto "event" con campos típicos:
 * id, titulo, ciudad, fecha, descripcion, tema, region, imagen...
 */
export default function EventCard({ event }) {
    if (!event) return null;

    const {
        id,
        titulo,
        nombre,
        ciudad,
        fecha,
        descripcion,
        tema,
        categoria,
        region,
        imagen,
    } = event;

    // Título de fallback: primero titulo, luego nombre, luego ciudad
    const displayTitle = titulo || nombre || ciudad || "Evento";

    // Texto de meta: ciudad · fecha
    const metaText = `${ciudad ? ciudad + " · " : ""}${fecha || ""}`;

    return (
        <article className="event-card">
            {/* Media opcional (si hay imagen en los datos) */}
            {imagen && (
                <div className="event-card__media">
                    <img
                        src={imagen.startsWith("http") ? imagen : `/images/${imagen}`}
                        alt={displayTitle}
                    />
                </div>
            )}

            <div className="event-card__body">
                <h3 className="event-card__title">{displayTitle}</h3>

                {metaText && (
                    <p className="event-card__meta">
                        {metaText}
                    </p>
                )}

                {/* Tags de tema / región si existen */}
                <div className="event-card__tags">
                    {(tema || categoria) && (
                        <span className="tag tag--tema">
                            {tema || categoria}
                        </span>
                    )}
                    {region && (
                        <span className="tag tag--region">
                            {region}
                        </span>
                    )}
                </div>

                {descripcion && (
                    <p className="event-card__description">
                        {descripcion}
                    </p>
                )}

                <div className="event-card__actions">
                    <Link className="btn btn--primary" to={`/evento/${id}`}>
                        Ver detalle
                    </Link>
                </div>
            </div>
        </article>
    );
}
