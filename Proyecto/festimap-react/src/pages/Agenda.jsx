// src/pages/Agenda.jsx
// PAGINA: Agenda
// Token de búsqueda: PAGE:Agenda
// Página que muestra la "Agenda" del usuario: eventos guardados (por usuario)
// y permite eliminar items. También agrupa próximos/pasados y ofrece exportar
// la lista visible a PDF.
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
    list as listAgenda,
    remove as removeAgenda,
} from "../services/agenda.service";
import { jsPDF } from "jspdf";
import { getById } from "../services/eventos.service";
import ConfirmModal from "../components/ConfirmModal";

import "../styles/pages/agenda.css";

const DEMO_USER_ID = "demo-user"; // fallback

function getCurrentUserId() {
    try {
        const raw = localStorage.getItem('festi_usuario');
        if (raw) {
            const u = JSON.parse(raw);
            if (u && (u.email || u.id)) return u.email || u.id;
        }
    } catch (e) {}
    const email = localStorage.getItem('currentUserEmail');
    if (email) return email;
    return DEMO_USER_ID;
}

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
    const [modal, setModal] = useState({ show: false, title: '', message: '', type: 'info', onConfirm: null });

    // Alert checkboxes removed: alert behavior is automatic based on dates

    // Cargar la agenda del usuario al montar el componente.
    useEffect(() => {
        const uid = getCurrentUserId();
        const data = listAgenda(uid);
        setItems(data);
    }, []);

    // Eliminar un evento de la agenda del usuario y actualizar UI.
    function handleRemove(idEvento) {
        const uid = getCurrentUserId();
        const next = removeAgenda(uid, idEvento);
        setItems(next);
    }
    // Combinamos item de agenda con la info del evento
    const eventosEnAgenda = useMemo(() => {
        return items
            .map((item) => {
                const ev = getById(item.idEvento);
                if (!ev) return null;

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

    const proximos = eventosEnAgenda.filter((e) => !e._fecha || e._fecha >= hoy);
    const pasados = eventosEnAgenda.filter((e) => e._fecha && e._fecha < hoy);

    // Contadores para las pestañas
    const countProximos = proximos.length;
    const countPasados = pasados.length;
    // Planes guardados (marcados por PlanViaje con `isPlan`)
    const plans = eventosEnAgenda.filter((e) => e.isPlan);
    const countPlans = plans.length;

    let listaMostrar = tab === "proximos" ? proximos : pasados;
    if (tab === "planes") {
        listaMostrar = plans;
    }

    // Para la vista 'proximos' agrupamos en Hoy / Esta semana / Próximos (>7 días)
    const groupedProximos = (() => {
        const sections = { hoy: [], semana: [], proximos: [] };
        const ahora = new Date();
        const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());

        proximos.forEach((item) => {
            const fechaStr = item._fecha || item.evento?.fecha;
            if (!fechaStr) {
                sections.proximos.push(item);
                return;
            }
            const fecha = new Date(fechaStr);
            if (Number.isNaN(fecha.getTime())) {
                sections.proximos.push(item);
                return;
            }
            const diffMs = fecha.getTime() - inicioHoy.getTime();
            const dias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            if (dias === 0) sections.hoy.push(item);
            else if (dias >= 1 && dias <= 7) sections.semana.push(item);
            else sections.proximos.push(item);
        });

        return sections;
    })();

    // Alertas demo: tomamos algunos próximos
    const alertas = proximos.slice(0, 5);

    // Exportar la lista mostrada a PDF
    function handleExportCurrentList() {
        const lista = (tab === 'proximos') ? proximos : (tab === 'pasados' ? pasados : plans);
        if (!lista || lista.length === 0) {
            setModal({
                show: true,
                title: '⚠️ Sin Eventos',
                message: 'No hay eventos en la vista seleccionada para exportar.',
                type: 'warning',
                onConfirm: () => setModal({ show: false, title: '', message: '', type: 'info', onConfirm: null })
            });
            return;
        }

        const doc = new jsPDF({ unit: 'mm', format: 'a4' });
        doc.setFontSize(16);
        doc.text('Mi Agenda FestiMap', 14, 16);
        doc.setFontSize(11);
        doc.text(`Sección: ${tab}`, 14, 24);

        let y = 34;
        const lineHeight = 7;

        lista.forEach((item, idx) => {
            if (y > 270) {
                doc.addPage();
                y = 20;
            }
            const ev = item.evento || {};
            const titulo = buildTitulo(ev);
            const fecha = item._fecha || item.fecha || ev.fecha || '';
            const lugar = buildLugar(ev) || '';

            doc.setFontSize(12);
            doc.text(`${idx + 1}. ${titulo}`, 14, y);
            y += lineHeight;
            doc.setFontSize(10);
            if (fecha) { doc.text(`Fecha: ${fecha}`, 18, y); y += lineHeight; }
            if (lugar) { doc.text(`Lugar: ${lugar}`, 18, y); y += lineHeight; }
            y += 3;
        });

        doc.save('FestiMap_Agenda.pdf');
    }

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
    // Helper to render the agenda list (keeps JSX balanced)
    function renderLista() {
        if (listaMostrar.length === 0) {
            return (
                <p className="muted" style={{ padding: 16 }}>
                    No hay eventos en esta vista. Prueba cambiando de pestaña o los
                    filtros.
                </p>
            );
        }

        if (tab === 'proximos') {
            return (
                <>
                    {groupedProximos.hoy.length > 0 && (
                        <div className="section-group">
                            <h4 className="section-group__title">Hoy ({groupedProximos.hoy.length})</h4>
                            {groupedProximos.hoy.map(({ idEvento, nota, evento, _fecha }) => {
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
                                    <article key={idEvento} className={`agenda-item is-soon`}>
                                        <div className="agenda-item__info">
                                            <div className="item-text">
                                                <span className="badge badge--today">Hoy</span>
                                                <h4>{titulo}</h4>
                                                {meta && <p className="muted">{meta}</p>}
                                            </div>
                                            {imagenSrc && (
                                                <div className="item-image">
                                                    <img src={imagenSrc} alt={titulo} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="agenda-item__feedback">
                                            {nota ? (
                                                <p className="agenda-item__note"><strong>Nota:</strong> {nota}</p>
                                            ) : (
                                                <p className="agenda-item__note">Puedes agregar notas a este evento desde las próximas versiones de la agenda.</p>
                                            )}
                                        </div>
                                        <div className="agenda-item__actions">
                                            <Link className="btn btn--ghost" to={`/evento/${idEvento}`}>Ver detalle</Link>
                                            <button type="button" className="btn btn--danger" onClick={() => handleRemove(idEvento)}>Quitar</button>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}

                    {groupedProximos.semana.length > 0 && (
                        <div className="section-group">
                            <h4 className="section-group__title">Esta semana ({groupedProximos.semana.length})</h4>
                            {groupedProximos.semana.map(({ idEvento, nota, evento, _fecha }) => {
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
                                    <article key={idEvento} className={`agenda-item is-soon`}>
                                        <div className="agenda-item__info">
                                            <div className="item-text">
                                                <span className="badge badge--soon">Próximo</span>
                                                <h4>{titulo}</h4>
                                                {meta && <p className="muted">{meta}</p>}
                                            </div>
                                            {imagenSrc && (
                                                <div className="item-image">
                                                    <img src={imagenSrc} alt={titulo} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="agenda-item__feedback">
                                            {nota ? (
                                                <p className="agenda-item__note"><strong>Nota:</strong> {nota}</p>
                                            ) : (
                                                <p className="agenda-item__note">Puedes agregar notas a este evento desde las próximas versiones de la agenda.</p>
                                            )}
                                        </div>
                                        <div className="agenda-item__actions">
                                            <Link className="btn btn--ghost" to={`/evento/${idEvento}`}>Ver detalle</Link>
                                            <button type="button" className="btn btn--danger" onClick={() => handleRemove(idEvento)}>Quitar</button>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}

                    {groupedProximos.proximos.length > 0 && (
                        <div className="section-group">
                            <h4 className="section-group__title">Próximos ({groupedProximos.proximos.length})</h4>
                            {groupedProximos.proximos.map(({ idEvento, nota, evento, _fecha }) => {
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
                                    <article key={idEvento} className={`agenda-item`}>
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
                                        <div className="agenda-item__feedback">
                                            {nota ? (
                                                <p className="agenda-item__note"><strong>Nota:</strong> {nota}</p>
                                            ) : (
                                                <p className="agenda-item__note">Puedes agregar notas a este evento desde las próximas versiones de la agenda.</p>
                                            )}
                                        </div>
                                        <div className="agenda-item__actions">
                                            <Link className="btn btn--ghost" to={`/evento/${idEvento}`}>Ver detalle</Link>
                                            <button type="button" className="btn btn--danger" onClick={() => handleRemove(idEvento)}>Quitar</button>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </>
            );
        }

        // Pasados
        return listaMostrar.map(({ idEvento, nota, evento, _fecha }) => {
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

                    <div className="agenda-item__feedback">
                        {nota ? (
                            <p className="agenda-item__note"><strong>Nota:</strong> {nota}</p>
                        ) : (
                            <p className="agenda-item__note">Puedes agregar notas a este evento desde las próximas versiones de la agenda.</p>
                        )}
                    </div>

                    <div className="agenda-item__actions">
                        <Link className="btn btn--ghost" to={`/evento/${idEvento}`}>Ver detalle</Link>
                        <button type="button" className="btn btn--danger" onClick={() => handleRemove(idEvento)}>Quitar</button>
                    </div>
                </article>
            );
        });
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
                            Próximos ({countProximos})
                        </button>
                        <button
                            type="button"
                            className={`tab ${tab === "pasados" ? "is-active" : ""}`}
                            onClick={() => setTab("pasados")}
                        >
                            Pasados ({countPasados})
                        </button>

                        <button
                            type="button"
                            className={`tab ${tab === "planes" ? "is-active" : ""}`}
                            onClick={() => setTab("planes")}
                        >
                            Planes guardados ({countPlans})
                        </button>
                    </div>
                </div>

                    <div className="alert-options">
                        {/* Export current tab to PDF */}
                        <button type="button" className="btn btn--secondary" onClick={() => handleExportCurrentList()}>
                            Exportar PDF
                        </button>
                    </div>
            </div>

            {/* Mapa + lista layout: lista + centro de alertas */}
            <div className="grid-2 grid-agenda">
                {/* Lista de agenda */}
                <section className="agenda-list" id="agenda-list">
                    {renderLista()}
                </section>

                {/* Panel de alertas (derecha) */}
                <aside className="panel alert-center">
                    <h3>Centro de alertas ({alertas.length})</h3>
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

                                const isSoon = (() => {
                                    if (!_fecha) return false;
                                    const fecha = new Date(_fecha);
                                    if (Number.isNaN(fecha.getTime())) return false;
                                    const ahora = new Date();
                                    const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
                                    const diffMs = fecha.getTime() - inicioHoy.getTime();
                                    const dias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                                    return dias >= 0 && dias <= 7;
                                })();

                                return (
                                    <li key={idEvento} className={isSoon ? 'is-soon' : ''}>
                                        <Link
                                            className={`alert-link ${isSoon ? 'is-soon' : ''}`}
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

            {modal.show && (
                <ConfirmModal
                    show={modal.show}
                    title={modal.title}
                    message={modal.message}
                    type={modal.type}
                    onConfirm={modal.onConfirm}
                    onCancel={() => setModal({ show: false, title: '', message: '', type: 'info', onConfirm: null })}
                />
            )}
        </main>
    );
}
