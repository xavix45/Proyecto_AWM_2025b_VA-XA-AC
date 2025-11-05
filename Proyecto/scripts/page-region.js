// scripts/page-region.js
// Página "Explorar por región":
// - Lee base de eventos (EVENTOS + EVENTOS_ADMIN)
// - Tabs: Costa / Sierra / Amazonía / Galápagos
// - Filtros: provincia, cantón, texto
// - Lista de eventos
// - Mapa real (Google Maps iframe) centrado en el evento seleccionado
// - Si viene con ?id=123, se centra directamente en ese evento

import { EVENTOS as EVENTOS_BASE } from "../data/eventos.js";

const LS_KEY_ADMIN = "EVENTOS_ADMIN";

function cargarEventosAdmin() {
    try {
        return JSON.parse(localStorage.getItem(LS_KEY_ADMIN) || "[]");
    } catch {
        return [];
    }
}

const EVENTOS_ADMIN = cargarEventosAdmin();
const TODOS_EVENTOS = [...EVENTOS_BASE, ...EVENTOS_ADMIN];

/* Utilidades de texto */
function formateaFechas(ev) {
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

/* Construir URL para Google Maps embed */
function buildMapUrl(ev) {
    const hasCoords =
        typeof ev.lat === "number" &&
        typeof ev.lng === "number" &&
        !Number.isNaN(ev.lat) &&
        !Number.isNaN(ev.lng);

    if (hasCoords) {
        // Centrar por coordenadas
        return `https://www.google.com/maps?q=${ev.lat},${ev.lng}&z=13&output=embed`;
    }

    // Fallback: buscar por texto (lugar + ciudad + provincia + Ecuador)
    const query = encodeURIComponent(
        `${ev.lugar || ""} ${ev.ciudad || ""} ${ev.provincia || ""} Ecuador`
    );
    return `https://www.google.com/maps?q=${query}&z=13&output=embed`;
}

/* Referencias DOM */
const tabs = document.querySelectorAll(".tabs .tab");
const provinciaSelect = document.getElementById("f-provincia");
const cantonSelect = document.getElementById("f-canton");
const searchInput = document.getElementById("f-texto");
const btnAplicar = document.getElementById("btn-aplicar-filtros");
const regionTitle = document.getElementById("region-title");
const regionList = document.getElementById("region-list");
const regionWrap = document.getElementById("region-wrap");

const mapIframe = document.getElementById("region-map");
const mapCaption = document.getElementById("map-caption");

/* Leer id de la URL (si viene de Ver en mapa) */
const params = new URLSearchParams(location.search);
const idParam = params.get("id");

let eventoSeleccionado = idParam
    ? TODOS_EVENTOS.find(e => String(e.id) === String(idParam))
    : null;

/* Región actual (tab activo) */
let regionActual = "Sierra";

// Si el evento seleccionado tiene región, usamos esa
if (eventoSeleccionado && eventoSeleccionado.region) {
    regionActual = eventoSeleccionado.region;
}

/* Marcar visualmente el tab activo */
function activarTab(region) {
    tabs.forEach(tab => {
        const tabRegion = tab.dataset.region || tab.textContent.trim();
        if (tabRegion === region) {
            tab.classList.add("is-active");
        } else {
            tab.classList.remove("is-active");
        }
    });

    if (regionTitle) {
        regionTitle.textContent = `Eventos activos en ${region}`;
    }
    if (regionWrap) {
        regionWrap.dataset.region = region;
    }
}

/* Llenar combos de provincia y cantón según región */
function llenarFiltrosRegion() {
    if (!provinciaSelect || !cantonSelect) return;

    const eventosRegion = TODOS_EVENTOS.filter(ev => ev.region === regionActual);

    const provincias = new Set();
    const cantones = new Set();

    eventosRegion.forEach(ev => {
        if (ev.provincia) provincias.add(ev.provincia);
        if (ev.ciudad) cantones.add(ev.ciudad);
    });

    // Provincia
    provinciaSelect.innerHTML = `<option value="">Provincia (todas)</option>`;
    provincias.forEach(p => {
        const opt = document.createElement("option");
        opt.value = p;
        opt.textContent = p;
        provinciaSelect.appendChild(opt);
    });

    // Cantón / Ciudad
    cantonSelect.innerHTML = `<option value="">Cantón / Ciudad (todos)</option>`;
    cantones.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c;
        opt.textContent = c;
        cantonSelect.appendChild(opt);
    });

    // Si tenemos un evento seleccionado en esta región, ajustar filtros
    if (eventoSeleccionado && eventoSeleccionado.region === regionActual) {
        if (eventoSeleccionado.provincia) {
            provinciaSelect.value = eventoSeleccionado.provincia;
        }
        if (eventoSeleccionado.ciudad) {
            cantonSelect.value = eventoSeleccionado.ciudad;
        }
    }
}

/* Renderizar mapa real */
function renderMapa() {
    if (!mapIframe || !mapCaption) return;

    if (!eventoSeleccionado) {
        // Mapa general de Ecuador
        mapIframe.src = "https://www.google.com/maps?q=Ecuador&z=6&output=embed";
        mapCaption.textContent = "Selecciona un evento de la lista para centrar el mapa.";
        return;
    }

    const url = buildMapUrl(eventoSeleccionado);
    mapIframe.src = url;
    mapCaption.textContent = `${eventoSeleccionado.name || ""} • ${lugarTexto(eventoSeleccionado)}`;
}

/* Renderizar lista de eventos */
function renderLista() {
    if (!regionList) return;

    let eventos = TODOS_EVENTOS.filter(ev => ev.region === regionActual);

    const prov = provinciaSelect?.value || "";
    const cant = cantonSelect?.value || "";
    const texto = (searchInput?.value || "").toLowerCase().trim();

    if (prov) {
        eventos = eventos.filter(ev => ev.provincia === prov);
    }
    if (cant) {
        eventos = eventos.filter(ev => ev.ciudad === cant);
    }
    if (texto) {
        eventos = eventos.filter(ev =>
            (ev.name && ev.name.toLowerCase().includes(texto)) ||
            (ev.ciudad && ev.ciudad.toLowerCase().includes(texto))
        );
    }

    regionList.innerHTML = "";

    if (!eventos.length) {
        regionList.innerHTML = `<p class="muted">No hay eventos que coincidan con los filtros.</p>`;
        return;
    }

    eventos.forEach(ev => {
        const card = document.createElement("article");
        card.className = "card";
        if (eventoSeleccionado && eventoSeleccionado.id === ev.id) {
            card.classList.add("is-selected");
        }

        card.innerHTML = `
      <img src="${ev.imagen || ""}" alt="${ev.name || ""}">
      <div class="card__body">
        <h4>${ev.name || ""}</h4>
        <p class="muted">${formateaFechas(ev)} • ${lugarTexto(ev)}</p>
        <a class="btn btn--ghost btn--small"
           href="./detalle-evento.html?id=${ev.id}">
          Ver detalle
        </a>
      </div>
    `;

        // Al hacer click en la tarjeta (pero no en el link), actualizar mapa
        card.addEventListener("click", (e) => {
            if (e.target.tagName.toLowerCase() === "a") return; // no interferir con el link
            eventoSeleccionado = ev;
            // remarcar selección
            document.querySelectorAll("#region-list .card").forEach(c => {
                c.classList.remove("is-selected");
            });
            card.classList.add("is-selected");
            renderMapa();
        });

        regionList.appendChild(card);
    });
}

/* Cambiar de región */
function setRegion(region) {
    regionActual = region;
    activarTab(region);

    // si el evento seleccionado no pertenece a esta región, lo deseleccionamos
    if (eventoSeleccionado && eventoSeleccionado.region !== region) {
        eventoSeleccionado = null;
    }

    llenarFiltrosRegion();
    renderLista();
    renderMapa();
}

/* Listeners de tabs */
tabs.forEach(tab => {
    tab.addEventListener("click", () => {
        const region = tab.dataset.region || tab.textContent.trim();
        setRegion(region);
    });
});

/* Botón Aplicar filtros */
btnAplicar?.addEventListener("click", (e) => {
    e.preventDefault();
    renderLista();
    renderMapa();
});

/* Inicio: elegir región inicial y pintar todo */
setRegion(regionActual);
