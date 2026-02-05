
const { eventosController } = require("../controllers");
const statsController = require("../controllers/stats.controller");
const { Log } = require("../models");
const { protectAdmin, protectController } = require("../middlewares/auth.middleware");

module.exports = (app) => {
  // ============================================================
  // RUTAS DE ADMIN - PROTEGIDAS CON JWT
  // Solo usuarios autenticados con role="admin" pueden acceder
  // ============================================================
  
  // Analítica y Auditoría (Solo Admin)
  app.get("/api/admin/stats/global", protectAdmin, statsController.obtenerMetricasGlobales);
  app.get("/api/admin/logs", protectAdmin, async (req, res) => {
    const logs = await Log.find().sort({ fecha: -1 }).limit(10);
    res.json(logs);
  });

  // ============================================================
  // RUTAS PÚBLICAS - SIN PROTECCIÓN
  // Cualquiera puede consultar eventos
  // ============================================================
  app.get("/api/eventos", eventosController.obtenerEventos);
  app.get("/api/eventos/:id", eventosController.obtenerEventoPorId);

  // ============================================================
  // RUTAS DE MODIFICACIÓN - PROTEGIDAS CON JWT + ADMIN
  // Solo administradores autenticados pueden crear/editar/eliminar
  // ============================================================
  app.post("/api/eventos", protectAdmin, eventosController.crearEvento);
  app.put("/api/eventos/:id", protectAdmin, eventosController.actualizarEvento);
  app.delete("/api/eventos/:id", protectAdmin, eventosController.eliminarEvento);

  // Comentarios (Usuarios normales autenticados pueden comentar)
  app.post("/api/eventos/:id/comentarios", protectController, eventosController.agregarComentario);
};
