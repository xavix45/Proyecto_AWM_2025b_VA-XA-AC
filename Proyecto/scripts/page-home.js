// scripts/page-home.js
// Home: "Hoy y cerca de ti"
// Usa EVENTOS_BASE + EVENTOS_ADMIN para:
//   - Poblar lista de la derecha (#home-list)
//   - Poblar carrusel de la izquierda (#home-slider)

import { EVENTOS as EVENTOS_BASE } from "../data/eventos.js";

const LS_KEY_ADMIN = "EVENTOS_ADMIN";

// ---- Utilidades de datos ----
function cargarEventosAdmin() {
    try {
        return JSON.parse(localStorage.getItem(LS_KEY_ADMIN) || "[]");
    } catch {
        return [];
    }
}

const EVENTOS_ADMIN = cargarEventosAdmin();
const TODOS_EVENTOS = [...EVENTOS_BASE, ...EVENTOS_ADMIN];

// ---- Referencias DOM ----
const listEl = document.getElementById("home-list");
const sliderTrack = document.getElementById("home-slider");

// Barra de búsqueda principal
const searchForm = document.querySelector(".main-search-bar");
const searchInput = document.querySelector(".main-search-bar .input-search");

// Filtros secundarios
const regionSelect = document.getElementById("home-filter-region");
const tipoSelect = document.getElementById("home-filter-tipo");
const dateInput = document.getElementById("home-filter-date");
const chkViaje = document.querySelector('.filters input[type="checkbox"]');

// ---- Helpers ----
function hoyISO() {
    return new Date().toISOString().slice(0, 10);
}

function formateaFecha(ev) {
    if (!ev.fecha) return "";
    if (ev.fecha_fin && ev.fecha_fin !== ev.fecha) {
        return `${ev.fecha} – ${ev.fecha_fin}`;
    }
    return ev.fecha;
}

function lugarTexto(ev) {
    const partes = [];
    if (ev.ciudad) partes.push(ev.ciudad);
    if (ev.provincia) partes.push(ev.provincia);
    if (ev.region) partes.push(ev.region);
    return partes.join(" • ");
}

// ---- Filtros ----
function filtrarEventos() {
    const texto = (searchInput?.value || "").toLowerCase().trim();
    const region = regionSelect && regionSelect.value !== "Región"
        ? regionSelect.value
        : "";
    const tipo = tipoSelect && tipoSelect.value !== "Tipo"
        ? tipoSelect.value
        : "";
    const fechaFiltro = dateInput?.value || "";

    const hoy = hoyISO();

    return TODOS_EVENTOS
        // Solo eventos no pasados
        .filter(ev => {
            if (!ev.fecha) return true;
            return ev.fecha >= hoy;
        })
        .filter(ev => {
            const coincideTexto =
                !texto ||
                (ev.name && ev.name.toLowerCase().includes(texto)) ||
                (ev.ciudad && ev.ciudad.toLowerCase().includes(texto));

            const coincideRegion = !region || ev.region === region;
            const coincideTipo =
                !tipo || ev.categoria === tipo || ev.tipo === tipo;

            let coincideFecha = true;
            if (fechaFiltro) {
                const inicio = ev.fecha;
                const fin = ev.fecha_fin || ev.fecha;
                if (inicio && fin) {
                    coincideFecha = fechaFiltro >= inicio && fechaFiltro <= fin;
                } else if (inicio) {
                    coincideFecha = fechaFiltro === inicio;
                }
            }

            return coincideTexto && coincideRegion && coincideTipo && coincideFecha;
        })
        .sort((a, b) => {
            const fa = a.fecha || "9999-12-31";
            const fb = b.fecha || "9999-12-31";
            return fa.localeCompare(fb);
        });
}

// ---- Pintar lista (columna derecha) ----
function renderLista(lista) {
    if (!listEl) return;
    listEl.innerHTML = "";

    if (!lista.length) {
        listEl.innerHTML =
            `<p class="muted">No se encontraron festividades con esos filtros. Prueba cambiarlos.</p>`;
        return;
    }

    lista.slice(0, 12).forEach(ev => {
        const card = document.createElement("article");
        card.className = "list-card-home";

        card.innerHTML = `
      <div class="list-card-home__image">
        <img src="${ev.imagen || ""}" alt="${ev.name || ""}">
      </div>
      <div class="list-card-home__info">
        <h4>${ev.name || ""}</h4>
        <p class="muted">${formateaFecha(ev)} • ${lugarTexto(ev)}</p>
        <div class="card-actions">
          <a class="btn btn--ghost btn--small"
             href="../pages/detalle-evento.html?id=${ev.id}">
            Ver detalle
          </a>
        </div>
      </div>
    `;

        listEl.appendChild(card);
    });
}

// ---- Pintar carrusel (columna izquierda) ----
function renderCarrusel(lista) {
    if (!sliderTrack) return;
    sliderTrack.innerHTML = "";

    if (!lista.length) return;

    // Tomamos 5–7 eventos destacados
    const destacados = lista.slice(0, 7);

    destacados.forEach(ev => {
        const a = document.createElement("a");
        a.className = "slide";
        a.href = `../pages/detalle-evento.html?id=${ev.id}`;

        a.innerHTML = `
      <img src="${ev.imagen || ""}" alt="${ev.name || ""}">
      <div class="slide-caption">
        <h3>${ev.name || ""}</h3>
        <p>${ev.region || ""}</p>
      </div>
    `;

        sliderTrack.appendChild(a);
    });

    // Opcional: si quieres duplicar las slides para un loop más suave
    // destacados.forEach(ev => { ... crear otra vez ... });
}

// ---- Refresco general ----
function refrescar() {
    const lista = filtrarEventos();
    renderLista(lista);
    renderCarrusel(lista);
}

// ---- Listeners ----
searchForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    refrescar();
});

searchInput?.addEventListener("input", () => {
    refrescar();
});

regionSelect?.addEventListener("change", refrescar);
tipoSelect?.addEventListener("change", refrescar);
dateInput?.addEventListener("change", refrescar);
chkViaje?.addEventListener("change", refrescar);

// ---- Inicio ----
refrescar();
