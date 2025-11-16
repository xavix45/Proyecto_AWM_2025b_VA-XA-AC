// src/lib/storage.js

// Wrapper seguro sobre localStorage
function safeGetItem(key) {
    if (typeof window === "undefined") return null;
    try {
        return window.localStorage.getItem(key);
    } catch (err) {
        console.error("[storage] getItem error", err);
        return null;
    }
}

function safeSetItem(key, value) {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(key, value);
    } catch (err) {
        console.error("[storage] setItem error", err);
    }
}

function safeRemoveItem(key) {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.removeItem(key);
    } catch (err) {
        console.error("[storage] removeItem error", err);
    }
}

// Helpers JSON genéricos
export function getJSON(key, fallback = null) {
    const raw = safeGetItem(key);
    if (raw == null) return fallback;
    try {
        return JSON.parse(raw);
    } catch (err) {
        console.warn("[storage] JSON inválido para", key, err);
        return fallback;
    }
}

export function setJSON(key, value) {
    try {
        const raw = JSON.stringify(value);
        safeSetItem(key, raw);
    } catch (err) {
        console.error("[storage] no se pudo serializar", key, err);
    }
}

export function remove(key) {
    safeRemoveItem(key);
}

// Si en algún lado quieres seguir usando getItem/setItem "crudos":
export const storage = {
    getItem: safeGetItem,
    setItem: safeSetItem,
    removeItem: safeRemoveItem,
};
