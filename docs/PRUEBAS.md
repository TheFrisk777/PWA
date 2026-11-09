# Registro de pruebas

Entorno: Windows, Node.js 24, compilación Vite de producción y Microsoft Edge headless. Fecha de ejecución: 9 de noviembre de 2026.

## Alcance

**Resultado final:** compilación de producción completada, **3/3 pruebas Vitest aprobadas** y **3/3 escenarios Playwright aprobados**. El escenario CRUD incluye cero errores de JavaScript de página, manifest accesible, iconos HTTP 200 y controlador Service Worker activo. No se interpreta este resultado como instalación nativa o validación en producción pública.

- `npm run build`: validación TypeScript, bundles, manifest, iconos y generación del Service Worker.
- `npm test`: tres casos Vitest con fake-indexeddb: CRUD con coordenadas; rechazo de datos inválidos; preferencias. Estas son pruebas de almacenamiento emulado, complementadas por IndexedDB real en Edge.
- `npm run test:e2e`: tres escenarios de Playwright: permisos de notificación concedidos/denegados con respuestas controladas; CRUD/persistencia/recarga/rutas offline/manifest/iconos/diseño móvil; GPS controlado, error de permiso y tema persistente.
- `npm audit --omit=dev`: sin vulnerabilidades en dependencias de ejecución en la revisión realizada. La instalación completa informó 6 avisos en herramientas de desarrollo (2 bajos y 4 moderados); no se aplicaron cambios forzados de versiones mayores.

## Evidencia real

| Archivo                          | Qué muestra                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------- |
| `evidencias/dashboard.png`       | Dashboard de una sesión con actividades creadas por la prueba                               |
| `evidencias/movil.png`           | Misma sesión con viewport de 390×844; comprobación de ausencia de desbordamiento horizontal |
| `evidencias/formulario.png`      | Formulario antes de guardar una actividad                                                   |
| `evidencias/offline.png`         | Lista tras crear y editar sin red y recargar                                                |
| `evidencias/geolocalizacion.png` | Coordenadas controladas persistidas y recuperadas                                           |
| `evidencias/configuracion.png`   | Tema oscuro y opciones de recordatorios                                                     |
| `evidencias/diagnostico.json`    | Service Worker activado/controlador, caché y base IndexedDB detectada                       |

Las capturas son de la aplicación ejecutada, no composiciones visuales. El modo offline se activa mediante el contexto Playwright; no se desconectó el adaptador físico. El GPS concedido usa `context.setGeolocation`; el error de GPS y las respuestas de Notifications se inyectan para comprobar rutas de código. No prueban sensores físicos ni entrega de notificaciones por el sistema operativo.

## Incidencias corregidas durante la ejecución

1. Los selectores necesitaban nombres accesibles inequívocos para categoría, prioridad y tema. Se añadieron etiquetas explícitas y se repitieron las pruebas.
2. Una prueba recargaba antes de terminar el guardado asíncrono. Se corrigió para esperar la actividad guardada y navegación antes de recargar.
3. Una ejecución solapada perdió el servidor de pruebas al terminar otra sesión. Se descartó ese resultado y se ejecutó la suite de forma aislada.
4. El registro del Service Worker dependía del evento de carga. Se hizo inmediato para evitar carreras y se comprobó nuevamente el control offline.
5. La prueba del checkbox esperaba el cambio antes de terminar la escritura asíncrona. Se espera ahora el estado guardado. Se amplió el presupuesto de tiempo de los escenarios de navegador para admitir máquinas lentas.

## Límites

No se ejecutaron Lighthouse, instalación nativa, modo standalone, sensores físicos, notificación real del SO, cierre completo del perfil, actualización de dos versiones o validación de URL HTTPS pública. No hay capturas de paneles DevTools: el diagnóstico programático se identifica como tal. Consulta la lista manual en `VALIDACION_RUBRICA.md`.
