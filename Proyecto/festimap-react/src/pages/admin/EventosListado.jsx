// src/pages/admin/EventosListado.jsx
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { list as listEventos } from "../../services/eventos.service";
import "../../styles/pages/admin/eventos-listado.css";

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
                    : "status-badge status-draft";

    return <span className={cls}>{statusLabel(status)}</span>;
}

export default function AdminEventosListado() {
    // Cargamos eventos; en esta versión el cambio de estado es solo en memoria (demo)
    const [eventos, setEventos] = useState(() =>
        listEventos().map((e) => ({
            ...e,
            status: e.status || "draft",
        }))
    );

    // Filtros
    const [q, setQ] = useState("");
    const [fRegion, setFRegion] = useState("");
    const [fCategoria, setFCategoria] = useState("");
    const [fStatus, setFStatus] = useState("");

    // Selección de filas (checkboxes)
    const [seleccionados, setSeleccionados] = useState(() => new Set());

    // Opciones para selects
    const regiones = useMemo(
        () =>
            Array.from(
                new Set(eventos.map((e) => e.region).filter(Boolean))
            ).sort(),
        [eventos]
    );

    const categorias = useMemo(
        () =>
            Array.from(
                new Set(
                    eventos
                        .map((e) => e.categoria || e.tema)
                        .filter(Boolean)
                )
            ).sort(),
        [eventos]
    );

    const estados = useMemo(
        () =>
            Array.from(
                new Set(eventos.map((e) => e.status || "draft"))
            ).sort(),
        [eventos]
    );

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

    // Acciones masivas (solo en memoria, modo demo)
    function updateStatusSeleccionados(nuevoStatus) {
        if (!haySeleccion) return;
        if (
            !window.confirm(
                `¿Cambiar el estado de ${seleccionados.size} evento(s) a "${statusLabel(
                    nuevoStatus
                )}"?`
            )
        )
            return;

        setEventos((prev) =>
            prev.map((e) =>
                seleccionados.has(e.id) ? { ...e, status: nuevoStatus } : e
            )
        );
    }

    function eliminarSeleccionados() {
        if (!haySeleccion) return;
        if (
            !window.confirm(
                `¿Eliminar ${seleccionados.size} evento(s)? Esta acción no se guarda de forma permanente (demo).`
            )
        )
            return;

        setEventos((prev) => prev.filter((e) => !seleccionados.has(e.id)));
        setSeleccionados(new Set());
    }

    function eliminarFila(id) {
        if (!window.confirm("¿Eliminar este evento? (solo demo, no permanente)"))
            return;
        setEventos((prev) => prev.filter((e) => e.id !== id));
        setSeleccionados((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
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
                    Programar
                </button>
                <button
                    type="button"
                    className="btn btn-action-unpublish"
                    disabled={!haySeleccion}
                    onClick={() => updateStatusSeleccionados("draft")}
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
                            <th>Visitas</th>
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
                                    <td>{ev.titulo || ev.nombre}</td>
                                    <td>{ev.region || ""}</td>
                                    <td>{ev.ciudad || ""}</td>
                                    <td>{categoria}</td>
                                    <td>{formateaFecha(ev)}</td>
                                    <td>
                                        <StatusBadge status={status} />
                                    </td>
                                    <td>{ev.asistencias ?? "—"}</td>
                                    <td>{ev.rating ?? "—"}</td>
                                    <td>{ev.visitas ?? "—"}</td>
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

            <footer className="footer-row">
                <span>© 2025 FestiMap Ecuador • Administración • Eventos</span>
            </footer>
        </main>
    );
}
