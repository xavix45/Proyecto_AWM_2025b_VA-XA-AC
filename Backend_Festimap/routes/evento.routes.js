
const { eventosController } = require("../controllers");

module.exports = (app) => {
    // Rutas de Analítica (Nuevas)
  app.get("/api/admin/stats/global", statsController.obtenerMetricasGlobales);
 // Rutas Estándar
    app.get("/api/eventos", eventosController.obtenerEventos);
  app.get("/api/eventos/:id", eventosController.obtenerEventoPorId);
  app.post("/api/eventos", eventosController.crearEvento);
  app.put("/api/eventos/:id", eventosController.actualizarEvento);
  app.delete("/api/eventos/:id", eventosController.eliminarEvento);
  app.post("/api/eventos/:id/comentarios", eventosController.agregarComentario);
};
