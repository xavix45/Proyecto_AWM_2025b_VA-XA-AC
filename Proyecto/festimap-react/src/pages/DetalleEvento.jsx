// src/pages/DetalleEvento.jsx
// PAGINA: DetalleEvento
// Token de búsqueda: PAGE:DetalleEvento
// Muestra detalles completos de un evento, permite añadir a agenda,
// registrar asistencia y enviar reseñas (rating + comentario).
// Estados: `rating`, `comentario`, `modal`.
import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";

import { getById, list as listEventos, addAttendance, addReview } from "../services/eventos.service";
import { add as addAgenda } from "../services/agenda.service";
import ConfirmModal from "../components/ConfirmModal";

import "../styles/pages/detalle-evento.css";

const DEMO_USER_ID = "demo-user"; // fallback

function getCurrentUserId() {
    try {
        const raw = localStorage.getItem('festi_usuario');
        if (raw) {
            const u = JSON.parse(raw);
            if (u && (u.email || u.id)) return u.email || u.id;
        }
    } catch (e) {}
    const email = localStorage.getItem('currentUserEmail');
    if (email) return email;
    return DEMO_USER_ID;
}

function formateaFechas(ev) {
  if (!ev?.fecha) return "";
  if (ev.fecha_fin && ev.fecha_fin !== ev.fecha) {
    return `${ev.fecha} – ${ev.fecha_fin}`;
  }
  return ev.fecha;
}

function lugarTexto(ev) {
  if (!ev) return "";
  const partes = [];
  if (ev.ciudad) partes.push(ev.ciudad);
  if (ev.provincia) partes.push(ev.provincia);
  if (ev.region) partes.push(ev.region);
  return partes.join(" • ");
}

function buildImagenSrc(ev) {
  if (!ev?.imagen) return "";
  return ev.imagen.startsWith("http") ? ev.imagen : `/images/${ev.imagen}`;
}

export default function DetalleEvento() {
  const { id } = useParams();
  const navigate = useNavigate();

  const evento = getById(id);
  const TODOS_EVENTOS = listEventos();

  const [rating, setRating] = useState(0);
  const [comentario, setComentario] = useState("");
  const [modal, setModal] = useState({ show: false, title: '', message: '', type: 'info', onConfirm: null });

  if (!evento) {
    return (
      <main className="container page-detalle">
        <p>Evento no encontrado.</p>
        <Link className="btn btn--ghost" to="/home">
          Volver a Home
        </Link>
      </main>
    );
  }

  const {
    titulo,
    nombre,
    ciudad,
    descripcion,
    descripcion_larga,
    tema,
    categoria,
    region,
    lugar,
    url,
  } = evento;

  const tituloMostrar =
    titulo || nombre || evento.name || ciudad || "Detalle del evento";

  const fechas = formateaFechas(evento);
  const donde = lugarTexto(evento);
  const imagenSrc = buildImagenSrc(evento);
  const temaMostrar = tema || categoria;

  const metaDetalle = [fechas, donde].filter(Boolean).join(" • ");

  // relacionados por misma región (máx. 3)
  const relacionados = TODOS_EVENTOS.filter(
    (ev) => ev.id !== evento.id && ev.region && ev.region === region
  ).slice(0, 3);

  function handleAgregarAgenda() {
    const userId = getCurrentUserId();
    const fechaItem =
      evento.fecha || new Date().toISOString().slice(0, 10);

    addAgenda(userId, {
      idEvento: evento.id,
      fecha: fechaItem,
      nota: "",
    });

    // Notificar que la agenda cambió para actualizar la página Agenda
    try { 
      window.dispatchEvent(new Event('fm:agenda:changed')); 
    } catch (e) {}

    // Registrar asistencia/visita en el dataset de eventos (persistente)
    try {
      addAttendance(evento.id, userId);
      // Notificar a la app que los eventos cambiaron (para refresh en admin/listados)
      try { window.dispatchEvent(new Event('fm:eventos:changed')); } catch (e) {}
    } catch (err) {
      console.warn('[DetalleEvento] addAttendance error', err);
    }

    setModal({
      show: true,
      title: '✅ Evento Agregado',
      message: 'Evento agregado a tu agenda. Ve a la página Agenda para verlo.',
      type: 'success',
      onConfirm: () => setModal({ show: false, title: '', message: '', type: 'info', onConfirm: null })
    });
  }

  function handleVerMapa() {
    // De momento solo navegamos a /region (luego se puede pasar estado o query ?id=)
    navigate("/region");
  }

  function handleSubmitOpinion(e) {
    e.preventDefault();
    // Guardar rating y comentario en dataset de eventos para estadísticas
    if (!comentario.trim() && !rating) {
      setModal({
        show: true,
        title: '⚠️ Campo Requerido',
        message: 'Escribe un comentario o selecciona una valoración antes de enviar.',
        type: 'warning',
        onConfirm: () => setModal({ show: false, title: '', message: '', type: 'info', onConfirm: null })
      });
      return;
    }

    const userId = getCurrentUserId();
    try {
      addReview(evento.id, { userId: userId, rating, comment: comentario });
      try { window.dispatchEvent(new Event('fm:eventos:changed')); } catch (e) {}
      setModal({
        show: true,
        title: '👍 Opinión Enviada',
        message: 'Gracias por tu opinión (modo demo).',
        type: 'success',
        onConfirm: () => {
          setModal({ show: false, title: '', message: '', type: 'info', onConfirm: null });
          setComentario("");
          setRating(0);
        }
      });
    } catch (err) {
      console.error('[DetalleEvento] addReview error', err);
      setModal({
        show: true,
        title: '❌ Error',
        message: 'No se pudo guardar la opinión en modo demo.',
        type: 'danger',
        onConfirm: () => setModal({ show: false, title: '', message: '', type: 'info', onConfirm: null })
      });
    }
  }

  const estrellas = [1, 2, 3, 4, 5].map((n) => (
    <span
      key={n}
      className={`star ${n <= rating ? "is-active" : ""}`}
      onClick={() => setRating(n)}
    >
      ★
    </span>
  ));

  return (
    <main className="container section page-detalle">
      {/* Banner */}
      <div className="banner">
        {imagenSrc && (
          <img
            src={imagenSrc}
            alt={tituloMostrar}
            className="banner-img"
          />
        )}
      </div>

      {/* Cabecera detalle */}
      <div className="detail-head">
        <div>
          <h2 className="page-title">{tituloMostrar}</h2>
          <p className="muted">
            {fechas && (
              <>
                📅 <span>{fechas}</span>
              </>
            )}
            {fechas && donde && " • "}
            {donde && (
              <>
                📍 <span>{donde}</span>
              </>
            )}
          </p>

          {/* Tags debajo del título (tema / región) */}
          <div className="detalle-tags">
            {temaMostrar && (
              <span className="tag tag--tema">{temaMostrar}</span>
            )}
            {region && (
              <span className="tag tag--region">{region}</span>
            )}
          </div>
        </div>

        <div className="detail-actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={handleVerMapa}
          >
            Ver en mapa
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={handleAgregarAgenda}
          >
            Marcar como visitado
          </button>
        </div>
      </div>

      {/* Barra de descripción corta */}
      {descripcion && (
        <div className="detail-description-bar">
          {descripcion}
        </div>
      )}

      {/* Botón a sitio oficial si existe URL */}
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="btn btn--primary btn--full-width"
        >
          Ir al sitio oficial
        </a>
      )}

      {/* Layout 2 columnas: descripción + experiencia */}
      <section className="detalle-layout">
        <article>
          <h3>Descripción</h3>
          <p className="muted">
            {descripcion_larga ||
              descripcion ||
              "Sin información detallada disponible."}
          </p>

          {/* Lugar explícito */}
          {lugar && (
            <>
              <h3>Lugar</h3>
              <p className="muted">{lugar}</p>
            </>
          )}

          {/* Galería (simple, con la misma imagen de momento) */}
          <h3>Galería</h3>
          <div className="grid-3 thumbs">
            {imagenSrc && (
              <div className="thumb">
                <img
                  src={imagenSrc}
                  alt={tituloMostrar}
                  className="thumb-img"
                />
              </div>
            )}
          </div>

          <Link
            className="btn btn--ghost btn--full-width"
            to="/home"
          >
            Volver al mapa cultural
          </Link>
        </article>

        <aside className="panel">
          <h3>Tu experiencia</h3>

          <button
            className="btn btn--primary btn--full-width"
            type="button"
            onClick={handleAgregarAgenda}
          >
            Agregar a mi agenda
          </button>

          <hr />

          <label className="form__label">Valorar</label>
          <div className="stars">{estrellas}</div>

          <label className="form__label">Comentario (≤150)</label>
          <form onSubmit={handleSubmitOpinion}>
            <textarea
              className="input"
              rows={3}
              maxLength={150}
              placeholder="Breve opinión…"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
            />
            <button
              className="btn btn--primary btn--full-width"
              type="submit"
            >
              Enviar
            </button>
          </form>
        </aside>
      </section>

      {/* También cerca */}
      <h3>También cerca</h3>
      <section className="relacionados-grid">
        {relacionados.length === 0 ? (
          <p className="muted">
            No hay otros eventos cercanos registrados.
          </p>
        ) : (
          relacionados.map((ev) => {
            const t =
              ev.name || ev.titulo || ev.nombre || ev.ciudad || "Evento";
            const f = formateaFechas(ev);
            const l = lugarTexto(ev);
            const img = buildImagenSrc(ev);
            const meta = [f, l].filter(Boolean).join(" • ");

            return (
              <article key={ev.id} className="card rel-card">
                {img && (
                  <img
                    src={img}
                    alt={t}
                    className="card__media"
                  />
                )}
                <div className="card__body">
                  <h4 className="card__title">{t}</h4>
                  {meta && (
                    <p className="card__meta">{meta}</p>
                  )}
                  <Link
                    className="btn btn--ghost"
                    to={`/evento/${ev.id}`}
                  >
                    Ver detalle
                  </Link>
                </div>
              </article>
            );
          })
        )}
      </section>

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
