// src/pages/Home.jsx
import { list as listEventos } from "../services/eventos.service";
import "../styles/pages/home.css";
import EventCard from "../components/EventCard.jsx";
import { Link } from "react-router-dom";

export default function Home() {
  const EVENTOS = listEventos();

  return (
    <main className="page-home container">
      <h1>Hogar</h1>

      <div style={{ marginBottom: 18, display: 'flex', gap: 12 }}>
        <Link className="btn btn--ghost" to="/agenda">Agenda</Link>
        <Link className="btn btn--ghost" to="/tema">Tema</Link>
      </div>

      <div className="grid">
        {EVENTOS.map((ev) => (
          <EventCard key={ev.id} event={ev} />
        ))}
      </div>
    </main>
  );
}
