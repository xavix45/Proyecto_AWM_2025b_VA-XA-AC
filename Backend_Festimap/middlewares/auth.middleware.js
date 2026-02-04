
const jwt = require("jsonwebtoken");
const { Usuario } = require("../models");

const CLAVE_SECRETA = "festimap_secret_2026"; // Misma que en el controlador

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
