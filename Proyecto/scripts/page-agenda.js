// scripts/page-agenda.js
// Página "Mi Agenda y Alertas":
// - Lee los ids en FM_AGENDA
// - Cruza con EVENTOS_BASE + EVENTOS_ADMIN
// - Pinta tarjetas con: asistencia, rating, comentario, quitar
// - Genera alertas simples para eventos próximos, cambiando según los checkboxes

import { EVENTOS as EVENTOS_BASE } from "../data/eventos.js";
import { getAgenda, updateAgendaItem, removeFromAgenda } from "./agenda.js";

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

const agendaList = document.getElementById("agenda-list");
const alertList = document.getElementById("alert-list");
const tabs = document.querySelectorAll(".tabs .tab");

// Checkboxes de filtros de alertas
const chk24h = document.getElementById("alert-24h");
const chk1h = document.getElementById("alert-1h");
const chkCambios = document.getElementById("alert-cambios");
const chkNuevos = document.getElementById("alert-nuevos");

let vistaActual = "proximos"; // "proximos" o "pasados"

function hoyISO() {
    return new Date().toISOString().slice(0, 10);
}

function esPasado(ev) {
    const hoy = hoyISO();
    const fin = ev.fecha_fin || ev.fecha;
    return fin < hoy;
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

// ----- Pintar agenda -----
function renderAgenda() {
    if (!agendaList) return;

    const agenda = getAgenda();
    agendaList.innerHTML = "";

    if (!agenda.length) {
        agendaList.innerHTML = `<p class="muted">Aún no tienes eventos en tu agenda. Agrega desde el detalle de un evento.</p>`;
        if (alertList) alertList.innerHTML = "";
        return;
    }

    const itemsParaVista = agenda
        .map(item => {
            const ev = TODOS_EVENTOS.find(e => String(e.id) === String(item.id));
            if (!ev) return null;
            const pasado = esPasado(ev);
            return { item, ev, pasado };
        })
        .filter(Boolean)
        .filter(obj => vistaActual === "proximos" ? !obj.pasado : obj.pasado);

    if (!itemsParaVista.length) {
        agendaList.innerHTML = `<p class="muted">No hay eventos en esta vista.</p>`;
        if (alertList) alertList.innerHTML = "";
        return;
    }

    itemsParaVista.forEach(({ item, ev }) => {
        const article = document.createElement("article");
        article.className = "agenda-item";
        article.dataset.id = ev.id;

        article.innerHTML = `
      <div class="agenda-item__info">
        <div class="item-text">
          <h4>${ev.name || ""}</h4>
          <p class="muted">${formateaFechas(ev)} • ${ev.ciudad || ""}</p>
        </div>
        <div class="item-image">
          <img src="${ev.imagen || ""}" alt="${ev.name || ""}">
        </div>
      </div>

      <div class="agenda-item__feedback">
        <div class="feedback-controls">
          <div class="attendance-buttons">
            <button class="btn btn-attendance btn-si">✔ Sí</button>
            <button class="btn btn-attendance btn-no">✖ NO</button>
          </div>
          <div class="rating">
            <span class="stars">
              <span data-star="1">★</span>
              <span data-star="2">★</span>
              <span data-star="3">★</span>
              <span data-star="4">★</span>
              <span data-star="5">★</span>
            </span>
            <span class="rating-value">(${item.rating || "?"})</span>
          </div>
        </div>
        <textarea class="input comment-box" rows="2" maxlength="150"
          placeholder="Escribe tu comentario..."></textarea>
        <button class="btn btn--ghost btn-save-comment">Guardar Comentario</button>
      </div>

      <div class="agenda-item__actions">
        <a href="./explorar-region.html?id=${ev.id}" class="btn btn--primary">Ver en mapa</a>
        <button class="btn btn--ghost btn-quitar">Quitar</button>
      </div>
    `;

        // ----- Asistencia -----
        const btnSi = article.querySelector(".btn-si");
        const btnNo = article.querySelector(".btn-no");

        const marcarAsistencia = (valor) => {
            if (valor === "si") {
                btnSi.classList.add("is-active");
                btnNo.classList.remove("is-active");
            } else if (valor === "no") {
                btnNo.classList.add("is-active");
                btnSi.classList.remove("is-active");
            } else {
                btnSi.classList.remove("is-active");
                btnNo.classList.remove("is-active");
            }
        };

        marcarAsistencia(item.asistencia);

        btnSi?.addEventListener("click", () => {
            const nuevo = item.asistencia === "si" ? null : "si";
            updateAgendaItem(ev.id, { asistencia: nuevo });
            item.asistencia = nuevo;
            marcarAsistencia(nuevo);
        });

        btnNo?.addEventListener("click", () => {
            const nuevo = item.asistencia === "no" ? null : "no";
            updateAgendaItem(ev.id, { asistencia: nuevo });
            item.asistencia = nuevo;
            marcarAsistencia(nuevo);
        });

        // ----- Rating -----
        const starsBox = article.querySelector(".stars");
        const stars = starsBox ? starsBox.querySelectorAll("span[data-star]") : [];
        const ratingValue = article.querySelector(".rating-value");

        const pintarEstrellas = (valor) => {
            stars.forEach(st => {
                const n = Number(st.dataset.star);
                st.style.opacity = n <= valor ? "1" : "0.3";
            });
            if (ratingValue) ratingValue.textContent = `(${valor || "?"})`;
        };

        pintarEstrellas(item.rating || 0);

        stars.forEach(st => {
            st.addEventListener("click", () => {
                const valor = Number(st.dataset.star);
                updateAgendaItem(ev.id, { rating: valor });
                item.rating = valor;
                pintarEstrellas(valor);
            });
        });

        // ----- Comentario -----
        const txtComentario = article.querySelector(".comment-box");
        const btnGuardarComentario = article.querySelector(".btn-save-comment");

        if (txtComentario) {
            txtComentario.value = item.comentario || "";
        }

        btnGuardarComentario?.addEventListener("click", () => {
            const texto = (txtComentario.value || "").trim();
            updateAgendaItem(ev.id, { comentario: texto });
            item.comentario = texto;
            alert("Comentario guardado ✅");
        });

        // ----- Quitar de agenda -----
        const btnQuitar = article.querySelector(".btn-quitar");
        btnQuitar?.addEventListener("click", () => {
            if (!confirm("¿Quitar este evento de tu agenda?")) return;
            removeFromAgenda(ev.id);
            renderAgenda();
            renderAlertas();
        });

        agendaList.appendChild(article);
    });

    // Después de pintar, refrescamos las alertas
    renderAlertas();
}

// ----- Alertas simples -----
function renderAlertas() {
    if (!alertList) return;

    const agenda = getAgenda();
    alertList.innerHTML = "";

    if (!agenda.length) {
        alertList.innerHTML = `<li class="muted">No hay alertas por ahora.</li>`;
        return;
    }

    const hoy = new Date();
    const avisos = [];

    const usar24 = !chk24h || chk24h.checked;
    const usar1h = !chk1h || chk1h.checked;
    const usarCambios = !chkCambios || chkCambios.checked;
    const usarNuevos = !chkNuevos || chkNuevos.checked;

    // Recordatorios por fecha (simplificado: hoy y mañana)
    agenda.forEach(item => {
        const ev = TODOS_EVENTOS.find(e => String(e.id) === String(item.id));
        if (!ev || !ev.fecha) return;

        const fechaEv = new Date(ev.fecha);
        const diffMs = fechaEv - hoy;
        const diffDias = Math.round(diffMs / 86400000);

        // Mañana → 24h
        if (diffDias === 1 && usar24) {
            avisos.push({
                tipo: "info",
                texto: `Recordatorio: ${ev.name} — mañana ${ev.horario || ""}`.trim()
            });
        }
        // Hoy → lo tomamos como "1 h" (demo)
        if (diffDias === 0 && usar1h) {
            avisos.push({
                tipo: "info",
                texto: `Recordatorio: ${ev.name} — hoy ${ev.horario || ""}`.trim()
            });
        }
    });

    // Cambios de evento (demo)
    if (usarCambios && agenda.length) {
        avisos.push({
            tipo: "warning",
            texto: "Algunos eventos de tu agenda podrían haber cambiado de horario (demo)."
        });
    }

    // Nuevos cercanos (simple demo por región)
    if (usarNuevos && agenda.length) {
        const primerEvAgenda = TODOS_EVENTOS.find(e => String(e.id) === String(agenda[0].id));
        if (primerEvAgenda && primerEvAgenda.region) {
            const candidato = TODOS_EVENTOS.find(e =>
                e.region === primerEvAgenda.region &&
                !agenda.some(it => String(it.id) === String(e.id))
            );
            if (candidato) {
                avisos.push({
                    tipo: "success",
                    texto: `Nuevo cerca de ti: ${candidato.name} (${candidato.region})`
                });
            }
        }
    }

    if (!avisos.length) {
        alertList.innerHTML = `<li class="muted">No hay alertas activas con los filtros seleccionados.</li>`;
        return;
    }

    avisos.forEach(av => {
        const li = document.createElement("li");
        li.innerHTML = `
      <a href="#" class="alert-link ${av.tipo}">
        <span>🔔</span> ${av.texto}
      </a>
    `;
        alertList.appendChild(li);
    });
}

// ----- Tabs Próximos / Pasados -----
if (tabs.length >= 2) {
    const [tabProx, tabPas] = tabs;

    tabProx.addEventListener("click", () => {
        vistaActual = "proximos";
        tabs.forEach(t => t.classList.remove("is-active"));
        tabProx.classList.add("is-active");
        renderAgenda();
    });

    tabPas.addEventListener("click", () => {
        vistaActual = "pasados";
        tabs.forEach(t => t.classList.remove("is-active"));
        tabPas.classList.add("is-active");
        renderAgenda();
    });
}

// Cuando cambio filtros de alertas, vuelvo a pintar alertas
[chk24h, chk1h, chkCambios, chkNuevos].forEach(chk => {
    chk?.addEventListener("change", renderAlertas);
});

// ----- Inicio -----
renderAgenda();
