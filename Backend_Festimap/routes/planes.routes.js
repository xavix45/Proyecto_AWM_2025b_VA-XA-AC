
// Controladores de planes de viaje
const { planesController } = require('../controllers');
// Middleware de autenticación (requiere token)
const { protectController } = require('../middlewares/auth.middleware');

module.exports = (app) => {
  // Listar planes por usuario (GET /api/planes/usuario/:usuarioId)
  app.get('/api/planes/usuario/:usuarioId', protectController, planesController.obtenerPlanesPorUsuario);
  // Obtener un plan por ID (GET /api/planes/:id)
  app.get('/api/planes/:id', protectController, planesController.obtenerPlanPorId);
  // Crear plan (POST /api/planes)
  app.post('/api/planes', protectController, planesController.crearPlan);
  // Eliminar plan (DELETE /api/planes/:id)
  app.delete('/api/planes/:id', protectController, planesController.eliminarPlan);
};
