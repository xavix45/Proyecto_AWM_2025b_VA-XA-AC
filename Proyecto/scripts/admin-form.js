// scripts/admin-form.js
// Formulario Admin: crear / editar eventos en localStorage (EVENTOS_ADMIN)

const LS_KEY = "EVENTOS_ADMIN";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form");
    if (!form) {
        console.warn("No se encontró el formulario de eventos");
        return;
    }

    // Botones
    const btnPublicar = form.querySelector('button[type="submit"]');   // Guardar y Publicar
    const btnBorrador = form.querySelector('button[type="button"]');   // Guardar Borrador

    // Campos del ASIDE
    const inputImageUrl = document.querySelector('input[name="imageUrl"]');
    const thumbsBox = document.querySelector(".dropzone .thumbnails");
    const inputAllowComments = document.querySelector('input[name="allowComments"]');
    const inputRequireAppr = document.querySelector('input[name="requireApproval"]');
    const selectStatus = document.querySelector('select[name="status"]');
    const txtRejectReason = document.querySelector('textarea[name="rejectReason"]');

    // --- Helpers de localStorage ---
    function cargarEventos() {
        try {
            return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
        } catch {
            return [];
        }
    }

    function guardarEventos(arr) {
        localStorage.setItem(LS_KEY, JSON.stringify(arr));
    }

    // --- Vista previa de imagen ---
    function actualizarMiniatura(url) {
        if (!thumbsBox) return;

        thumbsBox.innerHTML = "";

        if (!url) {
            const p = document.createElement("p");
            p.textContent = "[ Miniaturas de fotos subidas ]";
            p.style.fontSize = "0.85rem";
            p.style.color = "#777";
            thumbsBox.appendChild(p);
            return;
        }

        const img = document.createElement("img");
        img.src = url;
        img.alt = "Vista previa del evento";
        img.style.maxWidth = "100%";
        img.style.maxHeight = "180px";
        img.style.objectFit = "cover";
        img.style.borderRadius = "12px";
        thumbsBox.appendChild(img);
    }

    // iniciar en vacío
    actualizarMiniatura("");

    if (inputImageUrl) {
        const update = () => actualizarMiniatura(inputImageUrl.value.trim());
        inputImageUrl.addEventListener("change", update);
        inputImageUrl.addEventListener("blur", update);
    }

    // --- Detectar si estamos EDITANDO ---
    const params = new URLSearchParams(location.search);
    const editId = params.get("id");

    function cargarParaEditar() {
        if (!editId) return; // modo crear

        const eventos = cargarEventos();
        const ev = eventos.find(e => String(e.id) === String(editId));
        if (!ev) return;

        // marcar que estamos editando
        form.dataset.editId = editId;

        // Datos principales
        form.eventName.value = ev.name || "";
        form.shortDescription.value = ev.descripcion || "";
        form.category.value = ev.categoria || "";
        form.type.value = ev.tipo || "";
        form.region.value = ev.region || "";
        form.province.value = ev.provincia || "";
        form.city.value = ev.ciudad || "";
        form.address.value = ev.lugar || "";
        form.reference.value = ev.referencia || "";
        form.latitude.value = ev.lat || "";
        form.longitude.value = ev.lng || "";

        // Fechas y horarios
        form.startDate.value = ev.fecha || "";
        form.endDate.value = ev.fecha_fin || "";
        form.schedule.value = ev.horario || "";
        form.repetition.value = ev.repeticion || "No se repite";

        // Contacto
        form.organizer.value = ev.organizador || "";
        form.phone.value = ev.telefono || "";
        form.website.value = ev.url || "";        // 👈 AQUÍ SE RELLENA EL URL
        form.price.value = ev.precio || "";
        form.tags.value = (ev.tags || []).join(", ");

        // Comentarios y estado
        if (inputAllowComments) inputAllowComments.checked = !!ev.allowComments;
        if (inputRequireAppr) inputRequireAppr.checked = !!ev.requireApproval;
        if (selectStatus) selectStatus.value = ev.status || "draft";
        if (txtRejectReason) txtRejectReason.value = ev.rejectReason || "";

        // Imagen principal
        if (inputImageUrl && ev.imagen) {
            inputImageUrl.value = ev.imagen;
            actualizarMiniatura(ev.imagen);
        }
    }

    cargarParaEditar();

    // --- Construir objeto evento según el formulario ---
    function construirEvento(statusForzado) {
        const data = Object.fromEntries(new FormData(form));

        // estado: forzado > select > draft
        let status = statusForzado || (selectStatus ? selectStatus.value : "") || "draft";
        if (selectStatus) selectStatus.value = status;

        const imagenUrl = inputImageUrl ? inputImageUrl.value.trim() : "";
        const allowComm = inputAllowComments ? inputAllowComments.checked : false;
        const requireAppr = inputRequireAppr ? inputRequireAppr.checked : false;
        const rejectText = txtRejectReason ? txtRejectReason.value.trim() : "";

        const idFinal = form.dataset.editId ? Number(form.dataset.editId) : Date.now();

        return {
            id: idFinal,
            name: data.eventName,
            descripcion: data.shortDescription,
            categoria: data.category,
            tipo: data.type,
            region: data.region,
            provincia: data.province,
            ciudad: data.city,
            lugar: data.address,
            referencia: data.reference || "",
            lat: parseFloat(data.latitude) || 0,
            lng: parseFloat(data.longitude) || 0,
            fecha: data.startDate,
            fecha_fin: data.endDate || "",
            horario: data.schedule,
            repeticion: data.repetition,
            durMin: 120, // por ahora fijo
            organizador: data.organizer || "",
            telefono: data.phone || "",
            url: data.website || "",      // 👈 se guarda el URL del sitio oficial
            precio: data.price || "Libre",
            imagen: imagenUrl,
            tags: data.tags
                ? data.tags.split(",").map(t => t.trim()).filter(Boolean)
                : [],
            allowComments: allowComm,
            requireApproval: requireAppr,
            status,
            rejectReason: rejectText,

            // 🔢 Campos para estadísticas (demo)
            // puedes cambiar los rangos si quieres
            asistencias: form.dataset.editId
                ? (Number(data.asistencias) || Number(window.asistenciasDemo) || 0)
                : Math.floor(Math.random() * 300) + 50,     // 50–349

            rating: form.dataset.editId
                ? (Number(data.rating) || Number(window.ratingDemo) || 0)
                : Number((Math.random() * 1.5 + 3.0).toFixed(1)), // 3.0–4.5

            comentariosAprobados: form.dataset.editId
                ? (Number(data.comentariosAprobados) || Number(window.comentariosDemo) || 0)
                : Math.floor(Math.random() * 150)           // 0–149
        };
    }

    function guardar(statusForzado) {
        let eventos = cargarEventos();
        const evento = construirEvento(statusForzado);

        if (form.dataset.editId) {
            // actualizar
            eventos = eventos.map(e => e.id === evento.id ? evento : e);
        } else {
            // crear nuevo
            eventos.push(evento);
        }

        guardarEventos(eventos);
        console.log("✅ Evento guardado:", evento);

        alert(
            `Evento guardado como "${evento.status === "draft" ? "Borrador" : "Publicado"}" ✅`
        );

        // volver al listado admin
        window.location.href = "eventos-listado.html";
    }

    // --- Conectar botones ---
    btnPublicar?.addEventListener("click", (e) => {
        e.preventDefault();
        guardar("approved");
    });

    btnBorrador?.addEventListener("click", (e) => {
        e.preventDefault();
        guardar("draft");
    });
});