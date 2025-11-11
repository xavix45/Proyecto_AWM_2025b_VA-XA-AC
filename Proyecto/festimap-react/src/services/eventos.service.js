import { EVENTOS } from "../data/eventos.js";

export function listarEventos() {
    return EVENTOS; // luego filtraremos por región/tema
}
export function obtenerEventoPorId(id) {
    return EVENTOS.find(e => String(e.id) === String(id)) || null;
}
