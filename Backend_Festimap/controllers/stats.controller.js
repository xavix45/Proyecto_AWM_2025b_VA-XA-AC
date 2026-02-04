
const { Evento, Plan, Usuario } = require('../models');
const { AppError } = require('../middlewares/errorHandler');

module.exports.obtenerMetricasGlobales = async (req, res, next) => {
  try {
    // Pipeline de MongoDB: Procesa miles de registros en milisegundos
    const stats = await Evento.aggregate([
      {
        $group: {
          _id: null,
          totalVisitas: { $sum: "$visitas" },
          totalAsistencias: { $sum: "$asistencias" },
          totalEventos: { $count: {} },
          promedioRating: { $avg: { $avg: "$comentarios.rating" } }
        }
      }
    ]);

    const regional = await Evento.aggregate([
      { $group: { _id: "$region", count: { $sum: 1 } } },
      { $project: { reg: "$_id", count: 1, _id: 0 } }
    ]);

    res.json({
      serverVerified: true,
      global: stats[0] || { totalVisitas: 0, totalAsistencias: 0, totalEventos: 0 },
      regional,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(new AppError("Error en el Analytics Engine del Servidor", 500, error));
  }
};
