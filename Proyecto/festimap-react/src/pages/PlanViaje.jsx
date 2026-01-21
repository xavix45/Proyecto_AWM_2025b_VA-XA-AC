// src/pages/PlanViaje.jsx
// PAGINA: PlanViaje
// Token de búsqueda: PAGE:PlanViaje
// Página para crear y optimizar planes de viaje: calcula rutas A→B, busca eventos
// cercanos a la ruta, crea un itinerario por día, permite reordenar y exportar a PDF.
// Dependencias clave: `leaflet`, `@turf/turf`, `jspdf`. Persiste por usuario en localStorage.

import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import L from "leaflet";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import * as turf from "@turf/turf";

import { list as listEventos } from "../services/eventos.service";
import { add as addAgenda, list as listAgenda } from "../services/agenda.service";
import ConfirmModal from "../components/ConfirmModal";

import "leaflet/dist/leaflet.css";
import "../styles/pages/plan-de-viaje.css";

/* --------- Utilidades de fecha y hora --------- */
// Comentarios: estas utilidades permiten parsing flexible de fechas porque los
// eventos pueden venir con formatos distintos. También hay un helper para
// formatear tiempos estimados de llegada en la línea de tiempo.

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
// `geocode` intenta resolver texto a coordenadas. Soporta:
// - coordenadas explícitas "lat,lng"
// - un mapa local de nombres conocidos (LOCAL_PLACES)
// - llamada a Nominatim como fallback

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
// Solicita una ruta a OSRM (routing server) entre dos coordenadas. Se usa
// para trazar la ruta en el mapa y construir un "buffer" donde buscar eventos.

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
// Algoritmo greedy (nearest neighbor) para ordenar puntos razonablemente bien
// sin hacer cálculos NP-hard (no es exacto, pero es rápido y suficiente).

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

// Notas sobre persistencia:
// - Antes se usaba una clave global `STORAGE_KEY`. Ahora el plan se guarda
//   por usuario usando `storageKeyForUser()` para evitar que distintos usuarios
//   sobreescriban el mismo plan.

const STORAGE_KEY_BASE = "festi_plan_ruta_avanzado_v2";
const DEMO_USER_ID = "demo-user";

function getCurrentUserId() {
  try {
    const raw = localStorage.getItem('festi_usuario');
    if (raw) {
      const u = JSON.parse(raw);
      if (u && (u.email || u.id)) return u.email || u.id;
    }
  } catch (e) {
    // ignore
  }
  const email = localStorage.getItem('currentUserEmail');
  if (email) return email;
  return DEMO_USER_ID;
}

function storageKeyForUser() {
  const id = getCurrentUserId();
  return `${STORAGE_KEY_BASE}:${id}`;
}

export default function PlanViaje() {
  /* ----- Dataset de eventos para sugerencias ----- */
  const eventosBase = useMemo(() => {
    const hoy = new Date().toISOString().slice(0, 10);
    return listEventos()
      .filter(ev => ev.fecha && ev.fecha >= hoy)
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
    origen: "",
    destino: "",
    fechaIni: "",
    dias: "3",
    radio: "3 km",
    tags: [],
  });

  const [activeDay, setActiveDay] = useState(0);

  /* ----- Estado de sugerencias e itinerario ----- */
  const [sugerencias, setSugerencias] = useState([]); // eventos cerca de la ruta
  const [itinerario, setItinerario] = useState({}); // {0:[poi,...],1:[...]}
  const [modal, setModal] = useState({ show: false, title: '', message: '', type: 'info', onConfirm: null });

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
    // Carga el plan persistido para el usuario actual (si existe). Mantiene
    // `form`, `itinerario` y `activeDay`.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKeyForUser());
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
    // Persiste automáticamente el estado del plan para el usuario actual.
  useEffect(() => {
    const payload = {
      form,
      itinerario,
      activeDay,
    };
    try {
      localStorage.setItem(storageKeyForUser(), JSON.stringify(payload));
    } catch (e) {
      console.warn('[PlanViaje] could not persist plan for user', e);
    }
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
      let acc = 0;
      const entries = [];

      for (let i = 0; i < ordered.length; i++) {
        const stop = ordered[i];
        let dur = stop.durMin || 60;

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
  }, [itinerario]);

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
      let totalMin = 0;
      let km = 0;

      for (let i = 0; i < ordered.length; i++) {
        let dur = ordered[i].durMin || 60;
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
  }, [itinerario]);

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

  // Devuelve el índice de día objetivo para un evento según form.fechaIni
  function computeTargetDayForEvent(ev) {
    const fi = parseDateFlexible(form.fechaIni);
    if (ev && ev.fecha && fi) {
      const f = parseDateFlexible(ev.fecha);
      if (f) {
        const msPerDay = 1000 * 60 * 60 * 24;
        const diff = Math.floor((f.getTime() - fi.getTime()) / msPerDay);
        if (!Number.isNaN(diff) && diff >= 0) return diff;
      }
    }
    return null;
  }

    /* =========================
      MAPA: marcar sugerencias
      ========================= */
    // Dibuja marcadores para las sugerencias en el mapa y los limpia cuando cambian.
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

    // Generar ruta: geocodifica origen/destino, solicita a OSRM, dibuja ruta y
    // genera un buffer para buscar eventos dentro del área.

  // Generar ruta y sugerencias
  async function handleGenerarRuta() {
    const radioKm = parseInt((form.radio.match(/\d+/) || [3])[0], 10);

    const o = await geocode(form.origen);
    const d = await geocode(form.destino);
    if (!o || !d) {
      setModal({
        show: true,
        title: '❌ Error de Geocodificación',
        message: 'No se pudo geocodificar el origen o destino. Verifica los nombres e inténtalo nuevamente.',
        type: 'danger',
        onConfirm: () => setModal({ show: false, title: '', message: '', type: 'info', onConfirm: null })
      });
      return;
    }

    const route = await osrmRoute(o, d);
    if (!route) {
      setModal({
        show: true,
        title: '❌ Error de Ruta',
        message: 'No se pudo trazar la ruta entre origen y destino.',
        type: 'danger',
        onConfirm: () => setModal({ show: false, title: '', message: '', type: 'info', onConfirm: null })
      });
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
  // Filtros aplicados:
  // - dentro del buffer geométrico (turf.pointsWithinPolygon)
  // - fecha dentro del rango [fechaIni, fechaIni + dias - 1] (si form.fechaIni definido)
  // - coincidencia con tags/intereses (si el usuario seleccionó tags)
  // - excluye eventos que ya están en la agenda del usuario (evita duplicados)
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

    // Excluir eventos que ya estén en la agenda del usuario
    try {
      const uid = getCurrentUserId();
      const agendaItems = listAgenda(uid) || [];
      const agendaIds = new Set(agendaItems.map(i => String(i.idEvento)));
      filtered = filtered.filter(e => !agendaIds.has(String(e.id)));
    } catch (e) {
      // ignore
    }

    // Fecha
    const fi = parseDateFlexible(form.fechaIni);
    if (fi) {
      const ff = new Date(fi);
      ff.setUTCDate(
        ff.getUTCDate() + (parseInt(form.dias || "1", 10) - 1)
      );
      // Excluir eventos previos a la fecha inicio; mantener eventos sin fecha
      filtered = dentro.filter((ev) => {
        if (!ev.fecha) return true; // keep undated events
        const f = parseDateFlexible(ev.fecha);
        // Only include events that are within [fi, ff]
        return f && f >= fi && f <= ff;
      });
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

    // Si el usuario definió fecha inicio y días, excluir eventos cuya fecha cae fuera del rango
    const diasNumCur = form.dias ? parseInt(form.dias, 10) : null;
    if (fi && Number.isInteger(diasNumCur) && diasNumCur > 0) {
      filtered = filtered.filter((ev) => {
        const c = computeTargetDayForEvent(ev);
        // mantener eventos sin fecha (c === null), pero excluir eventos con día >= diasNumCur
        if (c === null) return true;
        return c < diasNumCur;
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

  // Añadir parada al itinerario
  // Si el evento tiene fecha y cae dentro del rango, `computeTargetDayForEvent`
  // devuelve el índice de día correspondiente; en ese caso se colocará
  // automáticamente en el día correcto. Si no tiene fecha, se añade al
  // `activeDay` por defecto.
  function handleAddStop(ev, dayIndex = activeDay) {
    const computed = computeTargetDayForEvent(ev);
    const diasNumCur = form.dias ? parseInt(form.dias, 10) : 1;

    if (computed !== null && computed >= diasNumCur) {
      setModal({
        show: true,
        title: '⚠️ Evento Fuera de Rango',
        message: `El evento ocurre en el día ${computed + 1}, que está fuera del rango de tu viaje (${diasNumCur} días). Ajusta 'Días' o elige otra parada.`,
        type: 'warning',
        onConfirm: () => setModal({ show: false, title: '', message: '', type: 'info', onConfirm: null })
      });
      return;
    }

    const targetDay = computed !== null ? computed : dayIndex;

    setItinerario((prev) => {
      const day = targetDay;
      const current = prev[day] || [];
      if (current.some((x) => String(x.id) === String(ev.id))) return prev; // evita duplicados
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

  // Guardar plan explícitamente (y opcionalmente exportar a Agenda)
  // Al guardar se añaden los elementos al servicio de agenda por usuario
  // (addAgenda(userId, { idEvento, fecha, isPlan: true, planTitle })).
  function handleGuardarPlan() {
    // Guardar en localStorage ya ocurre automáticamente. Aquí además guardamos en la Agenda demo.
    const fi = parseDateFlexible(form.fechaIni);
    let added = 0;
    const userId = getCurrentUserId();
    Object.entries(itinerario).forEach(([key, stops]) => {
      const dayIndex = Number(key);
      (stops || []).forEach((s) => {
        // calcular fecha del evento: si tiene fecha propia la usamos, sino la derivamos de fechaIni + día
        let fecha = s.fecha || null;
        if (!fecha && fi) {
          const d = new Date(fi);
          d.setUTCDate(d.getUTCDate() + dayIndex);
          fecha = d.toISOString().slice(0, 10);
        }
        try {
          const planTitle = `${form.origen || "Origen"} → ${form.destino || "Destino"}`;
          addAgenda(userId, { idEvento: s.id, fecha, isPlan: true, planTitle });
          added += 1;
        } catch (e) {
          // ignore individual failures
        }
      });
    });

    setModal({
      show: true,
      title: '✅ Guardado en Agenda',
      message: `Se han guardado ${added} elementos en tu Agenda.`,
      type: 'success',
      onConfirm: () => setModal({ show: false, title: '', message: '', type: 'info', onConfirm: null })
    });
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
  const diasNum = form.dias ? parseInt(form.dias, 10) : 1;

  /* =========================
     Exportar a PDF tipo folleto
     ========================= */

  async function handleExportPDF() {
    const hasAnyStop = Object.values(itinerario).some((arr) => arr && arr.length);
    if (!hasAnyStop) {
      setModal({
        show: true,
        title: '⚠️ Sin Paradas',
        message: 'Agrega al menos una parada antes de exportar el plan.',
        type: 'warning',
        onConfirm: () => setModal({ show: false, title: '', message: '', type: 'info', onConfirm: null })
      });
      return;
    }

    async function fetchImageDataUrl(url) {
      if (!url) return null;
      try {
        const res = await fetch(url, { mode: "cors" });
        if (!res.ok) return null;
        const blob = await res.blob();
        return await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        });
      } catch (e) {
        return null;
      }
    }

    // Captura raster del mapa Leaflet (tiles) como imagen base64
    // Nota: requiere CORS en los servidores de tiles. OSM generalmente lo permite.
    async function captureMapDataUrl() {
      const mapEl = mapContainerRef.current;
      const map = mapRef.current;
      if (!mapEl || !map) return null;
      const rect = mapEl.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#e5e7eb';
      ctx.fillRect(0, 0, w, h);

      // 1) Dibujar tiles
      const tileImgs = Array.from(mapEl.querySelectorAll('.leaflet-tile-pane img.leaflet-tile'));
      const containerRect = mapEl.getBoundingClientRect();
      try {
        for (const img of tileImgs) {
          const r = img.getBoundingClientRect();
          const x = Math.round(r.left - containerRect.left);
          const y = Math.round(r.top - containerRect.top);
          // Intentar dibujar la misma instancia; si CORS bloquea, abortará más abajo
          ctx.drawImage(img, x, y);
        }
      } catch (e) {
        // Si se taintó el canvas por CORS, no podremos exportar; devolvemos null
        return null;
      }

      // 2) Dibujar la ruta (si existe) encima, usando proyección del mapa
      try {
        const route = routeStateRef.current?.geometry;
        if (route && route.type && (route.type === 'LineString' || route.type === 'MultiLineString')) {
          const segments = route.type === 'LineString' ? [route.coordinates] : route.coordinates;
          ctx.lineWidth = 4; ctx.strokeStyle = '#7c3aed'; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
          for (const coords of segments) {
            ctx.beginPath();
            for (let i = 0; i < coords.length; i++) {
              const [lng, lat] = coords[i];
              const p = map.latLngToContainerPoint([lat, lng]);
              if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
            }
            ctx.stroke();
          }
        }
      } catch {}

      try {
        return canvas.toDataURL('image/jpeg', 0.85);
      } catch (e) {
        return null;
      }
    }

    // Nuevo diseño: Folleto vertical A4 colorido y compacto (no tríptico)
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const PAGE_W = 210, PAGE_H = 297;
    const M = 14; // margen exterior
    const COL_GAP = 8;
    const COLS = 2;
    const COL_W = (PAGE_W - M * 2 - COL_GAP) / COLS; // ancho por columna

    // Paleta
    const accent = [255, 184, 0]; // amarillo
    const violet = [92, 51, 180]; // violeta oscuro
    const violetLight = [124, 58, 237];
    const ink = [31, 41, 55];
    const soft = [243, 244, 246];
    const white = [255, 255, 255];

    // Encabezado decorativo (banda con gradiente simulado)
    doc.setFillColor(violetLight[0], violetLight[1], violetLight[2]);
    doc.rect(0, 0, PAGE_W, 32, 'F');
    doc.setTextColor(white[0], white[1], white[2]);
    doc.setFont('helvetica','bold');
    doc.setFontSize(22);
    doc.text('FestiMap - Plan de viaje', M, 21);

    // Captura mapa real usando html2canvas con configuración mejorada
    let mapDataUrl = null;
    try {
      if (mapContainerRef.current && mapRef.current) {
        const map = mapRef.current;
        // Re-centrar el mapa a los bounds de la ruta antes de capturar
        if (routeLayerRef.current) {
          const bounds = routeLayerRef.current.getBounds();
          map.fitBounds(bounds, { padding: [30, 30], animate: false });
        }
        // Invalidar tamaño para forzar re-render de tiles
        map.invalidateSize();
        // Esperar que tiles se carguen completamente
        await new Promise(resolve => setTimeout(resolve, 500));
        const canvas = await html2canvas(mapContainerRef.current, { 
          useCORS: true, 
          allowTaint: true,
          backgroundColor: '#e5e7eb', 
          scale: 2,
          logging: false,
          imageTimeout: 0,
          scrollX: 0,
          scrollY: 0
        });
        mapDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      }
    } catch (e) {
      console.warn('Map capture failed:', e);
    }

    // Hero imagen (si existe)
    const firstWithImage = Object.values(itinerario).flat().find(s => s && (s.imagen || s.image || s.img || s.imageUrl || s.imagenUrl));
    const firstImageUrl = firstWithImage?.imagen || firstWithImage?.image || firstWithImage?.img || firstWithImage?.imageUrl || firstWithImage?.imagenUrl;
    let heroData = null;
    if (firstImageUrl) heroData = await fetchImageDataUrl(firstImageUrl);

    // Sección MAPA - Ancho completo y prominente
    let y = 38;
    const mapSectionH = 85;
    
    // Título sección mapa
    doc.setFontSize(12);
    doc.setFont('helvetica','bold');
    doc.setTextColor(ink[0], ink[1], ink[2]);
    doc.text('Tu ruta', M, y);
    y += 6;

    // Contenedor mapa con borde
    doc.setDrawColor(200, 200, 210);
    doc.setLineWidth(0.3);
    if (mapDataUrl) {
      try { 
        doc.addImage(mapDataUrl, 'JPEG', M, y, PAGE_W - 2*M, mapSectionH - 6); 
      } catch (e) {
        // Fallback: bloque con mensaje
        doc.setFillColor(soft[0], soft[1], soft[2]);
        doc.roundedRect(M, y, PAGE_W - 2*M, mapSectionH - 6, 3, 3, 'F');
        doc.setTextColor(110,110,110);
        doc.setFontSize(10);
        doc.text('Mapa no disponible. Asegúrate de generar la ruta primero.', M + 10, y + (mapSectionH - 6)/2);
      }
    } else {
      // Fallback: bloque con mensaje
      doc.setFillColor(soft[0], soft[1], soft[2]);
      doc.roundedRect(M, y, PAGE_W - 2*M, mapSectionH - 6, 3, 3, 'F');
      doc.setTextColor(110,110,110);
      doc.setFontSize(10);
      doc.text('Mapa no disponible. Asegúrate de generar la ruta primero.', M + 10, y + (mapSectionH - 6)/2);
    }
    
    y += mapSectionH;

    // Sección RESUMEN - Dos columnas con info y consejos
    const infoBoxH = 32;
    doc.setFillColor(soft[0], soft[1], soft[2]);
    doc.roundedRect(M, y, COL_W, infoBoxH, 3, 3, 'F');
    doc.roundedRect(M + COL_W + COL_GAP, y, COL_W, infoBoxH, 3, 3, 'F');

    // Columna izquierda: Datos del viaje
    doc.setFont('helvetica','bold');
    doc.setFontSize(11);
    doc.setTextColor(violetLight[0], violetLight[1], violetLight[2]);
    doc.text('Datos del viaje', M + 4, y + 7);
    doc.setFont('helvetica','normal');
    doc.setFontSize(9);
    doc.setTextColor(ink[0], ink[1], ink[2]);
    doc.text(`Origen: ${form.origen || '—'}`, M + 4, y + 14);
    doc.text(`Destino: ${form.destino || '—'}`, M + 4, y + 19);
    doc.text(`Días: ${diasNum}`, M + 4, y + 24);
    doc.text(`Paradas totales: ${totalParadas}`, M + 4, y + 29);

    // Columna derecha: Consejos
    doc.setFont('helvetica','bold');
    doc.setFontSize(11);
    doc.setTextColor(violetLight[0], violetLight[1], violetLight[2]);
    doc.text('Consejos útiles', M + COL_W + COL_GAP + 4, y + 7);
    doc.setFont('helvetica','normal');
    doc.setFontSize(9);
    doc.setTextColor(ink[0], ink[1], ink[2]);
    doc.text('• Verifica horarios de eventos', M + COL_W + COL_GAP + 4, y + 14);
    doc.text('• Usa "Cómo llegar" para GPS', M + COL_W + COL_GAP + 4, y + 19);
    doc.text('• Descarga este PDF offline', M + COL_W + COL_GAP + 4, y + 24);
    doc.text('• Comparte con tu grupo', M + COL_W + COL_GAP + 4, y + 29);

    y += infoBoxH + 10;

    // Título de sección Itinerario
    doc.setFont('helvetica','bold');
    doc.setFontSize(16);
    doc.setTextColor(violetLight[0], violetLight[1], violetLight[2]);
    doc.text('Itinerario detallado', M, y);
    y += 8;

    // Función para dibujar una tarjeta de evento mejorada
    async function drawEventCard(ev, x, yCard, width) {
      const CARD_H = 54; // altura para contenido completo
      const IMG_SIZE = 40;
      const LEFT_PAD = 6;
      const IMG_X = x + LEFT_PAD;
      const IMG_Y = yCard + 7;
      const TEXT_X = IMG_X + IMG_SIZE + 8;
      const TEXT_W = width - (IMG_SIZE + LEFT_PAD + 10);
      
      // Fondo blanco con borde
      doc.setDrawColor(220, 220, 230);
      doc.setLineWidth(0.3);
      doc.setFillColor(white[0], white[1], white[2]);
      doc.roundedRect(x, yCard, width, CARD_H, 3, 3, 'FD');
      
      // Borde lateral izquierdo según categoría
      const borderColor = ev.categoria === 'Gastronomía' ? accent : 
                         ev.categoria === 'Cultural' ? violetLight :
                         ev.categoria === 'Naturaleza' ? [34, 197, 94] : accent;
      doc.setFillColor(borderColor[0], borderColor[1], borderColor[2]);
      doc.rect(x, yCard, 3, CARD_H, 'F');
      
      // IMAGEN - Intentar cargar primero
      let imgData = null;
      const url = ev.imagen || ev.image || ev.img || ev.imageUrl || ev.imagenUrl;
      
      if (url) {
        try {
          imgData = await fetchImageDataUrl(url);
        } catch (e) {
          console.warn('Image load failed for:', url);
        }
      }
      
      if (imgData) {
        try {
          // Dibujar imagen con borde redondeado
          doc.setFillColor(240, 240, 245);
          doc.roundedRect(IMG_X, IMG_Y, IMG_SIZE, IMG_SIZE, 2, 2, 'F');
          doc.addImage(imgData, 'JPEG', IMG_X, IMG_Y, IMG_SIZE, IMG_SIZE);
        } catch (e) {
          console.warn('Failed to embed image in PDF');
          imgData = null;
        }
      }
      
      // Si no hay imagen, mostrar placeholder
      if (!imgData) {
        doc.setFillColor(soft[0], soft[1], soft[2]);
        doc.roundedRect(IMG_X, IMG_Y, IMG_SIZE, IMG_SIZE, 2, 2, 'F');
        doc.setFillColor(borderColor[0], borderColor[1], borderColor[2]);
        doc.circle(IMG_X + IMG_SIZE/2, IMG_Y + IMG_SIZE/2, 10, 'F');
        doc.setFontSize(20);
        doc.setTextColor(white[0], white[1], white[2]);
        const initial = (ev.name || ev.titulo || ev.nombre || 'E').charAt(0).toUpperCase();
        doc.text(initial, IMG_X + IMG_SIZE/2 - 4, IMG_Y + IMG_SIZE/2 + 6);
      }
      
      // TÍTULO
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(ink[0], ink[1], ink[2]);
      const title = ev.titulo || ev.name || ev.nombre || 'Actividad';
      const titleLines = doc.splitTextToSize(title, TEXT_W);
      doc.text(titleLines.slice(0, 1), TEXT_X, yCard + 12);
      
      // CATEGORÍA
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(borderColor[0], borderColor[1], borderColor[2]);
      if (ev.categoria) {
        doc.text(ev.categoria.toUpperCase(), TEXT_X, yCard + 19);
      }
      
      // DESCRIPCIÓN
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 85);
      if (ev.descripcion) {
        const desc = String(ev.descripcion).slice(0, 90);
        const descLines = doc.splitTextToSize(desc, TEXT_W);
        doc.text(descLines.slice(0, 2), TEXT_X, yCard + 25);
      }
      
      // METADATA
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 100, 105);
      let metaY = yCard + 37;
      
      if (ev.fecha) {
        doc.text(`Fecha: ${ev.fecha}`, TEXT_X, metaY);
        metaY += 5;
      }
      
      const lugar = [ev.lugar, ev.ciudad, ev.provincia].filter(Boolean).join(', ');
      if (lugar) {
        const lugarText = lugar.length > 40 ? lugar.slice(0, 37) + '...' : lugar;
        doc.text(`Lugar: ${lugarText}`, TEXT_X, metaY);
      }
      
      // ENLACE
      if (ev.lat && ev.lng) {
        doc.setTextColor(59, 130, 246);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.textWithLink('→ Cómo llegar', TEXT_X, yCard + CARD_H - 6, { 
          url: `https://www.google.com/maps/search/?api=1&query=${ev.lat},${ev.lng}` 
        });
      }
      
      return CARD_H + 6;
    }

    // Recorrer días y eventos en columnas
    for (let day = 0; day < diasNum; day++) {
      const stops = getDayStops(day);
      const r = resumenDias[day] || { km:0, min:0, paradas:0 };
      
      // Cabecera Día con fondo destacado
      doc.setFillColor(violetLight[0], violetLight[1], violetLight[2]);
      doc.roundedRect(M, y, PAGE_W - 2*M, 12, 2, 2, 'F');
      doc.setFontSize(14);
      doc.setFont('helvetica','bold');
      doc.setTextColor(white[0], white[1], white[2]);
      doc.text(`Día ${day + 1}`, M + 4, y + 8);
      
      // Resumen del día a la derecha
      doc.setFontSize(9);
      doc.setFont('helvetica','normal');
      const summaryText = `${r.km.toFixed(1)} km • ${r.min} min • ${r.paradas} paradas`;
      doc.text(summaryText, PAGE_W - M - doc.getTextWidth(summaryText) - 4, y + 8);
      y += 16;

      if (!stops.length) {
        doc.setFillColor(soft[0], soft[1], soft[2]);
        doc.roundedRect(M, y, PAGE_W - 2*M, 12, 2, 2, 'F');
        doc.setTextColor(150,150,150);
        doc.setFontSize(9);
        doc.text('— Sin paradas asignadas para este día —', M + 6, y + 8);
        y += 16;
        continue;
      }

      let colY = [y, y];
      for (let i = 0; i < stops.length; i++) {
        // Verificar si necesitamos nueva página ANTES de dibujar
        if (Math.min(colY[0], colY[1]) > PAGE_H - 60) {
          doc.addPage();
          // Redibujar cabecera del día en la nueva página
          const newY = 20;
          doc.setFillColor(violetLight[0], violetLight[1], violetLight[2]);
          doc.roundedRect(M, newY, PAGE_W - 2*M, 12, 2, 2, 'F');
          doc.setFontSize(14);
          doc.setFont('helvetica','bold');
          doc.setTextColor(white[0], white[1], white[2]);
          doc.text(`Día ${day + 1} (cont.)`, M + 4, newY + 8);
          doc.setFontSize(9);
          doc.setFont('helvetica','normal');
          const summaryText = `${r.km.toFixed(1)} km • ${r.min} min • ${r.paradas} paradas`;
          doc.text(summaryText, PAGE_W - M - doc.getTextWidth(summaryText) - 4, newY + 8);
          colY = [newY + 16, newY + 16];
        }
        
        const col = colY[0] <= colY[1] ? 0 : 1; // elegir columna más corta
        const x = M + col * (COL_W + COL_GAP);
        const used = await drawEventCard(stops[i], x, colY[col], COL_W);
        colY[col] += used;
      }
      y = Math.max(colY[0], colY[1]) + 8;
      if (y > PAGE_H - 40 && day < diasNum - 1) {
        doc.addPage();
        y = 20;
      }
    }

    // Pie de página elegante
    const footerY = PAGE_H - 12;
    doc.setDrawColor(violetLight[0], violetLight[1], violetLight[2]);
    doc.setLineWidth(0.5);
    doc.line(M, footerY - 3, PAGE_W - M, footerY - 3);
    doc.setFontSize(8);
    doc.setTextColor(110, 110, 120);
    doc.text('Generado con FestiMap Ecuador — festimapes.ec', M, footerY);
    doc.text('© 2025', PAGE_W - M - doc.getTextWidth('© 2025'), footerY);

    doc.save('FestiMap_Folleto.pdf');
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
            <span className="hero-summary__value">{form.dias || "—"}</span>
          </div>
          <div className="hero-summary__card">
            <span className="hero-summary__label">Paradas totales</span>
            <span className="hero-summary__value">{totalParadas}</span>
          </div>
          <div className="hero-summary__card">
            <span className="hero-summary__label">Radio de búsqueda</span>
            <span className="hero-summary__value">{form.radio}</span>
          </div>
          {/* Ritmo option removed */}
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
              placeholder="Ej: Quito Centro o -0.22,-78.51"
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
              placeholder="Ej: Otavalo Plaza o 0.23,-78.26"
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
            <input
              type="number"
              className="input"
              min="1"
              placeholder="3"
              value={form.dias}
              onChange={(e) => handleFormChange("dias", e.target.value)}
            />
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
                    {(() => {
                      const computed = computeTargetDayForEvent(ev);
                      const diasNumCur = form.dias ? parseInt(form.dias, 10) : 1;
                      const outOfRange = computed !== null && computed >= diasNumCur;
                      const targetDay = computed !== null ? computed : activeDay;
                      const buttonText = `Añadir al Día ${targetDay + 1}`;
                      return (
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm"
                          onClick={() => handleAddStop(ev)}
                          disabled={outOfRange}
                          title={outOfRange ? `Evento fuera del rango (día ${computed + 1})` : `Se agregará al día ${targetDay + 1}`}
                        >
                          {buttonText}
                        </button>
                      );
                    })()}
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
