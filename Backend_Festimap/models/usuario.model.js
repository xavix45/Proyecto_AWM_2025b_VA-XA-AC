
const mongoose = require('mongoose');

const UsuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: [true, "El nombre es obligatorio"], minlength: [3, "Mínimo 3 caracteres"] },
  email: { 
    type: String, 
    required: [true, "El email es obligatorio"], 
    unique: true, 
    lowercase: true,
    match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, "Email no válido"]
  },
  password: { type: String, required: [true, "La contraseña es obligatoria"], minlength: [8, "Mínimo 8 caracteres"] },
  tipoViajero: { type: String, enum: ['turista', 'estudiante', 'administrador'], default: 'turista' },
  rol: { type: String, enum: ['user', 'admin'], default: 'user' },
  agenda: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Evento' }],
  preferencias: {
    provincia: { type: String, default: '' },
    categorias: [String]
  }
}, { timestamps: true });

// El tercer parámetro 'usuarios' es CLAVE: obliga a conectar con la colección de tu captura
module.exports = mongoose.model('Usuario', UsuarioSchema, 'usuarios');
