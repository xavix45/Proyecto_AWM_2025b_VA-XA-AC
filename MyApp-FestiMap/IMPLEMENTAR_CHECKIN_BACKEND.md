# 🚀 GUÍA RÁPIDA: IMPLEMENTAR CHECK-IN EN BACKEND

## ⚠️ PROBLEMA ACTUAL
```
Error: Cannot POST /api/eventos/6982f59d9f14e6d59ff13cc2/checkin
```

**Causa**: El endpoint `/checkin` NO existe en el backend.

---

## 📝 PASOS PARA IMPLEMENTAR

### **PASO 1: Abrir el Schema de Mongoose**

📁 Archivo: `Backend_Festimap/models/Evento.js` (o donde esté tu schema)

**BUSCA** esta línea cerca del final del schema:
```javascript
comentarios: [...]
```

**AGREGA** después de `comentarios`:
```javascript
  comentarios: [...],
  
  asistencias: {
    type: Number,
    default: 0
  },
  asistentes: [{
    userId: String,
    userName: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
```

---

### **PASO 2: Crear la Función en el Controlador**

📁 Archivo: `Backend_Festimap/controllers/eventoController.js`

**AL FINAL DEL ARCHIVO**, antes de `module.exports`, agrega:

```javascript
// Registrar asistencia (check-in)
exports.registrarCheckIn = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, userName } = req.body;

    const evento = await Evento.findById(id);
    if (!evento) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado'
      });
    }

    // Verificar si ya hizo check-in
    const yaRegistrado = evento.asistentes?.some(a => a.userId === userId);
    if (yaRegistrado) {
      return res.status(409).json({
        success: false,
        message: 'Ya registraste tu asistencia'
      });
    }

    // Agregar check-in
    if (!evento.asistentes) evento.asistentes = [];
    evento.asistentes.push({
      userId,
      userName,
      timestamp: new Date()
    });

    // Actualizar contador
    evento.asistencias = evento.asistentes.length;
    await evento.save();

    res.status(200).json({
      success: true,
      message: 'Asistencia registrada',
      data: {
        eventoId: evento._id,
        totalAsistencias: evento.asistencias
      }
    });

  } catch (error) {
    console.error('Error check-in:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar asistencia'
    });
  }
};
```

---

### **PASO 3: Exportar la Función**

En el **MISMO ARCHIVO** `eventoController.js`, busca la línea:

```javascript
module.exports = {
  obtenerEventos,
  crearEvento,
  // ... otras funciones
};
```

**AGREGA** `registrarCheckIn`:
```javascript
module.exports = {
  obtenerEventos,
  crearEvento,
  actualizarEvento,
  eliminarEvento,
  registrarCheckIn  // ← AGREGAR ESTA LÍNEA
};
```

---

### **PASO 4: Agregar la Ruta**

📁 Archivo: `Backend_Festimap/routes/eventos.js`

**BUSCA** la línea:
```javascript
const { obtenerEventos, crearEvento, ... } = require('../controllers/eventoController');
```

**MODIFÍCALA** para incluir `registrarCheckIn`:
```javascript
const { 
  obtenerEventos, 
  crearEvento, 
  actualizarEvento,
  eliminarEvento,
  registrarCheckIn  // ← AGREGAR
} = require('../controllers/eventoController');
```

**LUEGO BUSCA** las rutas (ej: `router.post('/', ...)`) y **AGREGA AL FINAL**:

```javascript
// ← AGREGAR ESTA RUTA NUEVA
router.post('/:id/checkin', registrarCheckIn);
```

---

### **PASO 5: Reiniciar el Servidor**

En la terminal del Backend:

**Opción A** (Si usas npm start):
```bash
Ctrl+C
npm start
```

**Opción B** (Si usas nodemon):
```bash
# Nodemon detecta cambios automáticamente
# Solo verifica que se reinició en la consola
```

---

## ✅ VERIFICACIÓN

Después de implementar, verifica en la consola del backend que diga:

```
✓ Servidor corriendo en http://192.168.0.149:8000
✓ MongoDB conectado
```

**LUEGO** en la app:
1. Entra a un evento (ej: "Año Nuevo en el Teleférico")
2. Presiona **"¡ESTUVE AQUÍ!"**
3. Deberías ver: **"🎊 Asistencia Registrada"**
4. El número cambia de **37 Viajeros** → **38 Viajeros** ✅

---

## 🐛 SI AÚN DA ERROR

**Error: "Ya registraste tu asistencia"**
- ✅ Correcto. Significa que YA hiciste check-in antes.

**Error: "Token inválido"**
- Verifica que hayas iniciado sesión en la app.

**Error: "Evento no encontrado"**
- Verifica que el evento exista en MongoDB.

**Sigue sin funcionar:**
- Comparte el contenido de:
  - `Backend_Festimap/routes/eventos.js`
  - `Backend_Festimap/controllers/eventoController.js`
  - Consola del backend (errores)

---

**Tiempo estimado**: 5 minutos ⏱️
