// /scripts/planner.js
import { EVENTOS } from "../data/eventos.js";

const qs = s => document.querySelector(s);

window.addEventListener("DOMContentLoaded", () => {
    const origenI = qs("#origen");
    const destinoI = qs("#destino");
    const radioSel = qs("#radio");
    const ritmoSel = qs("#ritmo");
    const btnGen = qs("#btn-generar");
    const sugeridas = qs("#lista-sugeridas");
    const tabs = [...document.querySelectorAll(".tab")];
    const panels = [...document.querySelectorAll(".tabpanel")];

    // --- Inicializar mapa ---
    const map = L.map("map").setView([-0.22, -78.51], 9);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap"
    }).addTo(map);

    let rutaLayer = null;
    let bufferLayer = null;
    let markers = [];
    const itinerario = {};

    // --- Tabs de días ---
    tabs.forEach((t, i) => {
        t.addEventListener("click", () => {
            tabs.forEach(x => x.classList.remove("is-active"));
            panels.forEach(p => { p.classList.remove("is-active"); p.hidden = true; });
            t.classList.add("is-active");
            panels[i].classList.add("is-active");
            panels[i].hidden = false;
        });
    });

    // --- Botón principal: generar ruta ---
    btnGen.addEventListener("click", async () => {
        const radioKm = parseInt((radioSel.value.match(/\d+/) || [3])[0]);
        const o = await geocode(origenI.value);
        const d = await geocode(destinoI.value);
        if (!o || !d) { alert("No se pudo geocodificar."); return; }

        const route = await osrmRoute(o, d);
        if (!route) { alert("No se pudo trazar ruta."); return; }

        if (rutaLayer) map.removeLayer(rutaLayer);
        rutaLayer = L.geoJSON(route.geometry).addTo(map);
        map.fitBounds(rutaLayer.getBounds());

        const buffer = turf.buffer(route.geometry, radioKm, { units: "kilometers" });
        if (bufferLayer) map.removeLayer(bufferLayer);
        bufferLayer = L.geoJSON(buffer, { style: { fillOpacity: 0.1 } }).addTo(map);

        markers.forEach(m => map.removeLayer(m)); markers = [];

        // Filtrar eventos dentro del buffer
        const pts = turf.featureCollection(EVENTOS.map(e => turf.point([e.lng, e.lat], e)));
        const dentro = turf.pointsWithinPolygon(pts, buffer).features.map(f => f.properties);
        const ranked = dentro.map(e => ({
            ...e,
            score: turf.pointToLineDistance(turf.point([e.lng, e.lat]), route.geometry, { units: "kilometers" })
        })).sort((a, b) => a.score - b.score);

        sugeridas.innerHTML = "";
        ranked.forEach(e => {
            const li = document.createElement("li");
            li.innerHTML = `<span>${e.name}</span> <button class="btn btn--ghost btn-add">+ Añadir</button>`;
            sugeridas.appendChild(li);

            const mk = L.marker([e.lat, e.lng]).addTo(map).bindPopup(e.name);
            markers.push(mk);

            li.querySelector(".btn-add").addEventListener("click", () => addStopToDay(e));
        });
    });

    // --- Añadir parada a día activo ---
    function addStopToDay(poi) {
        const activeIdx = tabs.findIndex(t => t.classList.contains("is-active"));
        if (!itinerario[activeIdx]) itinerario[activeIdx] = [];
        itinerario[activeIdx].push(poi);
        renderDay(activeIdx);
    }

    // --- Render día ---
    function renderDay(idx) {
        const ol = qs(`#itin-dia-${idx + 1}`);
        const resumen = qs(`#resumen-${idx + 1}`);
        const ritmo = ritmoSel.value;
        const arr = (itinerario[idx] || []).slice();
        const ordered = nearestNeighbor(arr);

        let totalMin = 0, km = 0;
        ol.innerHTML = "";
        for (let i = 0; i < ordered.length; i++) {
            let dur = ordered[i].durMin;
            if (ritmo === "relajado") dur *= 1.2;
            if (ritmo === "intenso") dur *= 0.8;

            if (i > 0) {
                const prev = ordered[i - 1];
                const dkm = turf.distance([prev.lng, prev.lat], [ordered[i].lng, ordered[i].lat], { units: "kilometers" });
                km += dkm;
                totalMin += Math.max(10, dkm * 2);
            }
            totalMin += dur;
            const li = document.createElement("li");
            li.textContent = `Parada ${i + 1} — ${ordered[i].name} — ${Math.round(dur)} min`;
            ol.appendChild(li);
        }
        resumen.textContent = `${km.toFixed(1)} km • ${Math.round(totalMin)} min • ${ordered.length} paradas`;
    }

    // --- Utilidades ---
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
        const used = new Set();
        const out = [];
        let curr = items[0];
        out.push(curr);
        used.add(curr.id);
        while (out.length < items.length) {
            let best = null, bestD = Infinity;
            for (const c of items) {
                if (used.has(c.id)) continue;
                const d = turf.distance([curr.lng, curr.lat], [c.lng, c.lat], { units: "kilometers" });
                if (d < bestD) { bestD = d; best = c; }
            }
            out.push(best);
            used.add(best.id);
            curr = best;
        }
        return out;
    }
});
