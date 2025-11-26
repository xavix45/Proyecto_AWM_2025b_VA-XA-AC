import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { getJSON, setJSON } from "../../lib/storage";
import { getByIdFull } from "../../services/eventos.service";
import ConfirmModal from "../../components/ConfirmModal";
import "../../styles/pages/admin/admin-evento-formulario.css";

const LS_KEY = "fm:eventos:admin";

const CATEGORIAS = [
  "Cultural",
  "Gastronomía",
  "Religiosa",
  "Naturaleza",
  "Artesanía",
  "Deportes",
  "Turismo",
];

const TIPOS = ["tradición", "cívica", "ancestral", "comunitaria", "festiva", "peregrinación"];

const REGIONES = ["Costa", "Sierra", "Amazonía", "Galápagos"];

const PROVINCIAS_POR_REGION = {
  Costa: ["Esmeraldas", "Manabí", "Guayas", "Santa Elena"],
  Sierra: ["Pichincha", "Imbabura", "Cotopaxi", "Tungurahua"],
  "Amazonía": ["Napo", "Orellana"],
  "Galápagos": ["Galápagos"],
};

function cargarEventos() {
  return getJSON(LS_KEY, []);
}

function guardarEventos(arr) {
  setJSON(LS_KEY, arr);
}

export default function EventForm() {
  const formRef = useRef(null);
  const thumbsRef = useRef(null);
  const [imagePreview, setImagePreview] = useState("");
  const [provincias, setProvincias] = useState([]);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const params = useParams();
  const [modal, setModal] = useState({ show: false, title: '', message: '', type: 'info', onConfirm: null });

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

    // si estamos editando, cargar datos (buscamos en override y en el dataset base)
    if (editId) {
      const ev = getByIdFull(editId) || cargarEventos().find((e) => String(e.id) === String(editId));
      if (ev) {
        console.log('[EventForm] Cargando evento para editar:', ev);
        
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
        form.organizer.value = ev.organizador || "";
        form.phone.value = ev.telefono || "";
        form.website.value = ev.url || "";
        form.price.value = ev.precio || "";
        form.tags.value = (ev.tags || []).join(", ");
        if (form.querySelector('input[name="allowComments"]'))
          form.querySelector('input[name="allowComments"]').checked = !!ev.allowComments;
        if (form.querySelector('input[name="requireApproval"]'))
          form.querySelector('input[name="requireApproval"]').checked = !!ev.requireApproval;
        
        // Cargar imagen - el campo imageUrl está fuera del form, en el aside
        setTimeout(() => {
          const imageVal = ev.imagen || ev.image || ev.imageUrl || ev.imagenUrl || ev.imagenPrincipal || '';
          console.log('[EventForm] Intentando cargar imagen:', imageVal);
          
          // Buscar el campo directamente en el documento ya que está fuera del form
          const imageUrlField = document.querySelector('input[name="imageUrl"]');
          console.log('[EventForm] Campo imageUrl existe?:', !!imageUrlField);
          
          if (imageUrlField) {
            imageUrlField.value = imageVal || '';
            console.log('[EventForm] Valor asignado al campo:', imageUrlField.value);
            
            if (imageVal) {
              // Construir URL completa si es una ruta relativa
              let fullImageUrl = imageVal;
              if (!imageVal.startsWith('http')) {
                fullImageUrl = `/images/${imageVal}`;
                console.log('[EventForm] URL completa:', fullImageUrl);
              }
              setImagePreview(fullImageUrl);
            } else {
              console.warn('[EventForm] No se encontró URL de imagen en evento');
              setImagePreview('');
            }
          } else {
            console.error('[EventForm] Campo imageUrl no encontrado en el documento');
          }
        }, 150);
      } else {
        console.warn('[EventForm] No se encontró evento con id:', editId);
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
    img.onerror = () => {
      console.error('[EventForm] Error cargando imagen:', imagePreview);
      img.style.display = 'none';
      const errorP = document.createElement('p');
      errorP.textContent = '⚠️ No se pudo cargar la imagen';
      errorP.style.fontSize = '0.85rem';
      errorP.style.color = '#d9534f';
      box.appendChild(errorP);
    };
    box.appendChild(img);
  }, [imagePreview]);

  function construirEvento(statusForzado) {
    const form = formRef.current;
    const data = Object.fromEntries(new FormData(form));
    let status = statusForzado || 'pending';
    const imagenUrl = form.querySelector('input[name="imageUrl"]')?.value.trim() || '';
    const allowComm = form.querySelector('input[name="allowComments"]')?.checked || false;
    const requireAppr = form.querySelector('input[name="requireApproval"]')?.checked || false;
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
      repeticion: data.repetition || 'No se repite',
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
      rejectReason: '',
      asistencias: form.dataset.editId ? (Number(data.asistencias) || 0) : Math.floor(Math.random() * 300) + 50,
      rating: form.dataset.editId ? (Number(data.rating) || 0) : Number((Math.random() * 1.5 + 3.0).toFixed(1)),
      comentariosAprobados: form.dataset.editId ? (Number(data.comentariosAprobados) || 0) : Math.floor(Math.random() * 150),
    };
  }

  function guardar(statusForzado) {
    const eventos = cargarEventos() || [];
    const evento = construirEvento(statusForzado);
    let nuevos = eventos;
    if (formRef.current.dataset.editId) {
      nuevos = eventos.map((e) => (e.id === evento.id ? evento : e));
    } else {
      nuevos = [...eventos, evento];
    }
    guardarEventos(nuevos);
    try { window.dispatchEvent(new Event('fm:eventos:changed')); } catch (e) {}
    
    const statusLabel = evento.status === 'draft' ? 'Borrador' : evento.status === 'pending' ? 'En Revisión' : 'Publicado';
    setModal({
      show: true,
      title: '✅ Evento Guardado',
      message: `El evento se guardó exitosamente como "${statusLabel}".`,
      type: 'success',
      onConfirm: () => {
        setModal({ show: false, title: '', message: '', type: 'info', onConfirm: null });
        navigate('/admin');
      }
    });
  }

  function onPublicar(e) {
    e.preventDefault();
    // Al crear/editar desde el formulario, por defecto enviamos a revisión (pending).
    guardar('pending');
  }

  function onBorrador(e) {
    e.preventDefault();
    guardar('draft');
  }

  function onImageUrlChange(e) {
    const val = e.target.value.trim();
    // Si no comienza con http, asumimos que es ruta relativa y agregamos /images/
    const fullUrl = (val && !val.startsWith('http')) ? `/images/${val}` : val;
    setImagePreview(fullUrl);
  }

  return (
    <main className="container section section-admin">
      <h2 className="page-title">{editId ? 'Evento — Editar' : 'Evento — Crear'}</h2>

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
              <label className="form__label">Horario*
                <input className="input" name="schedule" placeholder="09:00–14:00 o Varios" required />
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
              <label className="form__label half">Detallar precios
                <input className="input" name="price" placeholder="Ej: Entrada $5, Niños gratis, Gratuito" />
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
        </aside>
      </div>

      {modal.show && (
        <ConfirmModal
          show={modal.show}
          title={modal.title}
          message={modal.message}
          type={modal.type}
          onConfirm={modal.onConfirm}
          onCancel={() => setModal({ show: false, title: '', message: '', type: 'info', onConfirm: null })}
        />
      )}
    </main>
  );
}
