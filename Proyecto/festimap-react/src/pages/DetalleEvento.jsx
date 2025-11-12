import { useParams, Link } from "react-router-dom";
import EVENTOS from "../data/eventos.js";
import "../styles/pages/detalle-evento.css"; // ahora existe

export default function DetalleEvento() {
  const { id } = useParams();
  const evento = EVENTOS.find((e) => String(e.id) === String(id));

  if (!evento) {
    return (
      <main className="container" style={{ padding: "24px 16px" }}>
        <p>Evento no encontrado.</p>
        <Link to="/home">Volver</Link>
      </main>
    );
  }

  return (
    <main className="container" style={{ padding: "24px 16px" }}>
      <h1>{evento.titulo ?? "Detalle del evento"}</h1>
      <p><strong>Fecha:</strong> {evento.fecha}</p>
      {evento.ciudad && <p><strong>Ciudad:</strong> {evento.ciudad}</p>}
      {evento.descripcion && <p style={{ marginTop: 12 }}>{evento.descripcion}</p>}

      {evento.imagen && (
        <img
          src={evento.imagen.startsWith("http") ? evento.imagen : `/images/${evento.imagen}`}
          alt={evento.titulo ?? "Evento"}
          style={{ width: "100%", maxWidth: 720, borderRadius: 12, marginTop: 16 }}
        />
      )}

      <div style={{ marginTop: 16 }}>
        <Link className="btn btn--primary" to="/home">Volver a Home</Link>
      </div>
    </main>
  );
}
