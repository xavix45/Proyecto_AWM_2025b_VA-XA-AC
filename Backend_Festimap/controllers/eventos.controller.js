const Evento = require('../models/eventos.model');

// Obtener todos los eventos con filtros opcionales
const obtenerEventos = async (req, res) => {
  try {
    const { categoria, region, ciudad, provincia, tipo, status } = req.query;
    
    let filtros = {};
    
    if (categoria) filtros.categoria = categoria;
    if (region) filtros.region = region;
    if (ciudad) filtros.ciudad = ciudad;
    if (provincia) filtros.provincia = provincia;
    if (tipo) filtros.tipo = tipo;
    if (status) filtros.status = status;
    
    const eventos = await Evento.find(filtros).sort({ fecha: 1 });
    
    res.status(200).json(eventos);
  } catch (error) {
    console.error("Error al obtener eventos:", error);
    res.status(500).json({ message: "Error al obtener eventos", error: error.message });
  }
};

// Obtener un evento por ID
const obtenerEventoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    
    const evento = await Evento.findById(id);
    
    if (!evento) {
      return res.status(404).json({ message: "Evento no encontrado" });
    }
    
    res.status(200).json(evento);
  } catch (error) {
    console.error("Error al obtener evento:", error);
    res.status(500).json({ message: "Error al obtener evento", error: error.message });
  }
};

// Crear un nuevo evento (solo admin)
const crearEvento = async (req, res) => {
  try {
    const nuevoEvento = new Evento(req.body);
    
    const eventoGuardado = await nuevoEvento.save();
    
    res.status(201).json({
      message: "Evento creado exitosamente",
      evento: eventoGuardado
    });
  } catch (error) {
    console.error("Error al crear evento:", error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: "Error de validación", 
        errors: Object.values(error.errors).map(e => e.message)
      });
    }
    
    res.status(500).json({ message: "Error al crear evento", error: error.message });
  }
};

// Actualizar un evento (solo admin)
const actualizarEvento = async (req, res) => {
  try {
    const { id } = req.params;
    
    const eventoActualizado = await Evento.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!eventoActualizado) {
      return res.status(404).json({ message: "Evento no encontrado" });
    }
    
    res.status(200).json({
      message: "Evento actualizado exitosamente",
      evento: eventoActualizado
    });
  } catch (error) {
    console.error("Error al actualizar evento:", error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: "Error de validación", 
        errors: Object.values(error.errors).map(e => e.message)
      });
    }
    
    res.status(500).json({ message: "Error al actualizar evento", error: error.message });
  }
};

// Eliminar un evento (solo admin)
const eliminarEvento = async (req, res) => {
  try {
    const { id } = req.params;
    
    const eventoEliminado = await Evento.findByIdAndDelete(id);
    
    if (!eventoEliminado) {
      return res.status(404).json({ message: "Evento no encontrado" });
    }
    
    res.status(200).json({
      message: "Evento eliminado exitosamente",
      evento: eventoEliminado
    });
  } catch (error) {
    console.error("Error al eliminar evento:", error);
    res.status(500).json({ message: "Error al eliminar evento", error: error.message });
  }
};

// Agregar comentario a un evento
const agregarComentario = async (req, res) => {
  try {
    const { id } = req.params;
    const { usuario, rating, comentario } = req.body;
    
    const evento = await Evento.findById(id);
    
    if (!evento) {
      return res.status(404).json({ message: "Evento no encontrado" });
    }
    
    if (!evento.allowComments) {
      return res.status(403).json({ message: "Este evento no permite comentarios" });
    }
    
    const nuevoComentario = {
      id: Date.now(),
      usuario,
      rating,
      comentario,
      fecha: new Date().toISOString().split('T')[0]
    };
    
    evento.comentarios.push(nuevoComentario);
    await evento.save();
    
    res.status(201).json({
      message: "Comentario agregado exitosamente",
      comentario: nuevoComentario
    });
  } catch (error) {
    console.error("Error al agregar comentario:", error);
    res.status(500).json({ message: "Error al agregar comentario", error: error.message });
  }
};

// Buscar eventos por texto (búsqueda en nombre, descripción, tags)
const buscarEventos = async (req, res) => {
  try {
    const { texto } = req.query;
    
    if (!texto) {
      return res.status(400).json({ message: "Debe proporcionar un texto de búsqueda" });
    }
    
    const eventos = await Evento.find({
      $or: [
        { name: { $regex: texto, $options: 'i' } },
        { descripcion: { $regex: texto, $options: 'i' } },
        { tags: { $regex: texto, $options: 'i' } },
        { ciudad: { $regex: texto, $options: 'i' } }
      ]
    });
    
    res.status(200).json(eventos);
  } catch (error) {
    console.error("Error al buscar eventos:", error);
    res.status(500).json({ message: "Error al buscar eventos", error: error.message });
  }
};

// Obtener eventos por rango de fechas
const obtenerEventosPorFechas = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    
    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({ message: "Debe proporcionar fechaInicio y fechaFin" });
    }
    
    const eventos = await Evento.find({
      fecha: { $gte: fechaInicio, $lte: fechaFin }
    }).sort({ fecha: 1 });
    
    res.status(200).json(eventos);
  } catch (error) {
    console.error("Error al obtener eventos por fechas:", error);
    res.status(500).json({ message: "Error al obtener eventos", error: error.message });
  }
};

module.exports = {
  obtenerEventos,
  obtenerEventoPorId,
  crearEvento,
  actualizarEvento,
  eliminarEvento,
  agregarComentario,
  buscarEventos,
  obtenerEventosPorFechas
};
