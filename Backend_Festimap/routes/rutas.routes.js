const rutasController = require('../controllers/rutas.controller');
const { protectController } = require('../middlewares/auth.middleware');

module.exports = (app) => {
  app.post('/api/rutas/geocode', protectController, rutasController.geocode);
  app.post('/api/rutas/reverse', protectController, rutasController.reverse);
  app.post('/api/rutas/generar', protectController, rutasController.generarRuta);
};
