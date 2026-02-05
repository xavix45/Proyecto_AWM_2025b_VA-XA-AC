
// Importa Express (framework backend)
const express = require("express");
// Importa CORS (permite llamadas desde el frontend)
const cors = require("cors");
// Crea la app de Express
const app = express();
// Puerto donde corre el servidor
const puerto = 8000;

// Configuración Base de Datos (conexión MongoDB)
require("./config/mongoose.config");

// Middlewares globales
app.use(cors()); // Permite solicitudes desde otras IPs (Expo / Postman)
app.use(express.json()); // Permite leer JSON en el body
app.use(express.urlencoded({ extended: true })); // Permite leer form-data/urlencoded

// Rutas del backend (ENDPOINTS)
require("./routes/evento.routes")(app); // eventos (CRUD + comentarios)
require("./routes/user.routes")(app); // login / register / usuarios
require("./routes/planes.routes")(app); // planes de viaje
require("./routes/rutas.routes")(app); // rutas (geocode / reverse / generar)

// Manejo de errores (Siempre al final)
const { errorHandler } = require("./middlewares/errorHandler");
app.use(errorHandler); // Captura errores y responde con mensaje controlado

// Inicia servidor
app.listen(puerto, () => {
  console.log(`-------------------------------------------`);
  console.log(`🚀 SERVIDOR FESTIMAP ACTIVO`);
  console.log(`📡 Puerto: ${puerto}`);
  console.log(`-------------------------------------------`);
});
