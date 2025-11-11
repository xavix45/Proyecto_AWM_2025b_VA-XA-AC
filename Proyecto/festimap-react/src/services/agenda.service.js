import { getJSON, setJSON } from "../lib/storage.js";
const LS_KEY = "FM_AGENDA";

export function leerAgenda() {
    return getJSON(LS_KEY, []); // [{id, asistencia, rating, comentario}]
}
export function guardarAgenda(arr) {
    setJSON(LS_KEY, arr);
}
