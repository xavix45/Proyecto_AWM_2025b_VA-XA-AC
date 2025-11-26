// src/services/agenda.service.js
// Servicio simple para gestionar la "agenda" (lista de eventos) por usuario.
// Guarda cada agenda en localStorage bajo la clave `fm:agenda:<userId>`.
// Se asume que `userId` es un identificador único por usuario (email o id).
// Proporciona funciones CRUD pequeñas: list, add, remove, update.

import { getJSON, setJSON } from "../lib/storage";

const AGENDA_KEY_PREFIX = "fm:agenda:";

// Construye la clave de almacenamiento para un usuario dado.
// Lanza si no se provee userId, porque la agenda es por usuario.
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
/**
 * list(userId) -> Array
 * Devuelve la lista de elementos de la agenda para `userId`.
 * Cada elemento tiene al menos: { idEvento, fecha?, nota?, isPlan? }
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
/**
 * add(userId, item) -> Array
 * Añade un item a la agenda del usuario o actualiza (merge) si ya existe
 * un registro con el mismo `idEvento`.
 * item.idEvento es obligatorio.
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
/**
 * remove(userId, idEvento) -> Array
 * Elimina el item identificado por idEvento de la agenda del usuario.
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
/**
 * update(userId, idEvento, patch) -> Array
 * Actualiza parcialmente un item existente (por ejemplo cambiar la nota o la fecha).
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
