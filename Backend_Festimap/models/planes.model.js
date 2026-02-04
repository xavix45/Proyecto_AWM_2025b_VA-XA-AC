const mongoose = require('mongoose');

// Schema para datos geográficos
const GeoDatosSchema = new mongoose.Schema({
  lat: {
    type: Number,
    required: true
  },
  lng: {
    type: Number,
    required: true
  }
}, { _id: false });

// Schema principal de Plan de Viaje
const PlanSchema = new mongoose.Schema({
  usuarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  nombrePlan: {
    type: String,
    required: [true, "El nombre del plan es obligatorio"],
    minlength: [3, "El nombre debe tener al menos 3 caracteres"]
  },
  origen: {
    type: String,
    required: true
  },
  destino: {
    type: String,
    required: true
  },
  fechaInicio: {
    type: String,
    required: true
  },
  dias: {
    type: Number,
    required: true,
    min: 1,
    max: 30
  },
  radio: {
    type: Number,
    required: true,
    default: 15
  },
  itinerario: {
    type: Map,
    of: [mongoose.Schema.Types.ObjectId],
    default: {}
  },
  eventosIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Evento'
  }],
  geoData: {
    origen: GeoDatosSchema,
    destino: GeoDatosSchema
  }
}, {
  timestamps: true
});

// Índice para mejorar búsquedas por usuario
PlanSchema.index({ usuarioId: 1 });

const Plan = mongoose.model('Plan', PlanSchema);

module.exports = Plan;