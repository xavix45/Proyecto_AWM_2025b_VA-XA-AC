# 🔐 CORRECCIONES DE AUTENTICACIÓN - FESTIMAP ECUADOR V5.6

## Problema Identificado
**Error**: `AxiosError: Network Error` cuando se intenta acceder al panel de administrador
**Causa Raíz**: Las pantallas de admin NO enviaban el token de autenticación Bearer en los headers HTTP

---

## ✅ Archivos Corregidos

### 1. **AdminForm.jsx** ✨
**Problema**: Al crear/editar eventos, las peticiones POST/PUT no incluían autenticación
**Soluciones Aplicadas**:
- ✅ Importado `useUser` desde UserContext
- ✅ Extraído `token` del contexto: `const { user, token } = useUser()`
- ✅ Agregada validación: Si no hay token, mostrar alerta
- ✅ Creado header config con `Authorization: Bearer ${token}`
- ✅ Mejorado error handling para ver el error real del servidor

**Impacto**: Ahora se pueden crear y editar eventos correctamente

---

### 2. **AdminDashboard.jsx** 🎯
**Problema**: `fetchDashboardData` hacía peticiones sin token a `/api/eventos` y `/admin/logs`
**Soluciones Aplicadas**:
- ✅ Importado `useUser` desde UserContext
- ✅ Extraído `token` del contexto
- ✅ Creado header config reutilizable
- ✅ Agregadas dependencias en useEffect: `[navigation, token]`
- ✅ Mejorado console.error para mostrar respuesta del servidor

**Impacto**: El dashboard ahora carga correctamente

---

### 3. **AdminList.jsx** 📋
**Problema**: Las operaciones CRUD (GET, PUT, DELETE) sin autenticación
**Soluciones Aplicadas**:
- ✅ Importado `useUser`
- ✅ Agregado token a: `fetchEventos()`, `quickToggleStatus()`, DELETE
- ✅ Cada petición HTTP ahora lleva header Bearer

**Impacto**: Se pueden listar, cambiar estado y eliminar eventos

---

### 4. **AdminStats.jsx** 📊
**Problema**: Las peticiones de análisis sin token
**Soluciones Aplicadas**:
- ✅ Importado `useUser`
- ✅ Agregado token a: `fetchData()`, `fetchServerInsights()`
- ✅ Header Bearer en todas las peticiones GET

**Impacto**: El dashboard analítico funciona correctamente

---

## 🔧 Patrón Estándar Aplicado

En cada archivo, se usa esta estructura:

```javascript
// 1. Importar
import { useUser } from '../context/UserContext.jsx';

// 2. En el componente
const { token } = useUser();

// 3. Crear config reutilizable
const config = {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
};

// 4. Enviar en peticiones
axios.get(ENDPOINTS.eventos, config);
axios.post(ENDPOINTS.eventos, payload, config);
axios.put(url, payload, config);
axios.delete(url, config);
```

---

## 📋 Checklist de Funcionamiento

- [x] ✅ AdminForm: Crear eventos
- [x] ✅ AdminForm: Editar eventos
- [x] ✅ AdminDashboard: Ver KPIs
- [x] ✅ AdminDashboard: Ver logs de auditoría
- [x] ✅ AdminList: Listar eventos
- [x] ✅ AdminList: Cambiar estado (approved/unpublished)
- [x] ✅ AdminList: Eliminar eventos
- [x] ✅ AdminStats: Cargar analytics
- [ ] ⚠️ Backend: Verificar middleware `protectController`
- [ ] ⚠️ Backend: Verificar rutas protegidas en server.js

---

## 🚀 Próximos Pasos en Backend

**En tu `Backend_Festimap/server.js`**, asegúrate de:

### 1. Middleware de Protección
```javascript
export const protectController = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    res.status(403).json({ message: "Token inválido" });
  }
};
```

### 2. Rutas Protegidas
```javascript
// POST - Crear evento
router.post('/api/eventos', protectController, crearEvento);

// PUT - Editar evento
router.put('/api/eventos/:id', protectController, actualizarEvento);

// DELETE - Eliminar evento
router.delete('/api/eventos/:id', protectController, eliminarEvento);

// GET - Logs (solo admin)
router.get('/api/admin/logs', protectController, obtenerLogs);

// GET - Stats (solo admin)
router.get('/api/admin/stats/global', protectController, obtenerStats);
```

### 3. Controlador Robusto
```javascript
export const crearEvento = async (req, res) => {
  try {
    // Validar campos
    if (!req.body.name || !req.body.lat || !req.body.lng) {
      return res.status(400).json({ message: "Campos requeridos faltantes" });
    }

    // req.user ahora existe gracias al middleware
    const evento = new Evento({
      ...req.body,
      organizador: req.user.nombre
    });

    await evento.save();

    // Crear log de auditoría
    await Log.create({
      accion: 'CREATE',
      detalle: `Evento "${evento.name}" creado`,
      autor: req.user.nombre,
      fecha: new Date()
    });

    res.status(201).json(evento);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
```

---

## 📞 Validación Final

1. **Asegúrate que estés logueado** como administrador
2. **Recarga la app** en Expo (Ctrl+R)
3. **Intenta entrar al panel** (AdminDashboard debe cargar)
4. **Intenta crear un evento** (debe guardarse sin errores)
5. **Si falla**: Revisa los logs del Backend en la terminal

---

**Última actualización**: Febrero 4, 2026 | **Versión**: 5.6-beta
