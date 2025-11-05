// scripts/page-explorar-tema.js
// Página "Explorar por tema": búsqueda y filtros sobre TODOS_EVENTOS.

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

// ---- DOM ----
const buscador = document.getElementById("buscador");
const formSearch = document.querySelector(".main-search-bar");

const filtroTipo = document.getElementById("filtro-tipo");
const filtroProvincia = document.getElementById("filtro-provincia");
const filtroFecha = document.getElementById("filtro-fecha");
const filtroOrden = document.getElementById("filtro-orden");
const chkViaje = document.getElementById("chk-viaje");

const listaEl = document.getElementById("tema-list");

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

// Rellena el select de provincias con las que existen en los datos
function llenarProvincias() {
    if (!filtroProvincia) return;
    const set = new Set();

    TODOS_EVENTOS.forEach(ev => {
        if (ev.provincia) set.add(ev.provincia);
    });

    [...set].sort().forEach(p => {
        const opt = document.createElement("option");
        opt.value = p;
        opt.textContent = p;
        filtroProvincia.appendChild(opt);
    });
}

// ---- Filtro principal ----
function filtrarEventos() {
    const texto = (buscador?.value || "").toLowerCase().trim();
    const tipo = filtroTipo?.value || "";
    const provincia = filtroProvincia?.value || "";
    const fechaF = filtroFecha?.value || "";
    const orden = filtroOrden?.value || "";

    const hoy = hoyISO();

    // Creamos una lista con "score" de relevancia
    const listaConScore = TODOS_EVENTOS.map(ev => {
        let score = 0;

        if (texto) {
            const campo =
                (ev.name || "") +
                " " +
                (ev.descripcion || "") +
                " " +
                (ev.ciudad || "") +
                " " +
                (ev.tags || []).join(" ");

            const lower = campo.toLowerCase();

            if (lower.includes(texto)) score += 10;
            // Bonus si coincide la palabra exacta en nombre
            if ((ev.name || "").toLowerCase().includes(texto)) score += 5;
        }

        return { ev, score };
    });

    // Filtros
    let filtrados = listaConScore.filter(obj => {
        const ev = obj.ev;

        // Si se tilda "Dentro de tu viaje" podemos hacer una lógica simple:
        if (chkViaje?.checked) {
            // como demo: solo eventos próximos (hoy o posteriores)
            if (ev.fecha && ev.fecha < hoy) return false;
        }

        const coincideTipo =
            !tipo || ev.categoria === tipo || ev.tipo === tipo;

        const coincideProvincia =
            !provincia || ev.provincia === provincia;

        let coincideFecha = true;
        if (fechaF) {
            const inicio = ev.fecha;
            const fin = ev.fecha_fin || ev.fecha;
            if (inicio && fin) {
                coincideFecha = fechaF >= inicio && fechaF <= fin;
            } else if (inicio) {
                coincideFecha = fechaF === inicio;
            }
        }

        // si hay texto pero score 0, se descarta
        const coincideTexto = !texto || obj.score > 0;

        return coincideTipo && coincideProvincia && coincideFecha && coincideTexto;
    });

    // Orden
    if (orden === "fecha") {
        filtrados.sort((a, b) => {
            const fa = a.ev.fecha || "9999-12-31";
            const fb = b.ev.fecha || "9999-12-31";
            return fa.localeCompare(fb);
        });
    } else if (orden === "relevancia" && buscador?.value.trim()) {
        filtrados.sort((a, b) => b.score - a.score);
    } else {
        // por defecto: fecha ascendente
        filtrados.sort((a, b) => {
            const fa = a.ev.fecha || "9999-12-31";
            const fb = b.ev.fecha || "9999-12-31";
            return fa.localeCompare(fb);
        });
    }

    return filtrados.map(obj => obj.ev);
}

// ---- Pintar resultados ----
function renderLista() {
    if (!listaEl) return;

    const lista = filtrarEventos();
    listaEl.innerHTML = "";

    if (!lista.length) {
        listaEl.innerHTML =
            `<p class="muted">No se encontraron eventos con esos criterios. Prueba ajustando los filtros.</p>`;
        return;
    }

    lista.forEach(ev => {
        const card = document.createElement("article");
        card.className = "tema-card";

        card.innerHTML = `
      <div class="tema-card__image">
        <img src="${ev.imagen || ""}" alt="${ev.name || ""}">
      </div>

      <div class="tema-card__body">
        <h3>${ev.name || ""}</h3>
        <p class="muted">${formateaFecha(ev)} • ${lugarTexto(ev)}</p>
        <p class="desc">
          ${(ev.descripcion || "").slice(0, 140)}${(ev.descripcion || "").length > 140 ? "…" : ""}
        </p>

        <div class="chips">
          ${ev.categoria ? `<span class="chip">${ev.categoria}</span>` : ""}
          ${ev.tipo ? `<span class="chip chip-alt">${ev.tipo}</span>` : ""}
          ${(ev.tags || []).slice(0, 3).map(t => `<span class="chip chip-tag">${t}</span>`).join("")}
        </div>

        <div class="tema-card__actions">
          <a href="../pages/detalle-evento.html?id=${ev.id}" class="btn btn--ghost btn--small">
            Ver detalle
          </a>
        </div>
      </div>
    `;

        listaEl.appendChild(card);
    });
}

// ---- Listeners ----
formSearch?.addEventListener("submit", (e) => {
    e.preventDefault();
    renderLista();
});

buscador?.addEventListener("input", () => {
    // Búsqueda dinámica
    renderLista();
});

filtroTipo?.addEventListener("change", renderLista);
filtroProvincia?.addEventListener("change", renderLista);
filtroFecha?.addEventListener("change", renderLista);
filtroOrden?.addEventListener("change", renderLista);
chkViaje?.addEventListener("change", renderLista);

// ---- Inicio ----
llenarProvincias();
renderLista();
