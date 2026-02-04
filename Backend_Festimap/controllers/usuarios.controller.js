
const { Usuario } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { AppError } = require('../middlewares/errorHandler');

const CLAVE = "festimap_secret_2026";

module.exports.registrar = async (req, res, next) => {
  try {
    const { nombre, email, password, tipoViajero } = req.body;
    const existe = await Usuario.findOne({ email: email.toLowerCase() });
    if (existe) return next(new AppError("El correo ya está registrado en nuestra base", 400));

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
      mensaje: "Usuario indexado correctamente", 
      user: { id: nuevo._id, nombre: nuevo.nombre, email: nuevo.email }, 
      token 
    });
  } catch (error) {
    next(new AppError("Error fatal en el registro", 500, error));
  }
};

module.exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    // Usamos .populate('agenda') para que el Backend entregue la data completa de una vez
    const user = await Usuario.findOne({ email: email.toLowerCase() }).populate('agenda');
    
    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign({ id: user._id, email: user.email }, CLAVE, { expiresIn: '7d' });
      res.json({ 
        id: user._id, 
        nombre: user.nombre, 
        email: user.email, 
        rol: user.rol, 
        token, 
        preferencias: user.preferencias,
        agenda: user.agenda 
      });
    } else {
      next(new AppError("Credenciales denegadas por el servidor", 401));
    }
  } catch (error) {
    next(new AppError("Error de autenticación", 500, error));
  }
};

/**
 * ACTUALIZACIÓN INTELIGENTE (Agenda y Perfil)
 * Maneja la lógica de añadir/quitar de agenda mediante el servidor
 */
module.exports.actualizar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { toggleAgendaId, preferencias, nombre, email } = req.body;
    
    let updateOperation = {};

    // Lógica de Agenda: Si viene toggleAgendaId, el servidor decide si añadir o quitar
    if (toggleAgendaId) {
      const user = await Usuario.findById(id);
      const isPresent = user.agenda.includes(toggleAgendaId);
      const operator = isPresent ? '$pull' : '$addToSet';
      updateOperation[operator] = { agenda: toggleAgendaId };
    }

    // Lógica de Perfil y Preferencias
    if (preferencias) updateOperation.$set = { ...updateOperation.$set, preferencias };
    if (nombre) updateOperation.$set = { ...updateOperation.$set, nombre };
    if (email) updateOperation.$set = { ...updateOperation.$set, email: email.toLowerCase() };

    const actualizado = await Usuario.findByIdAndUpdate(
      id, 
      updateOperation,
      { new: true, runValidators: true }
    ).populate('agenda').select("-password");
    
    if (!actualizado) return next(new AppError("Usuario no encontrado", 404));
    
    console.log(`[LOG] Usuario ${actualizado.nombre} sincronizado con MongoDB`);
    res.json(actualizado);
  } catch (error) {
    next(new AppError("Error en la sincronización del perfil", 500, error));
  }
};
