
const { Evento, Log } = require('../models');
const { AppError } = require('../middlewares/errorHandler');

/**
 * MOTOR DE EVENTOS V5.6 - BACKEND DOMINANTE
 */
module.exports.obtenerEventos = async (req, res, next) => {
  try {
    const { categoria, region, search, lat, lng, radio } = req.query;
    let query = {};

    if (lat && lng && radio) {
      query.location = {
        $near: {
          $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseFloat(radio) * 1000 
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

// ESTA FUNCIÓN FALTABA Y CAUSABA EL ERROR
module.exports.obtenerEventoPorId = async (req, res, next) => {
  try {
    const evento = await Evento.findById(req.params.id);
    if (!evento) return next(new AppError("Evento no localizado en MongoDB", 404));
    res.json(evento);
  } catch (error) {
    next(new AppError("Error al consultar el documento por ID", 500, error));
  }
};

// BACKEND: Crear evento (POST /api/eventos) - solo admin
module.exports.crearEvento = async (req, res, next) => {
  try {
    const datos = {
      ...req.body,
      location: { type: 'Point', coordinates: [parseFloat(req.body.lng || 0), parseFloat(req.body.lat || 0)] }
    };
    
    const nuevo = await Evento.create(datos);
    
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

// BACKEND: Actualizar evento (PUT /api/eventos/:id) - solo admin
module.exports.actualizarEvento = async (req, res, next) => {
  try {
    if (req.body.lat && req.body.lng) {
      req.body.location = { type: 'Point', coordinates: [parseFloat(req.body.lng), parseFloat(req.body.lat)] };
    }

    const actualizado = await Evento.findByIdAndUpdate(req.params.id, req.body, { new: true });
    
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

// BACKEND: Eliminar evento (DELETE /api/eventos/:id) - solo admin
module.exports.eliminarEvento = async (req, res, next) => {
  try {
    const eliminado = await Evento.findByIdAndDelete(req.params.id);
    if (!eliminado) return next(new AppError("No existe el registro", 404));

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
