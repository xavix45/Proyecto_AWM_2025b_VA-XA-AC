// src/pages/Agenda.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
    list as listAgenda,
    remove as removeAgenda,
} from "../services/agenda.service";
import { getById } from "../services/eventos.service";

import "../styles/pages/agenda.css";

const DEMO_USER_ID = "demo-user"; // luego se integra con auth real

function hoyISO() {
    return new Date().toISOString().slice(0, 10);
}

function buildTitulo(ev) {
    return ev.titulo || ev.nombre || ev.name || ev.ciudad || "Evento";
}

function buildLugar(ev) {
    const partes = [];
    if (ev.ciudad) partes.push(ev.ciudad);
    if (ev.provincia) partes.push(ev.provincia);
    if (ev.region) partes.push(ev.region);
    return partes.join(" • ");
}

function buildImagenSrc(ev) {
    const img = ev.imagen;
    if (!img) return "";
    return img.startsWith("http") ? img : `/images/${img}`;
}

export default function Agenda() {
    const [items, setItems] = useState([]);

    const [tab, setTab] = useState("proximos"); // "proximos" | "pasados"
    const [dentroViaje, setDentroViaje] = useState(true);

    const [alert24h, setAlert24h] = useState(true);
    const [alert1h, setAlert1h] = useState(true);
    const [alertCambios, setAlertCambios] = useState(true);
    const [alertNuevos, setAlertNuevos] = useState(true);

    useEffect(() => {
        const data = listAgenda(DEMO_USER_ID);
        setItems(data);
    }, []);

    function handleRemove(idEvento) {
        const next = removeAgenda(DEMO_USER_ID, idEvento);
        setItems(next);
    }

    // Combinamos item de agenda con la info del evento
    const eventosEnAgenda = useMemo(() => {
        return items
            .map((item) => {
                const ev = getById(item.idEvento);
                if (!ev) return null;

                // fecha efectiva para filtros (evento o agenda)
                const fechaEfectiva = ev.fecha || item.fecha || null;

                return {
                    ...item,
                    evento: ev,
                    _fecha: fechaEfectiva,
                };
            })
            .filter(Boolean);
    }, [items]);

    const hoy = hoyISO();

    const proximos = eventosEnAgenda.filter(
        (e) => !e._fecha || e._fecha >= hoy
    );
    const pasados = eventosEnAgenda.filter(
        (e) => e._fecha && e._fecha < hoy
    );

    let listaMostrar = tab === "proximos" ? proximos : pasados;

    // “Dentro de tu viaje”: en este demo lo usamos como filtro extra sobre próximos
    if (dentroViaje && tab === "proximos") {
        listaMostrar = proximos;
    }

    // Alertas demo: tomamos algunos próximos
    const alertas = proximos.slice(0, 5);

    // Estado vacío
    if (eventosEnAgenda.length === 0) {
        return (
            <main className="container section page-agenda">
                <h2 className="page-title">Mi Agenda Cultural</h2>

                <p className="page-agenda__empty">
                    Aún no has agregado eventos a tu agenda.
                </p>

                <div className="page-agenda__actions">
                    <Link className="btn btn--primary" to="/home">
                        Explorar eventos
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="container section page-agenda">
            <h2 className="page-title">Mi Agenda Cultural</h2>

            {/* Controles superiores: tabs + alertas */}
            <div className="agenda-controls">
                <div className="tabs-group">
                    <div className="tabs">
                        <button
                            type="button"
                            className={`tab ${tab === "proximos" ? "is-active" : ""}`}
                            onClick={() => setTab("proximos")}
                        >
                            Próximos
                        </button>
                        <button
                            type="button"
                            className={`tab ${tab === "pasados" ? "is-active" : ""}`}
                            onClick={() => setTab("pasados")}
                        >
                            Pasados
                        </button>
                    </div>

                    <label className="checkbox">
                        <input
                            type="checkbox"
                            checked={dentroViaje}
                            onChange={(e) => setDentroViaje(e.target.checked)}
                        />{" "}
                        Dentro de tu viaje
                    </label>
                </div>

                <div className="alert-options">
                    <span>Alertas:</span>
                    <label className="checkbox">
                        <input
                            id="alert-24h"
                            type="checkbox"
                            checked={alert24h}
                            onChange={(e) => setAlert24h(e.target.checked)}
                        />{" "}
                        24 h
                    </label>
                    <label className="checkbox">
                        <input
                            id="alert-1h"
                            type="checkbox"
                            checked={alert1h}
                            onChange={(e) => setAlert1h(e.target.checked)}
                        />{" "}
                        1 h
                    </label>
                    <label className="checkbox">
                        <input
                            id="alert-cambios"
                            type="checkbox"
                            checked={alertCambios}
                            onChange={(e) => setAlertCambios(e.target.checked)}
                        />{" "}
                        Cambios de evento
                    </label>
                    <label className="checkbox">
                        <input
                            id="alert-nuevos"
                            type="checkbox"
                            checked={alertNuevos}
                            onChange={(e) => setAlertNuevos(e.target.checked)}
                        />{" "}
                        Nuevos cercanos
                    </label>
                </div>
            </div>

            {/* Layout 2 columnas: lista + centro de alertas */}
            <div className="grid-2 grid-agenda">
                {/* Lista de agenda */}
                <section className="agenda-list" id="agenda-list">
                    {listaMostrar.length === 0 ? (
                        <p className="muted" style={{ padding: 16 }}>
                            No hay eventos en esta vista. Prueba cambiando de pestaña o los
                            filtros.
                        </p>
                    ) : (
                        listaMostrar.map(({ idEvento, nota, evento, _fecha }) => {
                            const titulo = buildTitulo(evento);
                            const lugar = buildLugar(evento);
                            const meta = [
                                _fecha || "",
                                lugar ? `• ${lugar}` : "",
                            ]
                                .join(" ")
                                .trim();

                            const imagenSrc = buildImagenSrc(evento);

                            return (
                                <article key={idEvento} className="agenda-item">
                                    {/* Columna 1: info + imagen */}
                                    <div className="agenda-item__info">
                                        <div className="item-text">
                                            <h4>{titulo}</h4>
                                            {meta && <p className="muted">{meta}</p>}
                                        </div>

                                        {imagenSrc && (
                                            <div className="item-image">
                                                <img src={imagenSrc} alt={titulo} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Columna 2: feedback simple (nota) */}
                                    <div className="agenda-item__feedback">
                                        {nota ? (
                                            <p className="agenda-item__note">
                                                <strong>Nota:</strong> {nota}
                                            </p>
                                        ) : (
                                            <p className="agenda-item__note">
                                                Puedes agregar notas a este evento desde las próximas
                                                versiones de la agenda.
                                            </p>
                                        )}
                                    </div>

                                    {/* Columna 3: acciones */}
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
                        })
                    )}
                </section>

                {/* Panel de alertas (derecha) */}
                <aside className="panel alert-center">
                    <h3>Centro de alertas</h3>
                    {alertas.length === 0 ? (
                        <p className="muted" style={{ marginTop: 8 }}>
                            No hay eventos próximos para generar alertas.
                        </p>
                    ) : (
                        <ul className="alert-list" id="alert-list">
                            {alertas.map(({ idEvento, evento, _fecha }) => {
                                const titulo = buildTitulo(evento);
                                const lugar = buildLugar(evento);
                                const meta = [
                                    _fecha || "",
                                    lugar ? `• ${lugar}` : "",
                                ]
                                    .join(" ")
                                    .trim();

                                return (
                                    <li key={idEvento}>
                                        <Link
                                            className="alert-link"
                                            to={`/evento/${idEvento}`}
                                        >
                                            <span>⏰</span>
                                            <div>
                                                <strong>{titulo}</strong>
                                                {meta && (
                                                    <div className="muted" style={{ fontSize: "0.8rem" }}>
                                                        {meta}
                                                    </div>
                                                )}
                                            </div>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </aside>
            </div>
        </main>
    );
}
