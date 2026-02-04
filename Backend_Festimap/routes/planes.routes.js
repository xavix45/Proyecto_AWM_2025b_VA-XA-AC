
const { planesController } = require('../controllers');
const { protectController } = require('../middlewares/auth.middleware');

module.exports = (app) => {
  app.get('/api/planes/usuario/:usuarioId', protectController, planesController.obtenerPlanesPorUsuario);
  app.get('/api/planes/:id', protectController, planesController.obtenerPlanPorId);
  app.post('/api/planes', protectController, planesController.crearPlan);
  app.delete('/api/planes/:id', protectController, planesController.eliminarPlan);
};
