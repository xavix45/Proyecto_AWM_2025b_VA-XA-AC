const Usuario = require('../models/usuario.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Secret para JWT (en producción debe estar en variables de entorno)
const JWT_SECRET = process.env.JWT_SECRET || 'festimap_secret_key_2026';

// Registrar nuevo usuario
const registrarUsuario = async (req, res) => {
  try {
    const { nombre, email, contra, tipoViajero } = req.body;
    
    // Verificar si el email ya existe
    const usuarioExistente = await Usuario.findOne({ email: email.toLowerCase() });
    
    if (usuarioExistente) {
      return res.status(400).json({ message: "El email ya está registrado" });
    }
    
    // Hashear contraseña
    const salt = await bcrypt.genSalt(10);
    const contraHasheada = await bcrypt.hash(contra, salt);
    
    // Determinar rol (admin si el email es admin@epn.edu.ec)
    const rol = email.toLowerCase() === 'admin@epn.edu.ec' ? 'admin' : 'user';
    
    // Crear nuevo usuario
    const nuevoUsuario = new Usuario({
      nombre,
      email: email.toLowerCase(),
      contra: contraHasheada,
      tipoViajero: tipoViajero || 'turista',
      rol,
      agenda: [],
      preferencias: { provincia: '', categorias: [] }
    });
    
    const usuarioGuardado = await nuevoUsuario.save();
    
    // Generar token JWT
    const token = jwt.sign(
      { id: usuarioGuardado._id, email: usuarioGuardado.email, rol: usuarioGuardado.rol },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Ocultar contraseña en respuesta
    const usuarioRespuesta = usuarioGuardado.toObject();
    delete usuarioRespuesta.contra;
    
    res.status(201).json({
      message: "Usuario registrado exitosamente",
      usuario: usuarioRespuesta,
      token
    });
  } catch (error) {
    console.error("Error al registrar usuario:", error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: "Error de validación", 
        errors: Object.values(error.errors).map(e => e.message)
      });
    }
    
    res.status(500).json({ message: "Error al registrar usuario", error: error.message });
  }
};

// Login de usuario
const loginUsuario = async (req, res) => {
  try {
    const { email, contra } = req.body;
    
    if (!email || !contra) {
      return res.status(400).json({ message: "Email y contraseña son requeridos" });
    }
    
    // Buscar usuario por email
    const usuario = await Usuario.findOne({ email: email.toLowerCase() });
    
    if (!usuario) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }
    
    // Comparar contraseña
    const contraValida = await bcrypt.compare(contra, usuario.contra);
    
    if (!contraValida) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }
    
    // Actualizar último acceso
    usuario.ultimoAcceso = new Date();
    await usuario.save();
    
    // Generar token JWT
    const token = jwt.sign(
      { id: usuario._id, email: usuario.email, rol: usuario.rol },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Ocultar contraseña en respuesta
    const usuarioRespuesta = usuario.toObject();
    delete usuarioRespuesta.contra;
    
    res.status(200).json({
      message: "Login exitoso",
      usuario: usuarioRespuesta,
      token
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ message: "Error en login", error: error.message });
  }
};

// Obtener todos los usuarios (para búsqueda en login - compatible con app actual)
const obtenerUsuarios = async (req, res) => {
  try {
    const { email } = req.query;
    
    let filtros = {};
    if (email) filtros.email = email.toLowerCase();
    
    const usuarios = await Usuario.find(filtros).select('-contra');
    
    res.status(200).json(usuarios);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ message: "Error al obtener usuarios", error: error.message });
  }
};

// Obtener usuario por ID
const obtenerUsuarioPorId = async (req, res) => {
  try {
    const { id } = req.params;
    
    const usuario = await Usuario.findById(id)
      .select('-contra')
      .populate('agenda', 'name fecha ciudad imagen');
    
    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    
    res.status(200).json(usuario);
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    res.status(500).json({ message: "Error al obtener usuario", error: error.message });
  }
};

// Actualizar perfil de usuario
const actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, contra, tipoViajero, preferencias } = req.body;
    
    const usuario = await Usuario.findById(id);
    
    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    
    // Actualizar campos permitidos
    if (nombre) usuario.nombre = nombre;
    if (email) usuario.email = email.toLowerCase();
    if (tipoViajero) usuario.tipoViajero = tipoViajero;
    if (preferencias) usuario.preferencias = preferencias;
    
    // Si se actualiza la contraseña, hashearla
    if (contra) {
      const salt = await bcrypt.genSalt(10);
      usuario.contra = await bcrypt.hash(contra, salt);
    }
    
    const usuarioActualizado = await usuario.save();
    
    // Ocultar contraseña
    const usuarioRespuesta = usuarioActualizado.toObject();
    delete usuarioRespuesta.contra;
    
    res.status(200).json({
      message: "Usuario actualizado exitosamente",
      usuario: usuarioRespuesta
    });
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    res.status(500).json({ message: "Error al actualizar usuario", error: error.message });
  }
};

// Agregar evento a la agenda del usuario
const agregarEventoAgenda = async (req, res) => {
  try {
    const { id } = req.params;
    const { eventoId } = req.body;
    
    const usuario = await Usuario.findById(id);
    
    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    
    // Verificar si el evento ya está en la agenda
    if (usuario.agenda.includes(eventoId)) {
      return res.status(400).json({ message: "El evento ya está en la agenda" });
    }
    
    usuario.agenda.push(eventoId);
    await usuario.save();
    
    const usuarioActualizado = await Usuario.findById(id)
      .select('-contra')
      .populate('agenda', 'name fecha ciudad imagen');
    
    res.status(200).json({
      message: "Evento agregado a la agenda",
      usuario: usuarioActualizado
    });
  } catch (error) {
    console.error("Error al agregar evento a agenda:", error);
    res.status(500).json({ message: "Error al agregar evento", error: error.message });
  }
};

// Quitar evento de la agenda del usuario
const quitarEventoAgenda = async (req, res) => {
  try {
    const { id, eventoId } = req.params;
    
    const usuario = await Usuario.findById(id);
    
    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    
    usuario.agenda = usuario.agenda.filter(e => e.toString() !== eventoId);
    await usuario.save();
    
    const usuarioActualizado = await Usuario.findById(id)
      .select('-contra')
      .populate('agenda', 'name fecha ciudad imagen');
    
    res.status(200).json({
      message: "Evento eliminado de la agenda",
      usuario: usuarioActualizado
    });
  } catch (error) {
    console.error("Error al quitar evento de agenda:", error);
    res.status(500).json({ message: "Error al quitar evento", error: error.message });
  }
};

// Eliminar usuario
const eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    
    const usuarioEliminado = await Usuario.findByIdAndDelete(id);
    
    if (!usuarioEliminado) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    
    res.status(200).json({
      message: "Usuario eliminado exitosamente"
    });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    res.status(500).json({ message: "Error al eliminar usuario", error: error.message });
  }
};

module.exports = {
  registrarUsuario,
  loginUsuario,
  obtenerUsuarios,
  obtenerUsuarioPorId,
  actualizarUsuario,
  agregarEventoAgenda,
  quitarEventoAgenda,
  eliminarUsuario
};
