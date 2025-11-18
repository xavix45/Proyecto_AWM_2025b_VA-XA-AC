// src/pages/Tema.jsx
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { list as listEventos, filter as filterEventos } from "../services/eventos.service";
import EventCard from "../components/EventCard.jsx";
import "../styles/pages/tema.css";

const EVENTOS_TODOS = listEventos();

// Sacar lista de temas/categorías distintas
const TEMAS = Array.from(
  new Set(
    EVENTOS_TODOS
      .map((e) => e.tema || e.categoria)
      .filter(Boolean)
  )
).sort();

export default function Tema() {
  const [temaSeleccionado, setTemaSeleccionado] = useState("");

  const eventosFiltrados = useMemo(() => {
    if (!temaSeleccionado) return [];
    return filterEventos({ tema: temaSeleccionado });
  }, [temaSeleccionado]);

  return (
    <main className="page-tema container">
      <header className="page-tema__header">
        <h1>Explorar por tema</h1>
        <p>Filtra los eventos según su tema o categoría principal.</p>
      </header>

      <section className="page-tema__filters">
        <label htmlFor="tema-select">Tema</label>
        <select
          id="tema-select"
          value={temaSeleccionado}
          onChange={(e) => setTemaSeleccionado(e.target.value)}
        >
          <option value="">Seleccione un tema…</option>
          {TEMAS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </section>

      {!temaSeleccionado && (
        <p className="page-tema__hint">
          Elige un tema en el selector para ver los eventos asociados.
        </p>
      )}

      {temaSeleccionado && eventosFiltrados.length === 0 && (
        <p className="page-tema__empty">
          No encontramos eventos para el tema seleccionado.
        </p>
      )}

      {temaSeleccionado && eventosFiltrados.length > 0 && (
        <section className="page-tema__grid">
          {eventosFiltrados.map((ev) => (
            <EventCard key={ev.id} evento={ev} />
          ))}
        </section>
      )}

      <footer className="page-tema__footer">
        <Link className="btn btn--ghost" to="/home">
          Volver a inicio
        </Link>
      </footer>
    </main>
  );
}
