// src/pages/PlanViaje.jsx
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { list as listAgenda } from "../services/agenda.service";
import { list as listEventos } from "../services/eventos.service";
import "../styles/pages/plan-de-viaje.css";

const DEMO_USER_ID = "demo-user";

export default function PlanViaje() {
  const agenda = listAgenda(DEMO_USER_ID); // [{idEvento, fecha, nota}]

  const eventosIndex = useMemo(() => {
    const index = {};
    listEventos().forEach((ev) => {
      index[ev.id] = ev;
    });
    return index;
  }, []);

  const items = (agenda || [])
    .map((item) => {
      const ev = eventosIndex[item.idEvento];
      if (!ev) return null;
      return { ...item, evento: ev };
    })
    .filter(Boolean)
    .sort((a, b) => String(a.fecha || "").localeCompare(String(b.fecha || "")));

  return (
    <main className="page-plan container">
      <header className="page-plan__header">
        <h1>Plan de viaje</h1>
        <p>
          Este resumen se arma a partir de los eventos que añadiste en tu
          agenda.
        </p>
      </header>

      {items.length === 0 && (
        <p className="page-plan__empty">
          Aún no tienes eventos en tu agenda. Ve a la Home, abre un evento y usa
          “Agregar a mi agenda”.
        </p>
      )}

      {items.length > 0 && (
        <>
          <section className="page-plan__summary">
            <div>
              <h2>Total de paradas</h2>
              <p>{items.length}</p>
            </div>
            <div>
              <h2>Primera fecha</h2>
              <p>{items[0].fecha || "—"}</p>
            </div>
            <div>
              <h2>Última fecha</h2>
              <p>{items[items.length - 1].fecha || "—"}</p>
            </div>
          </section>

          <section className="page-plan__list">
            {items.map((it) => (
              <article key={it.idEvento} className="plan-card">
                <header>
                  <h3>{it.evento.titulo || it.evento.ciudad}</h3>
                  <p className="plan-card__meta">
                    {it.evento.ciudad} · {it.fecha}
                  </p>
                </header>
                {it.nota && (
                  <p className="plan-card__note">Nota: {it.nota}</p>
                )}
                <footer className="plan-card__footer">
                  <Link
                    to={`/evento/${it.idEvento}`}
                    className="btn btn--ghost"
                  >
                    Ver detalle
                  </Link>
                </footer>
              </article>
            ))}
          </section>
        </>
      )}

      <footer className="page-plan__footer">
        <button className="btn btn--secondary" disabled>
          Exportar a PDF (próximamente)
        </button>
        <Link className="btn btn--ghost" to="/home">
          Volver a inicio
        </Link>
      </footer>
    </main>
  );
}
