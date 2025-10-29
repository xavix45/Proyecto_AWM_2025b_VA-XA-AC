// scripts/events-view.js
import { EVENTOS } from "../data/eventos.js";

/* ===== Helpers mínimos ===== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const byId = new Map(EVENTOS.map(e => [e.id, e]));
const hoyISO = () => new Date().toISOString().slice(0, 10);
const inRange = (e, from, to) => {
    const f = e.fecha;
    const fin = e.fecha_fin || e.fecha;
    return !(fin < from || f > to);
};
const sortFecha = (a, b) => (a.fecha > b.fecha) - (a.fecha < b.fecha);
const kmHaversine = (a, b) => {
    const toRad = d => d * Math.PI / 180;
    const R = 6371, dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
    const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
};
const safe = v => v ?? "";
const official = e => (e.url && e.url !== "OFICIAL_URL") ? e.url : "";

/* ===== UI comunes ===== */
const cardHTML = e => `
<article class="card">
  <a class="card__link" href="${detalleURL(e.id)}" aria-label="Ver detalle de ${e.name}">
    <div class="card__image">
      <img src="${safe(e.imagen)}" alt="${e.name}" loading="lazy"
           onerror="this.onerror=null;this.src='/assets/placeholder.jpg'">
    </div>
    <div class="card__content">
      <h3 class="card__title">${e.name}</h3>
      <p class="card__meta">${e.ciudad || ""} · ${e.fecha}${e.fecha_fin ? " – " + e.fecha_fin : ""}</p>
      <p class="card__desc">${safe(e.descripcion)}</p>
    </div>
  </a>
</article>`.trim();

const detalleURL = id => {
    // respeta rutas relativas; si estás en /pages usa ruta simple
    const base = location.pathname.includes("/pages/") ? "detalle-evento.html" : "pages/detalle-evento.html";
    return `${base}?id=${id}`;
};

const renderList = (container, items) => {
    if (!container) return;
    container.innerHTML = items.map(cardHTML).join("");
};

/* ===== Boot por página ===== */
document.addEventListener("DOMContentLoaded", () => {
    const page = document.body.dataset.page || "";

    if (page === "home") {
        // Próximos 45 días, solo Pichincha + Imbabura
        const from = hoyISO();
        const to = new Date(Date.now() + 45 * 864e5).toISOString().slice(0, 10);
        const lista = EVENTOS
            .filter(e => ["Pichincha", "Imbabura"].includes(e.provincia))
            .filter(e => inRange(e, from, to))
            .sort(sortFecha);
        renderList($("#home-list"), lista.slice(0, 12));
    }

    if (page === "explorar-tema") {
        // Filtros simples por texto y tipo si existen en el DOM
        const cont = $("#tema-list");
        const q = $("#buscador");
        const sel = $("#filtro-tipo");
        const base = EVENTOS.filter(e => e.fecha >= hoyISO()).sort(sortFecha);
        const filtra = () => {
            const t = (q?.value || "").toLowerCase();
            const tipo = sel?.value || "";
            const list = base.filter(e =>
                (!tipo || e.tipo === tipo) &&
                (!t || e.name.toLowerCase().includes(t) || (e.tags || []).join(" ").includes(t))
            );
            renderList(cont, list);
        };
        q?.addEventListener("input", filtra);
        sel?.addEventListener("change", filtra);
        filtra();
    }

    if (page === "explorar-region") {
        // Si la página define data-provincia o data-ciudad en el contenedor, se usa.
        const cont = $("#region-list");
        const wrap = $("#region-wrap");
        const provincia = wrap?.dataset.provincia || "";
        const ciudad = wrap?.dataset.ciudad || "";
        let lista = EVENTOS.filter(e => e.fecha >= hoyISO());
        if (provincia) lista = lista.filter(e => e.provincia === provincia);
        if (ciudad) lista = lista.filter(e => e.ciudad === ciudad);
        renderList(cont, lista.sort(sortFecha));
    }

    if (page === "detalle") {
        const params = new URLSearchParams(location.search);
        const id = Number(params.get("id"));
        const e = byId.get(id);
        if (!e) return;

        // Puntos de inyección mínimos
        $("#evt-title") && ($("#evt-title").textContent = e.name);
        $("#evt-when") && ($("#evt-when").textContent = e.fecha_fin ? `${e.fecha} – ${e.fecha_fin}` : e.fecha);
        $("#evt-where") && ($("#evt-where").textContent = [e.lugar, e.ciudad, e.provincia].filter(Boolean).join(", "));
        $("#evt-desc") && ($("#evt-desc").textContent = e.descripcion || "");
        $("#evt-img") && ($("#evt-img").src = e.imagen, $("#evt-img").alt = e.name);
        $("#evt-url") && (official(e) ? ($("#evt-url").href = e.url, $("#evt-url").removeAttribute("hidden")) : $("#evt-url")?.setAttribute?.("hidden", ""));
        // Lista de relacionados cercanos (20 km)
        const cercanos = EVENTOS
            .filter(x => x.id !== e.id && Math.abs(new Date(x.fecha) - new Date(e.fecha)) <= 7 * 864e5)
            .filter(x => kmHaversine({ lat: e.lat, lng: e.lng }, { lat: x.lat, lng: x.lng }) <= 20)
            .sort(sortFecha)
            .slice(0, 6);
        renderList($("#relacionados"), cercanos);
    }
});
