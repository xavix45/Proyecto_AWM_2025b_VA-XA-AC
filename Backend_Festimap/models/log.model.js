
const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
  accion: { type: String, required: true }, // 'CREATE', 'UPDATE', 'DELETE'
  recurso: { type: String, required: true }, // 'EVENTO', 'PLAN', 'USUARIO'
  detalle: { type: String },
  autor: { type: String, default: 'Admin System' },
  ip: { type: String },
  fecha: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Log', LogSchema);
