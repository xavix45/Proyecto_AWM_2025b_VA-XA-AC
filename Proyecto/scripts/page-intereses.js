// scripts/page-intereses.js
// Maneja la selección de intereses culturales y el rango de edad.

const LS_INTERESES = "FM_INTERESES";

function getIntereses() {
    try {
        return JSON.parse(localStorage.getItem(LS_INTERESES) || "{}");
    } catch {
        return {};
    }
}

function saveIntereses(data) {
    localStorage.setItem(LS_INTERESES, JSON.stringify(data));
}

document.addEventListener("DOMContentLoaded", () => {
    const checkboxes = document.querySelectorAll(".subchips input[type='checkbox']");
    const ageRange = document.getElementById("age-range");
    const ageOutput = document.getElementById("age-output");
    const btnSave = document.getElementById("btn-save-interests");
    const btnClear = document.getElementById("btn-clear-interests");

    // ---- Cargar estado guardado ----
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

        saveIntereses(data);
        console.log("✅ Intereses guardados:", data);
        alert("Intereses guardados correctamente ✅");
    });

    // ---- Limpiar ----
    btnClear?.addEventListener("click", () => {
        checkboxes.forEach(cb => cb.checked = false);
        if (ageRange) ageRange.value = "30";
        actualizarEdadTexto();
        saveIntereses({ tags: [], edad: 30 });
    });
});
