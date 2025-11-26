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
import { getJSON } from "../lib/storage";

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

// list(): devuelve todos los eventos disponibles.
export function list() {
    return getData();
}

// getById(id): busca un evento por su identificador y devuelve null si
// no existe.
export function getById(id) {
    const all = getData();
    return all.find((e) => String(e.id) === String(id)) || null;
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
const eventosService = { list, getById, filter };
export default eventosService;
