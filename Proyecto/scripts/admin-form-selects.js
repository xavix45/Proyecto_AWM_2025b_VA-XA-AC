// scripts/admin-form-selects.js
// Rellena los <select> del formulario de eventos (categoría, tipo, región, provincia)

// 1️⃣ Listas base
const CATEGORIAS = [
    "Cultural",
    "Gastronomía",
    "Religiosa",
    "Tradición",
    "Naturaleza",
    "Feria / Artesanías",
    "Recreativa",
    "Turística"
];

const TIPOS = [
    "tradición",
    "cívica",
    "religiosa",
    "ancestral"
];

const REGIONES = [
    "Costa",
    "Sierra",
    "Amazonía",
    "Galápagos"
];

const PROVINCIAS_POR_REGION = {
    "Costa": ["Esmeraldas", "Manabí", "Guayas", "Santa Elena"],
    "Sierra": ["Pichincha", "Imbabura", "Cotopaxi", "Tungurahua"],
    "Amazonía": ["Napo", "Orellana"],
    "Galápagos": ["Galápagos"]
};

// 2️⃣ Función para rellenar un select con opciones
function fillSelect(select, options, placeholder = "Selecciona...") {
    if (!select) return;

    // Limpiar opciones actuales
    select.innerHTML = "";

    // Opción inicial
    const optPlaceholder = document.createElement("option");
    optPlaceholder.value = "";
    optPlaceholder.textContent = placeholder;
    select.appendChild(optPlaceholder);

    // Resto de opciones
    options.forEach((value) => {
        const opt = document.createElement("option");
        opt.value = value;
        opt.textContent = value;
        select.appendChild(opt);
    });
}

// 3️⃣ Cuando el documento esté listo, rellenamos los selects
document.addEventListener("DOMContentLoaded", () => {
    const selectCategoria = document.querySelector('select[name="category"]');
    const selectTipo = document.querySelector('select[name="type"]');
    const selectRegion = document.querySelector('select[name="region"]');
    const selectProvincia = document.querySelector('select[name="province"]');

    // Rellenar categoría y tipo
    fillSelect(selectCategoria, CATEGORIAS, "Selecciona categoría...");
    fillSelect(selectTipo, TIPOS, "Selecciona tipo...");

    // Rellenar regiones
    fillSelect(selectRegion, REGIONES, "Selecciona región...");

    // Provincias: se rellenan cuando el usuario elige región
    // dejamos solo el placeholder al inicio
    fillSelect(selectProvincia, [], "Selecciona provincia...");

    // 4️⃣ Cambiar provincias cuando cambia la región
    if (selectRegion && selectProvincia) {
        selectRegion.addEventListener("change", () => {
            const regionElegida = selectRegion.value;
            const provincias = PROVINCIAS_POR_REGION[regionElegida] || [];
            fillSelect(selectProvincia, provincias, "Selecciona provincia...");
        });
    }
});
