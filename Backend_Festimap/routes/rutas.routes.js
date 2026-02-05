// Controlador de rutas (geocode, reverse, generar)
const rutasController = require('../controllers/rutas.controller');
// Middleware de autenticación (requiere token)
const { protectController } = require('../middlewares/auth.middleware');

module.exports = (app) => {
  // Ciudad -> coordenadas (POST /api/rutas/geocode)
  app.post('/api/rutas/geocode', protectController, rutasController.geocode);
  // Coordenadas -> ciudad (POST /api/rutas/reverse)
  app.post('/api/rutas/reverse', protectController, rutasController.reverse);
  // Generar ruta + buffer + sugerencias (POST /api/rutas/generar)
  app.post('/api/rutas/generar', protectController, rutasController.generarRuta);
};
