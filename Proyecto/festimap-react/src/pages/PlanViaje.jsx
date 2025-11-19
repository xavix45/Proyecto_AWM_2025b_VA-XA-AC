// src/pages/PlanViaje.jsx
// Requiere: npm install leaflet @turf/turf jspdf

import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import L from "leaflet";
import { jsPDF } from "jspdf";
import * as turf from "@turf/turf";

import { list as listEventos } from "../services/eventos.service";

import "leaflet/dist/leaflet.css";
import "../styles/pages/plan-de-viaje.css";

/* --------- Utilidades de fecha y hora --------- */

// dd/mm/aaaa, dd-mm-aaaa, yyyy-mm-dd, yyyy/mm/dd
function parseDateFlexible(str) {
  if (!str) return null;
  const s = String(str).trim();
  let m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) {
    const d = +m[1],
      mo = +m[2] - 1,
      y = +m[3];
    if (mo >= 0 && mo < 12 && d > 0 && d <= 31) {
      return new Date(Date.UTC(y, mo, d, 12, 0, 0, 0));
    }
  }
  m = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (m) {
    const y = +m[1],
      mo = +m[2] - 1,
      d = +m[3];
    if (mo >= 0 && mo < 12 && d > 0 && d <= 31) {
      return new Date(Date.UTC(y, mo, d, 12, 0, 0, 0));
    }
  }
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    return new Date(
      Date.UTC(
        d.getUTCFullYear(),
        d.getUTCMonth(),
        d.getUTCDate(),
        12,
        0,
        0,
        0
      )
    );
  }
  console.warn("Formato de fecha no reconocido:", str);
  return null;
}

// Hora estimada (comienza 08:30) para mostrar llegada
function formatTime(totalMinutes) {
  const startMinutes = 8 * 60 + 30;
  const m = startMinutes + totalMinutes;
  const hh = Math.floor(m / 60) % 24;
  const mm = Math.round(m % 60);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

/* --------- Geocodificación --------- */

const LOCAL_PLACES = {
  quito: { lat: -0.2201, lng: -78.5126 },
  "quito centro": { lat: -0.2201, lng: -78.5126 },
  otavalo: { lat: 0.233, lng: -78.262 },
  "otavalo plaza": { lat: 0.233, lng: -78.262 },
  "mitad del mundo": { lat: -0.0023, lng: -78.4558 },
  "el quinche": { lat: -0.108, lng: -78.273 },
};

async function geocode(q) {
  if (!q) return null;
  const raw = q.trim();

  // Coordenadas "lat,lng"
  const m = raw.match(/^\s*(-?\d+(\.\d+)?)[,\s]+(-?\d+(\.\d+)?)\s*$/);
  if (m) return { lat: +m[1], lng: +m[3] };

  // Fallback local por nombre
  const key = raw.toLowerCase();
  if (LOCAL_PLACES[key]) return { ...LOCAL_PLACES[key] };

  // Nominatim
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    raw
  )}&limit=1`;
  try {
    const r = await fetch(url, { headers: { "Accept-Language": "es" } }).then(
      (x) => x.json()
    );
    if (r && r[0]) {
      return { lat: parseFloat(r[0].lat), lng: parseFloat(r[0].lon) };
    }
  } catch (e) {
    console.warn("Geocode error", e);
  }

  // Último intento: palabras clave parciales
  for (const k of Object.keys(LOCAL_PLACES)) {
    if (key.includes(k)) return { ...LOCAL_PLACES[k] };
  }
  return null;
}

/* --------- Ruteo OSRM --------- */

async function osrmRoute(o, d) {
  const url = `https://router.project-osrm.org/route/v1/driving/${o.lng},${o.lat};${d.lng},${d.lat}?overview=full&geometries=geojson`;
  try {
    const j = await fetch(url).then((x) => x.json());
    return j?.routes?.[0] ? { geometry: j.routes[0].geometry } : null;
  } catch (e) {
    console.warn("OSRM error", e);
    return null;
  }
}

/* --------- Heurística de orden --------- */

function nearestNeighbor(items) {
  if (!items || items.length <= 2) return items ? items.slice() : [];
  const used = new Set();
  const out = [];
  let curr = items[0];
  out.push(curr);
  used.add(curr.id);

  while (out.length < items.length) {
    let best = null;
    let bestD = Infinity;
    for (const c of items) {
      if (used.has(c.id)) continue;
      const d = turf.distance(
        [curr.lng, curr.lat],
        [c.lng, c.lat],
        { units: "kilometers" }
      );
      if (d < bestD) {
        bestD = d;
        best = c;
      }
    }
    out.push(best);
    used.add(best.id);
    curr = best;
  }
  return out;
}

/* =====================================================
   COMPONENTE PRINCIPAL
   ===================================================== */

const STORAGE_KEY = "festi_plan_ruta_avanzado_v2";

export default function PlanViaje() {
  /* ----- Dataset de eventos para sugerencias ----- */
  const eventosBase = useMemo(() => {
    return listEventos()
      .map((ev) => ({
        ...ev,
        id: ev.id,
        lat:
          typeof ev.lat === "number"
            ? ev.lat
            : typeof ev.latitud === "number"
              ? ev.latitud
              : null,
        lng:
          typeof ev.lng === "number"
            ? ev.lng
            : typeof ev.longitud === "number"
              ? ev.longitud
              : null,
        name: ev.name || ev.titulo || ev.nombre || ev.ciudad || "Evento",
        tags:
          ev.tags ||
          ev.etiquetas ||
          ev.temas ||
          (ev.tema ? [ev.tema] : []) ||
          [],
      }))
      .filter((e) => typeof e.lat === "number" && typeof e.lng === "number");
  }, []);

  /* ----- Estado de formulario ----- */
  const [form, setForm] = useState({
    origen: "Quito Centro",
    destino: "Otavalo Plaza",
    fechaIni: "",
    dias: "3",
    ritmo: "normal",
    radio: "3 km",
    tags: [],
  });

  const [activeDay, setActiveDay] = useState(0);

  /* ----- Estado de sugerencias e itinerario ----- */
  const [sugerencias, setSugerencias] = useState([]); // eventos cerca de la ruta
  const [itinerario, setItinerario] = useState({}); // {0:[poi,...],1:[...]}

  // Estado de ruta (ref para no rerender en cada trazo de mapa)
  const routeStateRef = useRef({
    hasRoute: false,
    geometry: null,
    bufferKm: 3,
    bufferPoly: null,
  });

  /* ----- Leaflet refs ----- */
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const routeLayerRef = useRef(null);
  const bufferLayerRef = useRef(null);
  const markersRef = useRef([]);

  /* =========================
     Inicializar mapa Leaflet
     ========================= */
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView(
        [-0.22, -78.51],
        8
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
      }).addTo(mapRef.current);
    }
  }, []);

  /* =========================
     Cargar desde localStorage
     ========================= */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved.form) setForm((prev) => ({ ...prev, ...saved.form }));
      if (saved.itinerario) setItinerario(saved.itinerario);
      if (typeof saved.activeDay === "number") setActiveDay(saved.activeDay);
    } catch (e) {
      console.warn("Error leyendo plan de viaje guardado", e);
    }
  }, []);

  /* =========================
     Guardar en localStorage
     ========================= */
  useEffect(() => {
    const payload = {
      form,
      itinerario,
      activeDay,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [form, itinerario, activeDay]);

  /* =========================
     Derivados: timeline y resumen
     ========================= */

  // Calcula línea de tiempo por día (hora, duración, viaje)
  const timelineByDay = useMemo(() => {
    const map = {};
    Object.entries(itinerario).forEach(([key, stops]) => {
      const dayIndex = Number(key);
      if (!stops || stops.length === 0) {
        map[dayIndex] = [];
        return;
      }

      const ordered = nearestNeighbor(stops);
      const ritmo = form.ritmo;
      let acc = 0;
      const entries = [];

      for (let i = 0; i < ordered.length; i++) {
        const stop = ordered[i];
        let dur = stop.durMin || 60;
        if (ritmo === "relajado") dur = Math.round(dur * 1.2);
        if (ritmo === "intenso") dur = Math.round(dur * 0.8);

        let travel = 0;
        if (i > 0) {
          const prev = ordered[i - 1];
          const dkm = turf.distance(
            [prev.lng, prev.lat],
            [stop.lng, stop.lat],
            { units: "kilometers" }
          );
          travel = Math.max(10, Math.round(dkm * 2));
        }

        const time = formatTime(acc + travel);
        acc += travel + dur;

        entries.push({ stop, time, dur, travel, index: i });
      }

      map[dayIndex] = entries;
    });
    return map;
  }, [itinerario, form.ritmo]);

  // Resumen (km, min, paradas) por día
  const resumenDias = useMemo(() => {
    const result = {};
    Object.entries(itinerario).forEach(([key, stops]) => {
      const dayIndex = Number(key);
      if (!stops || stops.length === 0) {
        result[dayIndex] = { km: 0, min: 0, paradas: 0 };
        return;
      }

      const ordered = nearestNeighbor(stops);
      const ritmo = form.ritmo;
      let totalMin = 0;
      let km = 0;

      for (let i = 0; i < ordered.length; i++) {
        let dur = ordered[i].durMin || 60;
        if (ritmo === "relajado") dur = Math.round(dur * 1.2);
        if (ritmo === "intenso") dur = Math.round(dur * 0.8);
        totalMin += dur;

        if (i > 0) {
          const prev = ordered[i - 1];
          const dkm = turf.distance(
            [prev.lng, prev.lat],
            [ordered[i].lng, ordered[i].lat],
            { units: "kilometers" }
          );
          km += dkm;
          totalMin += Math.max(10, Math.round(dkm * 2));
        }
      }

      result[dayIndex] = {
        km: parseFloat(km.toFixed(1)),
        min: totalMin,
        paradas: ordered.length,
      };
    });
    return result;
  }, [itinerario, form.ritmo]);

  /* =========================
     Utilidades de UI
     ========================= */

  function handleFormChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleTag(tag) {
    setForm((prev) => {
      const has = prev.tags.includes(tag);
      return {
        ...prev,
        tags: has ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
      };
    });
  }

  // Mantener activeDay dentro del rango cuando cambia "dias"
  useEffect(() => {
    const n = parseInt(form.dias || "1", 10);
    setActiveDay((prev) => {
      if (prev < 0) return 0;
      if (prev >= n) return n - 1;
      return prev;
    });
  }, [form.dias]);

  function getDayStops(dayIndex) {
    return (itinerario[dayIndex] || []).slice();
  }

  /* =========================
     MAPA: marcar sugerencias
     ========================= */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // limpiar marcadores previos
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    if (!sugerencias.length) return;

    sugerencias.forEach((ev) => {
      const marker = L.marker([ev.lat, ev.lng])
        .addTo(map)
        .bindPopup(`${ev.name}${ev.fecha ? "<br>" + ev.fecha : ""}`);
      markersRef.current.push(marker);
    });
  }, [sugerencias]);

  /* =========================
     ACCIONES PRINCIPALES
     ========================= */

  // Generar ruta y sugerencias
  async function handleGenerarRuta() {
    const radioKm = parseInt((form.radio.match(/\d+/) || [3])[0], 10);

    const o = await geocode(form.origen);
    const d = await geocode(form.destino);
    if (!o || !d) {
      alert("No se pudo geocodificar origen/destino.");
      return;
    }

    const route = await osrmRoute(o, d);
    if (!route) {
      alert("No se pudo trazar la ruta.");
      return;
    }

    const map = mapRef.current;
    if (!map) return;

    // Limpiar capas previas
    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }
    if (bufferLayerRef.current) {
      map.removeLayer(bufferLayerRef.current);
      bufferLayerRef.current = null;
    }

    // Dibujar ruta
    routeLayerRef.current = L.geoJSON(route.geometry, {
      color: "#0ea5e9",
      weight: 4,
    }).addTo(map);

    const bounds = routeLayerRef.current.getBounds();
    map.fitBounds(bounds, { padding: [24, 24] });

    // Buffer para buscar sugerencias
    const buffer = turf.buffer(route.geometry, radioKm, {
      units: "kilometers",
    });

    bufferLayerRef.current = L.geoJSON(buffer, {
      style: {
        fillColor: "#e0f2fe",
        fillOpacity: 0.25,
        color: "#38bdf8",
      },
    }).addTo(map);

    routeStateRef.current = {
      hasRoute: true,
      geometry: route.geometry,
      bufferKm: radioKm,
      bufferPoly: buffer,
    };

    buildSuggestions();
  }

  // Construir sugerencias según ruta + fecha + intereses
  function buildSuggestions() {
    const routeState = routeStateRef.current;
    if (!routeState.hasRoute || !routeState.bufferPoly || !routeState.geometry)
      return;

    const pts = turf.featureCollection(
      eventosBase.map((e) => turf.point([e.lng, e.lat], e))
    );
    const dentro = turf
      .pointsWithinPolygon(pts, routeState.bufferPoly)
      .features.map((f) => f.properties);

    let filtered = dentro;

    // Fecha
    const fi = parseDateFlexible(form.fechaIni);
    if (fi) {
      const ff = new Date(fi);
      ff.setUTCDate(
        ff.getUTCDate() + (parseInt(form.dias || "1", 10) - 1)
      );

      filtered = dentro.filter((ev) => {
        if (!ev.fecha) return true;
        const f = parseDateFlexible(ev.fecha);
        return f && f >= fi && f <= ff;
      });

      // Si quedó vacío, intentamos mismo mes
      if (filtered.length === 0) {
        filtered = dentro.filter((ev) => {
          if (!ev.fecha) return true;
          const f = parseDateFlexible(ev.fecha);
          return (
            f &&
            f.getUTCFullYear() === fi.getUTCFullYear() &&
            f.getUTCMonth() === fi.getUTCMonth()
          );
        });
      }

      if (filtered.length === 0) filtered = dentro;
    }

    // Intereses / tags
    if (form.tags.length > 0) {
      const tagsLower = form.tags.map((t) => t.toLowerCase());
      filtered = filtered.filter((ev) => {
        const evTags = (ev.tags || ev.temas || ev.etiquetas || []).map((t) =>
          String(t).toLowerCase()
        );
        if (!evTags.length && ev.tema) {
          evTags.push(String(ev.tema).toLowerCase());
        }
        return tagsLower.some((t) => evTags.includes(t));
      });
    }

    if (!filtered.length) {
      setSugerencias([]);
      return;
    }

    // Ordenamos por distancia a la ruta
    const ranked = filtered
      .map((e) => ({
        ...e,
        score: turf.pointToLineDistance(
          turf.point([e.lng, e.lat]),
          routeState.geometry,
          { units: "kilometers" }
        ),
      }))
      .sort((a, b) => a.score - b.score);

    setSugerencias(ranked);
  }

  // Añadir parada al día activo
  function handleAddStop(ev, dayIndex = activeDay) {
    setItinerario((prev) => {
      const day = dayIndex;
      const current = prev[day] || [];
      if (current.some((x) => x.id === ev.id)) return prev; // evita duplicados
      return {
        ...prev,
        [day]: [...current, ev],
      };
    });
  }

  // Quitar parada
  function handleRemoveStop(ev, dayIndex) {
    setItinerario((prev) => {
      const current = prev[dayIndex] || [];
      const next = current.filter((x) => x.id !== ev.id);
      return {
        ...prev,
        [dayIndex]: next,
      };
    });
  }

  // Optimizar orden del día
  function handleOptimizarDia(dayIndex) {
    setItinerario((prev) => {
      const current = prev[dayIndex] || [];
      if (current.length < 2) return prev;
      const ordered = nearestNeighbor(current);
      return {
        ...prev,
        [dayIndex]: ordered,
      };
    });
  }

  // Generar automáticamente con primeras sugerencias
  function handleGenerarAuto() {
    if (!routeStateRef.current.hasRoute) {
      alert("Primero genera la ruta sugerida.");
      return;
    }
    if (!sugerencias.length) {
      alert("No hay sugerencias disponibles para esa ruta.");
      return;
    }
    const n = Math.min(5, sugerencias.length);
    for (let i = 0; i < n; i++) {
      handleAddStop(sugerencias[i], activeDay);
    }
  }

  // Guardar plan explícitamente (aunque ya se guarda auto)
  function handleGuardarPlan() {
    alert("Tu plan de viaje se ha guardado en este navegador.");
  }

  /* =========================
     Render helpers
     ========================= */

  function renderStopLine(ev, idx, dayIndex) {
    const timeline = timelineByDay[dayIndex] || [];
    const entry = timeline.find((e) => e.stop.id === ev.id);

    const baseTitle =
      ev.titulo || ev.name || ev.nombre || ev.ciudad || `Parada ${idx + 1}`;

    if (!entry) {
      return baseTitle;
    }

    return `${entry.time} ${baseTitle} (${entry.dur} min)${entry.index === 0
        ? " (Inicio)"
        : entry.travel
          ? ` (+${entry.travel} min viaje)`
          : ""
      }`;
  }

  // Datos globales para el héroe
  const totalParadas = Object.values(itinerario).reduce(
    (acc, arr) => acc + (arr?.length || 0),
    0
  );
  const diasNum = parseInt(form.dias || "1", 10);

  /* =========================
     Exportar a PDF tipo folleto
     ========================= */

  function handleExportPDF() {
    const hasAnyStop = Object.values(itinerario).some(
      (arr) => arr && arr.length
    );
    if (!hasAnyStop) {
      alert("Agrega al menos una parada antes de exportar.");
      return;
    }

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const colorAccent = { r: 250, g: 204, b: 21 }; // amarillo
    const colorInk = { r: 15, g: 23, b: 42 }; // azul oscuro
    const colorSoft = { r: 249, g: 250, b: 251 };

    /* Portada */
    doc.setFillColor(colorInk.r, colorInk.g, colorInk.b);
    doc.rect(0, 0, 210, 60, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("FestiMap Ecuador", 14, 22);

    doc.setFontSize(16);
    doc.text("Plan de viaje cultural", 14, 38);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(
      "Itinerario personalizado a partir de tu ruta y preferencias.",
      14,
      48
    );

    // Resumen
    doc.setFillColor(colorSoft.r, colorSoft.g, colorSoft.b);
    doc.roundedRect(12, 66, 186, 28, 3, 3, "F");

    doc.setTextColor(colorInk.r, colorInk.g, colorInk.b);
    doc.setFontSize(10);
    doc.text(`Origen: ${form.origen || "—"}`, 18, 74);
    doc.text(`Destino: ${form.destino || "—"}`, 18, 80);
    doc.text(`Días: ${form.dias || "—"}`, 90, 74);
    doc.text(`Ritmo: ${form.ritmo}`, 90, 80);
    doc.text(`Paradas totales: ${totalParadas}`, 150, 74);

    /* Itinerario por día */
    let y = 110;

    for (let day = 0; day < diasNum; day++) {
      const stops = getDayStops(day);
      const resumen = resumenDias[day] || {
        km: 0,
        min: 0,
        paradas: 0,
      };

      if (y > 260) {
        doc.addPage();
        y = 20;
      }

      // Cabecera del día
      doc.setFillColor(colorInk.r, colorInk.g, colorInk.b);
      doc.roundedRect(12, y - 6, 36, 8, 2, 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(`Día ${day + 1}`, 14, y - 0.5);

      doc.setTextColor(colorInk.r, colorInk.g, colorInk.b);
      doc.setFont("helvetica", "normal");
      doc.text(
        `${resumen.km.toFixed(1)} km • ${resumen.min} min • ${resumen.paradas
        } paradas`,
        56,
        y
      );

      y += 6;

      if (!stops.length) {
        doc.setFontSize(9);
        doc.setTextColor(148, 163, 184);
        doc.text("— sin paradas para este día —", 18, y + 2);
        y += 10;
        continue;
      }

      stops.forEach((s, i) => {
        if (y > 260) {
          doc.addPage();
          y = 20;
        }

        const line = renderStopLine(s, i, day);

        doc.setFillColor(colorSoft.r, colorSoft.g, colorSoft.b);
        doc.setDrawColor(229, 231, 235);
        doc.roundedRect(14, y, 182, 10, 2, 2, "FD");

        doc.setTextColor(colorInk.r, colorInk.g, colorInk.b);
        doc.setFontSize(9);
        doc.text(`${i + 1}. ${line}`, 18, y + 6);

        y += 12;
      });

      y += 4;
    }

    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      "Generado automáticamente con FestiMap Ecuador — Guía de festividades y rutas culturales.",
      14,
      292
    );

    doc.save("FestiMap_Plan_de_viaje.pdf");
  }

  /* =========================
     RENDER
     ========================= */

  return (
    <main className="planner-page container">
      {/* Hero */}
      <header className="planner-hero">
        <div className="planner-hero__text">
          <h1>Planifica tu viaje</h1>
          <p>
            Define origen y destino, ajusta fechas e intereses y te sugerimos
            festividades cercanas a tu ruta. Después puedes ordenar las paradas
            por día y exportar todo como un folleto listo para compartir.
          </p>
        </div>
        <div className="planner-hero__summary">
          <div className="hero-summary__card">
            <span className="hero-summary__label">Días de viaje</span>
            <span className="hero-summary__value">{diasNum}</span>
          </div>
          <div className="hero-summary__card">
            <span className="hero-summary__label">Paradas totales</span>
            <span className="hero-summary__value">{totalParadas}</span>
          </div>
          <div className="hero-summary__card">
            <span className="hero-summary__label">Radio de búsqueda</span>
            <span className="hero-summary__value">{form.radio}</span>
          </div>
          <div className="hero-summary__card">
            <span className="hero-summary__label">Ritmo</span>
            <span className="hero-summary__value">
              {form.ritmo === "relajado"
                ? "Relajado"
                : form.ritmo === "intenso"
                  ? "Intenso"
                  : "Normal"}
            </span>
          </div>
        </div>
      </header>

      {/* Formulario de parámetros */}
      <section className="planner-form">
        <h2>Parámetros del plan</h2>
        <form
          className="planner-form__grid"
          onSubmit={(e) => {
            e.preventDefault();
            handleGenerarRuta();
          }}
        >
          <label className="planner-form__field">
            <span>Origen</span>
            <input
              type="text"
              className="input"
              value={form.origen}
              onChange={(e) => handleFormChange("origen", e.target.value)}
              placeholder="Quito Centro o -0.22,-78.51"
              required
            />
          </label>

          <label className="planner-form__field">
            <span>Destino</span>
            <input
              type="text"
              className="input"
              value={form.destino}
              onChange={(e) => handleFormChange("destino", e.target.value)}
              placeholder="Otavalo Plaza o 0.23,-78.26"
              required
            />
          </label>

          <label className="planner-form__field">
            <span>Fecha inicio</span>
            <input
              type="date"
              className="input"
              value={form.fechaIni}
              onChange={(e) => handleFormChange("fechaIni", e.target.value)}
              required
            />
          </label>

          <label className="planner-form__field">
            <span>Días</span>
            <select
              className="input"
              value={form.dias}
              onChange={(e) => handleFormChange("dias", e.target.value)}
            >
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="5">5</option>
              <option value="7">7</option>
            </select>
          </label>

          <label className="planner-form__field">
            <span>Ritmo</span>
            <select
              className="input"
              value={form.ritmo}
              onChange={(e) => handleFormChange("ritmo", e.target.value)}
            >
              <option value="relajado">Relajado</option>
              <option value="normal">Normal</option>
              <option value="intenso">Intenso</option>
            </select>
          </label>

          <label className="planner-form__field">
            <span>Radio</span>
            <select
              className="input"
              value={form.radio}
              onChange={(e) => handleFormChange("radio", e.target.value)}
            >
              <option>2 km</option>
              <option>3 km</option>
              <option>5 km</option>
              <option>8 km</option>
            </select>
          </label>

          <fieldset className="planner-form__fieldset">
            <legend>Intereses principales</legend>
            <div className="planner-chips">
              {["Cultura", "Artesanía", "Gastronomía", "Naturaleza", "Festividades"].map(
                (tag) => (
                  <button
                    key={tag}
                    type="button"
                    className={
                      form.tags.includes(tag.toLowerCase())
                        ? "planner-chip planner-chip--active"
                        : "planner-chip"
                    }
                    onClick={() => toggleTag(tag.toLowerCase())}
                  >
                    {tag}
                  </button>
                )
              )}
            </div>
          </fieldset>

          <div className="planner-form__actions">
            <button
              type="submit"
              className="btn btn--primary"
            >
              Generar ruta sugerida
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={handleGenerarAuto}
              disabled={!routeStateRef.current.hasRoute || !sugerencias.length}
            >
              Generar automática
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={handleGuardarPlan}
            >
              Guardar plan
            </button>
          </div>
        </form>
      </section>

      {/* Layout Mapa + Itinerario */}
      <section className="planner-layout">
        {/* Columna mapa */}
        <div className="planner-map-card">
          <h2>Mapa y paradas sugeridas</h2>
          <p className="planner-map-card__subtitle">
            Visualiza tu ruta de viaje y añade paradas recomendadas cerca del
            recorrido.
          </p>
          <div
            ref={mapContainerRef}
            className="planner-map"
            aria-label="Mapa de ruta del plan de viaje"
          />
          <div className="planner-suggestions">
            <h3>Paradas sugeridas cerca de tu ruta</h3>
            {!sugerencias.length && (
              <p className="planner-suggestions__empty">
                Genera una ruta para obtener sugerencias de festividades.
              </p>
            )}
            {!!sugerencias.length && (
              <ul className="planner-suggestions__list">
                {sugerencias.map((ev) => (
                  <li key={ev.id} className="planner-suggestion">
                    <div className="planner-suggestion__info">
                      <span className="planner-suggestion__title">
                        {ev.name}
                      </span>
                      <span className="planner-suggestion__meta">
                        {ev.ciudad || ev.canton || ""}{" "}
                        {ev.fecha ? `• ${ev.fecha}` : ""}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => handleAddStop(ev)}
                    >
                      + Añadir al día {activeDay + 1}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Columna itinerario */}
        <aside className="planner-itinerary">
          <h2>Tu itinerario</h2>

          {/* Tabs de días */}
          <div className="planner-tabs" role="tablist" aria-label="Días">
            {Array.from({ length: diasNum }, (_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={activeDay === i}
                className={
                  activeDay === i
                    ? "planner-tab planner-tab--active"
                    : "planner-tab"
                }
                onClick={() => setActiveDay(i)}
              >
                Día {i + 1}
              </button>
            ))}
          </div>

          {/* Contenido del día activo */}
          <div className="planner-tabpanel" role="tabpanel">
            <ol className="planner-itinerary__list">
              {getDayStops(activeDay).length === 0 && (
                <li className="planner-itinerary__empty">
                  Añade paradas desde las sugerencias del mapa.
                </li>
              )}
              {getDayStops(activeDay).map((stop, idx) => (
                <li key={stop.id} className="planner-itinerary__item">
                  <span className="planner-itinerary__text">
                    {renderStopLine(stop, idx, activeDay)}
                  </span>
                  <button
                    type="button"
                    className="planner-itinerary__remove"
                    title="Quitar parada"
                    onClick={() => handleRemoveStop(stop, activeDay)}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ol>

            <div className="planner-itinerary__footer">
              <button
                type="button"
                className="btn btn--primary btn--block"
                onClick={() => handleOptimizarDia(activeDay)}
                disabled={getDayStops(activeDay).length < 2}
              >
                Optimizar día {activeDay + 1}
              </button>
              <p className="planner-itinerary__meta">
                {(() => {
                  const r = resumenDias[activeDay] || {
                    km: 0,
                    min: 0,
                    paradas: 0,
                  };
                  return `${r.km.toFixed(1)} km • ${r.min} min • ${r.paradas
                    } paradas`;
                })()}
              </p>
            </div>
          </div>

          <hr className="planner-itinerary__divider" />

          <div className="planner-itinerary__bottom-actions">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={handleExportPDF}
            >
              Exportar folleto PDF
            </button>
            <Link className="btn btn--ghost" to="/agenda">
              Ver agenda
            </Link>
          </div>
        </aside>
      </section>
    </main>
  );
}
