
const { Usuario } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { AppError } = require('../middlewares/errorHandler');

const CLAVE = "festimap_secret_2026";

module.exports.registrar = async (req, res, next) => {
  try {
    const { nombre, email, password, tipoViajero } = req.body;
    const existe = await Usuario.findOne({ email: email.toLowerCase() });
    if (existe) return next(new AppError("El correo ya está registrado", 400));

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const nuevo = await Usuario.create({
      nombre, 
      email: email.toLowerCase(), 
      password: hashedPassword, 
      tipoViajero 
    });

    const token = jwt.sign({ id: nuevo._id }, CLAVE, { expiresIn: '7d' });
    res.status(201).json({ 
      mensaje: "Registro exitoso", 
      user: { id: nuevo._id, nombre: nuevo.nombre, email: nuevo.email }, 
      token 
    });
  } catch (error) {
    next(new AppError("Error en el registro", 500, error));
  }
};

module.exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await Usuario.findOne({ email: email.toLowerCase() });
    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign({ id: user._id }, CLAVE, { expiresIn: '7d' });
      res.json({ id: user._id, nombre: user.nombre, email: user.email, rol: user.rol, token });
    } else {
      next(new AppError("Credenciales inválidas", 401));
    }
  } catch (error) {
    next(new AppError("Error en el login", 500, error));
  }
};
