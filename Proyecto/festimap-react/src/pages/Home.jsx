// src/pages/Home.jsx
import { list as listEventos } from "../services/eventos.service";
import "../styles/pages/home.css";
import EventCard from "../components/EventCard.jsx";

export default function Home() {
  // Obtenemos los eventos desde el servicio (ya preparado para overrides admin)
  const EVENTOS = listEventos();

  return (
    <main className="page-home container">
      <h1>Hogar</h1>

      <div className="grid">
        {EVENTOS.map((ev) => (
          <EventCard key={ev.id} event={ev} />
        ))}
      </div>
    </main>
  );
}
