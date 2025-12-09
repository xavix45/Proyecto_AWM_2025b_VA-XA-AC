Nombre de la aplicación:
FestiMap Ecuador

Descripción breve del objetivo de la práctica:

La práctica tuvo como finalidad aplicar React para crear interactividad en la aplicación web FestiMap Ecuador según el uso de componentes.
Se implementaron validaciones de formularios, manejo de eventos en botones y la simulación de envío de datos.
Además, se integró el almacenamiento local y la manipulación del DOM para actualizar la interfaz dinámicamente.
Se migró parte de la aplicación estática original hacia una Single Page Application con React y Vite. Se trasladaron formularios y páginas a componentes React, se adaptó la lógica en JavaScript para usar hooks y se incorporaron estilos y rutas al nuevo proyecto `festimap-react`.

Documentar los pasos de migración y los principales cambios realizados


Pasos de migración
- Preparación del entorno: instalar dependencias en la carpeta `Proyecto/festimap-react` con `npm install` y verificar que `vite` y `react` estén presentes.
- Crear componentes React: por cada página HTML original se creó un componente en `src/pages/` (ej.: `Login.jsx`, `Register.jsx`, `PermisoUbicacion.jsx`, `Intereses.jsx`, `Cuenta.jsx`).
- Portar la lógica JS: funciones que antes usaban `document.querySelector` y eventos DOM se reescribieron como handlers con `useState`, `useEffect` y `useCallback` cuando fue necesario.
- Copiar y organizar estilos: se movieron o adaptaron hojas CSS a `src/styles/pages/` y se crearon utilidades en `src/styles/components/` (por ejemplo `_form.css`, `_button.css`, `_card.css`) importadas desde `src/styles/main.css`.
- Actualizar el router: se registraron las nuevas rutas en `src/main.jsx` usando `createBrowserRouter` y `RouterProvider`, añadiendo rutas como `/login`, `/registro`, `/permiso-ubicacion`, `/intereses`, `/cuenta`.
- Actualizar layout y navegación: `src/layouts/BaseLayout.jsx` se modificó para mostrar el enlace `Mi cuenta` cuando existe un usuario autenticado (gestión con `localStorage` y eventos para sincronizar el header).
- Migración del formulario admin: se creó `src/pages/admin/EventForm.jsx` portando HTML/CSS y la lógica de `admin-form-selects.js` / `admin-form.js` para crear/editar eventos y guardarlos en `localStorage` o en `EVENTOS_ADMIN`.

Cambios principales y decisiones técnicas
- Persistencia: se mantiene `localStorage` como almacenamiento local de desarrollo. Claves usadas: `usuarios`, `currentUserEmail`, `EVENTOS_ADMIN`, `lastCoords`, `permisoUbicacion`.
- Estado controlado en React: formularios y toggles (por ejemplo las notificaciones en `Cuenta.jsx`) ahora usan `useState` o `useReducer` y actualizan `localStorage` mediante `fetch`/`PATCH` (cuando se integra API) o directamente en el cliente.
- Rutas y navegación: la SPA usa `react-router-dom` v7 con rutas anidadas y `BaseLayout` como layout común. El header se actualiza ante cambios de autenticación escuchando eventos custom (`userChanged`) y `storage`.
- Estilos: se conservaron clases CSS originales cuando fue posible para minimizar cambios visuales y facilitar la migración; se añadieron componentes CSS reutilizables.
- Dev server y debugging: se resolvieron problemas típicos — instalar dependencias en la carpeta correcta y aceptar que Vite puede cambiar de puerto si 5173 está ocupado (ej. 5174). Se añadió `db.json` y `json-server` para simular API REST cuando se requiere.

Archivos añadidos / modificados relevantes
- `Proyecto/festimap-react/src/pages/Login.jsx` — componente de inicio de sesión y guardado de `currentUserEmail`.
- `Proyecto/festimap-react/src/pages/Register.jsx` — formulario de registro y persistencia en `usuarios`.
- `Proyecto/festimap-react/src/pages/PermisoUbicacion.jsx` — lógica de geolocalización y guardado de `lastCoords` / `permisoUbicacion`.
- `Proyecto/festimap-react/src/pages/Intereses.jsx` — UI de selección de intereses y guardado en perfil del usuario.
- `Proyecto/festimap-react/src/pages/Cuenta.jsx` — perfil de usuario, toggles de notificaciones y guardado de preferencias.
- `Proyecto/festimap-react/src/pages/admin/EventForm.jsx` — formulario admin para crear/editar eventos (migración de `pages/admin/evento-formulario.html` y `scripts/admin-form*.js`).
- `Proyecto/festimap-react/src/layouts/BaseLayout.jsx` — header con control de sesión y enlace `Mi cuenta`.
- `Proyecto/festimap-react/src/main.jsx` — registro de rutas en `createBrowserRouter`.
- `Proyecto/festimap-react/src/styles/pages/` y `src/styles/components/` — CSS movido/adaptado.
- `Proyecto/festimap-react/db.json` — dataset de prueba para `json-server` (usuarios, eventos, favoritos, intereses, ubicacion, eventos_admin).

Cómo probar localmente (resumen rápido)
- Instalar dependencias (si no está hecho):
	- `cd Proyecto/festimap-react`
	- `npm install`
- Ejecutar Vite dev server:
	- `npm run dev` (verifica el puerto que Vite elija, por ejemplo `http://localhost:5174/`).
- Ejecutar json-server para simular API (opcional):
	- `npx json-server --watch db.json --port 3001` (endpoints: `/usuarios`, `/eventos`, `/favoritos`, ...).
- Probar flujos clave en la SPA: registro -> permiso de ubicación -> intereses -> home; login -> mi cuenta; admin -> crear evento.

Notas y recomendaciones
- Para producción, reemplazar `localStorage` por una API real con autenticación y una base de datos persistente.
- Mantener el uso de componentes CSS reutilizables para normalizar estilos y facilitar futuras refactorizaciones.
- Considerar pruebas automáticas (unit + integración) para validar los flujos migrados (login/registro/perfil/admin).
- Documentar en el repositorio los scripts útiles: `npm run dev`, `npm run build` y `npm run json:dev` (si se añade).



Conclusiones

- **Verónica Aguilar**
  - Se observó una mejora en la integridad y calidad de los datos gracias a la centralización de las validaciones en los formularios.
  - Se registró un aumento en la modularidad del código, lo que facilitó la reutilización y el mantenimiento tras la migración a React.

- **Xavier Anatoa**
  - La sustitución de manipulaciones directas del DOM por hooks y componentes incrementó la previsibilidad del estado de la interfaz.
  - El uso combinado de `localStorage` y `json-server` permitió ejecutar pruebas locales integradas; se sugiere integrar una API real y pruebas automatizadas para producción.

- **Angelo Conteron**
  - En la verificación de los flujos interactivos se constató la coherencia funcional entre módulos tras la migración.
  - Se identificó la necesidad de mejorar la accesibilidad y de añadir pruebas E2E para cubrir escenarios críticos.


Recomendaciones

Verónica Aguilar

**Recomendaciones**

**Verónica Aguilar**
- Se recomienda mantener y ampliar las pruebas de validación (unitarias y de integración) para cubrir casos límite y evitar regresiones al refactorizar.
- Se recomienda documentar los casos de uso de los formularios y añadir mensajes de ayuda / validación inline para mejorar la usabilidad.

**Xavier Anatoa**
- Se recomienda reemplazar el uso de `localStorage` por llamadas a una API con autenticación y una base de datos persistente para entornos de producción.
- Se recomienda incorporar pruebas automatizadas y un pipeline básico de CI que incluya linter y ejecución de tests antes de fusionar cambios.

**Angelo Conteron**
- Se recomienda mejorar la interfaz visual mediante componentes reutilizables y accesibles (colores, contraste y estados) y añadir iconografía para facilitar la navegación.
- Se recomienda documentar el proceso de despliegue y los scripts de desarrollo (`npm run json:dev`, `npm run dev`, `npm run build`) para estandarizar las pruebas y la entrega.
