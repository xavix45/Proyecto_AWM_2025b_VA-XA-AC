// scripts/detalle.js
// Muestra el detalle de un evento (base + admin)
// Permite: favoritos, agregar a agenda y mostrar relacionados.

import { EVENTOS as EVENTOS_BASE } from "../data/eventos.js";
import { esFavorito, toggleFavorito } from "./favorites.js";
import { addToAgenda } from "./agenda.js";

const LS_KEY_ADMIN = "EVENTOS_ADMIN";

// ---- Utilidades ----
function cargarEventosAdmin() {
    try {
        return JSON.parse(localStorage.getItem(LS_KEY_ADMIN) || "[]");
    } catch {
        return [];
    }
}

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

// ---- Carga de datos ----
const eventosAdmin = cargarEventosAdmin();
const TODOS_EVENTOS = [...EVENTOS_BASE, ...eventosAdmin];

const params = new URLSearchParams(location.search);
const idParam = params.get("id");

if (!idParam) {
    console.warn("No se proporcionó id en la URL");
}

const evento = TODOS_EVENTOS.find(e => String(e.id) === String(idParam));

if (!evento) {
    console.warn("No se encontró el evento con id", idParam);
}

// ---- Referencias al DOM ----
const imgEl = document.getElementById("evt-img");
const titleEl = document.getElementById("evt-title");
const whenEl = document.getElementById("evt-when");
const whereEl = document.getElementById("evt-where");
const descBarEl = document.getElementById("evt-desc");
const descLongEl = document.getElementById("evt-desc-long");
const urlBtn = document.getElementById("evt-url");
const relacionadosBox = document.getElementById("relacionados");

// Botones de acciones (en el encabezado y el aside)
const btnFav = document.querySelector(".detail-actions a.btn--ghost"); // primer ghost = favoritos
const btnMapa = document.querySelector(".detail-actions .btn--primary");
const btnAgenda = document.querySelector(".panel .btn.btn--primary"); // "Agregar a mi agenda"

// ---- Rellenar la vista principal ----
if (evento) {
    // Imagen
    if (imgEl) {
        imgEl.src = evento.imagen || "";
        imgEl.alt = evento.name || "Imagen del evento";
    }

    // Título
    if (titleEl) titleEl.textContent = evento.name || "";

    // Fecha y lugar
    if (whenEl) whenEl.textContent = formateaFechas(evento);
    if (whereEl) whereEl.textContent = lugarTexto(evento);

    // Descripciones
    if (descBarEl) {
        descBarEl.textContent =
            evento.descripcion ||
            "Sin descripción corta disponible para este evento.";
    }
    if (descLongEl) {
        descLongEl.textContent =
            evento.descripcion_larga ||
            evento.descripcion ||
            "Sin información detallada disponible.";
    }

    // Botón "Ir al sitio oficial"
    if (urlBtn) {
        if (evento.url) {
            urlBtn.href = evento.url;
            urlBtn.hidden = false;
        } else {
            urlBtn.hidden = true;
        }
    }

    // ---- Favoritos (y también a agenda cuando se marca) ----
    if (btnFav) {
        const refrescarTextoFav = () => {
            const fav = esFavorito(evento.id);
            btnFav.textContent = fav ? "Quitar de favoritos" : "Agregar a favoritos";
        };

        refrescarTextoFav();

        btnFav.addEventListener("click", (e) => {
            e.preventDefault();
            const ahoraFav = toggleFavorito(evento.id);
            btnFav.textContent = ahoraFav ? "Quitar de favoritos" : "Agregar a favoritos";

            // Si queda como favorito, lo agregamos también a la agenda
            if (ahoraFav) {
                addToAgenda(evento.id);
            }
        });
    }

    // ---- Ver en mapa → explorar-region.html ----
    if (btnMapa) {
        btnMapa.addEventListener("click", (e) => {
            e.preventDefault();
            // Redirigimos a la página que mostrará el mapa centrado en este evento
            window.location.href = "explorar-region.html?id=" + evento.id;
        });
    }

    // ---- Agregar a mi agenda (botón del aside) ----
    if (btnAgenda) {
        btnAgenda.addEventListener("click", (e) => {
            e.preventDefault();
            addToAgenda(evento.id);
            alert("Evento agregado a tu agenda ✅");
        });
    }

    // ---- También cerca (misma región, máximo 3) ----
    if (relacionadosBox) {
        const relacionados = TODOS_EVENTOS
            .filter(e => e.id !== evento.id && e.region === evento.region)
            .slice(0, 3);

        relacionadosBox.innerHTML = "";

        relacionados.forEach(ev => {
            const card = document.createElement("article");
            card.className = "card";

            card.innerHTML = `
        <img src="${ev.imagen || ""}" alt="${ev.name || ""}">
        <div class="card__body">
          <h4>${ev.name || ""}</h4>
          <p class="muted">${formateaFechas(ev)} • ${lugarTexto(ev)}</p>
          <a class="btn btn--ghost btn--small"
             href="detalle-evento.html?id=${ev.id}">
            Ver detalle
          </a>
        </div>
      `;

            relacionadosBox.appendChild(card);
        });

        if (!relacionados.length) {
            relacionadosBox.innerHTML =
                `<p class="muted">No hay otros eventos cercanos registrados.</p>`;
        }
    }
}
