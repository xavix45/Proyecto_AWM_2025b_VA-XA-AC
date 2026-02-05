# 📍 ENDPOINT REQUERIDO EN BACKEND - CHECK-IN DE ASISTENCIAS

## 🎯 Funcionalidad
Registrar la asistencia de un usuario a un evento específico e incrementar el contador de visitantes.

---

## 🔗 ENDPOINT A CREAR EN BACKEND

### **POST** `/api/eventos/:id/checkin`

**Descripción**: Registra que un usuario asistió al evento y aumenta el contador de asistencias.

---

## 📋 REQUEST

### Headers
```javascript
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Body
```json
{
  "userId": "67890abc12345def",
  "userName": "Xavier Almeida"
}
```

### Params
- `id` (String) - ID del evento en MongoDB

---

## ✅ RESPONSE EXITOSO (200 OK)

```json
{
  "success": true,
  "message": "Asistencia registrada exitosamente",
  "data": {
    "eventoId": "67890abc12345def",
    "totalAsistencias": 38,
    "userId": "67890abc12345def",
    "timestamp": "2026-02-04T16:45:00.000Z"
  }
}
```

---

## ❌ ERRORES POSIBLES

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Token de autenticación requerido"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Evento no encontrado"
}
```

### 409 Conflict (Ya hizo check-in)
```json
{
  "success": false,
  "message": "Ya registraste tu asistencia a este evento"
}
```

---

## 🔧 IMPLEMENTACIÓN EN BACKEND (Node.js + Express + MongoDB)

### 1. **Agregar campo en el Schema de Mongoose** (`models/Evento.js`)

```javascript
const eventoSchema = new mongoose.Schema({
  // ... campos existentes ...
  
  asistencias: {
    type: Number,
    default: 0
  },
  
  asistentes: [{
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    userName: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
});
```

---

### 2. **Crear el Controlador** (`controllers/eventoController.js`)

```javascript
const Evento = require('../models/Evento');

exports.registrarCheckIn = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, userName } = req.body;

    // 1. Buscar el evento
    const evento = await Evento.findById(id);
    if (!evento) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado'
      });
    }

    // 2. Verificar si el usuario ya hizo check-in
    const yaRegistrado = evento.asistentes.some(
      a => a.userId.toString() === userId
    );

    if (yaRegistrado) {
      return res.status(409).json({
        success: false,
        message: 'Ya registraste tu asistencia a este evento'
      });
    }

    // 3. Agregar el check-in
    evento.asistentes.push({
      userId,
      userName,
      timestamp: new Date()
    });

    // 4. Incrementar contador
    evento.asistencias = evento.asistentes.length;

    // 5. Guardar en la base de datos
    await evento.save();

    // 6. Responder con éxito
    res.status(200).json({
      success: true,
      message: 'Asistencia registrada exitosamente',
      data: {
        eventoId: evento._id,
        totalAsistencias: evento.asistencias,
        userId,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('Error en check-in:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar asistencia',
      error: error.message
    });
  }
};
```

---

### 3. **Agregar la Ruta** (`routes/eventos.js`)

```javascript
const express = require('express');
const router = express.Router();
const { 
  obtenerEventos, 
  crearEvento, 
  registrarCheckIn  // ← NUEVO
} = require('../controllers/eventoController');
const { protectController } = require('../middleware/auth');

// Rutas existentes
router.get('/', obtenerEventos);
router.post('/', protectController, crearEvento);

// ← NUEVA RUTA PARA CHECK-IN
router.post('/:id/checkin', protectController, registrarCheckIn);

module.exports = router;
```

---

### 4. **Middleware de Autenticación** (`middleware/auth.js`)

Si no existe, agregar:

```javascript
const jwt = require('jsonwebtoken');

exports.protectController = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token de autenticación requerido'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido o expirado'
    });
  }
};
```

---

## 🧪 PRUEBA CON POSTMAN/THUNDER CLIENT

### Request
```http
POST http://192.168.0.149:8000/api/eventos/67890abc12345def/checkin
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "userId": "507f1f77bcf86cd799439011",
  "userName": "Xavier Almeida"
}
```

### Response Esperada
```json
{
  "success": true,
  "message": "Asistencia registrada exitosamente",
  "data": {
    "eventoId": "67890abc12345def",
    "totalAsistencias": 38,
    "userId": "507f1f77bcf86cd799439011",
    "timestamp": "2026-02-04T21:45:30.123Z"
  }
}
```

---

## 📊 FLUJO COMPLETO

1. Usuario presiona **"¡ESTUVE AQUÍ!"** en `Detalles.jsx`
2. Frontend envía POST con token + userId + userName
3. Backend valida token con middleware `protectController`
4. Backend verifica que el evento existe
5. Backend verifica que el usuario NO haya hecho check-in antes
6. Backend agrega el registro al array `asistentes`
7. Backend incrementa el campo `asistencias`
8. Backend guarda en MongoDB
9. Backend responde con éxito
10. Frontend refresca los datos del evento
11. Usuario ve el contador actualizado: **38 Viajeros**

---

## 🚀 COMANDOS DE INSTALACIÓN (Si no existen)

```bash
cd Backend_Festimap
npm install jsonwebtoken
npm install bcrypt
```

---

**Versión**: v1.0 | **Última actualización**: 4 Feb 2026 | **Status**: 📝 PENDIENTE IMPLEMENTACIÓN EN BACKEND
