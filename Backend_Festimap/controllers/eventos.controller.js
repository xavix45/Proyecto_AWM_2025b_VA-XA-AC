
const { Evento } = require('../models');
const { AppError } = require('../middlewares/errorHandler');

/**
 * MOTOR DE EVENTOS - LÓGICA DE NEGOCIO CENTRALIZADA
 */
module.exports.obtenerEventos = async (req, res, next) => {
  try {
    const { categoria, region, search, status } = req.query;
    let query = {};

    // El Backend ahora filtra dinámicamente para ahorrar carga al celular
    if (categoria && categoria !== 'Todas') query.categoria = categoria;
    if (region) query.region = region;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { ciudad: { $regex: search, $options: 'i' } }
      ];
    }

    const eventos = await Evento.find(query).sort({ fecha: 1 });
    
    // El Backend incrementa el contador de 'visitas' cada vez que se consultan los eventos
    // Esto genera datos para el Analytics Engine
    await Evento.updateMany(query, { $inc: { visitas: 1 } });

    res.json(eventos);
  } catch (error) {
    next(new AppError("Error en el motor de eventos del servidor", 500, error));
  }
};

module.exports.crearEvento = async (req, res, next) => {
  try {
    // El servidor valida la integridad de los datos antes de persistir
    const nuevo = await Evento.create(req.body);
    console.log(`[LOG] Evento creado: ${nuevo.name} por Admin`);
    res.status(201).json(nuevo);
  } catch (error) {
    next(new AppError("Fallo en la creación: El esquema de MongoDB rechazó los datos", 400, error));
  }
};

module.exports.obtenerEventoPorId = async (req, res, next) => {
  try {
    const evento = await Evento.findById(req.params.id);
    if (!evento) return next(new AppError("ID inexistente en el inventario", 404));
    res.json(evento);
  } catch (error) {
    next(new AppError("Error al recuperar el documento", 500, error));
  }
};

module.exports.actualizarEvento = async (req, res, next) => {
  try {
    const actualizado = await Evento.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    if (!actualizado) return next(new AppError("No se encontró para actualizar", 404));
    res.json(actualizado);
  } catch (error) {
    next(new AppError("Error de validación en la actualización", 400, error));
  }
};

module.exports.eliminarEvento = async (req, res, next) => {
  try {
    const eliminado = await Evento.findByIdAndDelete(req.params.id);
    if (!eliminado) return next(new AppError("Evento no encontrado", 404));
    res.json({ mensaje: "Registro eliminado permanentemente del patrimonio" });
  } catch (error) {
    next(new AppError("Error en el borrado físico", 500, error));
  }
};

module.exports.agregarComentario = async (req, res, next) => {
  try {
    const evento = await Evento.findById(req.params.id);
    if (!evento) return next(new AppError("Evento inexistente", 404));

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
    next(new AppError("Error al procesar la opinión en el servidor", 500, error));
  }
};
