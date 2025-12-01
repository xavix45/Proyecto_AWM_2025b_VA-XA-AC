// src/pages/admin/EventosListado.jsx
// PAGINA: AdminEventosListado
// Token de búsqueda: PAGE:AdminEventosListado
// Panel de administración: listado, filtrado y acciones masivas sobre eventos.
// Estados principales: `eventos`, `confirmModal`, `q`, `fRegion`, `fCategoria`, `seleccionados`.
import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { list as listEventos } from "../../services/eventos.service";
import "../../styles/pages/admin/eventos-listado.css";
import "../../styles/pages/admin/confirm-modal.css";

function formateaFecha(ev) {
    if (!ev.fecha) return "";
    if (ev.fecha_fin && ev.fecha_fin !== ev.fecha) {
        return `${ev.fecha} – ${ev.fecha_fin}`;
    }
    return ev.fecha;
}

function statusLabel(status) {
    switch (status) {
        case "approved":
            return "Aprobado";
        case "pending":
            return "Pendiente";
        case "unpublished":
            return "Despublicado";
        case "rejected":
            return "Rechazado";
        default:
            return "Borrador";
    }
}

function StatusBadge({ status }) {
    const cls =
        status === "approved"
            ? "status-badge status-approved"
            : status === "pending"
                ? "status-badge status-pending"
                : status === "rejected"
                    ? "status-badge status-rejected"
                    : status === "unpublished"
                        ? "status-badge status-unpublished"
                        : "status-badge status-draft";

    return <span className={cls}>{statusLabel(status)}</span>;
}

export default function AdminEventosListado() {
    // Cargamos eventos; en esta versión el cambio de estado es solo en memoria (demo)
    const [eventos, setEventos] = useState(() =>
        listEventos({ admin: true }).map((e) => ({
            ...e,
            status: e.status || "draft",
        }))
    );
    
    // Estado para el modal de confirmación personalizado
    const [confirmModal, setConfirmModal] = useState({
        show: false,
        title: '',
        message: '',
        onConfirm: null,
        type: 'info' // 'info', 'warning', 'danger', 'success'
    });

    // Escuchar cambios globales en eventos (persistidos en localStorage)
    useEffect(() => {
        function handler() {
            setEventos(
                listEventos({ admin: true }).map((e) => ({ ...e, status: e.status || "draft" }))
            );
        }

        window.addEventListener("fm:eventos:changed", handler);
        return () => window.removeEventListener("fm:eventos:changed", handler);
    }, []);

    // Filtros
    const [q, setQ] = useState("");
    const [fRegion, setFRegion] = useState("");
    const [fCategoria, setFCategoria] = useState("");
    const [fStatus, setFStatus] = useState("");

    // Selección de filas (checkboxes)
    const [seleccionados, setSeleccionados] = useState(() => new Set());

    // Opciones para selects (combinamos valores detectados con listas por defecto)
    const DEFAULT_REGIONS = ["Sierra", "Costa", "Oriente", "Galápagos"];
    const DEFAULT_CATEGORIES = [
        "Cultural",
        "Gastronomía",
        "Religiosa",
        "Tradición",
        "Naturaleza",
        "Feria / Artesanías",
        "Deporte",
        "Música",
        "Arte",
        "Educación",
        "Patrimonio",
    ];
    const ALL_STATUSES = ["approved", "pending", "draft", "rejected", "unpublished"];

    const regiones = useMemo(() => {
        const detected = Array.from(new Set(eventos.map((e) => e.region).filter(Boolean)));
        return Array.from(new Set([...DEFAULT_REGIONS, ...detected])).sort();
    }, [eventos]);

    const categorias = useMemo(() => {
        const detected = Array.from(new Set(eventos.map((e) => e.categoria || e.tema).filter(Boolean)));
        return Array.from(new Set([...DEFAULT_CATEGORIES, ...detected])).sort();
    }, [eventos]);

    const estados = useMemo(() => {
        // Siempre mostramos la lista completa de estados permitidos
        return ALL_STATUSES;
    }, [eventos]);

    // Lista filtrada
    const filtrados = useMemo(() => {
        const texto = q.trim().toLowerCase();

        return eventos.filter((e) => {
            // texto
            const matchTexto =
                !texto ||
                [
                    e.titulo,
                    e.nombre,
                    e.ciudad,
                    e.region,
                    e.categoria,
                    e.tema,
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase()
                    .includes(texto);

            const matchRegion = !fRegion || e.region === fRegion;
            const cat = e.categoria || e.tema || "";
            const matchCat = !fCategoria || cat === fCategoria;
            const status = e.status || "draft";
            const matchStatus = !fStatus || status === fStatus;

            return matchTexto && matchRegion && matchCat && matchStatus;
        });
    }, [eventos, q, fRegion, fCategoria, fStatus]);

    const idsVisibles = filtrados.map((e) => e.id);
    const allVisibleSelected =
        idsVisibles.length > 0 &&
        idsVisibles.every((id) => seleccionados.has(id));
    const haySeleccion = seleccionados.size > 0;

    // Helpers selección
    function toggleRow(id) {
        setSeleccionados((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    function toggleSelectAllVisible() {
        setSeleccionados((prev) => {
            const next = new Set(prev);
            const allSel = idsVisibles.every((id) => next.has(id));

            if (allSel) {
                idsVisibles.forEach((id) => next.delete(id));
            } else {
                idsVisibles.forEach((id) => next.add(id));
            }
            return next;
        });
    }

    function limpiarFiltros() {
        setQ("");
        setFRegion("");
        setFCategoria("");
        setFStatus("");
    }

    // Acciones masivas con modal personalizado
    async function updateStatusSeleccionados(nuevoStatus) {
        if (!haySeleccion) return;
        
        const statusText = statusLabel(nuevoStatus);
        
        // Mostrar modal de confirmación personalizado
        setConfirmModal({
            show: true,
            title: '🔄 Cambiar Estado',
            message: `¿Cambiar el estado de ${seleccionados.size} evento(s) a "${statusText}"?`,
            type: nuevoStatus === 'approved' ? 'success' : nuevoStatus === 'rejected' || nuevoStatus === 'unpublished' ? 'danger' : 'warning',
            onConfirm: async () => {
                try {
                    for (const id of Array.from(seleccionados)) {
                        await import("../../services/eventos.service").then((mod) => {
                            const ev = eventos.find((e) => e.id === id);
                            if (!ev) return;
                            const updated = { ...ev, status: nuevoStatus };
                            if (mod.updateEvent) mod.updateEvent(id, updated);
                        });
                    }

                    // Actualizar inmediatamente con listEventos({ admin: true })
                    const freshEvents = listEventos({ admin: true }).map((e) => ({ 
                        ...e, 
                        status: e.status || "draft" 
                    }));
                    setEventos(freshEvents);
                    setSeleccionados(new Set());
                    
                    try { window.dispatchEvent(new Event('fm:eventos:changed')); } catch (e) {}
                    setConfirmModal({ show: false, title: '', message: '', onConfirm: null, type: 'info' });
                } catch (err) {
                    console.error('[AdminEventosListado] updateStatusSeleccionados error', err);
                    setConfirmModal({
                        show: true,
                        title: '❌ Error al Actualizar',
                        message: 'No se pudieron actualizar todos los eventos. Revisa la consola para más detalles.',
                        type: 'danger',
                        onConfirm: () => setConfirmModal({ show: false, title: '', message: '', onConfirm: null, type: 'info' })
                    });
                }
            }
        });
    }

    async function eliminarSeleccionados() {
        if (!haySeleccion) return;
        
        setConfirmModal({
            show: true,
            title: '🗑️ Eliminar Eventos',
            message: `¿Eliminar ${seleccionados.size} evento(s)? Esta acción es permanente y no se puede deshacer.`,
            type: 'danger',
            onConfirm: async () => {
                try {
                    for (const id of Array.from(seleccionados)) {
                        await import("../../services/eventos.service").then((mod) => {
                            if (mod.removeEvent) mod.removeEvent(id);
                        });
                    }

                    const freshEvents = listEventos({ admin: true }).map((e) => ({ ...e, status: e.status || "draft" }));
                    setEventos(freshEvents);
                    setSeleccionados(new Set());
                    
                    try { window.dispatchEvent(new Event('fm:eventos:changed')); } catch (e) {}
                    setConfirmModal({ show: false, title: '', message: '', onConfirm: null, type: 'info' });
                } catch (err) {
                    console.error('[AdminEventosListado] eliminarSeleccionados error', err);
                    setConfirmModal({
                        show: true,
                        title: '❌ Error al Eliminar',
                        message: 'No se pudieron eliminar todos los eventos. Revisa la consola para más detalles.',
                        type: 'danger',
                        onConfirm: () => setConfirmModal({ show: false, title: '', message: '', onConfirm: null, type: 'info' })
                    });
                }
            }
        });
    }

    async function eliminarFila(id) {
        const evento = eventos.find(e => e.id === id);
        const nombreEvento = evento ? (evento.name || evento.titulo || evento.nombre) : 'este evento';
        
        setConfirmModal({
            show: true,
            title: '🗑️ Eliminar Evento',
            message: `¿Eliminar "${nombreEvento}"? Esta acción es permanente y no se puede deshacer.`,
            type: 'danger',
            onConfirm: async () => {
                try {
                    const mod = await import("../../services/eventos.service");
                    if (mod.removeEvent) mod.removeEvent(id);
                    
                    const freshEvents = listEventos({ admin: true }).map((e) => ({ ...e, status: e.status || "draft" }));
                    setEventos(freshEvents);
                    setSeleccionados((prev) => {
                        const next = new Set(prev);
                        next.delete(id);
                        return next;
                    });
                    
                    try { window.dispatchEvent(new Event('fm:eventos:changed')); } catch (e) {}
                    setConfirmModal({ show: false, title: '', message: '', onConfirm: null, type: 'info' });
                } catch (err) {
                    console.error('[AdminEventosListado] eliminarFila error', err);
                    setConfirmModal({
                        show: true,
                        title: '❌ Error al Eliminar',
                        message: 'No se pudo eliminar el evento. Revisa la consola para más detalles.',
                        type: 'danger',
                        onConfirm: () => setConfirmModal({ show: false, title: '', message: '', onConfirm: null, type: 'info' })
                    });
                }
            }
        });
    }

    function exportarTablaComoPDF() {
        const table = document.querySelector(".table-admin-events");
        if (!table) return;

        const clone = table.cloneNode(true);

        // quitamos columna de acciones (última)
        clone.querySelectorAll("tr").forEach((tr) => {
            if (tr.lastElementChild) {
                tr.removeChild(tr.lastElementChild);
            }
        });

        const win = window.open("", "_blank");
        if (!win) return;

        win.document.write(`
      <html>
      <head>
        <title>Listado de eventos</title>
        <meta charset="utf-8" />
        <style>
          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            padding: 16px;
          }
          h2 {
            margin-bottom: 12px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
          }
          th, td {
            border: 1px solid #ccc;
            padding: 4px 6px;
            text-align: left;
          }
          th {
            background: #f3f3f3;
          }
        </style>
      </head>
      <body>
        <h2>Listado de eventos</h2>
        ${clone.outerHTML}
      </body>
      </html>
    `);

        win.document.close();
        win.focus();
        win.print();
    }

    const [commentsOpen, setCommentsOpen] = useState(false);
    const [selectedComments, setSelectedComments] = useState([]);
    const [selectedEventTitle, setSelectedEventTitle] = useState("");

    function openCommentsFor(ev) {
        const comments = Array.isArray(ev.comments) ? ev.comments : [];
        setSelectedComments(comments);
        setSelectedEventTitle(ev.titulo || ev.nombre || ev.name || "Evento");
        setCommentsOpen(true);
    }

    function closeComments() {
        setCommentsOpen(false);
        setSelectedComments([]);
        setSelectedEventTitle("");
    }

    return (
        <main className="container section section-admin">
            {/* Toolbar filtros + crear */}
            <div className="toolbar-wrapper">
                <div className="toolbar toolbar--filters">
                    <input
                        className="input input-search-main"
                        type="text"
                        placeholder="Buscar por nombre/ciudad…"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                    />

                    <select
                        className="input"
                        value={fRegion}
                        onChange={(e) => setFRegion(e.target.value)}
                    >
                        <option value="">Región</option>
                        {regiones.map((r) => (
                            <option key={r} value={r}>
                                {r}
                            </option>
                        ))}
                    </select>

                    <select
                        className="input"
                        value={fCategoria}
                        onChange={(e) => setFCategoria(e.target.value)}
                    >
                        <option value="">Categoría</option>
                        {categorias.map((c) => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                    </select>

                    <select
                        className="input"
                        value={fStatus}
                        onChange={(e) => setFStatus(e.target.value)}
                    >
                        <option value="">Estado</option>
                        {estados.map((s) => (
                            <option key={s} value={s}>
                                {statusLabel(s)}
                            </option>
                        ))}
                    </select>

                    <button
                        type="button"
                        className="btn btn--primary"
                        onClick={limpiarFiltros}
                    >
                        Limpiar filtros
                    </button>

                    <button
                        type="button"
                        className="btn btn--ghost"
                        onClick={exportarTablaComoPDF}
                    >
                        Exportar PDF
                    </button>
                </div>

                <Link
                    className="btn btn--primary btn-create-event"
                    to="/admin/evento/nuevo"
                >
                    Crear evento
                </Link>
            </div>

            {/* Barra de acciones masivas */}
            <div className="bulk-actions-bar">
                <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={toggleSelectAllVisible}
                >
                    <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        readOnly
                        style={{ marginRight: 8 }}
                    />
                    Seleccionar todo
                </button>

                <button
                    type="button"
                    className="btn btn-action-approve"
                    disabled={!haySeleccion}
                    onClick={() => updateStatusSeleccionados("approved")}
                >
                    Aprobar
                </button>
                <button
                    type="button"
                    className="btn btn-action-schedule"
                    disabled={!haySeleccion}
                    onClick={() => updateStatusSeleccionados("pending")}
                >
                    Enviar a revisión
                </button>
                <button
                    type="button"
                    className="btn btn-action-unpublish"
                    disabled={!haySeleccion}
                    onClick={() => updateStatusSeleccionados("unpublished")}
                >
                    Despublicar
                </button>
                <button
                    type="button"
                    className="btn btn-action-delete"
                    disabled={!haySeleccion}
                    onClick={eliminarSeleccionados}
                >
                    Eliminar
                </button>
            </div>

            {/* Tabla */}
            <div className="table-responsive-wrapper">
                <table className="table table-admin-events">
                    <thead>
                        <tr>
                            <th>
                                <input
                                    type="checkbox"
                                    checked={allVisibleSelected}
                                    onChange={toggleSelectAllVisible}
                                    title="Seleccionar todo"
                                />
                            </th>
                            <th>Nombre</th>
                            <th>Región</th>
                            <th>Ciudad</th>
                            <th>Categoría</th>
                            <th>Fecha</th>
                            <th>Estado</th>
                            <th>Asist.</th>
                            <th>Rating</th>
                            <th>Comentarios</th>
                            <th>Acc.</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtrados.length === 0 && (
                            <tr>
                                <td colSpan={11} className="muted">
                                    No hay eventos cargados con los filtros actuales.
                                </td>
                            </tr>
                        )}

                        {filtrados.map((ev) => {
                            const categoria = ev.categoria || ev.tema || "";
                            const status = ev.status || "draft";
                            const checked = seleccionados.has(ev.id);
                            const titulo = ev.titulo || ev.nombre || ev.name || "Evento";

                            return (
                                <tr key={ev.id}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            className="row-check"
                                            checked={checked}
                                            onChange={() => toggleRow(ev.id)}
                                        />
                                    </td>
                                    <td>{titulo}</td>
                                    <td>{ev.region || ""}</td>
                                    <td>{ev.ciudad || ""}</td>
                                    <td>{categoria}</td>
                                    <td>{formateaFecha(ev)}</td>
                                    <td>
                                        <StatusBadge status={status} />
                                    </td>
                                    <td>{ev.asistencias ?? "—"}</td>
                                    <td>{ev.rating ?? "—"}</td>
                                    <td>
                                        <button type="button" className="btn btn--ghost" onClick={() => openCommentsFor(ev)}>
                                            Ver comentarios
                                        </button>
                                    </td>
                                    <td className="actions-cell">
                                        <Link
                                            to={`/admin/evento/${ev.id}`}
                                            title="Editar"
                                        >
                                            ✏️
                                        </Link>
                                        <Link
                                            to={`/evento/${ev.id}`}
                                            title="Ver"
                                            target="_blank"
                                        >
                                            👁️
                                        </Link>
                                        <button
                                            type="button"
                                            className="btn-delete"
                                            title="Eliminar"
                                            onClick={() => eliminarFila(ev.id)}
                                        >
                                            🗑️
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Modal simple para mostrar comentarios del evento */}
            {commentsOpen && (
                <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <div className="modal" style={{ background: '#fff', padding: 16, width: 600, maxHeight: '80vh', overflow: 'auto', borderRadius: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <h3 style={{ margin: 0 }}>Comentarios — {selectedEventTitle}</h3>
                            <button className="btn btn--ghost" onClick={closeComments}>Cerrar</button>
                        </div>

                        {selectedComments.length === 0 ? (
                            <p className="muted">No hay comentarios para este evento.</p>
                        ) : (
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                {selectedComments.map((c, idx) => (
                                    <li key={idx} style={{ borderBottom: '1px solid #eee', padding: '8px 0' }}>
                                        <div style={{ fontSize: 14, marginBottom: 4 }}><strong>{c.userId || 'Usuario'}</strong> · <span className="muted">{c.date ? new Date(c.date).toLocaleString() : ''}</span></div>
                                        <div style={{ marginBottom: 4 }}>Valoración: {c.rating ?? '—'}</div>
                                        <div style={{ whiteSpace: 'pre-wrap' }}>{c.text}</div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}

            {/* Modal de confirmación personalizado */}
            {confirmModal.show && (
                <div className="confirm-modal-backdrop">
                    <div className={`confirm-modal confirm-modal--${confirmModal.type}`}>
                        <div className="confirm-modal__header">
                            <h3 className="confirm-modal__title">{confirmModal.title}</h3>
                        </div>
                        <div className="confirm-modal__body">
                            <p className="confirm-modal__message">{confirmModal.message}</p>
                        </div>
                        <div className="confirm-modal__footer">
                            <button 
                                className="btn btn--ghost"
                                onClick={() => setConfirmModal({ show: false, title: '', message: '', onConfirm: null, type: 'info' })}
                            >
                                Cancelar
                            </button>
                            <button 
                                className={`btn btn--${confirmModal.type === 'danger' ? 'danger' : confirmModal.type === 'success' ? 'success' : 'primary'}`}
                                onClick={() => {
                                    if (confirmModal.onConfirm) {
                                        confirmModal.onConfirm();
                                    }
                                }}
                            >
                                Aceptar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <footer className="footer-row">
                <span>© 2025 FestiMap Ecuador • Administración • Eventos</span>
            </footer>
        </main>
    );
}
