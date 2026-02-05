const axios = require('axios');
const turf = require('@turf/turf');
const { Evento } = require('../models');
const { AppError } = require('../middlewares/errorHandler');

const LOCAL_PLACES = {
  quito: { lat: -0.2201, lng: -78.5126 },
  guayaquil: { lat: -2.1708, lng: -79.9224 },
  cuenca: { lat: -2.9001, lng: -79.0059 },
  otavalo: { lat: 0.233, lng: -78.262 }
};

const parseLocalDate = (dateStr) => {
  if (!dateStr) return null;
  const cleanStr = dateStr.replace(/\//g, '-').trim();
  const parts = cleanStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const day = parseInt(parts[2]);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
};

const geocodeQuery = async (q) => {
  if (!q) return null;
  const raw = q.toLowerCase().trim();
  if (LOCAL_PLACES[raw]) return LOCAL_PLACES[raw];

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(raw)}&limit=1`;
    const res = await axios.get(url, { headers: { 'User-Agent': 'FestiMapGeocode/1.0' } });
    if (res.data[0]) {
      return { lat: parseFloat(res.data[0].lat), lng: parseFloat(res.data[0].lon) };
    }
  } catch (e) {
    return null;
  }
  return null;
};

const reverseGeocode = async (lat, lng) => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    const res = await axios.get(url, { headers: { 'User-Agent': 'FestiMapEcuador/2.0' } });
    const address = res.data?.address || {};
    return address.city || address.town || address.village || address.county || 'Mi ubicación';
  } catch (e) {
    return 'Mi ubicación';
  }
};

module.exports.geocode = async (req, res, next) => {
  try {
    const { query } = req.body;
    if (!query) return next(new AppError('Falta la búsqueda', 400));
    const coords = await geocodeQuery(query);
    if (!coords) return next(new AppError('Lugar no encontrado', 404));
    res.json(coords);
  } catch (error) {
    next(new AppError('Error al geocodificar', 500, error));
  }
};

module.exports.reverse = async (req, res, next) => {
  try {
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) return next(new AppError('Faltan coordenadas', 400));
    const city = await reverseGeocode(lat, lng);
    res.json({ city });
  } catch (error) {
    next(new AppError('Error al obtener ciudad', 500, error));
  }
};

module.exports.generarRuta = async (req, res, next) => {
  try {
    const { origen, destino, fechaInicio, dias, radio } = req.body;

    const start = parseLocalDate(fechaInicio);
    if (!start) return next(new AppError('Fecha inválida. Usa AAAA-MM-DD', 400));

    const o = await geocodeQuery(origen);
    const d = await geocodeQuery(destino);

    if (!o || !d) return next(new AppError('Origen o destino no encontrado', 404));

    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${o.lng},${o.lat};${d.lng},${d.lat}?overview=full&geometries=geojson`;
    const osrmRes = await axios.get(osrmUrl);
    const routeGeometry = osrmRes.data.routes[0].geometry;

    const line = turf.lineString(routeGeometry.coordinates);
    const buffer = turf.buffer(line, Number(radio || 15), { units: 'kilometers' });

    const end = new Date(start);
    end.setDate(start.getDate() + (parseInt(dias) || 1));

    const eventos = await Evento.find({ status: 'approved' })
      .select('name fecha ciudad provincia lat lng imagen descripcion precio status');

    const pts = turf.featureCollection(
      eventos.map(e => turf.point([e.lng, e.lat], { ...e.toObject() }))
    );

    const dentro = turf.pointsWithinPolygon(pts, buffer).features
      .map(f => f.properties)
      .filter(ev => {
        const evDate = parseLocalDate(ev.fecha);
        if (!evDate) return false;
        return evDate.getTime() >= start.getTime() && evDate.getTime() < end.getTime();
      });

    res.json({
      sugerencias: dentro,
      geoData: { route: line.geometry, buffer: buffer.geometry, points: { o, d } }
    });
  } catch (error) {
    next(new AppError('Error al generar la ruta', 500, error));
  }
};
