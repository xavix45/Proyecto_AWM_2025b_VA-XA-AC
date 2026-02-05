
const express = require("express");
const cors = require("cors");
const app = express();
const puerto = 8000;

// Configuración Base de Datos
require("./config/mongoose.config");

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas (Asegúrate que los nombres de archivos en routes/ coincidan)
require("./routes/evento.routes")(app);
require("./routes/user.routes")(app);
require("./routes/planes.routes")(app);
require("./routes/rutas.routes")(app);

// Manejo de errores (Siempre al final)
const { errorHandler } = require("./middlewares/errorHandler");
app.use(errorHandler);

app.listen(puerto, () => {
  console.log(`-------------------------------------------`);
  console.log(`🚀 SERVIDOR FESTIMAP ACTIVO`);
  console.log(`📡 Puerto: ${puerto}`);
  console.log(`-------------------------------------------`);
});
