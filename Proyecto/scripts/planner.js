// /scripts/planner.js
import { EVENTOS } from "../data/eventos.js";

const qs = s => document.querySelector(s);
const qsa = s => [...document.querySelectorAll(s)];

/* ----------------- Fechas ----------------- */
// dd/mm/aaaa, dd-mm-aaaa, yyyy-mm-dd, yyyy/mm/dd
function parseDateFlexible(str) {
    if (!str) return null;
    const s = String(str).trim();
    let m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (m) { // dd/mm/aaaa
        const d = +m[1], mo = +m[2] - 1, y = +m[3];
        if (mo >= 0 && mo < 12 && d > 0 && d <= 31) return new Date(Date.UTC(y, mo, d, 12, 0, 0, 0));
    }
    m = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
    if (m) { // yyyy-mm-dd
        const y = +m[1], mo = +m[2] - 1, d = +m[3];
        if (mo >= 0 && mo < 12 && d > 0 && d <= 31) return new Date(Date.UTC(y, mo, d, 12, 0, 0, 0));
    }
    const d = new Date(s);
    if (!isNaN(d.getTime())) return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0, 0));
    console.warn("Formato de fecha no reconocido:", str);
    return null;
}

// Hora estimada (comienza 08:30) para mostrar llegada
function formatTime(totalMinutes) {
    const startMinutes = 8 * 60 + 30;
    const m = startMinutes + totalMinutes;
    const hh = Math.floor(m / 60) % 24, mm = Math.round(m % 60);
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

/* ------------- Geocodificación ------------- */
// Diccionario de fallback si Nominatim falla o hay rate-limit
const LOCAL_PLACES = {
    "quito": { lat: -0.2201, lng: -78.5126 },
    "quito centro": { lat: -0.2201, lng: -78.5126 },
    "otavalo": { lat: 0.2330, lng: -78.2620 },
    "otavalo plaza": { lat: 0.2330, lng: -78.2620 },
    "mitad del mundo": { lat: -0.0023, lng: -78.4558 },
    "el quinche": { lat: -0.1080, lng: -78.2730 }
};

async function geocode(q) {
    if (!q) return null;
    const raw = q.trim();

    // coordenadas "lat,lng"
    const m = raw.match(/^\s*(-?\d+(\.\d+)?)[,\s]+(-?\d+(\.\d+)?)\s*$/);
    if (m) return { lat: +m[1], lng: +m[3] };

    // fallback local por nombre
    const key = raw.toLowerCase();
    if (LOCAL_PLACES[key]) return { ...LOCAL_PLACES[key] };

    // Nominatim
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(raw)}&limit=1`;
    try {
        const r = await fetch(url, { headers: { "Accept-Language": "es" } }).then(x => x.json());
        if (r && r[0]) return { lat: parseFloat(r[0].lat), lng: parseFloat(r[0].lon) };
    } catch (_e) {
        console.warn("Geocode error, usando fallback si existe", _e);
    }
    // último intento: palabras clave parciales
    for (const k of Object.keys(LOCAL_PLACES)) {
        if (key.includes(k)) return { ...LOCAL_PLACES[k] };
    }
    return null;
}

/* --------------- Ruteo OSRM --------------- */
async function osrmRoute(o, d) {
    const url = `https://router.project-osrm.org/route/v1/driving/${o.lng},${o.lat};${d.lng},${d.lat}?overview=full&geometries=geojson`;
    try {
        const j = await fetch(url).then(x => x.json());
        return j?.routes?.[0] ? { geometry: j.routes[0].geometry } : null;
    } catch (_e) {
        console.warn("OSRM error", _e);
        return null;
    }
}

/* ---------- Heurística de orden ----------- */
function nearestNeighbor(items) {
    if (items.length <= 2) return items.slice();
    const used = new Set(), out = [];
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

/* ----------------- App UI ------------------ */
window.addEventListener("DOMContentLoaded", () => {
    // UI
    const origenI = qs("#origen");
    const destinoI = qs("#destino");
    const radioSel = qs("#radio");
    const ritmoSel = qs("#ritmo");
    const diasSel = qs("#dias");
    const fechaI = qs("#fecha-ini");

    const btnGen = qs("#btn-generar");
    const btnAuto = qs("#btn-auto");
    const btnGuardar = qs("#btn-guardar");
    const btnExport = qs("#btn-exportar");

    const sugeridas = qs("#lista-sugeridas");
    let tabs = qsa(".tab");
    let panels = qsa(".tabpanel");

    // Limpia la lista estática de ejemplo
    if (sugeridas) sugeridas.innerHTML = "";

    // Estado
    const itinerario = {}; // {0:[poi,...],1:[...]}
    let routeState = { hasRoute: false, geometry: null, bufferKm: 3, bufferPoly: null };

    // Mapa
    let map = null, rutaLayer = null, bufferLayer = null, markers = [];
    try {
        if (typeof L !== "undefined" && qs("#map")) {
            map = L.map("map").setView([-0.22, -78.51], 9);
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap" }).addTo(map);
        } else {
            const mapDiv = qs("#map");
            if (mapDiv) mapDiv.innerHTML = "<p style='color:red;text-align:center'>No se cargó Leaflet.</p>";
        }
    } catch (e) {
        const mapDiv = qs("#map");
        if (mapDiv) mapDiv.innerHTML = "<p style='color:red;text-align:center'>Error al cargar el mapa.</p>";
    }

    // Tabs
    function handleTabClick(ev) { const i = tabs.indexOf(ev.currentTarget); if (i > -1) activateDay(i); }
    function bindTabs() {
        tabs = qsa(".tab"); panels = qsa(".tabpanel");
        tabs.forEach(t => { t.removeEventListener("click", handleTabClick); t.addEventListener("click", handleTabClick); });
    }
    function activateDay(i) {
        tabs.forEach((t, idx) => { const on = idx === i; t.classList.toggle("is-active", on); t.setAttribute("aria-selected", String(on)); });
        panels.forEach((p, idx) => { const on = idx === i && (tabs[idx]?.style.display !== "none"); p.classList.toggle("is-active", on); p.hidden = !on; });
    }
    function syncTabsWithDays() {
        const n = parseInt(diasSel.value || "1", 10);
        let firstVisible = -1;
        tabs.forEach((t, i) => { const vis = i < n; t.style.display = vis ? "" : "none"; if (vis && firstVisible < 0) firstVisible = i; if (!vis) t.classList.remove("is-active"); });
        panels.forEach((p, i) => { p.hidden = i >= n; if (p.hidden) p.classList.remove("is-active"); });
        const hasActiveVisible = tabs.some((t, i) => t.classList.contains("is-active") && i < n);
        if (!hasActiveVisible && firstVisible >= 0) activateDay(firstVisible);
        else if (firstVisible === -1 && tabs.length > 0) activateDay(0);
    }
    bindTabs(); syncTabsWithDays();
    diasSel.addEventListener("change", syncTabsWithDays);

    // Optimizar día
    qsa('[id^="btn-recalcular-"]').forEach((btn, idx) => {
        btn.addEventListener("click", () => {
            const day = idx;
            if (!itinerario[day] || itinerario[day].length < 2) { if (itinerario[day]?.length) renderDay(day); return; }
            itinerario[day] = nearestNeighbor(itinerario[day]); renderDay(day);
        });
    });

    // Generar ruta + sugerencias
    btnGen.addEventListener("click", async () => {
        const radioKm = parseInt((radioSel.value.match(/\d+/) || [3])[0], 10);
        const o = await geocode(origenI.value);
        const d = await geocode(destinoI.value);
        if (!o || !d) { alert("No se pudo geocodificar origen/destino."); return; }

        const route = await osrmRoute(o, d);
        if (!route) { alert("No se pudo trazar la ruta."); return; }

        let buffer = null;
        if (map) {
            if (rutaLayer) map.removeLayer(rutaLayer);
            rutaLayer = L.geoJSON(route.geometry, { color: "#007f7f", weight: 4 }).addTo(map);
            map.fitBounds(rutaLayer.getBounds());

            buffer = turf.buffer(route.geometry, radioKm, { units: "kilometers" });
            if (bufferLayer) map.removeLayer(bufferLayer);
            bufferLayer = L.geoJSON(buffer, { style: { fillColor: "#00ffff", fillOpacity: 0.1, color: "#00b3b3" } }).addTo(map);

            markers.forEach(m => map.removeLayer(m)); markers = [];
        } else {
            buffer = turf.buffer(route.geometry, radioKm, { units: "kilometers" });
        }

        routeState = { hasRoute: true, geometry: route.geometry, bufferKm: radioKm, bufferPoly: buffer };
        buildSuggestions();
    });

    // Generar automática
    btnAuto.addEventListener("click", () => {
        if (!routeState.hasRoute) { alert("Primero genera la ruta."); return; }
        if (!qs("#lista-sugeridas li")) buildSuggestions();
        const items = qsa("#lista-sugeridas li .btn-add");
        if (items.length === 0) { alert("No hay sugerencias disponibles."); return; }
        items.slice(0, 5).forEach(b => b.click());
    });

    // Sugerencias
    function buildSuggestions() {
        if (!routeState.hasRoute || !routeState.bufferPoly || !routeState.geometry) return;

        const pts = turf.featureCollection(EVENTOS.map(e => turf.point([e.lng, e.lat], e)));
        const dentro = turf.pointsWithinPolygon(pts, routeState.bufferPoly).features.map(f => f.properties);

        // Rango exacto -> mismo mes -> sin fecha
        let filtered = dentro;
        const fi = parseDateFlexible(fechaI.value);
        if (fi) {
            const ff = new Date(fi); ff.setUTCDate(ff.getUTCDate() + (parseInt(diasSel.value || "1", 10) - 1));
            filtered = dentro.filter(ev => {
                if (!ev.fecha) return true;
                const f = parseDateFlexible(ev.fecha);
                return f && f >= fi && f <= ff;
            });
            if (filtered.length === 0) {
                filtered = dentro.filter(ev => {
                    if (!ev.fecha) return true;
                    const f = parseDateFlexible(ev.fecha);
                    return f && f.getUTCFullYear() === fi.getUTCFullYear() && f.getUTCMonth() === fi.getUTCMonth();
                });
            }
            if (filtered.length === 0) filtered = dentro;
        }

        sugeridas.innerHTML = "";
        if (filtered.length === 0) {
            sugeridas.innerHTML = "<li>No hay eventos cercanos para esas fechas.</li>";
            markers.forEach(m => map?.removeLayer(m)); markers = [];
            return;
        }

        const ranked = filtered.map(e => ({
            ...e,
            score: turf.pointToLineDistance(turf.point([e.lng, e.lat]), routeState.geometry, { units: "kilometers" })
        })).sort((a, b) => a.score - b.score);

        markers.forEach(m => map?.removeLayer(m)); markers = [];
        ranked.forEach(e => {
            const li = document.createElement("li");
            li.innerHTML = `<span>${e.name}${e.fecha ? " (" + e.fecha + ")" : ""}</span>
        <button class="btn btn--ghost btn-add">+ Añadir</button>`;
            sugeridas.appendChild(li);

            if (map) {
                const mk = L.marker([e.lat, e.lng]).addTo(map).bindPopup(`${e.name}${e.fecha ? ("<br>" + e.fecha) : ""}`);
                markers.push(mk);
            }
            li.querySelector(".btn-add").addEventListener("click", () => addStopToActiveDay(e));
        });
    }

    // Añadir / Quitar / Render
    function addStopToActiveDay(poi) {
        const idx = tabs.findIndex(t => t.classList.contains("is-active") && t.style.display !== "none");
        if (idx < 0) return;
        if (!itinerario[idx]) itinerario[idx] = [];
        if (itinerario[idx].some(x => x.id === poi.id)) return; // evita duplicados
        itinerario[idx].push(poi);
        renderDay(idx);
    }

    function renderDay(idx) {
        const ol = qs(`#itin-dia-${idx + 1}`);
        const resumen = qs(`#resumen-${idx + 1}`);
        if (!ol || !resumen) return;

        const ritmo = ritmoSel.value;
        const arr = (itinerario[idx] || []).slice();
        const ordered = nearestNeighbor(arr);

        let totalMin = 0, km = 0, acc = 0;
        ol.innerHTML = "";

        if (ordered.length === 0) {
            ol.innerHTML = "<li>(Añade paradas desde las sugerencias)</li>";
        } else {
            ordered.forEach((stop, i) => {
                let dur = stop.durMin || 60;
                if (ritmo === "relajado") dur = Math.round(dur * 1.2);
                if (ritmo === "intenso") dur = Math.round(dur * 0.8);

                let travel = 0;
                if (i > 0) {
                    const prev = ordered[i - 1];
                    const dkm = turf.distance([prev.lng, prev.lat], [stop.lng, stop.lat], { units: "kilometers" });
                    km += dkm; travel = Math.max(10, Math.round(dkm * 2)); acc += travel;
                }
                const tStr = formatTime(acc);
                acc += dur; totalMin = acc;

                const li = document.createElement("li");
                li.className = "itinerary-item";
                li.innerHTML = `<span>${tStr} ${stop.name} (${dur} min)${i > 0 ? ` (+${travel} min viaje)` : " (Inicio)"}</span>
          <button class="btn-remove" title="Quitar">✖</button>`;
                ol.appendChild(li);

                li.querySelector(".btn-remove").addEventListener("click", () => {
                    itinerario[idx] = (itinerario[idx] || []).filter(x => x.id !== stop.id);
                    renderDay(idx);
                });
            });
            // resumen final consistente
            totalMin = 0; km = 0;
            for (let i = 0; i < ordered.length; i++) {
                let dur = ordered[i].durMin || 60;
                if (ritmo === "relajado") dur = Math.round(dur * 1.2);
                if (ritmo === "intenso") dur = Math.round(dur * 0.8);
                totalMin += dur;
                if (i > 0) {
                    const prev = ordered[i - 1];
                    const dkm = turf.distance([prev.lng, prev.lat], [ordered[i].lng, ordered[i].lat], { units: "kilometers" });
                    km += dkm; totalMin += Math.max(10, Math.round(dkm * 2));
                }
            }
        }
        resumen.textContent = `${km.toFixed(1)} km • ${totalMin} min • ${ordered.length} paradas`;
    }

    // Guardar / Cargar
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
        origenI.value = plan.origen || "";
        destinoI.value = plan.destino || "";
        ritmoSel.value = plan.ritmo || "normal";
        radioSel.value = plan.radio || "3 km";
        diasSel.value = plan.dias || "3";
        fechaI.value = plan.fechaIni || "";
        syncTabsWithDays();
        Object.keys(plan.itinerario || {}).forEach(idx => {
            itinerario[idx] = plan.itinerario[idx];
            renderDay(parseInt(idx, 10));
        });
    })();

    // PDF (jsPDF UMD)
    btnExport.addEventListener("click", () => {
        if (typeof window.jspdf === "undefined") { alert("No se encontró jsPDF."); return; }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

        // Encabezado
        doc.setFillColor(15, 150, 150); doc.rect(0, 0, 210, 30, "F");
        doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(20);
        doc.text("FestiMap Ecuador", 14, 19); doc.setFontSize(12);
        doc.text("Plan de Viaje Cultural", 196, 19, { align: "right" });

        let y = 42; doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal"); doc.setFontSize(12);
        doc.text(`Origen: ${origenI.value || "—"}`, 14, y); y += 7;
        doc.text(`Destino: ${destinoI.value || "—"}`, 14, y); y += 7;
        doc.text(`Fecha inicio: ${fechaI.value || "—"}`, 14, y); y += 7;
        doc.text(`Ritmo: ${ritmoSel.value}`, 14, y); y += 7;
        doc.text(`Duración: ${diasSel.value} día(s)`, 14, y); y += 6;
        doc.setDrawColor(200, 200, 200); doc.line(14, y, 196, y); y += 10;

        doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.setTextColor(15, 150, 150);
        doc.text("Itinerario Detallado", 14, y); y += 8;

        const diasOrden = Object.keys(itinerario).map(n => parseInt(n, 10)).sort((a, b) => a - b);
        if (diasOrden.length === 0) {
            doc.setFont("helvetica", "normal"); doc.setFontSize(12); doc.setTextColor(80, 80, 80);
            doc.text("No se han agregado paradas.", 14, y);
        } else {
            diasOrden.forEach(idx => {
                const stops = itinerario[idx] || [];
                doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(0, 100, 100);
                doc.text(`Día ${idx + 1}`, 14, y); y += 6;

                doc.setFont("helvetica", "normal"); doc.setFontSize(11); doc.setTextColor(0, 0, 0);
                if (stops.length === 0) { doc.text("— sin paradas —", 18, y); y += 6; }
                stops.forEach((s, i) => {
                    const line = `${i + 1}. ${s.name}${s.fecha ? ` (${s.fecha})` : ""} — ${s.durMin || 60} min`;
                    doc.text(line, 18, y); y += 6; if (y > 270) { doc.addPage(); y = 20; }
                });
                y += 4; doc.setDrawColor(220, 220, 220); doc.line(14, y, 196, y); y += 6;
            });
        }
        doc.setFontSize(10); doc.setTextColor(100, 100, 100);
        doc.text("Generado con FestiMap Ecuador — folleto cultural", 14, 290);
        doc.save("FestiMap_Itinerario.pdf");
    });
});