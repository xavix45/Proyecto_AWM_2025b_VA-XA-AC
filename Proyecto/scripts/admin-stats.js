// scripts/admin-stats.js
// Usa los datos de EVENTOS_ADMIN desde localStorage para armar el dashboard de reportes.

const LS_KEY_STATS = "EVENTOS_ADMIN";
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const $ = (s, r = document) => r.querySelector(s);

// Filtros
const selRange = $("#stats-range");
const selRegion = $("#stats-region");
const selCategory = $("#stats-category");
const btnApply = $("#stats-apply");
const btnCSV = $("#stats-export-csv");
const btnPDF = $("#stats-export-pdf");

// KPIs
const kpiAsistencias = $("#kpi-asistencias");
const kpiRating = $("#kpi-rating");
const kpiActivos = $("#kpi-activos");
const kpiComments = $("#kpi-comments");

// Gráficos
const graphAsistencias = $("#graph-asistencias");
const graphRating = $("#graph-rating");

// Tablas
const tbodyTopEvents = $("#tbody-top-events");
const tbodyRegionAct = $("#tbody-region-activity");

let eventosBase = [];
let eventosFiltrados = [];

/* ==== Utilidades generales ==== */

function cargarEventosAdmin() {
    try {
        return JSON.parse(localStorage.getItem(LS_KEY_STATS) || "[]");
    } catch {
        return [];
    }
}

function parseFecha(fechaStr) {
    if (!fechaStr) return null;
    const d = new Date(fechaStr);
    return isNaN(d.getTime()) ? null : d;
}

function filtrarPorRangoFecha(lista, rango) {
    if (!rango) return lista; // sin límite

    const hoy = new Date();
    const MS_DIA = 86400000;

    let desde = null;

    if (rango === "7") {
        desde = new Date(hoy.getTime() - 6 * MS_DIA);
    } else if (rango === "30") {
        desde = new Date(hoy.getTime() - 29 * MS_DIA);
    } else if (rango === "month") {
        // Este mes: desde el 1 del mes hasta hoy
        desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    } else {
        return lista;
    }

    return lista.filter(ev => {
        const f = parseFecha(ev.fecha);
        if (!f) return false;
        return f >= desde && f <= hoy;
    });
}

function aplicarFiltros() {
    let lista = [...eventosBase];

    const rango = selRange?.value || "";
    const regionSel = selRegion?.value || "";
    const catSel = selCategory?.value || "";

    // Fecha
    lista = filtrarPorRangoFecha(lista, rango);

    // Región
    if (regionSel && regionSel !== "Todas") {
        lista = lista.filter(ev => ev.region === regionSel);
    }

    // Categoría
    if (catSel && catSel !== "Todas") {
        lista = lista.filter(ev => ev.categoria === catSel);
    }

    eventosFiltrados = lista;
    actualizarDashboard();
}

/* ==== KPIs ==== */

function calcularKPIs(lista) {
    let totalAsist = 0;
    let sumRating = 0;
    let countRating = 0;
    let eventosActivos = 0;
    let totalComments = 0;

    lista.forEach(ev => {
        const asist = Number(ev.asistencias || 0);
        totalAsist += asist;

        const r = Number(ev.rating || 0);
        if (r > 0) {
            sumRating += r;
            countRating++;
        }

        if (ev.status === "approved") {
            eventosActivos++;
        }

        const com = Number(ev.comentariosAprobados || 0);
        totalComments += com;
    });

    const promedioRating = countRating ? (sumRating / countRating) : 0;

    return {
        asistencias: totalAsist,
        rating: promedioRating,
        activos: eventosActivos,
        comentarios: totalComments
    };
}

function renderKPIs(lista) {
    const k = calcularKPIs(lista);

    if (kpiAsistencias) kpiAsistencias.textContent = k.asistencias.toString();
    if (kpiRating) kpiRating.textContent = `${k.rating.toFixed(1)}★`;
    if (kpiActivos) kpiActivos.textContent = k.activos.toString();
    if (kpiComments) kpiComments.textContent = k.comentarios.toString();

    // Las tendencias las dejamos como texto genérico por ahora
    // (podrías compararlas con otro rango si quieres)
}

/* ==== Tablas ==== */

function renderTopEventos(lista) {
    if (!tbodyTopEvents) return;
    tbodyTopEvents.innerHTML = "";

    if (!lista.length) {
        tbodyTopEvents.innerHTML = `
      <tr><td colspan="4" class="muted">No hay eventos para este periodo.</td></tr>
    `;
        return;
    }

    // Ordenar por asistencias descendente
    const ordenados = [...lista].sort((a, b) => (b.asistencias || 0) - (a.asistencias || 0));

    ordenados.slice(0, 5).forEach(ev => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
      <td>${ev.name || "-"}</td>
      <td>${ev.region || "-"}</td>
      <td>${ev.asistencias || 0}</td>
      <td>${ev.rating ? `${ev.rating}★` : "—"}</td>
    `;
        tbodyTopEvents.appendChild(tr);
    });
}

function renderActividadRegion(lista) {
    if (!tbodyRegionAct) return;
    tbodyRegionAct.innerHTML = "";

    if (!lista.length) {
        tbodyRegionAct.innerHTML = `
      <tr><td colspan="3" class="muted">No hay datos para este periodo.</td></tr>
    `;
        return;
    }

    const mapa = new Map(); // region -> { eventos, asistencias }

    lista.forEach(ev => {
        const reg = ev.region || "Sin región";
        if (!mapa.has(reg)) {
            mapa.set(reg, { eventos: 0, asistencias: 0 });
        }
        const obj = mapa.get(reg);
        obj.eventos += 1;
        obj.asistencias += Number(ev.asistencias || 0);
    });

    [...mapa.entries()].forEach(([region, info]) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
      <td>${region}</td>
      <td>${info.eventos}</td>
      <td>${info.asistencias}</td>
    `;
        tbodyRegionAct.appendChild(tr);
    });
}

/* ==== Gráficos simples (barras con <div>) ==== */

function renderGraficoAsistenciasPorSemana(lista) {
    if (!graphAsistencias) return;

    graphAsistencias.innerHTML = "<h3>Asistencias por semana</h3>";

    if (!lista.length) {
        graphAsistencias.innerHTML += `<p class="muted">No hay datos en el rango seleccionado.</p>`;
        return;
    }

    const MS_DIA = 86400000;
    const mapaSemanas = new Map(); // "YYYY-Wn" -> asistencias

    lista.forEach(ev => {
        const f = parseFecha(ev.fecha);
        if (!f) return;

        const year = f.getFullYear();
        const startYear = new Date(year, 0, 1);
        const dayOfYear = Math.floor((f - startYear) / MS_DIA) + 1;
        const week = Math.ceil(dayOfYear / 7);
        const key = `${year}-W${week}`;

        const asist = Number(ev.asistencias || 0);

        mapaSemanas.set(key, (mapaSemanas.get(key) || 0) + asist);
    });

    const items = [...mapaSemanas.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    if (!items.length) {
        graphAsistencias.innerHTML += `<p class="muted">No hay datos de asistencias.</p>`;
        return;
    }

    const maxValor = Math.max(...items.map(([_, v]) => v)) || 1;

    const cont = document.createElement("div");
    cont.style.marginTop = "8px";

    items.forEach(([semana, valor]) => {
        const fila = document.createElement("div");
        fila.style.display = "flex";
        fila.style.alignItems = "center";
        fila.style.marginBottom = "4px";
        fila.style.fontSize = "0.85rem";

        const label = document.createElement("span");
        label.textContent = semana;
        label.style.width = "80px";

        const barWrap = document.createElement("div");
        barWrap.style.flex = "1";
        barWrap.style.background = "#f0f0f0";
        barWrap.style.borderRadius = "999px";
        barWrap.style.overflow = "hidden";
        barWrap.style.marginLeft = "8px";
        barWrap.style.marginRight = "8px";

        const bar = document.createElement("div");
        bar.style.height = "10px";
        bar.style.width = `${(valor / maxValor) * 100}%`;
        bar.style.background = "#2563eb"; // azul (puedes cambiar según tu CSS)
        barWrap.appendChild(bar);

        const num = document.createElement("span");
        num.textContent = valor.toString();

        fila.appendChild(label);
        fila.appendChild(barWrap);
        fila.appendChild(num);

        cont.appendChild(fila);
    });

    graphAsistencias.appendChild(cont);
}

function renderGraficoRatingPorRegion(lista) {
    if (!graphRating) return;

    graphRating.innerHTML = "<h3>Valoración promedio por región</h3>";

    if (!lista.length) {
        graphRating.innerHTML += `<p class="muted">No hay datos en el rango seleccionado.</p>`;
        return;
    }

    const mapa = new Map(); // region -> { sumRating, count }

    lista.forEach(ev => {
        const reg = ev.region || "Sin región";
        const r = Number(ev.rating || 0);
        if (r <= 0) return;

        if (!mapa.has(reg)) {
            mapa.set(reg, { sum: 0, count: 0 });
        }
        const obj = mapa.get(reg);
        obj.sum += r;
        obj.count += 1;
    });

    const items = [...mapa.entries()].map(([reg, { sum, count }]) => ({
        region: reg,
        promedio: count ? sum / count : 0
    })).sort((a, b) => b.promedio - a.promedio);

    if (!items.length) {
        graphRating.innerHTML += `<p class="muted">No hay calificaciones registradas.</p>`;
        return;
    }

    const maxValor = Math.max(...items.map(i => i.promedio)) || 1;

    const cont = document.createElement("div");
    cont.style.marginTop = "8px";

    items.forEach(item => {
        const fila = document.createElement("div");
        fila.style.display = "flex";
        fila.style.alignItems = "center";
        fila.style.marginBottom = "4px";
        fila.style.fontSize = "0.85rem";

        const label = document.createElement("span");
        label.textContent = item.region;
        label.style.width = "80px";

        const barWrap = document.createElement("div");
        barWrap.style.flex = "1";
        barWrap.style.background = "#f0f0f0";
        barWrap.style.borderRadius = "999px";
        barWrap.style.overflow = "hidden";
        barWrap.style.marginLeft = "8px";
        barWrap.style.marginRight = "8px";

        const bar = document.createElement("div");
        bar.style.height = "10px";
        bar.style.width = `${(item.promedio / maxValor) * 100}%`;
        bar.style.background = "#16a34a"; // verde
        barWrap.appendChild(bar);

        const num = document.createElement("span");
        num.textContent = item.promedio.toFixed(1);

        fila.appendChild(label);
        fila.appendChild(barWrap);
        fila.appendChild(num);

        cont.appendChild(fila);
    });

    graphRating.appendChild(cont);
}

/* ==== Exportar ==== */

function exportarCSVStats() {
    if (!eventosFiltrados.length) {
        alert("No hay datos para exportar.");
        return;
    }

    const encabezados = [
        "id", "nombre", "categoria", "tipo", "region",
        "provincia", "ciudad", "fecha", "asistencias", "rating", "status"
    ];

    const filas = eventosFiltrados.map(ev => [
        ev.id,
        `"${(ev.name || "").replace(/"/g, '""')}"`,
        ev.categoria || "",
        ev.tipo || "",
        ev.region || "",
        ev.provincia || "",
        ev.ciudad || "",
        ev.fecha || "",
        ev.asistencias || 0,
        ev.rating || "",
        ev.status || ""
    ].join(","));

    const contenido = [encabezados.join(","), ...filas].join("\n");
    const blob = new Blob([contenido], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "estadisticas_eventos.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function exportarPDFStats() {
    // Imprimimos sólo KPIs + tablas (sin toda la página)
    const kpis = document.querySelector(".kpis");
    const tables = document.querySelector(".table-container");

    const win = window.open("", "_blank");
    win.document.write(`
    <html>
      <head>
        <title>Reporte de eventos</title>
        <meta charset="utf-8">
        <style>
          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            padding: 16px;
          }
          h1 {
            margin-bottom: 16px;
          }
          .kpis {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 12px;
            margin-bottom: 16px;
          }
          .kpi {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 8px 10px;
            font-size: 0.9rem;
          }
          .kpi__label {
            display: block;
            font-weight: 600;
            margin-bottom: 4px;
          }
          .kpi__value {
            font-size: 1.2rem;
            font-weight: 700;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.8rem;
          }
          th, td {
            border: 1px solid #ccc;
            padding: 4px 6px;
          }
          th {
            background: #f3f3f3;
          }
          .table-wrapper {
            margin-bottom: 16px;
          }
        </style>
      </head>
      <body>
        <h1>Reporte de eventos</h1>
        ${kpis ? kpis.outerHTML : ""}
        ${tables ? tables.outerHTML : ""}
      </body>
    </html>
  `);
    win.document.close();
    win.focus();
    win.print(); // el navegador permite "Guardar como PDF"
}

/* ==== Actualizar todo el dashboard ==== */

function actualizarDashboard() {
    renderKPIs(eventosFiltrados);
    renderTopEventos(eventosFiltrados);
    renderActividadRegion(eventosFiltrados);
    renderGraficoAsistenciasPorSemana(eventosFiltrados);
    renderGraficoRatingPorRegion(eventosFiltrados);
}

/* ==== Listeners ==== */

btnApply?.addEventListener("click", aplicarFiltros);
btnCSV?.addEventListener("click", exportarCSVStats);
btnPDF?.addEventListener("click", exportarPDFStats);

// Si quieres que cambie en tiempo real al cambiar filtros:
// selRange?.addEventListener("change", aplicarFiltros);
// selRegion?.addEventListener("change", aplicarFiltros);
// selCategory?.addEventListener("change", aplicarFiltros);

/* ==== Inicio ==== */

document.addEventListener("DOMContentLoaded", () => {
    eventosBase = cargarEventosAdmin();
    eventosFiltrados = [...eventosBase]; // al inicio, sin filtros
    actualizarDashboard();
});
