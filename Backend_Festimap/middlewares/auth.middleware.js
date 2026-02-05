
const jwt = require("jsonwebtoken");
const { Usuario } = require("../models");

const CLAVE_SECRETA = "festimap_secret_2026"; // Misma que en el controlador

// MIDDLEWARE 1: Verificar que el usuario esté autenticado (tiene token válido)
module.exports.protectController = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, CLAVE_SECRETA);

      req.user = await Usuario.findById(decoded.id).select("-password");
      next();
    } catch (error) {
      return res.status(401).json({ message: "No autorizado, token fallido" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "No autorizado, falta el token" });
  }
};

// MIDDLEWARE 2: Verificar que el usuario sea ADMINISTRADOR
// Uso: app.post("/api/eventos", protectAdmin, crearEvento)
// Solo usuarios con rol: "admin" pueden crear/editar/eliminar eventos
module.exports.protectAdmin = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, CLAVE_SECRETA);

      req.user = await Usuario.findById(decoded.id).select("-password");
      
      // VERIFICACIÓN CRÍTICA: ¿El usuario es admin?
      if (req.user.rol !== "admin") {
        return res.status(403).json({ 
          message: "❌ ACCESO DENEGADO: Solo administradores pueden realizar esta acción",
          requiredRole: "admin",
          userRole: req.user.rol
        });
      }
      
      next();
    } catch (error) {
      return res.status(401).json({ message: "No autorizado, token fallido" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "No autorizado, falta el token" });
  }
};
