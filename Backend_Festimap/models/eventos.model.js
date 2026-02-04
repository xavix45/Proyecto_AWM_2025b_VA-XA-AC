
const mongoose = require('mongoose');

const ComentarioSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  usuario: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comentario: { type: String, required: true },
  fecha: { type: String, required: true }
}, { _id: false });

const EventoSchema = new mongoose.Schema({
  name: { type: String, required: [true, "El nombre es obligatorio"], minlength: [3, "Mínimo 3 caracteres"] },
  descripcion: { type: String, required: [true, "La descripción es obligatoria"] },
  categoria: { 
    type: String, 
    required: true,
    enum: ["Entretenimiento", "Tecnología", "Educativo", "Cultural", "Musical", "Deportes", "Gastronomía", "Ancestral", "Tradición"]
  },
  tipo: { type: String, required: true },
  region: { type: String, required: true, enum: ['Sierra', 'Costa', 'Amazonía', 'Galápagos', 'Insular'] },
  provincia: { type: String, required: true },
  ciudad: { type: String, required: true },
  lugar: { type: String, required: true },
  referencia: String,
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  // GeoJSON para búsquedas espaciales en el servidor
  location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] } // [lng, lat]
  },
  fecha: { type: String, required: true },
  fecha_fin: { type: String, default: null },
  horario: { type: String, required: true },
  repeticion: { type: String, default: "Anual" },
  durMin: { type: Number, default: 60 },
  organizador: String,
  telefono: String,
  url: String,
  precio: { type: String, default: "Gratuito" },
  imagen: { type: String, required: true },
  tags: [String],
  allowComments: { type: Boolean, default: true },
  requireApproval: { type: Boolean, default: false },
  status: { type: String, enum: ['approved', 'pending', 'rejected', 'unpublished'], default: 'approved' },
  comentarios: [ComentarioSchema],
  visitas: { type: Number, default: 0 },
  asistencias: { type: Number, default: 0 }
}, { timestamps: true });

// CRÍTICO PARA EXPOSICIÓN: Índice espacial para que el servidor calcule distancias
EventoSchema.index({ location: "2dsphere" });

module.exports = mongoose.model('Evento', EventoSchema);
