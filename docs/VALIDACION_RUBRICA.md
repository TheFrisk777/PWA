# Validación de la rúbrica

Proyecto: **TaskFlow**. Fecha: 9 de noviembre de 2026. Los estados distinguen implementación de verificación; no equivalen a una calificación docente.

| Criterio                  | Puntaje máximo | Implementación                                                                                            | Evidencia                                                                       | Estado                                                                                                            |
| ------------------------- | -------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Manifest e instalabilidad | 3              | Manifest generado, PNG reales, maskable, prompt de instalación y ayuda por plataforma                     | `vite.config.ts`, `public/icons/`, pruebas HTTP de manifest e iconos            | Implementado; instalación real y standalone pendientes de verificación                                            |
| App Shell responsivo      | 3              | React CSR, cinco vistas, menú lateral/móvil, estados y temas                                              | `evidencias/dashboard.png`, `evidencias/movil.png`, `evidencias/formulario.png` | Completado y probado en navegador de escritorio y viewport móvil                                                  |
| Service Worker            | 3              | Workbox, precaché revisionada, instalación/activación/fetch, limpieza, actualización por acción explícita | `evidencias/diagnostico.json`, `vite.config.ts`                                 | Registro, activación y control comprobados; relevo de versión y limpieza entre builds pendientes de prueba manual |
| Funcionamiento offline    | 3              | App Shell y rutas disponibles; CRUD sobre IndexedDB sin red                                               | `evidencias/offline.png`, `tests/app.spec.ts`                                   | Probado con contexto de navegador offline; desconexión física pendiente                                           |
| IndexedDB                 | 3              | CRUD asíncrono, preferencias, coordenadas, validación, esquema v1 y manejo de errores                     | `src/db.test.ts`, pruebas de recarga, `evidencias/diagnostico.json`             | CRUD y recarga comprobados; cierre completo de navegador y captura de DevTools pendientes                         |
| Web APIs nativas          | 3              | Geolocation y Notifications con permisos explícitos y avisos internos alternativos                        | `evidencias/geolocalizacion.png`, `evidencias/configuracion.png`, pruebas E2E   | Flujos controlados probados; sensor y diálogos reales/notificación del SO pendientes                              |
| Despliegue HTTPS          | 3              | Build, rutas SPA y cabeceras para Netlify y Vercel                                                        | `netlify.toml`, `vercel.json`, README                                           | Preparado; requiere cuenta de hosting, publicación y comprobación pública                                         |
| Git y commits             | 3              | Repositorio solicitado, rama main, commits auténticos, .gitignore                                         | `git log`, https://github.com/TheFrisk777/PWA                                   | Completado; cambios publicados en main                                                                            |
| README profesional        | 3              | Arquitectura Mermaid, instalación, uso, offline, APIs, límites, pruebas y capturas                        | `README.md`, `PRUEBAS.md`                                                       | Completado; URL de producción y evidencias manuales señaladas como pendientes                                     |
| Entrega final             | 3              | Código, documentación, pruebas, evidencias y guía de entrega                                              | Repositorio y esta matriz                                                       | Entregables preparados; publicación y entrega educativa a cargo del estudiante                                    |

## Verificación manual final

- [ ] Publicar en Vercel o Netlify siguiendo el README y registrar la URL HTTPS real.
- [ ] Capturar DevTools → Application → Manifest, Service Workers e IndexedDB.
- [ ] Instalar en escritorio y teléfono, comprobar `display-mode: standalone` y guardar capturas.
- [ ] Cerrar por completo el navegador, abrir de nuevo y confirmar persistencia.
- [ ] Desconectar realmente la red y comprobar apertura/navegación/CRUD.
- [ ] Probar permiso real concedido y denegado en GPS y Notifications, incluyendo la notificación del sistema.
- [ ] Probar GPS no disponible, timeout y API ausente en dispositivos relevantes.
- [ ] Publicar un segundo build, verificar aviso de actualización, aceptar y comprobar limpieza de recursos obsoletos.
- [ ] Ejecutar Lighthouse y registrar el informe sin interpretar sus métricas como calificación de la rúbrica.
- [ ] Añadir evidencias reales de instalación y producción; no usar capturas simuladas.

No se afirma compatibilidad universal ni se adjudica automáticamente 30/30.
