// scripts/agenda.js
// Maneja los eventos que el usuario guarda en su agenda.

const LS_AGENDA = "FM_AGENDA";

// Devuelve un array de objetos: { id, asistencia, rating, comentario }
export function getAgenda() {
    try {
        return JSON.parse(localStorage.getItem(LS_AGENDA) || "[]");
    } catch {
        return [];
    }
}

export function saveAgenda(arr) {
    localStorage.setItem(LS_AGENDA, JSON.stringify(arr));
}

export function isInAgenda(id) {
    return getAgenda().some(item => item.id === id);
}

export function addToAgenda(id) {
    const lista = getAgenda();
    if (!lista.some(it => it.id === id)) {
        lista.push({
            id,
            asistencia: null,   // "si", "no" o null
            rating: 0,          // 0 a 5
            comentario: ""
        });
        saveAgenda(lista);
    }
}

export function removeFromAgenda(id) {
    const lista = getAgenda().filter(it => it.id !== id);
    saveAgenda(lista);
}

export function updateAgendaItem(id, parcial) {
    const lista = getAgenda().map(it => {
        if (it.id === id) {
            return { ...it, ...parcial };
        }
        return it;
    });
    saveAgenda(lista);
}
