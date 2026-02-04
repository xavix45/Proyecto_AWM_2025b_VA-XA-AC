// Exportación centralizada de todos los controladores
const eventosController = require('./eventos.controller');
const usuariosController = require('./usuarios.controller');
const planesController = require('./planes.controller');

module.exports = {
  eventosController,
  usuariosController,
  planesController
};
