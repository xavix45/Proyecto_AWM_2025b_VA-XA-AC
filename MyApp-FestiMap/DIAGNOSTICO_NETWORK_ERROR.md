# 🔍 DIAGNÓSTICO Y SOLUCIÓN - ERROR NETWORK EN ADMIN

## Error Actual
```
Dashboard error: Network Error
```

## Causa Probable
El Backend **NO está corriendo** o **no es accesible** desde la app en `http://192.168.0.149:8000`

---

## ✅ VERIFICACIÓN PASO A PASO

### 1. **¿El Backend está corriendo?**
En la terminal del Backend, debes ver:
```
✅ Servidor corriendo en puerto 8000
✅ MongoDB conectado
```

**Si está apagado:**
```bash
cd Backend_Festimap
npm start
```

---

### 2. **¿La IP es correcta?**
En tu archivo `src/config/api.js`:
```javascript
export const YOUR_COMPUTER_IP = '192.168.0.149';
```

**Para verificar tu IP:**
- **Windows**: Abre PowerShell y ejecuta: `ipconfig` 
- Busca el adaptador de red activo y copia la IPv4

**Posible problema**: Si cambió tu IP, actualiza en `api.js`

---

### 3. **¿Se puede acceder al Backend desde el navegador?**
Abre en el navegador:
```
http://192.168.0.149:8000/api/eventos
```

**Si funciona**: Verás un JSON con eventos  
**Si falla**: El Backend no responde → Reinicia el Backend

---

### 4. **¿MongoDB está corriendo?**
En otra terminal, ejecuta:
```bash
mongod
```

Debes ver:
```
✅ MongoDB [info] Listening on 0.0.0.0:27017
```

---

## 🚀 CAMBIOS IMPLEMENTADOS

Acabo de mejorar **todos** los archivos de admin:

### AdminDashboard.jsx
✅ Ahora intenta cargar eventos SIN requerir token obligatoriamente  
✅ Los logs son opcionales (si el endpoint no existe, continúa)  
✅ Mejor error logging en consola

### AdminStats.jsx
✅ Config de headers más flexible  
✅ Maneja errors sin bloquear  

### AdminList.jsx
✅ Mejor manejo de errores  
✅ Logs detallados en consola  

---

## 🛠️ QUÉ HACER AHORA

### Opción 1: Backend no está corriendo
```bash
cd Backend_Festimap
npm start
```
Luego recarga la app en Expo (Ctrl+R)

### Opción 2: La IP cambió
1. Verifica tu IP: `ipconfig` en PowerShell
2. Actualiza en `src/config/api.js`
3. Recarga la app

### Opción 3: MongoDB no está corriendo
En otra terminal:
```bash
mongod
```

---

## 📱 PRUEBAS EN LA APP

Recarga la app completa:
1. Presiona **Ctrl+R** en Expo
2. Intenta entrar a AdminDashboard
3. Mira la consola de Expo para ver los logs que agregué

**Deberías ver en consola**:
```
🔄 Cargando Dashboard... Token: ✅ Disponible
✅ Eventos cargados: 5
✅ Logs cargados: 3
```

O en caso de error:
```
🚨 Dashboard error: {
  message: "...",
  status: 404,
  data: {...}
}
```

---

## 💡 CHECKLIST FINAL

- [ ] ¿Backend está corriendo? (`npm start`)
- [ ] ¿MongoDB está corriendo? (`mongod`)
- [ ] ¿IP en api.js es correcta? (Verifica con `ipconfig`)
- [ ] ¿Recargaste la app? (Ctrl+R en Expo)
- [ ] ¿Ves logs en la consola de Expo?

---

## 🆘 Si Sigue Fallando

1. **Comparte los logs de Expo** (consola completa)
2. **Comparte los logs del Backend** (terminal de servidor)
3. **Verifica CORS** en el Backend si tienes configurado

---

**Última actualización**: 4 Feb 2026 | **v5.6-beta**
