const express = require("express");
const app = express();
const puerto = 8000;

require("./config/mongoose.config");

app.use(express.json());
//para trabajo con forms tradcionales 
app.use(express.urlencoded({ extended: true }));

app.listen(puerto, () => {
  console.log("Servidor de FestiMap escuchando en puerto ", puerto);
});
