const mongoose = require("mongoose");

const ComentarioSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true },
    usuario: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comentario: { type: String, required: true },
    fecha: { type: String, required: true },
  },
  { _id: false },
);

const EventoSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "El nombre es obligatorio"],
      minlength: [3, "Mínimo 3 caracteres"],
    },
    descripcion: {
      type: String,
      required: [true, "La descripción es obligatoria"],
    },
    categoria: {
      type: String,
      required: true,
      enum: [
        "Cultural",
        "Musical",
        "Entretenimiento",
        "Educativo",
        "Deportivo",
        "Tecnología",
        "Gastronómico",
        "Religioso",
        "Ancestral",
        "Tradición",
        "Otro",
      ],
    },
    tipo: { type: String, required: true },
    region: {
      type: String,
      required: true,
      enum: ["Sierra", "Costa", "Amazonía", "Galápagos", "Insular"],
    },
    provincia: { type: String, required: true },
    ciudad: { type: String, required: true },
    lugar: { type: String, required: true },
    referencia: String,
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    fecha: { type: String, required: true },
    fecha_fin: { type: String, default: null },
    horario: { type: String, required: true },
    precio: { type: String, required: true },
    imagen: { type: String, required: true },
    tags: [String],
    status: {
      type: String,
      enum: ["approved", "pending", "rejected"],
      default: "approved",
    },
    comentarios: [ComentarioSchema],
    visitas: { type: Number, default: 0 },
    asistencias: { type: Number, default: 0 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Evento", EventoSchema);
