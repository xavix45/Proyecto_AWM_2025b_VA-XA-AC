// src/services/eventos.service.js
// Servicio simple para acceder al catálogo de eventos de la app.
// Funciona sobre un dataset base (`src/data/eventos`) pero permite un
// override mediante localStorage bajo la clave `fm:eventos:admin` para
// facilitar pruebas o edición desde el navegador.
// Exporta funciones públicas:
// - list(): devuelve todos los eventos (dataset base o override)
// - getById(id): busca un evento por id
// - filter(opts): filtro flexible por región, tema o texto libre

import EVENTOS_BASE from "../data/eventos";
import { getJSON, setJSON } from "../lib/storage";

const ADMIN_KEY = "fm:eventos:admin";

/**
 * Devuelve el listado de eventos.
 * Si existe un override en localStorage (fm:eventos:admin),
 * se usa ese listado; si no, se usa el dataset base.
 */
// getData(): determina la fuente de verdad para los eventos.
// Si existe un array en localStorage (clave `fm:eventos:admin`) se usa ese
// como override — útil para pruebas o edición desde el entorno cliente.
function getData() {
    const override = getJSON(ADMIN_KEY, null);
    if (Array.isArray(override) && override.length > 0) {
        return override;
    }
    return EVENTOS_BASE;
}

// Guarda el listado (override) en localStorage
function saveData(arr) {
    try {
        setJSON(ADMIN_KEY, arr);
    } catch (err) {
        console.error('[eventos.service] saveData error', err);
    }
}

/**
 * Actualiza un evento por id aplicando un patch (merge shallow) y persiste
 * en la clave `fm:eventos:admin`. Devuelve el evento actualizado o null.
 */
export function updateEvent(id, patch = {}) {
    const all = getData().slice();
    const idx = all.findIndex((e) => String(e.id) === String(id));
    if (idx === -1) return null;

    const target = Object.assign({}, all[idx]);
    const next = Object.assign({}, target, patch);

    // inicializar campos de métricas si no existen
    next.visitas = Number(next.visitas || 0);
    next.asistencias = Number(next.asistencias || 0);
    next.rating = next.rating ?? null;
    next.ratingCount = Number(next.ratingCount || 0);
    next.ratingSum = Number(next.ratingSum || 0);
    next.comments = Array.isArray(next.comments) ? next.comments : (target.comments || []);

    all[idx] = next;
    saveData(all);
    return next;
}

/**
 * Registra una asistencia/visita para un evento (incrementa visitas y asistencias,
 * opcionalmente registra userId en visitors) y persiste.
 */
export function addAttendance(id, userId = null) {
    const all = getData().slice();
    const idx = all.findIndex((e) => String(e.id) === String(id));
    if (idx === -1) return null;

    const ev = Object.assign({}, all[idx]);
    ev.visitas = Number(ev.visitas || 0) + 1;
    ev.asistencias = Number(ev.asistencias || 0) + 1;
    ev.visitors = Array.isArray(ev.visitors) ? ev.visitors : [];
    if (userId && !ev.visitors.includes(userId)) ev.visitors.push(userId);

    all[idx] = ev;
    saveData(all);
    return ev;
}

/**
 * Añade una review (rating + comentario) al evento y recalcula el rating promedio.
 * { userId, rating, comment }
 */
export function addReview(id, { userId = null, rating = 0, comment = "" } = {}) {
    const all = getData().slice();
    const idx = all.findIndex((e) => String(e.id) === String(id));
    if (idx === -1) return null;

    const ev = Object.assign({}, all[idx]);
    ev.ratingCount = Number(ev.ratingCount || 0) + (rating ? 1 : 0);
    ev.ratingSum = Number(ev.ratingSum || 0) + (rating || 0);
    ev.rating = ev.ratingCount ? Math.round((ev.ratingSum / ev.ratingCount) * 10) / 10 : null;
    ev.comments = Array.isArray(ev.comments) ? ev.comments : [];
    if (comment && comment.trim()) {
        ev.comments.push({ userId, rating: rating || null, text: comment.trim(), date: new Date().toISOString() });
    }

    all[idx] = ev;
    saveData(all);
    return ev;
}

/**
 * Elimina un evento del dataset persistido (override). Devuelve true si se eliminó.
 */
export function removeEvent(id) {
    const all = getData().slice();
    const idx = all.findIndex((e) => String(e.id) === String(id));
    if (idx === -1) return false;
    all.splice(idx, 1);
    saveData(all);
    return true;
}

// list(): devuelve todos los eventos disponibles.
export function list(opts = {}) {
    // opts: { admin: boolean }
    const { admin = false } = opts;
    const all = getData();
    if (admin) return all;
    // por defecto devolvemos solo eventos publicados (approved)
    return all.filter((e) => String(e.status || "").toLowerCase() === "approved");
}

// getById(id, opts): busca un evento por su identificador y devuelve null si
// no existe o si el usuario no tiene permiso para verlo.
// opts: { admin: boolean } - Si es admin, puede ver eventos en cualquier estado.
// Si no es admin, solo puede ver eventos con status "approved".
export function getById(id, opts = {}) {
    const { admin = false } = opts;
    const all = getData();
    const evento = all.find((e) => String(e.id) === String(id));
    
    if (!evento) return null;
    
    // Si no es admin, solo puede ver eventos aprobados
    if (!admin && String(evento.status || "").toLowerCase() !== "approved") {
        return null;
    }
    
    return evento;
}

// getByIdFull(id, opts): busca primero en el override (si existe) y si no encuentra
// en el dataset base `EVENTOS_BASE`. Útil para formularios que deben
// mostrar eventos base aunque exista un override parcial en localStorage.
// opts: { admin: boolean } - Si es admin, puede ver eventos en cualquier estado.
export function getByIdFull(id, opts = {}) {
    const { admin = false } = opts;
    
    // intentar override primero
    const override = getJSON(ADMIN_KEY, null);
    if (Array.isArray(override) && override.length > 0) {
        const found = override.find((e) => String(e.id) === String(id));
        if (found) {
            // Si no es admin, verificar status
            if (!admin && String(found.status || "").toLowerCase() !== "approved") {
                return null;
            }
            return found;
        }
    }
    
    // luego dataset base
    const base = EVENTOS_BASE.find((e) => String(e.id) === String(id));
    if (!base) return null;
    
    // Si no es admin, verificar status
    if (!admin && String(base.status || "").toLowerCase() !== "approved") {
        return null;
    }
    
    return base;
}

/**
 * Filtro flexible.
 * @param {Object} opts
 * @param {string} [opts.region]
 * @param {string} [opts.tema]
 * @param {string} [opts.query]  texto libre (título/ciudad/descripción)
 */
// filter(opts): filtro flexible para buscar eventos según criterios.
// Opciones soportadas: { region, tema, query }.
export function filter(opts = {}) {
    const { region, tema, query } = opts;
    let items = getData();

    if (region) {
        items = items.filter(
            (e) =>
                e.region &&
                String(e.region).toLowerCase() === String(region).toLowerCase()
        );
    }

    if (tema) {
        items = items.filter(
            (e) =>
                (e.tema || e.categoria) &&
                String(e.tema || e.categoria).toLowerCase() ===
                String(tema).toLowerCase()
        );
    }

    if (query) {
        const q = query.toLowerCase();
        items = items.filter((e) => {
            const campos = [
                e.titulo,
                e.nombre,
                e.ciudad,
                e.descripcion,
                e.region,
                e.tema,
                e.categoria,
            ]
                .filter(Boolean)
                .map((v) => String(v).toLowerCase())
                .join(" ");

            return campos.includes(q) || campos.indexOf(q) !== -1 || campos.match(q);
        });
    }

    return items;
}

// Opcional: export default por comodidad
const eventosService = { list, getById, getByIdFull, filter, updateEvent, addAttendance, addReview, removeEvent };
export default eventosService;
