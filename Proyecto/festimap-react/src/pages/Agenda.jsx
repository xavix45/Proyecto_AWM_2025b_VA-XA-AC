// src/pages/Agenda.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { list as listAgenda, remove as removeAgenda } from "../services/agenda.service";
import { getById } from "../services/eventos.service";

import "../styles/pages/agenda.css";

const DEMO_USER_ID = "demo-user"; // luego se cambia por el user real de auth.service

export default function Agenda() {
    const [items, setItems] = useState([]);

    useEffect(() => {
        const data = listAgenda(DEMO_USER_ID);
        setItems(data);
    }, []);

    function handleRemove(idEvento) {
        const next = removeAgenda(DEMO_USER_ID, idEvento);
        setItems(next);
    }

    // combinamos cada item de agenda con la info del evento
    const eventosEnAgenda = items
        .map((item) => {
            const ev = getById(item.idEvento);
            if (!ev) return null;
            return { ...item, evento: ev };
        })
        .filter(Boolean);

    if (eventosEnAgenda.length === 0) {
        return (
            <main className="container page-agenda">
                <header className="page-agenda__header">
                    <h1>Mi agenda</h1>
                    <p className="page-agenda__subtitle">
                        Aún no has agregado eventos a tu agenda.
                    </p>
                </header>

                <div className="page-agenda__actions">
                    <Link className="btn btn--primary" to="/home">
                        Explorar eventos
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="container page-agenda">
            <header className="page-agenda__header">
                <h1>Mi agenda</h1>
                <p className="page-agenda__subtitle">
                    Estos son los eventos que has guardado (modo demo).
                </p>
            </header>

            <section className="agenda-list">
                {eventosEnAgenda.map(({ idEvento, fecha, nota, evento }) => {
                    const titulo = evento.titulo || evento.nombre || evento.ciudad || "Evento";
                    const meta = `${evento.ciudad ? evento.ciudad + " · " : ""}${evento.fecha || fecha || ""
                        }`;

                    return (
                        <article key={idEvento} className="agenda-item">
                            <div className="agenda-item__main">
                                <h2 className="agenda-item__title">{titulo}</h2>
                                {meta && <p className="agenda-item__meta">{meta}</p>}

                                {evento.tema && (
                                    <div className="agenda-item__tags">
                                        <span className="tag tag--tema">{evento.tema}</span>
                                        {evento.region && (
                                            <span className="tag tag--region">{evento.region}</span>
                                        )}
                                    </div>
                                )}

                                {nota && (
                                    <p className="agenda-item__note">
                                        <strong>Nota:</strong> {nota}
                                    </p>
                                )}
                            </div>

                            <div className="agenda-item__actions">
                                <Link className="btn btn--ghost" to={`/evento/${idEvento}`}>
                                    Ver detalle
                                </Link>
                                <button
                                    type="button"
                                    className="btn btn--danger"
                                    onClick={() => handleRemove(idEvento)}
                                >
                                    Quitar
                                </button>
                            </div>
                        </article>
                    );
                })}
            </section>

            <div className="page-agenda__actions">
                <Link className="btn btn--ghost" to="/home">
                    Volver a Home
                </Link>
            </div>
        </main>
    );
}
