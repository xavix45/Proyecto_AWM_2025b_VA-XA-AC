Nombre de la aplicación:
FestiMap Ecuador

Descripción breve del objetivo de la práctica:

La práctica tuvo como finalidad aplicar json-server para crear una especie de base de datos para qeu a través de consultas HTTP se tenga un crud para la aplicación.


Conclusiones

- **Verónica Aguilar**
 - La capa de validación en formularios evitó datos inconsistentes antes de llegar al backend simulado.
  - El consumo de endpoints con fetch() evidenció la necesidad de manejar estados de carga y error para mantener la experiencia fluida.

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
- Ampliar pruebas unitarias/integración para validaciones y flujos de formulario, cubriendo casos límite y mensajes de error.
- Documentar los contratos de datos esperados por el backend y los mensajes de retroalimentación al usuario.

**Xavier Anatoa**
- Sustituir el mock por una API con autenticación y persistencia real; agregar un pipeline de CI con lint y tests.
- Añadir manejo centralizado de errores y reintentos ligeros en las llamadas fetch para mejorar resiliencia.

**Angelo Conteron**
- Refinar la accesibilidad: estados focus/hover, contraste y mensajes ARIA para operaciones asincrónicas.
- Documentar scripts de desarrollo y despliegue (`npm run json:dev`, `npm run dev`, `npm run build`) para estandarizar pruebas y entregas.
