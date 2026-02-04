
const { Evento, Log } = require('../models');
const { AppError } = require('../middlewares/errorHandler');

/**
 * MOTOR DE EVENTOS V5.6 - BACKEND DOMINANTE
 */
module.exports.obtenerEventos = async (req, res, next) => {
  try {
    const { categoria, region, search, lat, lng, radio } = req.query;
    let query = {};

    // 1. Lógica Geoespacial: Si vienen coordenadas, el servidor calcula la cercanía
    if (lat && lng && radio) {
      query.location = {
        $near: {
          $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseFloat(radio) * 1000 // Convertir KM a metros
        }
      };
    }

    if (categoria && categoria !== 'Todas') query.categoria = categoria;
    if (region) query.region = region;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { ciudad: { $regex: search, $options: 'i' } }
      ];
    }

    const eventos = await Evento.find(query).sort({ fecha: 1 });
    res.json(eventos);
  } catch (error) {
    next(new AppError("Error en el Motor de Datos del Servidor", 500, error));
  }
};

module.exports.crearEvento = async (req, res, next) => {
  try {
    // Sincronizar location con lat/lng antes de guardar
    const datos = {
      ...req.body,
      location: { type: 'Point', coordinates: [parseFloat(req.body.lng), parseFloat(req.body.lat)] }
    };
    
    const nuevo = await Evento.create(datos);
    
    // AUDITORÍA: El servidor registra la acción
    await Log.create({
      accion: 'CREATE',
      recurso: 'EVENTO',
      detalle: `Evento "${nuevo.name}" creado en ${nuevo.ciudad}`,
      autor: req.user?.nombre || 'Administrador'
    });

    res.status(201).json(nuevo);
  } catch (error) {
    next(new AppError("Validación fallida en el Servidor", 400, error));
  }
};

module.exports.actualizarEvento = async (req, res, next) => {
  try {
    if (req.body.lat && req.body.lng) {
      req.body.location = { type: 'Point', coordinates: [parseFloat(req.body.lng), parseFloat(req.body.lat)] };
    }

    const actualizado = await Evento.findByIdAndUpdate(req.params.id, req.body, { new: true });
    
    // AUDITORÍA: El servidor registra el cambio
    await Log.create({
      accion: 'UPDATE',
      recurso: 'EVENTO',
      detalle: `Evento ID ${req.params.id} modificado`,
      autor: req.user?.nombre || 'Administrador'
    });

    res.json(actualizado);
  } catch (error) {
    next(new AppError("Error en la actualización física del documento", 400, error));
  }
};

module.exports.eliminarEvento = async (req, res, next) => {
  try {
    const eliminado = await Evento.findByIdAndDelete(req.params.id);
    if (!eliminado) return next(new AppError("No existe el registro", 404));

    // AUDITORÍA: El servidor registra la eliminación
    await Log.create({
      accion: 'DELETE',
      recurso: 'EVENTO',
      detalle: `Evento "${eliminado.name}" eliminado permanentemente`,
      autor: req.user?.nombre || 'Administrador'
    });

    res.json({ mensaje: "Registro purgado" });
  } catch (error) {
    next(new AppError("Fallo en la purga de datos", 500, error));
  }
};

module.exports.agregarComentario = async (req, res, next) => {
  try {
    const evento = await Evento.findById(req.params.id);
    const nuevoComentario = {
      id: Date.now(),
      usuario: req.body.usuario,
      rating: req.body.rating,
      comentario: req.body.comentario,
      fecha: new Date().toISOString().split('T')[0]
    };
    evento.comentarios.push(nuevoComentario);
    await evento.save();
    res.status(201).json(nuevoComentario);
  } catch (error) {
    next(new AppError("Error al procesar opinión", 500, error));
  }
};
