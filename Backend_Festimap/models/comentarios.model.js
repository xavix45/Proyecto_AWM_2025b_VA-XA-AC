const mongoose = require('mongoose');

// Modelo independiente de Comentarios (opcional - si decides no usar comentarios embebidos en eventos)
const ComentarioSchema = new mongoose.Schema({
  eventoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Evento',
    required: true
  },
  usuarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  usuario: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comentario: {
    type: String,
    required: [true, "El comentario es obligatorio"],
    minlength: [5, "El comentario debe tener al menos 5 caracteres"]
  },
  aprobado: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Índice para búsquedas por evento
ComentarioSchema.index({ eventoId: 1, createdAt: -1 });

const Comentario = mongoose.model('Comentario', ComentarioSchema);

module.exports = Comentario;