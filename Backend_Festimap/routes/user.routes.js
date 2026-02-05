
// Controladores de usuarios (auth y perfil)
const { usuariosController } = require('../controllers');
// app es el objeto de Express que se pasa desde server.js para definir rutas
module.exports = (app) => {
  // Registro de usuario (POST /api/register)
  app.post('/api/register', usuariosController.registrar);
  // Login y entrega de token (POST /api/login)
  app.post('/api/login', usuariosController.login);
  // Actualizar perfil de usuario (PUT /api/usuarios/:id)
  app.put('/api/usuarios/:id', usuariosController.actualizar);
};
