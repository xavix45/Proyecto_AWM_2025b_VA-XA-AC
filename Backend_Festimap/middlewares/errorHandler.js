class AppError extends Error { //hereda de Error
  constructor(message, statusCode = 500, details = null) {
    super(message);// viene de la clase Error
    this.statusCode = statusCode; //inicializa el código de estado HTTP
    this.details = details; //inicializa detalles adicionales del error
  }
}
//middleware de manejo de errores, funcion anónima con 4 parámetros
const errorHandler = (err, req, res, next) => { 
  console.error("🔥 Error detectado:", err);

  if (err?.name === "ValidationError") {
    //extrae mensajes de error de cada validación de Mongoose
    const errors = Object.values(err.errors).map((e) => e.message);
    return res
      .status(400)
      .json({ mensaje: "Datos inválidos", errores: errors });
  }

  if (err?.name === "CastError") {
    return res
      .status(400)
      .json({ mensaje: "ID inválido o recurso no encontrado" });
  }

  return res.status(err.statusCode || 500).json({
    mensaje: err.message || "Error interno del servidor",
    detalles: err.details,
  });
};

module.exports = { AppError, errorHandler };
