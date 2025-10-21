1. Nombre de la apliación:

    Festimap Ecuador


2. Objetivo breve de la práctica

- Refinar backlog y plan de sprint.

- Diseñar diagramas de casos de uso y modelo de requisitos.

- Crear mockups iniciales del proyecto y maquetarlos en HTML según las restricciones del curso.

- Descripcion:

FestiMap Ecuador es una maqueta web para descubrir festividades y rutas culturales del país. El usuario puede:

Explorar “Hoy y cerca de ti”, filtrar por región, tipo y fecha, ver detalle del evento y agregarlo a su agenda.

Buscar por tema/palabra clave y explorar por región.

Planificar rutas A→B con paradas sugeridas.

Gestionar cuenta, intereses y permisos de ubicación.

Un módulo inicial de administración permite listar eventos y completar un formulario de creación/edición, además de una vista de reportes.

El entregable actual se centra en maquetar vistas coherentes con historias y casos de uso, dejando la lógica y el diseño visual avanzado para etapas posteriores.

4. Conclusiones y Recomendaciones

Verónica Aguilar

Conclusiones

En los mockups en Excel confirmamos que “Hoy y cerca de ti”, los filtros y la ficha de evento sostienen la navegación principal. Al depurar pantallas, eliminamos redundancias y dejamos un flujo claro para explorar, buscar y agendar. La coherencia de Historias de Usuario, Casos de Uso y Mockups se mantiene visible en cada vista priorizada.

A partir de los requerimientos funcionales y no funcionales, junto con los casos de uso definidos, se elaboraron los mockups iniciales en Excel, lo que permitió representar visualmente la interfaz propuesta y comprobar su coherencia con las necesidades planteadas en el sistema.

Recomendaciones

Se recomienda continuar utilizando mockups sencillos en Excel u otras herramientas accesibles en las primeras fases, ya que permiten validar rápidamente la interfaz y realizar ajustes antes de pasar a un diseño más avanzado.

Se recomienda tener bien definida la idea del proyecto desde el inicio, con el fin de precisar adecuadamente los mockups y las funciones que debe realizar la aplicación.

Xavier Anatoa

Conclusiones

Verificamos que el diagrama UML refleja el dominio esencial: Evento, Usuario, Interés, Ruta, Parada y Reporte. Las relaciones sostienen los casos de uso priorizados y facilitan escalabilidad. La trazabilidad HU↔CU↔UI↔UML queda clara y verificable.

En el módulo de administración, confirmamos que el CRUD de eventos y la validación de formularios cubren el flujo editorial mínimo. La maqueta permite evaluar reglas de publicación y estados del evento sin depender aún del back-end.

Recomendaciones

Completemos criterios de aceptación medibles por historia (filtros, paginación, validaciones, accesibilidad). A partir de ellos derivemos casos de prueba funcionales para QA del MVP. Mantengamos la cobertura en una matriz simple.

Mantengamos “trazabilidad viva”: cada ajuste de reglas o alcance debe reflejarse en Historias de Usuario, Casos de Uso, mockups y UML. Con esto prevenimos desviaciones al pasar a código y facilitamos la revisión entre sprints.

Angelo Conterón

Conclusiones

Validamos que la planificación de punto A al punto B con paradas está modelada lo suficiente para revisar navegación y contenido. Podemos diferir mapa interactivo y cálculo de ruta sin perder intención de producto. Reducimos riesgo técnico en esta etapa.

Los permisos de ubicación y la agenda del usuario se perfilan como piezas críticas de la propuesta de valor. Al anclarlas en la maqueta, facilitamos futuras integraciones y pruebas con datos simulados.

Recomendaciones

Ejecutemos pruebas de concepto pequeñas: permisos de ubicación, carga de puntos de interés y render básico de rutas con datos mock. Validemos desempeño y mensajes de permiso antes del desarrollo completo. Documentemos hallazgos en la maqueta.

Prioricemos endpoints mínimos para el siguiente sprint (CRUD de Evento, autenticación, preferencias, listados y reportes). Esto habilita iteraciones cortas y medición temprana del valor entregado.