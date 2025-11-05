// scripts/admin-listado.js

const LS_KEY = "EVENTOS_ADMIN";
const $ = (s, r = document) => r.querySelector(s);

const tbody = $("#admin-events-body");
const searchInput = $("#search-admin");
const regionSelect = $("#filter-region");
const categorySelect = $("#filter-category");
const statusSelect = $("#filter-status");
const btnFilter = $("#btn-filter");
const btnExport = $("#btn-export");

// Checkbox cabecera + barra
const headCheck = document.querySelector(".table-admin-events thead input[type='checkbox']");
const bulkCheck = document.querySelector(".bulk-actions-bar input[type='checkbox']");

// Botones barra verde
const btnApprove = document.querySelector(".btn-action-approve");
const btnSchedule = document.querySelector(".btn-action-schedule");
const btnUnpublish = document.querySelector(".btn-action-unpublish");
const btnBulkDelete = document.querySelector(".btn-action-delete");

let eventos = [];
let listaActual = []; // último resultado filtrado (sirve para exportar / imprimir)

/* ---------- Utilidades ---------- */
function cargarEventos() {
    try {
        return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    } catch {
        return [];
    }
}

function guardarEventos(arr) {
    localStorage.setItem(LS_KEY, JSON.stringify(arr));
}

function formateaFecha(ev) {
    if (!ev.fecha) return "";
    if (ev.fecha_fin && ev.fecha_fin !== ev.fecha) {
        return `${ev.fecha} – ${ev.fecha_fin}`;
    }
    return ev.fecha;
}

function statusBadge(status) {
    switch (status) {
        case "approved":
            return '<span class="status-badge status-approved">Aprobado</span>';
        case "pending":
            return '<span class="status-badge status-pending">Pendiente</span>';
        case "rejected":
            return '<span class="status-badge status-rejected">Rechazado</span>';
        default:
            return '<span class="status-badge status-draft">Borrador</span>';
    }
}

/* ---------- Pintar filtros ---------- */
function llenarFiltros() {
    const regiones = new Set();
    const categorias = new Set();
    const estados = new Set();

    eventos.forEach(e => {
        if (e.region) regiones.add(e.region);
        if (e.categoria) categorias.add(e.categoria);
        if (e.status) estados.add(e.status);
    });

    // Región
    regiones.forEach(r => {
        const opt = document.createElement("option");
        opt.value = r;
        opt.textContent = r;
        regionSelect.appendChild(opt);
    });

    // Categoría
    categorias.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c;
        opt.textContent = c;
        categorySelect.appendChild(opt);
    });

    // Estado
    estados.forEach(s => {
        const opt = document.createElement("option");
        opt.value = s;
        opt.textContent =
            s === "approved" ? "Aprobado" :
                s === "pending" ? "Pendiente" :
                    s === "rejected" ? "Rechazado" : "Borrador";
        statusSelect.appendChild(opt);
    });
}

/* ---------- Pintar tabla ---------- */
function renderTabla(lista) {
    listaActual = lista;
    tbody.innerHTML = "";

    if (!lista.length) {
        tbody.innerHTML = `<tr><td colspan="11" class="muted">No hay eventos cargados.</td></tr>`;
        return;
    }

    lista.forEach(ev => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
      <td><input type="checkbox" class="row-check" data-id="${ev.id}"></td>
      <td>${ev.name}</td>
      <td>${ev.region || ""}</td>
      <td>${ev.ciudad || ""}</td>
      <td>${ev.categoria || ""}</td>
      <td>${formateaFecha(ev)}</td>
      <td>${statusBadge(ev.status)}</td>
      <td>${ev.asistencias || "—"}</td>
      <td>${ev.rating || "—"}</td>
      <td>${ev.visitas || "—"}</td>
      <td class="actions-cell">
        <a href="evento-formulario.html?id=${ev.id}" title="Editar">✏️</a>
        <a href="../detalle-evento.html?id=${ev.id}&source=admin" title="Ver" target="_blank">👁️</a>
        <button class="btn-delete" data-id="${ev.id}" title="Eliminar">🗑️</button>
      </td>
    `;
        tbody.appendChild(tr);
    });

    // actualiza estado de selección y botones
    actualizarSelecciones();
}

/* ---------- Gestión de selección ---------- */
function actualizarSelecciones() {
    const checks = [...document.querySelectorAll(".row-check")];
    const seleccionados = checks.filter(c => c.checked).length;

    // Checkbox cabecera (thead)
    if (headCheck) {
        headCheck.checked = seleccionados > 0 && seleccionados === checks.length;
        headCheck.indeterminate = seleccionados > 0 && seleccionados < checks.length;
    }

    // Checkbox barra "Seleccionar todo"
    if (bulkCheck) {
        bulkCheck.checked = seleccionados > 0 && seleccionados === checks.length;
    }

    const haySeleccion = seleccionados > 0;

    // Habilitar / deshabilitar botones masivos
    [btnApprove, btnSchedule, btnUnpublish, btnBulkDelete].forEach(b => {
        if (!b) return;
        b.disabled = !haySeleccion;
    });
}

// Devuelve los ids de los eventos seleccionados
function getIdsSeleccionados() {
    return [...document.querySelectorAll(".row-check:checked")]
        .map(c => Number(c.dataset.id));
}

/* ---------- Filtros ---------- */
function aplicarFiltros() {
    const texto = (searchInput.value || "").toLowerCase();
    const reg = regionSelect.value;
    const cat = categorySelect.value;
    const st = statusSelect.value;

    const filtrados = eventos.filter(ev => {
        const coincideTexto =
            !texto ||
            (ev.name && ev.name.toLowerCase().includes(texto)) ||
            (ev.ciudad && ev.ciudad.toLowerCase().includes(texto));

        const coincideRegion = !reg || ev.region === reg;
        const coincideCat = !cat || ev.categoria === cat;
        const coincideStatus = !st || ev.status === st;

        return coincideTexto && coincideRegion && coincideCat && coincideStatus;
    });

    renderTabla(filtrados);
}

/* ---------- Exportar CSV (no se usa por ahora, solo por si luego la necesitas) ---------- */
function exportarCSV() {
    if (!listaActual.length) {
        alert("No hay datos para exportar.");
        return;
    }

    const encabezados = [
        "id", "nombre", "categoria", "tipo", "region", "provincia",
        "ciudad", "lugar", "fecha", "fecha_fin", "horario", "precio", "status"
    ];

    const filas = listaActual.map(ev => [
        ev.id,
        `"${(ev.name || "").replace(/"/g, '""')}"`,
        ev.categoria || "",
        ev.tipo || "",
        ev.region || "",
        ev.provincia || "",
        ev.ciudad || "",
        `"${(ev.lugar || "").replace(/"/g, '""')}"`,
        ev.fecha || "",
        ev.fecha_fin || "",
        ev.horario || "",
        ev.precio || "",
        ev.status || ""
    ].join(","));

    const contenido = [encabezados.join(","), ...filas].join("\n");
    const blob = new Blob([contenido], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "eventos_admin.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/* ---------- Eliminar (icono de cada fila) ---------- */
tbody.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-delete");
    if (!btn) return;

    const id = Number(btn.dataset.id);
    if (!confirm("¿Eliminar este evento?")) return;

    eventos = eventos.filter(ev => ev.id !== id);
    guardarEventos(eventos);
    aplicarFiltros();
});

/* ---------- Cambios en checkboxes ---------- */
// fila individual
tbody.addEventListener("change", (e) => {
    if (e.target.matches(".row-check")) {
        actualizarSelecciones();
    }
});

// cabecera de la tabla
headCheck?.addEventListener("change", () => {
    const checked = headCheck.checked;
    document.querySelectorAll(".row-check").forEach(c => {
        c.checked = checked;
    });
    if (bulkCheck) bulkCheck.checked = checked;
    actualizarSelecciones();
});

// checkbox de la barra "Seleccionar todo"
bulkCheck?.addEventListener("change", () => {
    const checked = bulkCheck.checked;
    document.querySelectorAll(".row-check").forEach(c => {
        c.checked = checked;
    });
    if (headCheck) headCheck.checked = checked;
    actualizarSelecciones();
});

/* ---------- Acciones masivas ---------- */
// Aprobar
btnApprove?.addEventListener("click", () => {
    const ids = getIdsSeleccionados();
    if (!ids.length) return;

    if (!confirm(`Aprobar ${ids.length} evento(s)?`)) return;

    eventos = eventos.map(ev =>
        ids.includes(ev.id) ? { ...ev, status: "approved" } : ev
    );

    guardarEventos(eventos);
    aplicarFiltros();
});

// Programar (marcar como pendiente)
btnSchedule?.addEventListener("click", () => {
    const ids = getIdsSeleccionados();
    if (!ids.length) return;

    if (!confirm(`Marcar ${ids.length} evento(s) como pendientes/programados?`)) return;

    eventos = eventos.map(ev =>
        ids.includes(ev.id) ? { ...ev, status: "pending" } : ev
    );

    guardarEventos(eventos);
    aplicarFiltros();
});

// Despublicar (borrador)
btnUnpublish?.addEventListener("click", () => {
    const ids = getIdsSeleccionados();
    if (!ids.length) return;

    if (!confirm(`Despublicar ${ids.length} evento(s)?`)) return;

    eventos = eventos.map(ev =>
        ids.includes(ev.id) ? { ...ev, status: "draft" } : ev
    );

    guardarEventos(eventos);
    aplicarFiltros();
});

// Eliminar
btnBulkDelete?.addEventListener("click", () => {
    const ids = getIdsSeleccionados();
    if (!ids.length) return;

    if (!confirm(`Eliminar ${ids.length} evento(s)? Esta acción no se puede deshacer.`)) return;

    eventos = eventos.filter(ev => !ids.includes(ev.id));

    guardarEventos(eventos);
    aplicarFiltros();
});

/* ---------- Listeners filtros ---------- */
btnFilter?.addEventListener("click", aplicarFiltros);
searchInput?.addEventListener("input", aplicarFiltros);

/* ---------- Inicio ---------- */
eventos = cargarEventos();
llenarFiltros();
aplicarFiltros();

/* ---------- Exportar / Imprimir tabla (PDF) ---------- */
btnExport?.addEventListener("click", () => {
    const table = document.querySelector(".table-admin-events");
    if (!table) return;

    // Clonamos la tabla para poder modificarla sin tocar la original
    const clone = table.cloneNode(true);

    // Quitamos la columna de Acciones (última columna)
    clone.querySelectorAll("tr").forEach(tr => {
        tr.removeChild(tr.lastElementChild);
    });

    // Creamos una nueva ventana solo con la tabla
    const win = window.open("", "_blank");
    win.document.write(`
    <html>
    <head>
      <title>Listado de eventos</title>
      <meta charset="utf-8">
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
    win.print(); // aquí el navegador permite "Guardar como PDF"
});
