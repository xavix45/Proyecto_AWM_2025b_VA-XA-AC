
const { eventosController } = require("../controllers");
const statsController = require("../controllers/stats.controller");
const { Log } = require("../models");

module.exports = (app) => {
  // Rutas de Analítica y Auditoría
  app.get("/api/admin/stats/global", statsController.obtenerMetricasGlobales);
  
  app.get("/api/admin/logs", async (req, res) => {
    const logs = await Log.find().sort({ fecha: -1 }).limit(10);
    res.json(logs);
  });

  // Rutas Estándar
  app.get("/api/eventos", eventosController.obtenerEventos);
  app.get("/api/eventos/:id", eventosController.obtenerEventoPorId);
  app.post("/api/eventos", eventosController.crearEvento);
  app.put("/api/eventos/:id", eventosController.actualizarEvento);
  app.delete("/api/eventos/:id", eventosController.eliminarEvento);
  app.post("/api/eventos/:id/comentarios", eventosController.agregarComentario);
};
