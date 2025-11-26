// src/pages/Tema.jsx
import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { list as listEventos } from "../services/eventos.service";

import "../styles/pages/tema.css";

const EVENTOS_TODOS = listEventos();

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

function buildTitulo(ev) {
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

export default function Tema() {
  // `textoInput` sigue el input del usuario; `textoBusqueda` es el término comprometido
  // que realmente dispara la búsqueda (se actualiza al hacer click en "Buscar" o enviar el formulario)
  const [textoInput, setTextoInput] = useState("");
  const [textoBusqueda, setTextoBusqueda] = useState("");
  const [tipo, setTipo] = useState("");
  const [region, setRegion] = useState("");
  const [provincia, setProvincia] = useState("");
  const [fecha, setFecha] = useState("");
  const [orden, setOrden] = useState("");

  const REGIONES = ["Sierra", "Costa", "Amazonía", "Galápagos"];

  // Provincias únicas para el combo (respetando la región si está seleccionada)
  const PROVINCIAS = useMemo(() => {
    const eventosRegion = region
      ? EVENTOS_TODOS.filter((e) => e.region === region)
      : EVENTOS_TODOS;

    return Array.from(
      new Set(eventosRegion.map((e) => e.provincia).filter(Boolean))
    ).sort();
  }, [region]);

  // Si se selecciona Galápagos como región, fijar la provincia a 'Galápagos'
  useEffect(() => {
    if (region === "Galápagos") {
      setProvincia("Galápagos");
    } else {
      // si se quita la región, limpiar provincia
      setProvincia("");
    }
  }, [region]);

  // Lista con score de relevancia según texto
  const listaConScore = useMemo(() => {
    const hoy = hoyISO();
    const txt = textoBusqueda.toLowerCase().trim();

    return EVENTOS_TODOS.map((ev) => {
      let score = 0;

      if (txt) {
        const campo =
          (ev.name || "") +
          " " +
          (ev.descripcion || "") +
          " " +
          (ev.ciudad || "") +
          " " +
          (ev.tags || []).join(" ");

        const lower = campo.toLowerCase();

        if (lower.includes(txt)) score += 10;
        if ((ev.name || "").toLowerCase().includes(txt)) score += 5;
      }

      return { ev, score, hoy };
    });
  }, [textoBusqueda]);

  const eventosFiltrados = useMemo(() => {
    let filtrados = listaConScore.filter(({ ev, hoy, score }) => {
      // (removed "dentro de tu viaje" filter: always include events regardless of agenda/demo flag)

      const coincideTipo =
        !tipo || ev.categoria === tipo || ev.tipo === tipo;

      const coincideRegion = !region || ev.region === region;

      const coincideProvincia =
        !provincia || ev.provincia === provincia;

      let coincideFecha = true;
      if (fecha) {
        const inicio = ev.fecha;
        const fin = ev.fecha_fin || ev.fecha;
        if (inicio && fin) {
          coincideFecha = fecha >= inicio && fecha <= fin;
        } else if (inicio) {
          coincideFecha = fecha === inicio;
        }
      }

      const coincideTexto = !textoBusqueda || score > 0;

      return coincideRegion && coincideTipo && coincideProvincia && coincideFecha && coincideTexto;
    });

    // Orden
    if (orden === "fecha") {
      filtrados.sort((a, b) => {
        const fa = a.ev.fecha || "9999-12-31";
        const fb = b.ev.fecha || "9999-12-31";
        return fa.localeCompare(fb);
      });
    } else if (orden === "relevancia" && texto.trim()) {
      filtrados.sort((a, b) => b.score - a.score);
    } else {
      filtrados.sort((a, b) => {
        const fa = a.ev.fecha || "9999-12-31";
        const fb = b.ev.fecha || "9999-12-31";
        return fa.localeCompare(fb);
      });
    }

    return filtrados.map((obj) => obj.ev);
  }, [listaConScore, tipo, provincia, fecha, orden, textoBusqueda]);

  return (
    <main className="page-tema container section">
      <h2 className="page-title">Explorar por intereses y temas</h2>

      {/* Barra de búsqueda principal */}
      <form
        className="main-search-bar"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          setTextoBusqueda(textoInput);
        }}
      >
        <input
          id="buscador"
          type="search"
          className="input-search"
          placeholder="Buscar colada morada, kpop, feria artesanal…"
          value={textoInput}
          onChange={(e) => setTextoInput(e.target.value)}
        />
        <button
          className="btn btn--primary"
          type="submit"
          onClick={() => setTextoBusqueda(textoInput)}
        >
          Buscar
        </button>
      </form>

      {/* Filtros */}
      <div className="filters">
        <select
          id="filtro-tipo"
          className="input"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
        >
          <option value="">Categoría</option>
          <option value="música">Música</option>
          <option value="arte">Arte</option>
          <option value="teatro">Teatro</option>
          <option value="danza">Danza</option>
          <option value="cívica">Cívica</option>
          <option value="tradición">Tradición</option>
          <option value="religiosa">Religiosa</option>
          <option value="ancestral">Ancestral</option>
          <option value="cultural">Cultural</option>
          <option value="gastronomía">Gastronomía</option>
          <option value="feria">Feria / Mercado</option>
          <option value="taller">Taller / Curso</option>
          <option value="exposición">Exposición</option>
        </select>

        <select
          id="filtro-region"
          className="input"
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
          id="filtro-provincia"
          className="input"
          value={provincia}
          onChange={(e) => setProvincia(e.target.value)}
          disabled={region === "Galápagos"}
        >
          {region === "Galápagos" ? (
            <option value="Galápagos">Galápagos</option>
          ) : (
            <>
              <option value="">Provincia</option>
              {PROVINCIAS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </>
          )}
        </select>

        <input
          id="filtro-fecha"
          className="input"
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
        />

        <select
          id="filtro-orden"
          className="input"
          value={orden}
          onChange={(e) => setOrden(e.target.value)}
        >
          <option value="">Ordenar</option>
          <option value="fecha">Por fecha (más próximo primero)</option>
          <option value="relevancia">Por relevancia (coincidencia texto)</option>
        </select>

        
      </div>

      {/* Lista de resultados */}
      <div className="explore-list" id="tema-list">
        {eventosFiltrados.length === 0 ? (
          <p className="muted">
            No se encontraron eventos con esos criterios. Prueba ajustando los filtros.
          </p>
        ) : (
          eventosFiltrados.map((ev) => {
            const titulo = buildTitulo(ev);
            const lugar = buildLugar(ev);
            const fechas = buildFechas(ev);
            const desc = ev.descripcion || "";
            const snippet =
              desc.length > 140 ? desc.slice(0, 140) + "…" : desc;

            return (
              <article key={ev.id} className="tema-card">
                <div className="tema-card__image">
                  <img src={buildImagenSrc(ev)} alt={titulo} />
                </div>

                <div className="tema-card__body">
                  <h3>{titulo}</h3>
                  <p className="muted">
                    {fechas}
                    {fechas && " • "}
                    {lugar}
                  </p>
                  <p className="desc">{snippet}</p>

                  <div className="chips">
                    {ev.categoria && (
                      <span className="chip">{ev.categoria}</span>
                    )}
                    {ev.tipo && (
                      <span className="chip chip-alt">{ev.tipo}</span>
                    )}
                    {(ev.tags || [])
                      .slice(0, 3)
                      .map((t) => (
                        <span key={t} className="chip chip-tag">
                          {t}
                        </span>
                      ))}
                  </div>

                  <div className="tema-card__actions">
                    <Link
                      className="btn btn--ghost btn--small"
                      to={`/evento/${ev.id}`}
                    >
                      Ver detalle
                    </Link>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </main>
  );
}
