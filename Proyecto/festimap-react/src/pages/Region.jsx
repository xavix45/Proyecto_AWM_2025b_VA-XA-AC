// src/pages/Region.jsx
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { list as listEventos, filter as filterEventos } from "../services/eventos.service";
import EventCard from "../components/EventCard.jsx";
import "../styles/pages/region.css";

const EVENTOS_TODOS = listEventos();

// Sacar lista de regiones distintas
const REGIONES = Array.from(
  new Set(
    EVENTOS_TODOS
      .map((e) => e.region)
      .filter(Boolean)
  )
).sort();

export default function Region() {
  const [regionSeleccionada, setRegionSeleccionada] = useState("");

  const eventosFiltrados = useMemo(() => {
    if (!regionSeleccionada) return [];
    return filterEventos({ region: regionSeleccionada });
  }, [regionSeleccionada]);

  return (
    <main className="page-region container">
      <header className="page-region__header">
        <h1>Explorar por región</h1>
        <p>Selecciona una región del Ecuador para ver los eventos culturales asociados.</p>
      </header>

      <section className="page-region__filters">
        <label htmlFor="region-select">Región</label>
        <select
          id="region-select"
          value={regionSeleccionada}
          onChange={(e) => setRegionSeleccionada(e.target.value)}
        >
          <option value="">Seleccione una región…</option>
          {REGIONES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </section>

      {!regionSeleccionada && (
        <p className="page-region__hint">
          Elige una región en el selector para ver los eventos disponibles.
        </p>
      )}

      {regionSeleccionada && eventosFiltrados.length === 0 && (
        <p className="page-region__empty">
          No encontramos eventos para la región seleccionada.
        </p>
      )}

      {regionSeleccionada && eventosFiltrados.length > 0 && (
        <section className="page-region__grid">
          {eventosFiltrados.map((ev) => (
            <EventCard key={ev.id} evento={ev} />
          ))}
        </section>
      )}

      <footer className="page-region__footer">
        <Link className="btn btn--ghost" to="/home">
          Volver a inicio
        </Link>
      </footer>
    </main>
  );
}
