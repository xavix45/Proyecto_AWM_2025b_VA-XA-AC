// src/pages/Region.jsx
import { useLocation, Link } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import { list as listEventos } from "../services/eventos.service";
import PROVINCIAS_BY_REGION from "../data/provincias";

import "../styles/pages/region.css";

const EVENTOS_TODOS = listEventos();
const REGIONES_TABS = ["Costa", "Sierra", "Amazonía", "Galápagos"];

function buildTitle(ev) {
  return ev.name || ev.titulo || ev.nombre || ev.ciudad || "Evento";
}

function buildLugar(ev) {
  const partes = [];
  if (ev.ciudad) partes.push(ev.ciudad);
  if (ev.provincia) partes.push(ev.provincia);
  if (ev.region) partes.push(ev.region);
  return partes.join(" • ");
}

function buildFechas(ev) {
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

function buildMapUrl(ev) {
  const hasCoords =
    typeof ev.lat === "number" &&
    typeof ev.lng === "number" &&
    !Number.isNaN(ev.lat) &&
    !Number.isNaN(ev.lng);

  if (hasCoords) {
    return `https://www.google.com/maps?q=${ev.lat},${ev.lng}&z=13&output=embed`;
  }

  const query = encodeURIComponent(
    `${ev.lugar || ""} ${ev.ciudad || ""} ${ev.provincia || ""} Ecuador`
  );
  return `https://www.google.com/maps?q=${query}&z=13&output=embed`;
}

export default function Region() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const idParam = searchParams.get("id");

  const eventoInicial = idParam
    ? EVENTOS_TODOS.find((e) => String(e.id) === String(idParam))
    : null;

  const [regionActual, setRegionActual] = useState(
    eventoInicial?.region || "Sierra"
  );
  const [provincia, setProvincia] = useState(eventoInicial?.provincia || "");
  const [canton, setCanton] = useState(eventoInicial?.ciudad || "");
  const [texto, setTexto] = useState("");
  const [selectedId, setSelectedId] = useState(eventoInicial?.id ?? null);

  const selectedEvent = useMemo(
    () =>
      EVENTOS_TODOS.find((e) => String(e.id) === String(selectedId)) || null,
    [selectedId]
  );

  // Cuando cambia de región, ajustar filtros provincia/cantón
  useEffect(() => {
    if (selectedEvent && selectedEvent.region === regionActual) {
      setProvincia(selectedEvent.provincia || "");
      setCanton(selectedEvent.ciudad || "");
    } else {
      setProvincia("");
      setCanton("");
    }
  }, [regionActual, selectedEvent]);

  // Cuando cambia la provincia manualmente, limpiar el cantón seleccionado
  useEffect(() => {
    setCanton("");
  }, [provincia]);

  const eventosRegion = useMemo(
    () => EVENTOS_TODOS.filter((ev) => ev.region === regionActual),
    [regionActual]
  );

  // Provincias: usar lista completa por región (si existe),
  // si no hay mapeo disponible revertir a las provincias presentes en los eventos
  const PROVINCIAS = useMemo(() => {
    const listaMap = PROVINCIAS_BY_REGION[regionActual];
    if (Array.isArray(listaMap) && listaMap.length > 0) return listaMap.slice();
    return Array.from(new Set(eventosRegion.map((e) => e.provincia).filter(Boolean))).sort();
  }, [regionActual, eventosRegion]);

  const CANTONES = useMemo(
    () => {
      // Si hay provincia seleccionada, devolver solo cantones de esa provincia
      if (provincia) {
        return Array.from(
          new Set(
            eventosRegion
              .filter((e) => e.provincia === provincia)
              .map((e) => e.ciudad)
              .filter(Boolean)
          )
        ).sort();
      }

      return Array.from(
        new Set(eventosRegion.map((e) => e.ciudad).filter(Boolean))
      ).sort();
    },
    [eventosRegion, provincia]
  );

  const eventosFiltrados = useMemo(() => {
    let lista = eventosRegion;

    if (provincia) {
      lista = lista.filter((ev) => ev.provincia === provincia);
    }
    if (canton) {
      lista = lista.filter((ev) => ev.ciudad === canton);
    }

    const txt = texto.toLowerCase().trim();
    if (txt) {
      lista = lista.filter((ev) => {
        const titulo = buildTitle(ev).toLowerCase();
        const ciudad = (ev.ciudad || "").toLowerCase();
        return titulo.includes(txt) || ciudad.includes(txt);
      });
    }

    return lista.sort((a, b) => {
      const fa = a.fecha || "9999-12-31";
      const fb = b.fecha || "9999-12-31";
      return fa.localeCompare(fb);
    });
  }, [eventosRegion, provincia, canton, texto]);

  const mapUrl = useMemo(() => {
    if (!selectedEvent || selectedEvent.region !== regionActual) {
      return "https://www.google.com/maps?q=Ecuador&z=6&output=embed";
    }
    return buildMapUrl(selectedEvent);
  }, [selectedEvent, regionActual]);

  const mapCaption = useMemo(() => {
    if (!selectedEvent || selectedEvent.region !== regionActual) {
      return "Selecciona un evento de la lista para centrar el mapa.";
    }
    return `${buildTitle(selectedEvent)} • ${buildLugar(selectedEvent)}`;
  }, [selectedEvent, regionActual]);

  return (
    <main className="page-region container section">
      <h2 className="page-title">Explorar por región</h2>

      {/* Barra de tabs + filtros */}
      <div className="filters-bar">
        <div className="tabs">
          {REGIONES_TABS.map((r) => (
            <button
              key={r}
              type="button"
              className={`tab ${regionActual === r ? "is-active" : ""}`}
              onClick={() => {
                setRegionActual(r);
                setSelectedId(null);
              }}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="filters">
          <select
            className="input"
            value={provincia}
            onChange={(e) => setProvincia(e.target.value)}
          >
            <option value="">Provincia (todas)</option>
            {PROVINCIAS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <select
            className="input"
            value={canton}
            onChange={(e) => setCanton(e.target.value)}
          >
            <option value="">Cantón / Ciudad (todos)</option>
            {CANTONES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <input
            type="search"
            className="input"
            placeholder="Buscar por nombre o ciudad..."
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />

          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              // Los filtros ya se aplican en tiempo real; este botón
              // solo evita que se envíe un formulario.
            }}
          >
            Aplicar
          </button>
        </div>
      </div>

      {/* Mapa + lista */}
      <div className="grid-region">
        {/* Lado mapa */}
        <div className="map">
          <iframe
            title="Mapa de eventos"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={mapUrl}
          />
          <p
            className="muted"
            style={{ marginTop: 8, fontSize: "0.85rem", padding: "0 12px 8px" }}
          >
            {mapCaption}
          </p>
        </div>

        {/* Lado lista */}
        <div className="list">
          <h3 className="list-title">
            Eventos activos en {regionActual}
          </h3>

          <section className="cards-grid">
            {eventosFiltrados.length === 0 ? (
              <p className="muted">
                No hay eventos que coincidan con los filtros.
              </p>
            ) : (
              eventosFiltrados.map((ev) => (
                <article
                  key={ev.id}
                  className={`card ${selectedId === ev.id ? "is-selected" : ""
                    }`}
                  onClick={() => setSelectedId(ev.id)}
                >
                  <img
                    src={buildImagenSrc(ev)}
                    alt={buildTitle(ev)}
                  />
                  <div className="card__body">
                    <h4>{buildTitle(ev)}</h4>
                    <p className="muted">
                      {buildFechas(ev)} • {buildLugar(ev)}
                    </p>
                    <Link
                      className="btn btn--ghost"
                      to={`/evento/${ev.id}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      Ver detalle
                    </Link>
                  </div>
                </article>
              ))
            )}
          </section>

          {/* Paginación decorativa */}
          <nav className="pagination">
            <span>&lt;</span>
            <a href="#" className="is-active">
              1
            </a>
            <a href="#">2</a>
            <a href="#">3</a>
            <span>...</span>
            <a href="#">Siguiente &gt;</a>
          </nav>
        </div>
      </div>
    </main>
  );
}
