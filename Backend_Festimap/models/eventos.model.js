const mongoose = require('mongoose');

// Schema para los comentarios dentro de eventos
const ComentarioSchema = new mongoose.Schema({
  id: {
    type: Number,
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
    required: true
  },
  fecha: {
    type: String,
    required: true
  }
}, { _id: false });

// Schema principal de Eventos
const EventoSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "El nombre del evento es obligatorio"],
    minlength: [3, "El nombre debe tener al menos 3 caracteres"]
  },
  descripcion: {
    type: String,
    required: [true, "La descripción es obligatoria"]
  },
  categoria: {
    type: String,
    required: true,
    enum: ['Cultural', 'Musical', 'Entretenimiento', 'Educativo', 'Deportivo', 'Tecnología', 'Gastronómico', 'Religioso', 'Otro']
  },
  tipo: {
    type: String,
    required: true
  },
  region: {
    type: String,
    required: true,
    enum: ['Sierra', 'Costa', 'Amazonía', 'Galápagos']
  },
  provincia: {
    type: String,
    required: true
  },
  ciudad: {
    type: String,
    required: true
  },
  lugar: {
    type: String,
    required: true
  },
  referencia: {
    type: String
  },
  lat: {
    type: Number,
    required: true
  },
  lng: {
    type: Number,
    required: true
  },
  fecha: {
    type: String,
    required: true
  },
  fecha_fin: {
    type: String,
    default: null
  },
  horario: {
    type: String,
    required: true
  },
  repeticion: {
    type: String,
    default: 'No se repite'
  },
  durMin: {
    type: Number,
    required: true
  },
  organizador: {
    type: String,
    required: true
  },
  telefono: {
    type: String,
    default: ''
  },
  url: {
    type: String,
    default: ''
  },
  precio: {
    type: String,
    required: true
  },
  imagen: {
    type: String,
    required: true
  },
  tags: [{
    type: String
  }],
  allowComments: {
    type: Boolean,
    default: true
  },
  requireApproval: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['approved', 'pending', 'rejected'],
    default: 'approved'
  },
  rejectReason: {
    type: String,
    default: ''
  },
  comentarios: [ComentarioSchema]
}, {
  timestamps: true
});

// Índices para mejorar búsquedas
EventoSchema.index({ categoria: 1, region: 1 });
EventoSchema.index({ fecha: 1 });
EventoSchema.index({ ciudad: 1 });

const Evento = mongoose.model('Evento', EventoSchema);

module.exports = Evento;