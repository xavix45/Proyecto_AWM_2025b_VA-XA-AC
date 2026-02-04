const mongoose = require('mongoose');

// Schema de preferencias del usuario
const PreferenciasSchema = new mongoose.Schema({
  provincia: {
    type: String,
    default: ''
  },
  categorias: [{
    type: String
  }]
}, { _id: false });

// Schema principal de Usuario
const UsuarioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, "El nombre es obligatorio"],
    minlength: [3, "El nombre debe tener al menos 3 caracteres"]
  },
  email: {
    type: String,
    required: [true, "El email es obligatorio"],
    unique: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
      },
      message: "Email no válido"
    }
  },
  contra: {
    type: String,
    required: [true, "La contraseña es obligatoria"],
    minlength: [8, "La contraseña debe tener al menos 8 caracteres"]
  },
  tipoViajero: {
    type: String,
    required: true,
    enum: ['turista', 'estudiante', 'administrador'],
    default: 'turista'
  },
  rol: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  agenda: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Evento'
  }],
  preferencias: {
    type: PreferenciasSchema,
    default: { provincia: '', categorias: [] }
  },
  ultimoAcceso: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const Usuario = mongoose.model('Usuario', UsuarioSchema);

module.exports = Usuario;