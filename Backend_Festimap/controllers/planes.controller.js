const Plan = require('../models/planes.model');

// Crear un nuevo plan de viaje
const crearPlan = async (req, res) => {
  try {
    const { 
      usuarioId, 
      nombrePlan, 
      origen, 
      destino, 
      fechaInicio, 
      dias, 
      radio, 
      itinerario, 
      eventosIds, 
      geoData 
    } = req.body;
    
    const nuevoPlan = new Plan({
      usuarioId,
      nombrePlan,
      origen,
      destino,
      fechaInicio,
      dias,
      radio,
      itinerario: itinerario || {},
      eventosIds: eventosIds || [],
      geoData
    });
    
    const planGuardado = await nuevoPlan.save();
    
    // Poblar con información de eventos
    const planCompleto = await Plan.findById(planGuardado._id)
      .populate('eventosIds', 'name fecha ciudad imagen precio');
    
    res.status(201).json({
      message: "Plan de viaje creado exitosamente",
      plan: planCompleto
    });
  } catch (error) {
    console.error("Error al crear plan:", error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: "Error de validación", 
        errors: Object.values(error.errors).map(e => e.message)
      });
    }
    
    res.status(500).json({ message: "Error al crear plan", error: error.message });
  }
};

// Obtener todos los planes de un usuario
const obtenerPlanesPorUsuario = async (req, res) => {
  try {
    const { usuarioId } = req.params;
    
    const planes = await Plan.find({ usuarioId })
      .populate('eventosIds', 'name fecha ciudad imagen precio')
      .sort({ createdAt: -1 });
    
    res.status(200).json(planes);
  } catch (error) {
    console.error("Error al obtener planes:", error);
    res.status(500).json({ message: "Error al obtener planes", error: error.message });
  }
};

// Obtener un plan por ID
const obtenerPlanPorId = async (req, res) => {
  try {
    const { id } = req.params;
    
    const plan = await Plan.findById(id)
      .populate('eventosIds', 'name descripcion fecha ciudad lugar imagen precio lat lng')
      .populate('usuarioId', 'nombre email');
    
    if (!plan) {
      return res.status(404).json({ message: "Plan no encontrado" });
    }
    
    res.status(200).json(plan);
  } catch (error) {
    console.error("Error al obtener plan:", error);
    res.status(500).json({ message: "Error al obtener plan", error: error.message });
  }
};

// Actualizar un plan
const actualizarPlan = async (req, res) => {
  try {
    const { id } = req.params;
    
    const planActualizado = await Plan.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    ).populate('eventosIds', 'name fecha ciudad imagen precio');
    
    if (!planActualizado) {
      return res.status(404).json({ message: "Plan no encontrado" });
    }
    
    res.status(200).json({
      message: "Plan actualizado exitosamente",
      plan: planActualizado
    });
  } catch (error) {
    console.error("Error al actualizar plan:", error);
    res.status(500).json({ message: "Error al actualizar plan", error: error.message });
  }
};

// Eliminar un plan
const eliminarPlan = async (req, res) => {
  try {
    const { id } = req.params;
    
    const planEliminado = await Plan.findByIdAndDelete(id);
    
    if (!planEliminado) {
      return res.status(404).json({ message: "Plan no encontrado" });
    }
    
    res.status(200).json({
      message: "Plan eliminado exitosamente",
      plan: planEliminado
    });
  } catch (error) {
    console.error("Error al eliminar plan:", error);
    res.status(500).json({ message: "Error al eliminar plan", error: error.message });
  }
};

// Agregar evento al itinerario de un plan
const agregarEventoAlPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { dia, eventoId } = req.body;
    
    const plan = await Plan.findById(id);
    
    if (!plan) {
      return res.status(404).json({ message: "Plan no encontrado" });
    }
    
    // Agregar evento al día específico
    if (!plan.itinerario.has(dia)) {
      plan.itinerario.set(dia, []);
    }
    
    const eventosDelDia = plan.itinerario.get(dia);
    if (!eventosDelDia.includes(eventoId)) {
      eventosDelDia.push(eventoId);
      plan.itinerario.set(dia, eventosDelDia);
    }
    
    // Agregar a la lista general de eventos si no existe
    if (!plan.eventosIds.includes(eventoId)) {
      plan.eventosIds.push(eventoId);
    }
    
    await plan.save();
    
    const planActualizado = await Plan.findById(id)
      .populate('eventosIds', 'name fecha ciudad imagen precio');
    
    res.status(200).json({
      message: "Evento agregado al plan",
      plan: planActualizado
    });
  } catch (error) {
    console.error("Error al agregar evento al plan:", error);
    res.status(500).json({ message: "Error al agregar evento", error: error.message });
  }
};

// Obtener todos los planes (admin)
const obtenerTodosLosPlanes = async (req, res) => {
  try {
    const planes = await Plan.find()
      .populate('usuarioId', 'nombre email')
      .populate('eventosIds', 'name fecha ciudad')
      .sort({ createdAt: -1 });
    
    res.status(200).json(planes);
  } catch (error) {
    console.error("Error al obtener planes:", error);
    res.status(500).json({ message: "Error al obtener planes", error: error.message });
  }
};

module.exports = {
  crearPlan,
  obtenerPlanesPorUsuario,
  obtenerPlanPorId,
  actualizarPlan,
  eliminarPlan,
  agregarEventoAlPlan,
  obtenerTodosLosPlanes
};
