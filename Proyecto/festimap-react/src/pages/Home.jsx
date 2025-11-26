// src/pages/Home.jsx
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { list as listEventos } from "../services/eventos.service";
import EventCard from "../components/EventCard.jsx";


import "../styles/pages/home.css";

function buildTitle(ev) {
  return ev.titulo || ev.nombre || ev.name || ev.ciudad || "Evento";
}

function buildLugar(ev) {
  const partes = [];
  if (ev.ciudad) partes.push(ev.ciudad);
  if (ev.provincia) partes.push(ev.provincia);
  if (ev.region) partes.push(ev.region);
  return partes.join(" • ");
}

function buildFecha(ev) {
  if (!ev.fecha) return "";
  if (ev.fecha_fin && ev.fecha_fin !== ev.fecha) {
    return `${ev.fecha} – ${ev.fecha_fin}`;
  }
  return ev.fecha;
}

function buildImagenSrc(ev) {
  const img = ev.imagen;
  if (!img) return "";
  return img.startsWith("http") ? img : `/images/${img}`;
}

export default function Home() {
  const EVENTOS = listEventos();

  const [texto, setTexto] = useState("");
  const [region, setRegion] = useState("");
  const [tipo, setTipo] = useState("");
  const [fecha, setFecha] = useState("");
  

  // Regiones fijas para Ecuador
  const REGIONES = ["Sierra", "Costa", "Galápagos"];

  const TIPOS = useMemo(
    () =>
      Array.from(
        new Set(
          EVENTOS.map((e) => e.categoria || e.tipo || e.tema).filter(Boolean)
        )
      ).sort(),
    [EVENTOS]
  );

  const eventosFiltrados = useMemo(() => {
    const txt = texto.toLowerCase().trim();

    return EVENTOS.filter((ev) => {
      const title = buildTitle(ev).toLowerCase();
      const city = (ev.ciudad || "").toLowerCase();

      const matchesText =
        !txt || title.includes(txt) || city.includes(txt);

      const matchesRegion = !region || ev.region === region;

      const tipoEv = ev.categoria || ev.tipo || ev.tema;
      const matchesTipo = !tipo || tipoEv === tipo;

      let matchesFecha = true;
      if (fecha) {
        const inicio = ev.fecha;
        const fin = ev.fecha_fin || ev.fecha;
        if (inicio && fin) {
          matchesFecha = fecha >= inicio && fecha <= fin;
        } else if (inicio) {
          matchesFecha = fecha === inicio;
        }
      }

      // por ahora "dentroViaje" no filtra nada extra, solo se deja listo
      return matchesText && matchesRegion && matchesTipo && matchesFecha;
    }).sort((a, b) => {
      const fa = a.fecha || "9999-12-31";
      const fb = b.fecha || "9999-12-31";
      return fa.localeCompare(fb);
    });
  }, [EVENTOS, texto, region, tipo, fecha]);

  // Fecha de hoy en ISO (YYYY-MM-DD)
  const hoy = new Date().toISOString().slice(0, 10);

  // Carrusel: solo eventos próximos (no afectado por buscador)
  const destacados = useMemo(() => {
    return EVENTOS.filter((ev) => ev.fecha && ev.fecha >= hoy)
      .sort((a, b) => {
        const fa = a.fecha || "9999-12-31";
        const fb = b.fecha || "9999-12-31";
        return fa.localeCompare(fb);
      })
      .slice(0, 7);
  }, [EVENTOS, hoy]);

  // notas: el autoplay del slider ahora se realiza por CSS (keyframes)

  // Lista lateral: respuesta al buscador (filtrados)
  const listaLateral = eventosFiltrados.slice(0, 10);

  // (destacados y listaLateral definidos arriba)

  return (
    <main className="page-home container">
      <h1 className="section-title">Festividades para descubrir</h1>

      {/* Barra de búsqueda principal */}
      <form
        className="main-search-bar"
        onSubmit={(e) => e.preventDefault()}
      >
        <input
          type="search"
          className="input-search"
          placeholder="Buscar colada morada, Inti Raymi..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
        <button className="btn btn--primary" type="submit">
          Buscar
        </button>
      </form>

      {/* Filtros secundarios */}
      <div className="filters">
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
        >
          <option value="">Región</option>
          {REGIONES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
        >
          <option value="">Tipo</option>
          {TIPOS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
        />

        
      </div>

      {/* Carrusel + lista (dos columnas) */}
      <div className="grid-2">
        {/* COLUMNA IZQUIERDA: CARRUSEL */}
        <div className="slider-container">
          <div className="slider-track">
            {destacados.concat(destacados).map((ev, idx) => (
              <Link key={`${ev.id}-${idx}`} className="slide" to={`/evento/${ev.id}`}>
                <img
                  src={buildImagenSrc(ev)}
                  alt={buildTitle(ev)}
                />
                <div className="slide-caption">
                  <h3>{buildTitle(ev)}</h3>
                  <p>{ev.region || ""}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* COLUMNA DERECHA: LISTA */}
        <div className="list">
          <Link
            className="btn btn--primary btn--full-width"
            to="/region"
          >
            Ver mapa completo
          </Link>

          <section id="home-list">
            {listaLateral.length === 0 ? (
              <p className="muted">
                No se encontraron festividades con esos filtros.
              </p>
            ) : (
              listaLateral.map((ev) => (
                <article key={ev.id} className="list-card-home">
                  <div className="list-card-home__image">
                    <img
                      src={buildImagenSrc(ev)}
                      alt={buildTitle(ev)}
                    />
                  </div>

                  <div className="list-card-home__info">
                    <h4>{buildTitle(ev)}</h4>
                    <p className="muted">
                      {buildFecha(ev)}{" "}
                      {buildLugar(ev) && `• ${buildLugar(ev)}`}
                    </p>

                    <div className="card-actions">
                      <Link
                        className="btn btn--ghost"
                        to={`/evento/${ev.id}`}
                      >
                        Ver detalle
                      </Link>
                    </div>
                  </div>
                </article>
              ))
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
