# 🧹 INSTRUCCIONES DE LIMPIEZA - BACKEND FESTIMAP

## 📋 CONTEXTO

El backend FestiMap tiene un archivo obsoleto que debe eliminarse:

**ARCHIVO OBSOLETO:**
- `models/comentarios.model.js` - No se usa porque los comentarios están embedidos en `evento.comentarios[]`

**ARCHIVOS QUE SÍ SE USAN (NO ELIMINAR):**
- ✅ `models/planes.model.js` - Guarda las rutas del usuario (botón "GUARDAR PLAN" en PlanViaje.jsx)
- ✅ `models/log.model.js` - Auditoría de cambios administrativos (huella digital de quién editó qué)
- ✅ `models/eventos.model.js` - Core de la app
- ✅ `models/usuario.model.js` - Autenticación

---

## ⚠️ VERIFICACIONES NECESARIAS

Cuando abras la carpeta **Backend_Festimap** en VS Code, pídele a Copilot:

### **Paso 1: Verificar si comentarios.model se importa**

**Instrucción para Copilot:**
```
Busca en todo el backend si comentarios.model.js se importa o usa en algún archivo.
Revisa especialmente:
- models/index.js
- controllers/eventos.controller.js  
- controllers/index.js
- routes/evento.routes.js

Si NO aparece en ningún lado, confírmame que puedo eliminarlo.
```

### **Paso 2: Eliminar comentarios.model.js**

Si la verificación confirma que NO se usa:

**Instrucción para Copilot:**
```
Elimina el archivo models/comentarios.model.js y verifica que no haya imports rotos.
```

---

## 📊 ESTRUCTURA BACKEND CONFIRMADA

```
Backend_Festimap/
├── config/
│   └── mongoose.config.js ✅ (Conexión MongoDB)
├── controllers/
│   ├── eventos.controller.js ✅ (CRUD eventos)
│   ├── usuarios.controller.js ✅ (Login, registro)
│   ├── planes.controller.js ✅ (Guardar rutas)
│   ├── stats.controller.js ✅ (Analytics)
│   └── index.js ✅
├── middlewares/
│   ├── auth.middleware.js ✅ (JWT)
│   └── errorHandler.js ✅
├── models/
│   ├── eventos.model.js ✅ (Core)
│   ├── usuario.model.js ✅ (Auth)
│   ├── planes.model.js ✅ (Rutas guardadas)
│   ├── log.model.js ✅ (Auditoría)
│   ├── comentarios.model.js ❌ (ELIMINAR - no se usa)
│   └── index.js ✅
├── routes/
│   ├── evento.routes.js ✅
│   ├── user.routes.js ✅
│   └── planes.routes.js ✅
├── server.js ✅ (Servidor principal)
├── seed.js ✅ (Migración db.json → MongoDB)
└── package.json ✅
```

---

## 🎯 RESULTADO ESPERADO

Después de la limpieza, el backend tendrá **SOLO** archivos necesarios:

- **5 modelos**: Evento, Usuario, Plan, Log, index.js
- **5 controladores**: eventos, usuarios, planes, stats, index.js  
- **3 rutas**: evento, user, planes
- **2 middlewares**: auth, errorHandler
- **1 config**: mongoose.config
- **3 archivos raíz**: server.js, seed.js, package.json

**Total: 19 archivos esenciales**

---

## 📝 NOTAS IMPORTANTES

1. **comentarios.model.js** es obsoleto porque los comentarios se guardan directamente en el array `evento.comentarios[]` del modelo de Eventos.

2. **log.model.js** SÍ es necesario para auditoría (saber quién editó/eliminó eventos).

3. **planes.model.js** SÍ es necesario porque el botón "GUARDAR PLAN" en PlanViaje.jsx hace POST a `/api/planes`.

4. Si encuentras algún import de `Comentario` o `comentarios.model`, es un **bug** que debe eliminarse también.

---

## 🚀 COMANDOS ÚTILES

Desde la terminal en Backend_Festimap:

```powershell
# Ver estructura completa
Get-ChildItem -Recurse -File | Select-Object FullName

# Buscar referencias a "Comentario" en el código
Select-String -Pattern "Comentario" -Path . -Recurse -Include *.js

# Iniciar servidor
npm run dev

# Migrar db.json a MongoDB
npm run seed
```

---

**Fecha de creación:** 5 de febrero de 2026  
**Contexto:** Limpieza post-análisis de estructura backend
