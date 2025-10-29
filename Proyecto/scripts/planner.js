// /scripts/planner.js
import { EVENTOS } from "../data/eventos.js";

const qs  = s => document.querySelector(s);
const qsa = s => [...document.querySelectorAll(s)];

// ----- Util: parseo robusto de fechas (dd/mm/aaaa o yyyy-mm-dd) -----
function parseDateFlexible(str) {
  if (!str) return null;
  const s = String(str).trim();
  // dd/mm/aaaa
  const m1 = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m1) {
    const d = Number(m1[1]), mo = Number(m1[2]) - 1, y = Number(m1[3]);
    // usar mediodía para evitar desfases TZ
    return new Date(y, mo, d, 12, 0, 0, 0);
  }
  // yyyy-mm-dd o yyyy/mm/dd
  const m2 = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (m2) {
    const y = Number(m2[1]), mo = Number(m2[2]) - 1, d = Number(m2[3]);
    return new Date(y, mo, d, 12, 0, 0, 0);
  }
  // Fallback Date()
  const d = new Date(s);
  if (!isNaN(d.getTime())) return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0);
  return null;
}

window.addEventListener("DOMContentLoaded", () => {
  // ---- Referencias UI ----
  const origenI   = qs("#origen");
  const destinoI  = qs("#destino");
  const radioSel  = qs("#radio");
  const ritmoSel  = qs("#ritmo");
  const diasSel   = qs("#dias");
  const fechaI    = qs("#fecha-ini");

  const btnGen    = qs("#btn-generar");
  const btnAuto   = qs("#btn-auto");
  const btnGuardar= qs("#btn-guardar");
  const btnExport = qs("#btn-exportar");

  const sugeridas = qs("#lista-sugeridas");
  let   tabs      = qsa(".tab");
  let   panels    = qsa(".tabpanel");

  // ---- Estado ----
  const itinerario = {}; // { diaIndex: [{id,name,lat,lng,durMin,fecha?}] }
  let routeState = {
    hasRoute: false,
    geometry: null,     // GeoJSON LineString
    bufferKm: 3,
    bufferPoly: null    // GeoJSON Polygon
  };

  // ---- Mapa ----
  const map = L.map("map").setView([-0.22, -78.51], 9);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap" }).addTo(map);
  let rutaLayer = null, bufferLayer = null, markers = [];

  // ---- Tabs ----
  function bindTabs() { tabs.forEach((t, i) => t.addEventListener("click", () => activateDay(i))); }
  function activateDay(i) {
    tabs.forEach(x => x.classList.remove("is-active"));
    panels.forEach(p => { p.classList.remove("is-active"); p.hidden = true; });
    tabs[i]?.classList.add("is-active");
    if (panels[i]) { panels[i].classList.add("is-active"); panels[i].hidden = false; }
  }
  function syncTabsWithDays() {
    const n = parseInt(diasSel.value, 10);
    tabs.forEach((t, i) => t.style.display = (i < n ? "" : "none"));
    panels.forEach((p, i) => {
      if (i < n) { p.style.display = ""; }
      else { p.style.display = "none"; p.hidden = true; }
    });
    if (!tabs.some(t => t.classList.contains("is-active") && t.style.display !== "none")) activateDay(0);
  }
  bindTabs();
  syncTabsWithDays();
  diasSel.addEventListener("change", syncTabsWithDays);

  // ---- Recalcular/Optimizar por día ----
  qsa('[id^="btn-recalcular-"]').forEach((btn, idx) => {
    btn.addEventListener("click", () => {
      const day = idx; // 0,1,2…
      if (!itinerario[day] || itinerario[day].length < 2) return;
      itinerario[day] = nearestNeighbor(itinerario[day]);
      renderDay(day);
    });
  });

  // ---- Generar ruta y sugerencias ----
  btnGen.addEventListener("click", async () => {
    const radioKm = parseInt((radioSel.value.match(/\d+/) || [3])[0], 10);
    const o = await geocode(origenI.value);
    const d = await geocode(destinoI.value);
    if (!o || !d) return alert("No se pudo geocodificar origen/destino.");

    const route = await osrmRoute(o, d);
    if (!route) return alert("No se pudo trazar la ruta.");

    // Ruta
    if (rutaLayer) map.removeLayer(rutaLayer);
    rutaLayer = L.geoJSON(route.geometry, { color: "#007f7f", weight: 4 }).addTo(map);
    map.fitBounds(rutaLayer.getBounds());

    // Buffer
    const buffer = turf.buffer(route.geometry, radioKm, { units: "kilometers" });
    if (bufferLayer) map.removeLayer(bufferLayer);
    bufferLayer = L.geoJSON(buffer, { style: { fillColor: "#00ffff", fillOpacity: 0.1, color: "#00b3b3" } }).addTo(map);

    // Estado ruta
    routeState = { hasRoute: true, geometry: route.geometry, bufferKm: radioKm, bufferPoly: buffer };

    // Limpiar marcadores previos
    markers.forEach(m => map.removeLayer(m)); markers = [];

    // Construir sugerencias
    buildSuggestions();
  });

  // ---- Generar automática ----
  btnAuto.addEventListener("click", () => {
    if (!routeState.hasRoute) {
      alert("Primero genera la ruta para ver y añadir sugerencias.");
      return;
    }
    // Si la lista está vacía, reintenta construir (por si cambió la fecha)
    if (!qs("#lista-sugeridas li")) buildSuggestions();

    const items = qsa("#lista-sugeridas li .btn-add");
    if (items.length === 0) {
      alert("No hay sugerencias disponibles para estas fechas y radio.");
      return;
    }
    items.slice(0, 5).forEach(btn => btn.click());
  });

  // ---- Sugerencias (reutilizable) ----
  function buildSuggestions() {
    if (!routeState.hasRoute || !routeState.bufferPoly || !routeState.geometry) return;

    const pts = turf.featureCollection(EVENTOS.map(e => turf.point([e.lng, e.lat], e)));
    let dentro = turf.pointsWithinPolygon(pts, routeState.bufferPoly).features.map(f => f.properties);

    // Rango de fechas real del viaje
    const fi = parseDateFlexible(fechaI.value);
    if (fi) {
      const ff = new Date(fi); // fecha fin
      ff.setDate(ff.getDate() + parseInt(diasSel.value || "1", 10));
      dentro = dentro.filter(ev => {
        if (!ev.fecha) return true;
        const f = parseDateFlexible(ev.fecha);
        return f && f >= fi && f <= ff;
      });
    }

    sugeridas.innerHTML = "";
    if (dentro.length === 0) {
      sugeridas.innerHTML = "<li>No hay eventos en esas fechas dentro del corredor de ruta.</li>";
      return;
    }

    const ranked = dentro.map(e => ({
      ...e,
      score: turf.pointToLineDistance(turf.point([e.lng, e.lat]), routeState.geometry, { units: "kilometers" })
    })).sort((a, b) => a.score - b.score);

    // Limpiar marcadores previos
    markers.forEach(m => map.removeLayer(m)); markers = [];

    ranked.forEach(e => {
      const li = document.createElement("li");
      li.innerHTML = `<span>${e.name}${e.fecha ? " (" + e.fecha + ")" : ""}</span> 
        <button class="btn btn--ghost btn-add">+ Añadir</button>`;
      sugeridas.appendChild(li);

      const mk = L.marker([e.lat, e.lng]).addTo(map)
        .bindPopup(`${e.name}${e.fecha ? "<br>" + e.fecha : ""}`);
      markers.push(mk);

      li.querySelector(".btn-add").addEventListener("click", () => addStopToActiveDay(e));
    });
  }

  // ---- Añadir/Quitar paradas ----
  function addStopToActiveDay(poi) {
    const idx = tabs.findIndex(t => t.classList.contains("is-active") && t.style.display !== "none");
    if (idx < 0) return;
    if (!itinerario[idx]) itinerario[idx] = [];
    itinerario[idx].push(poi);
    renderDay(idx);
  }

  function renderDay(idx) {
    const ol = qs(`#itin-dia-${idx + 1}`);
    const resumen = qs(`#resumen-${idx + 1}`);
    const ritmo = ritmoSel.value;
    const arr = (itinerario[idx] || []).slice();
    const ordered = nearestNeighbor(arr);

    let totalMin = 0, km = 0;
    ol.innerHTML = "";

    ordered.forEach((stop, i) => {
      let dur = stop.durMin || 60;
      if (ritmo === "relajado") dur = Math.round(dur * 1.2);
      if (ritmo === "intenso")  dur = Math.round(dur * 0.8);

      if (i > 0) {
        const prev = ordered[i - 1];
        const dkm = turf.distance([prev.lng, prev.lat], [stop.lng, stop.lat], { units: "kilometers" });
        km += dkm;
        totalMin += Math.max(10, Math.round(dkm * 2));
      }
      totalMin += dur;

      const li = document.createElement("li");
      li.className = "itinerary-item";
      li.innerHTML = `<span>${i + 1}. ${stop.name} — ${dur} min</span>
        <button class="btn-remove" title="Quitar">✖</button>`;
      ol.appendChild(li);

      li.querySelector(".btn-remove").addEventListener("click", () => {
        itinerario[idx] = (itinerario[idx] || []).filter(x => x.id !== stop.id);
        renderDay(idx);
      });
    });

    resumen.textContent = `${km.toFixed(1)} km • ${totalMin} min • ${ordered.length} paradas`;
  }

  // ---- Guardar/Cargar ----
  btnGuardar.addEventListener("click", () => {
    const data = {
      origen: origenI.value, destino: destinoI.value,
      ritmo: ritmoSel.value, radio: radioSel.value,
      dias: diasSel.value, fechaIni: fechaI.value,
      itinerario
    };
    localStorage.setItem("festi_itinerario", JSON.stringify(data));
    alert("Plan guardado.");
  });

  (function loadSaved() {
    const saved = localStorage.getItem("festi_itinerario");
    if (!saved) return;
    const plan = JSON.parse(saved);
    origenI.value  = plan.origen  || "";
    destinoI.value = plan.destino || "";
    ritmoSel.value = plan.ritmo   || "normal";
    radioSel.value = plan.radio   || "3 km";
    diasSel.value  = plan.dias    || "3";
    fechaI.value   = plan.fechaIni|| "";
    syncTabsWithDays();
    Object.keys(plan.itinerario || {}).forEach(idx => {
      itinerario[idx] = plan.itinerario[idx];
      renderDay(parseInt(idx, 10));
    });
  })();

  // ---- Exportar PDF (folleto) ----
  btnExport.addEventListener("click", () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    // Encabezado
    doc.setFillColor(15,150,150);
    doc.rect(0,0,210,30,"F");
    doc.setTextColor(255,255,255);
    doc.setFont("helvetica","bold");
    doc.setFontSize(20);
    doc.text("FestiMap Ecuador", 14, 19);
    doc.setFontSize(12);
    doc.text("Plan de Viaje Cultural", 196, 19, { align: "right" });

    // Datos
    let y = 42;
    doc.setTextColor(0,0,0);
    doc.setFont("helvetica","normal");
    doc.setFontSize(12);
    doc.text(`Origen: ${origenI.value || "—"}`, 14, y); y+=7;
    doc.text(`Destino: ${destinoI.value || "—"}`, 14, y); y+=7;
    doc.text(`Fecha inicio: ${fechaI.value || "—"}`, 14, y); y+=7;
    doc.text(`Ritmo: ${ritmoSel.value}`, 14, y); y+=7;
    doc.text(`Duración: ${diasSel.value} día(s)`, 14, y);

    // Separador
    y += 6;
    doc.setDrawColor(200,200,200);
    doc.line(14, y, 196, y);
    y += 10;

    // Itinerario
    doc.setFont("helvetica","bold");
    doc.setFontSize(14);
    doc.setTextColor(15,150,150);
    doc.text("Itinerario Detallado", 14, y);
    y += 8;

    const diasOrden = Object.keys(itinerario).map(n => parseInt(n,10)).sort((a,b)=>a-b);
    if (diasOrden.length === 0) {
      doc.setFont("helvetica","normal"); doc.setFontSize(12); doc.setTextColor(80,80,80);
      doc.text("No se han agregado paradas.", 14, y);
    } else {
      diasOrden.forEach(idx => {
        const stops = itinerario[idx] || [];
        doc.setFont("helvetica","bold"); doc.setFontSize(13); doc.setTextColor(0,100,100);
        doc.text(`Día ${idx + 1}`, 14, y); y += 6;

        doc.setFont("helvetica","normal"); doc.setFontSize(11); doc.setTextColor(0,0,0);
        if (stops.length === 0) { doc.text("— sin paradas —", 18, y); y += 6; }
        stops.forEach((s, i) => {
          const line = `${i + 1}. ${s.name}${s.fecha ? " (" + s.fecha + ")" : ""} — ${s.durMin || 60} min`;
          doc.text(line, 18, y); y += 6;
          if (y > 270) { doc.addPage(); y = 20; }
        });
        y += 4;
        doc.setDrawColor(220,220,220);
        doc.line(14, y, 196, y);
        y += 6;
      });
    }

    // Pie
    doc.setFontSize(10);
    doc.setTextColor(100,100,100);
    doc.text("Generado con FestiMap Ecuador — folleto cultural", 14, 290);
    doc.save("FestiMap_Itinerario.pdf");
  });

  // ---- Utils ----
  async function geocode(q) {
    const m = q.trim().match(/^\s*(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)\s*$/);
    if (m) return { lat: +m[1], lng: +m[3] };
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`;
    const r = await fetch(url).then(x => x.json()).catch(() => null);
    if (!r || !r[0]) return null;
    return { lat: parseFloat(r[0].lat), lng: parseFloat(r[0].lon) };
  }

  async function osrmRoute(o, d) {
    const url = `https://router.project-osrm.org/route/v1/driving/${o.lng},${o.lat};${d.lng},${d.lat}?overview=full&geometries=geojson`;
    const j = await fetch(url).then(x => x.json()).catch(() => null);
    return j?.routes?.[0] ? { geometry: j.routes[0].geometry } : null;
  }

  function nearestNeighbor(items) {
    if (items.length <= 2) return items.slice();
    const used = new Set(); const out = [];
    let curr = items[0]; out.push(curr); used.add(curr.id);
    while (out.length < items.length) {
      let best = null, bestD = Infinity;
      for (const c of items) {
        if (used.has(c.id)) continue;
        const d = turf.distance([curr.lng, curr.lat], [c.lng, c.lat], { units: "kilometers" });
        if (d < bestD) { bestD = d; best = c; }
      }
      out.push(best); used.add(best.id); curr = best;
    }
    return out;
  }
});
