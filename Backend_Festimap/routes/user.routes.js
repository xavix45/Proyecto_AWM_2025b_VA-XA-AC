
const { usuariosController } = require('../controllers');
//app es el objeto de Express que se pasa desde server.js para definir rutas
module.exports = (app) => {
  app.post('/api/register', usuariosController.registrar);
  app.post('/api/login', usuariosController.login);
  app.put('/api/usuarios/:id', usuariosController.actualizar);
};
