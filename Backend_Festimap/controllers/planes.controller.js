
const { Plan } = require('../models');
const { AppError } = require('../middlewares/errorHandler');

module.exports.crearPlan = async (req, res, next) => {
  try {
    const nuevoPlan = await Plan.create(req.body);
    const planPoblado = await Plan.findById(nuevoPlan._id)
      .populate('eventosIds', 'name fecha ciudad imagen precio');
    
    res.status(201).json({
      mensaje: "Plan de viaje creado exitosamente",
      plan: planPoblado
    });
  } catch (error) {
    next(new AppError("No se pudo crear el plan de viaje", 400, error));
  }
};

module.exports.obtenerPlanesPorUsuario = async (req, res, next) => {
  try {
    const planes = await Plan.find({ usuarioId: req.params.usuarioId })
      .populate('eventosIds', 'name fecha ciudad imagen precio')
      .sort({ createdAt: -1 });
    res.json(planes);
  } catch (error) {
    next(new AppError("Error al obtener tus planes", 500, error));
  }
};

module.exports.obtenerPlanPorId = async (req, res, next) => {
  try {
    const plan = await Plan.findById(req.params.id)
      .populate('eventosIds')
      .populate('usuarioId', 'nombre email');
    
    if (!plan) return next(new AppError("Plan no encontrado", 404));
    res.json(plan);
  } catch (error) {
    next(new AppError("Error al buscar el plan", 500, error));
  }
};

module.exports.eliminarPlan = async (req, res, next) => {
  try {
    const eliminado = await Plan.findByIdAndDelete(req.params.id);
    if (!eliminado) return next(new AppError("Plan no encontrado", 404));
    res.json({ mensaje: "Plan eliminado correctamente" });
  } catch (error) {
    next(new AppError("Error al eliminar el plan", 500, error));
  }
};
