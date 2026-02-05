
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

// ====================================================================
// ÍNDICE GEOESPACIAL: Permite buscar eventos por ubicación GPS
// ====================================================================
// "2dsphere" = MongoDB tratará las coordenadas como puntos en una esfera (la Tierra)
// 
// EJEMPLO DE USO en eventos.controller.js:
//   Evento.find({ 
//     location: { 
//       $near: { 
//         $geometry: { type: "Point", coordinates: [-78.4678, -0.1807] }, // Quito
//         $maxDistance: 15000 // 15km en metros
//       } 
//     } 
//   })
//
// Sin este índice, MongoDB NO podría:
//   ❌ Calcular distancias entre eventos y el usuario
//   ❌ Encontrar eventos dentro de un radio
//   ❌ Ordenar por cercanía
//
// Con este índice, MongoDB SÍ puede:
//   ✅ Responder "¿qué eventos hay cerca de mí?"
//   ✅ Calcular distancias reales en kilómetros
//   ✅ Filtrar por radio (5km, 10km, 50km, etc.)
// ====================================================================
EventoSchema.index({ location: "2dsphere" });

module.exports = mongoose.model('Evento', EventoSchema);
