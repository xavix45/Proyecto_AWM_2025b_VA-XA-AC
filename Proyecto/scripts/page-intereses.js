/// / scripts/page-intereses.js
// Maneja la selección de intereses culturales y el rango de edad
// para el USUARIO ACTUAL.

// --- Definimos las claves de localStorage que usaremos ---
const LS_USUARIOS_KEY = 'usuarios';
const LS_CURRENT_USER_KEY = 'currentUserEmail';

/**
 * Obtiene los intereses del usuario que está logueado.
 */
function getIntereses() {
    try {
        // 1. Ver quién está logueado
        const emailUsuarioActual = localStorage.getItem(LS_CURRENT_USER_KEY);
        if (!emailUsuarioActual) return { tags: [], edad: 30 }; // No hay nadie logueado

        // 2. Obtener la lista de usuarios
        const usuarios = JSON.parse(localStorage.getItem(LS_USUARIOS_KEY) || "[]");
        
        // 3. Encontrar al usuario actual
        const usuario = usuarios.find(u => u.email === emailUsuarioActual);

        // 4. Devolver sus intereses (o un objeto por defecto si no tiene)
        return usuario?.intereses || { tags: [], edad: 30 };

    } catch {
        // En caso de error, devolver un estado por defecto
        return { tags: [], edad: 30 };
    }
}

/**
 * Guarda los intereses DENTRO del objeto del usuario actual.
 */
function saveIntereses(data) {
    try {
        // 1. Ver quién está logueado
        const emailUsuarioActual = localStorage.getItem(LS_CURRENT_USER_KEY);
        if (!emailUsuarioActual) {
            console.error("No hay usuario logueado para guardar intereses.");
            alert("Error: No has iniciado sesión.");
            return;
        }

        // 2. Obtener la lista de usuarios
        let usuarios = JSON.parse(localStorage.getItem(LS_USUARIOS_KEY) || "[]");
        
        // 3. Encontrar el ÍNDICE de ese usuario
        const indexUsuario = usuarios.findIndex(u => u.email === emailUsuarioActual);

        // 4. Si encontramos al usuario...
        if (indexUsuario !== -1) {
            // 5. Actualizamos su propiedad 'intereses' con los nuevos datos
            usuarios[indexUsuario].intereses = data;
            
            // 6. Guardamos la lista COMPLETA de usuarios de vuelta en localStorage
            localStorage.setItem(LS_USUARIOS_KEY, JSON.stringify(usuarios));
            
            console.log("✅ Intereses guardados para:", emailUsuarioActual, data);
        } else {
            console.error("Error: No se pudo encontrar al usuario actual para guardar.");
        }

    } catch (error) {
        console.error("Error al guardar intereses:", error);
    }
}

// --- Esta parte del código es casi idéntica a la tuya ---
document.addEventListener("DOMContentLoaded", () => {
    const checkboxes = document.querySelectorAll(".subchips input[type='checkbox']");
    const ageRange = document.getElementById("age-range");
    const ageOutput = document.getElementById("age-output");
    const btnSave = document.getElementById("btn-save-interests");
    const btnClear = document.getElementById("btn-clear-interests");

    // ---- Cargar estado guardado ----
    // Esta función AHORA obtiene los datos del usuario logueado
    const saved = getIntereses(); 

    if (saved.tags && Array.isArray(saved.tags)) {
        checkboxes.forEach(cb => {
            if (saved.tags.includes(cb.value)) {
                cb.checked = true;
            }
        });
    }

    if (saved.edad && ageRange) {
        ageRange.value = saved.edad;
    }

    // Esta función no cambia
    const actualizarEdadTexto = () => {
        if (!ageRange || !ageOutput) return;
        const val = ageRange.value;
        ageOutput.innerHTML = `Edad promedio seleccionada: <strong>${val}</strong> años`;
    };

    actualizarEdadTexto();

    ageRange?.addEventListener("input", actualizarEdadTexto);

    // ---- Guardar ----
    btnSave?.addEventListener("click", () => {
        const seleccionados = [...checkboxes]
            .filter(cb => cb.checked)
            .map(cb => cb.value);

        const edadSel = ageRange ? Number(ageRange.value) : null;

        const data = {
            tags: seleccionados,
            edad: edadSel
        };

        // Esta función AHORA guarda los datos en el objeto del usuario
        saveIntereses(data); 
        alert("Intereses guardados correctamente ✅");
        
        // Redirigir al home después de guardar
        window.location.href = '../pages/home.html';
    });

    // ---- Limpiar ----
    btnClear?.addEventListener("click", () => {
        checkboxes.forEach(cb => cb.checked = false);
        if (ageRange) ageRange.value = "30";
        actualizarEdadTexto();
        
        // Guarda el estado "limpio" en el perfil del usuario
        saveIntereses({ tags: [], edad: 30 }); 
    });
});