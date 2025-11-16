// src/pages/DetalleEvento.jsx
import { useParams, Link, useNavigate } from "react-router-dom";
import { getById } from "../services/eventos.service";
import { add as addAgenda } from "../services/agenda.service";
import "../styles/pages/detalle-evento.css";

const DEMO_USER_ID = "demo-user"; // luego Xavi lo reemplaza por el user real

export default function DetalleEvento() {
  const { id } = useParams();
  const navigate = useNavigate();

  const evento = getById(id);

  if (!evento) {
    return (
      <main className="container page-detalle">
        <p>Evento no encontrado.</p>
        <Link className="btn btn--ghost" to="/home">
          Volver a Home
        </Link>
      </main>
    );
  }

  const {
    titulo,
    nombre,
    ciudad,
    fecha,
    descripcion,
    tema,
    categoria,
    region,
    imagen,
    lugar,
  } = evento;

  const displayTitle = titulo || nombre || ciudad || "Detalle del evento";
  const metaText = `${ciudad ? ciudad + " · " : ""}${fecha || ""}`;
  const displayTema = tema || categoria;

  function handleAgregarAgenda() {
    // Fecha por defecto:
    const fechaItem = fecha || new Date().toISOString().slice(0, 10);

    addAgenda(DEMO_USER_ID, {
      idEvento: evento.id,
      fecha: fechaItem,
      nota: "",
    });

    alert("Evento agregado a tu agenda (modo demo).");

    // Más adelante podríamos redirigir:
    // navigate("/agenda");
  }

  return (
    <main className="container page-detalle">
      <div className="detalle-evento">
        {/* Imagen principal si existe */}
        {imagen && (
          <div className="detalle-evento__media">
            <img
              src={imagen.startsWith("http") ? imagen : `/images/${imagen}`}
              alt={displayTitle}
            />
          </div>
        )}

        <div className="detalle-evento__body">
          <h1 className="detalle-evento__title">{displayTitle}</h1>

          {metaText && (
            <p className="detalle-evento__meta">
              {metaText}
            </p>
          )}

          <div className="detalle-evento__tags">
            {displayTema && (
              <span className="tag tag--tema">
                {displayTema}
              </span>
            )}
            {region && (
              <span className="tag tag--region">
                {region}
              </span>
            )}
          </div>

          {lugar && (
            <p className="detalle-evento__lugar">
              <strong>Lugar:</strong> {lugar}
            </p>
          )}

          {descripcion && (
            <p className="detalle-evento__description">
              {descripcion}
            </p>
          )}

          <div className="detalle-evento__actions">
            <button
              type="button"
              className="btn btn--primary"
              onClick={handleAgregarAgenda}
            >
              Agregar a mi agenda
            </button>

            <Link className="btn btn--ghost" to="/home">
              Volver a Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
