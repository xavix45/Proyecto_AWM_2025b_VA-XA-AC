// src/services/agenda.service.js
import { getJSON, setJSON } from "../lib/storage";

const AGENDA_KEY_PREFIX = "fm:agenda:";

function getKey(userId) {
    if (!userId) {
        throw new Error("[agenda.service] userId es requerido");
    }
    return `${AGENDA_KEY_PREFIX}${userId}`;
}

/**
 * Devuelve la agenda de un usuario.
 * Estructura: [{ idEvento, fecha, nota }]
 */
export function list(userId) {
    const key = getKey(userId);
    const items = getJSON(key, []);
    if (!Array.isArray(items)) return [];
    return items;
}

/**
 * Agrega o actualiza un evento en la agenda.
 * Si ya existe un item con el mismo idEvento, lo actualiza (merge).
 */
export function add(userId, item) {
    const key = getKey(userId);
    const { idEvento } = item;
    if (!idEvento) {
        throw new Error("[agenda.service] item.idEvento es requerido");
    }

    const current = list(userId);
    const idx = current.findIndex(
        (e) => String(e.idEvento) === String(idEvento)
    );

    if (idx >= 0) {
        // actualizamos el existente (merge)
        current[idx] = {
            ...current[idx],
            ...item,
        };
    } else {
        current.push(item);
    }

    setJSON(key, current);
    return current;
}

/**
 * Elimina un evento de la agenda por idEvento.
 */
export function remove(userId, idEvento) {
    const key = getKey(userId);
    const current = list(userId);
    const next = current.filter(
        (e) => String(e.idEvento) !== String(idEvento)
    );
    setJSON(key, next);
    return next;
}

/**
 * Actualiza parcialmente un item existente (por ejemplo solo nota o fecha).
 */
export function update(userId, idEvento, patch) {
    const key = getKey(userId);
    const current = list(userId);
    const next = current.map((e) => {
        if (String(e.idEvento) === String(idEvento)) {
            return { ...e, ...patch };
        }
        return e;
    });
    setJSON(key, next);
    return next;
}

// Export opcional agrupado
const agendaService = { list, add, remove, update };
export default agendaService;
