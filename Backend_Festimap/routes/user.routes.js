
const { usuariosController } = require('../controllers');

module.exports = (app) => {
  app.post('/api/register', usuariosController.registrar);
  app.post('/api/login', usuariosController.login);
  app.put('/api/usuarios/:id', usuariosController.actualizar);
};
