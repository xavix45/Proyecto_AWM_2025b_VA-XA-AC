// scripts/favorites.js
// Gestión simple de favoritos en localStorage

const LS_FAVORITOS = "FM_FAVORITOS";

// Devuelve un array de IDs (números)
export function getFavoritos() {
    try {
        return JSON.parse(localStorage.getItem(LS_FAVORITOS) || "[]");
    } catch {
        return [];
    }
}

export function guardarFavoritos(arr) {
    localStorage.setItem(LS_FAVORITOS, JSON.stringify(arr));
}

// ¿Este id está marcado como favorito?
export function esFavorito(id) {
    const favs = getFavoritos();
    return favs.includes(id);
}

// Alterna: si no está, lo agrega; si está, lo quita.
// Devuelve true si quedó como favorito, false si se quitó.
export function toggleFavorito(id) {
    let favs = getFavoritos();

    if (favs.includes(id)) {
        favs = favs.filter(f => f !== id);
    } else {
        favs.push(id);
    }

    guardarFavoritos(favs);
    return favs.includes(id);
}
