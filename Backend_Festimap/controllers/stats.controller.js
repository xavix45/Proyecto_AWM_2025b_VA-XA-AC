
const { Evento, Plan, Usuario } = require('../models');
const { AppError } = require('../middlewares/errorHandler');

/**
 * JUSTIFICACIÓN TEÓRICA (PREGUNTA 3 - DOMINIO):
 * Utilizamos el Aggregation Framework de MongoDB. Esto es superior a realizar 
 * cálculos en el frontend porque el procesamiento ocurre directamente en el motor 
 * de la base de datos (B-Tree index support), reduciendo el ancho de banda 
 * y la carga computacional del dispositivo móvil.
 */
module.exports.obtenerMetricasGlobales = async (req, res, next) => {
  try {
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
