import { Link } from "react-router-dom";
import EVENTOS from "../data/eventos.js";
import "../styles/pages/home.css"; // ahora existe (aunque esté vacío)

export default function Home() {
  return (
    <main className="container" style={{ padding: "24px 16px" }}>
      <h1>Hogar</h1>
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
        {EVENTOS.map((ev) => (
          <article key={ev.id} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
            <h3 style={{ margin: "0 0 8px" }}>{ev.titulo ?? ev.ciudad ?? "Evento"}</h3>
            <p style={{ margin: "0 0 12px" }}>
              {(ev.ciudad ? `${ev.ciudad} · ` : "")}{ev.fecha}
            </p>
            <Link className="btn btn--primary" to={`/evento/${ev.id}`}>Ver detalle</Link>
          </article>
        ))}
      </div>
    </main>
  );
}
