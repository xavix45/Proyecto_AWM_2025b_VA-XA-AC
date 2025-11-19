import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import "../../styles/pages/admin/admin-evento-formulario.css";

const LS_KEY = "EVENTOS_ADMIN";

const CATEGORIAS = [
  "Cultural",
  "Gastronomía",
  "Religiosa",
  "Tradición",
  "Naturaleza",
  "Feria / Artesanías",
  "Recreativa",
  "Turística",
];

const TIPOS = ["tradición", "cívica", "religiosa", "ancestral"];

const REGIONES = ["Costa", "Sierra", "Amazonía", "Galápagos"];

const PROVINCIAS_POR_REGION = {
  Costa: ["Esmeraldas", "Manabí", "Guayas", "Santa Elena"],
  Sierra: ["Pichincha", "Imbabura", "Cotopaxi", "Tungurahua"],
  "Amazonía": ["Napo", "Orellana"],
  "Galápagos": ["Galápagos"],
};

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

export default function EventForm() {
  const formRef = useRef(null);
  const thumbsRef = useRef(null);
  const [imagePreview, setImagePreview] = useState("");
  const [provincias, setProvincias] = useState([]);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const params = useParams();

  const routeId = params?.id;
  const editId = routeId || searchParams.get("id");

  useEffect(() => {
    // llenar selects
    const form = formRef.current;
    if (!form) return;

    const selectCategoria = form.querySelector('select[name="category"]');
    const selectTipo = form.querySelector('select[name="type"]');
    const selectRegion = form.querySelector('select[name="region"]');
    const selectProvincia = form.querySelector('select[name="province"]');

    function fillSelect(select, options, placeholder = "Selecciona...") {
      if (!select) return;
      select.innerHTML = "";
      const optPlaceholder = document.createElement("option");
      optPlaceholder.value = "";
      optPlaceholder.textContent = placeholder;
      select.appendChild(optPlaceholder);
      options.forEach((v) => {
        const opt = document.createElement("option");
        opt.value = v;
        opt.textContent = v;
        select.appendChild(opt);
      });
    }

    fillSelect(selectCategoria, CATEGORIAS, "Selecciona categoría...");
    fillSelect(selectTipo, TIPOS, "Selecciona tipo...");
    fillSelect(selectRegion, REGIONES, "Selecciona región...");
    fillSelect(selectProvincia, [], "Selecciona provincia...");

    // cuando cambie región, actualizar provincias y estado React
    selectRegion.addEventListener("change", () => {
      const region = selectRegion.value;
      const provs = PROVINCIAS_POR_REGION[region] || [];
      fillSelect(selectProvincia, provs, "Selecciona provincia...");
      setProvincias(provs);
    });

    // si estamos editando, cargar datos
    if (editId) {
      const eventos = cargarEventos();
      const ev = eventos.find((e) => String(e.id) === String(editId));
      if (ev) {
        form.dataset.editId = editId;
        form.eventName.value = ev.name || "";
        form.shortDescription.value = ev.descripcion || "";
        form.category.value = ev.categoria || "";
        form.type.value = ev.tipo || "";
        form.region.value = ev.region || "";
        // disparar cambio region para llenar provincias
        const evt = new Event('change');
        selectRegion.dispatchEvent(evt);
        form.province.value = ev.provincia || "";
        form.city.value = ev.ciudad || "";
        form.address.value = ev.lugar || "";
        form.reference.value = ev.referencia || "";
        form.latitude.value = ev.lat || "";
        form.longitude.value = ev.lng || "";
        form.startDate.value = ev.fecha || "";
        form.endDate.value = ev.fecha_fin || "";
        form.schedule.value = ev.horario || "";
        form.repetition.value = ev.repeticion || "No se repite";
        form.organizer.value = ev.organizador || "";
        form.phone.value = ev.telefono || "";
        form.website.value = ev.url || "";
        form.price.value = ev.precio || "";
        form.tags.value = (ev.tags || []).join(", ");
        if (form.querySelector('input[name="allowComments"]'))
          form.querySelector('input[name="allowComments"]').checked = !!ev.allowComments;
        if (form.querySelector('input[name="requireApproval"]'))
          form.querySelector('input[name="requireApproval"]').checked = !!ev.requireApproval;
        if (form.querySelector('select[name="status"]'))
          form.querySelector('select[name="status"]').value = ev.status || 'draft';
        if (form.querySelector('textarea[name="rejectReason"]'))
          form.querySelector('textarea[name="rejectReason"]').value = ev.rejectReason || '';
        if (form.querySelector('input[name="imageUrl"]') && ev.imagen) {
          form.querySelector('input[name="imageUrl"]').value = ev.imagen;
          setImagePreview(ev.imagen);
        }
      }
    }
  }, [editId]);

  useEffect(() => {
    // actualizar miniatura cuando imagePreview cambia
    const box = thumbsRef.current;
    if (!box) return;
    box.innerHTML = "";
    if (!imagePreview) {
      const p = document.createElement('p');
      p.textContent = '[ Miniaturas de fotos subidas ]';
      p.style.fontSize = '0.85rem';
      p.style.color = '#777';
      box.appendChild(p);
      return;
    }
    const img = document.createElement('img');
    img.src = imagePreview;
    img.alt = 'Vista previa del evento';
    img.style.maxWidth = '100%';
    img.style.maxHeight = '180px';
    img.style.objectFit = 'cover';
    img.style.borderRadius = '12px';
    box.appendChild(img);
  }, [imagePreview]);

  function construirEvento(statusForzado) {
    const form = formRef.current;
    const data = Object.fromEntries(new FormData(form));
    let status = statusForzado || (form.querySelector('select[name="status"]')?.value) || 'draft';
    if (form.querySelector('select[name="status"]')) form.querySelector('select[name="status"]').value = status;
    const imagenUrl = form.querySelector('input[name="imageUrl"]')?.value.trim() || '';
    const allowComm = form.querySelector('input[name="allowComments"]')?.checked || false;
    const requireAppr = form.querySelector('input[name="requireApproval"]')?.checked || false;
    const rejectText = form.querySelector('textarea[name="rejectReason"]')?.value.trim() || '';
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
      referencia: data.reference || '',
      lat: parseFloat(data.latitude) || 0,
      lng: parseFloat(data.longitude) || 0,
      fecha: data.startDate,
      fecha_fin: data.endDate || '',
      horario: data.schedule,
      repeticion: data.repetition,
      durMin: 120,
      organizador: data.organizer || '',
      telefono: data.phone || '',
      url: data.website || '',
      precio: data.price || 'Libre',
      imagen: imagenUrl,
      tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      allowComments: allowComm,
      requireApproval: requireAppr,
      status,
      rejectReason: rejectText,
      asistencias: form.dataset.editId ? (Number(data.asistencias) || 0) : Math.floor(Math.random() * 300) + 50,
      rating: form.dataset.editId ? (Number(data.rating) || 0) : Number((Math.random() * 1.5 + 3.0).toFixed(1)),
      comentariosAprobados: form.dataset.editId ? (Number(data.comentariosAprobados) || 0) : Math.floor(Math.random() * 150),
    };
  }

  function guardar(statusForzado) {
    const eventos = cargarEventos();
    const evento = construirEvento(statusForzado);
    let nuevos = eventos;
    if (formRef.current.dataset.editId) {
      nuevos = eventos.map(e => e.id === evento.id ? evento : e);
    } else {
      nuevos = [...eventos, evento];
    }
    guardarEventos(nuevos);
    alert(`Evento guardado como "${evento.status === 'draft' ? 'Borrador' : 'Publicado'}" ✅`);
    navigate('/admin');
  }

  function onPublicar(e) {
    e.preventDefault();
    guardar('approved');
  }

  function onBorrador(e) {
    e.preventDefault();
    guardar('draft');
  }

  function onImageUrlChange(e) {
    setImagePreview(e.target.value.trim());
  }

  return (
    <main className="container section section-admin">
      <h2 className="page-title">Evento — Crear / Editar</h2>

      <div className="grid-2 grid-form-page">
        <form className="form form-stacked" ref={formRef}>
          <section className="form__section">
            <h3>Datos principales</h3>
            <label className="form__label">Nombre del evento*
              <input className="input" name="eventName" required />
            </label>
            <label className="form__label">Descripción corta*
              <textarea className="input" name="shortDescription" rows="3" maxLength={200} required></textarea>
            </label>

            <div className="form__row">
              <label className="form__label half">Categoría*
                <select className="input" name="category" required></select>
              </label>
              <label className="form__label half">Tipo*
                <select className="input" name="type" required></select>
              </label>
            </div>

            <div className="form__row">
              <label className="form__label half">Región*
                <select className="input" name="region" required></select>
              </label>
              <label className="form__label half">Provincia*
                <select className="input" name="province" required></select>
              </label>
            </div>

            <div className="form__row">
              <label className="form__label half">Ciudad / Parroquia*
                <input className="input" name="city" required />
              </label>
              <label className="form__label half">Dirección*
                <input className="input" name="address" required />
              </label>
            </div>

            <div className="form__row">
              <label className="form__label half">Referencia
                <input className="input" name="reference" />
              </label>
            </div>

            <div className="form__row">
              <label className="form__label half">Latitud
                <input className="input" name="latitude" type="number" step="any" placeholder="-0.8301" />
              </label>
              <label className="form__label half">Longitud
                <input className="input" name="longitude" type="number" step="any" placeholder="-78.6150" />
              </label>
            </div>
          </section>

          <section className="form__section">
            <h3>Fechas y horarios</h3>
            <div className="form__row">
              <label className="form__label half">Fecha inicio*
                <input type="date" className="input" name="startDate" required />
              </label>
              <label className="form__label half">Fecha fin*
                <input type="date" className="input" name="endDate" required />
              </label>
            </div>
            <div className="form__row">
              <label className="form__label half">Horario*
                <input className="input" name="schedule" placeholder="09:00–14:00 o Varios" required />
              </label>
              <label className="form__label half">Repetición
                <select className="input" name="repetition">
                  <option>No se repite</option>
                  <option>Semanal (Jueves)</option>
                </select>
              </label>
            </div>
          </section>

          <section className="form__section">
            <h3>Contacto y extras</h3>
            <div className="form__row">
              <label className="form__label half">Organizador
                <input className="input" name="organizer" />
              </label>
              <label className="form__label half">Teléfono / WhatsApp
                <input className="input" name="phone" type="tel" />
              </label>
            </div>
            <div className="form__row">
              <label className="form__label half">Website / enlace
                <input className="input" name="website" type="url" />
              </label>
              <label className="form__label half">Precio (opcional)
                <input className="input" name="price" placeholder="Ej: $5.00 o Gratuito" />
              </label>
            </div>
            <label className="form__label">Etiquetas
              <input className="input" name="tags" placeholder="feria, comida, artesania (separadas por coma)" />
            </label>
          </section>

          <div className="form__actions">
            <button className="btn btn--primary" onClick={onPublicar}>Guardar y Publicar</button>
            <button className="btn btn--ghost" type="button" onClick={onBorrador}>Guardar Borrador</button>
          </div>
        </form>

        <aside className="panel panel-sticky">
          <section className="panel__section">
            <h3>Multimedia</h3>
            <div className="dropzone" onClick={() => { /* No upload UI implemented */ }}>
              <p>Arrastra imágenes aquí o haz clic para subir</p>
              <small>(JPG/PNG, 5MB máx.)</small>
              <div className="thumbnails" ref={thumbsRef}></div>
            </div>

            <label className="form__label" style={{ marginTop: '1rem' }}>
              URL imagen principal
              <input className="input" name="imageUrl" onChange={onImageUrlChange} />
            </label>
          </section>

          <section className="panel__section">
            <h3>Moderación de comentarios</h3>
            <label className="checkbox">
              <input type="checkbox" name="allowComments" defaultChecked />
              Permitir comentarios
            </label>
            <label className="checkbox">
              <input type="checkbox" name="requireApproval" />
              Requiere aprobación de admin
            </label>
          </section>

          <section className="panel__section">
            <h3>Estado del evento</h3>
            <label className="form__label">Estado
              <select className="input" name="status">
                <option value="draft">Borrador</option>
                <option value="pending">Pendiente</option>
                <option value="approved">Aprobado</option>
                <option value="rejected">Rechazado</option>
              </select>
            </label>
            <textarea className="input" name="rejectReason" rows="3" placeholder="Motivo de rechazo (si aplica)"></textarea>
          </section>

          <section className="panel__section">
            <h3>Estadísticas rápidas</h3>
            <ul className="stats-list">
              <li>Asistencias confirmadas: <strong>420</strong></li>
              <li>Valoración promedio: <strong>4.6★</strong></li>
              <li>Comentarios aprobados: <strong>92</strong></li>
            </ul>
          </section>

          <section className="panel__section">
            <h3>Historial de cambios</h3>
            <div className="history">
              <p>12 Oct 10:05 • Ana (aprobó)</p>
              <p>11 Oct 15:20 • Luis (editó horario)</p>
              <p>10 Oct 09:00 • Luis (creó borrador)</p>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
