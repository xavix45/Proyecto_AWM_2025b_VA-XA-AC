class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

const errorHandler = (err, req, res, next) => {
  console.error("🔥 Error detectado:", err);

  if (err?.name === "ValidationError") {
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
