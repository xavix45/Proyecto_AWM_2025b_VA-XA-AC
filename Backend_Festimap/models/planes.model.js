
const mongoose = require('mongoose');

const GeoDatosSchema = new mongoose.Schema({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true }
}, { _id: false });

const PlanSchema = new mongoose.Schema({
  usuarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario', // Cambiado para que coincida con el modelo usuario.model.js
    required: true
  },
  nombrePlan: {
    type: String,
    required: [true, "El nombre del plan es obligatorio"],
    minlength: [3, "Mínimo 3 caracteres"]
  },
  origen: { type: String, required: true },
  destino: { type: String, required: true },
  fechaInicio: { type: String, required: true },
  dias: { type: Number, required: true, min: 1, max: 30 },
  radio: { type: Number, default: 15 },
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
}, { timestamps: true });

// ÍNDICE DE OPTIMIZACIÓN: Acelera búsquedas por usuarioId
// Cuando haces Plan.find({ usuarioId: "123abc" }), MongoDB salta directo 
// a los planes de ese usuario en lugar de revisar TODOS los planes.
// Es como tener una agenda ordenada alfabéticamente vs. páginas desordenadas.
// El "1" significa orden ascendente (de menor a mayor ID).
PlanSchema.index({ usuarioId: 1 });

module.exports = mongoose.model('Plan', PlanSchema);
