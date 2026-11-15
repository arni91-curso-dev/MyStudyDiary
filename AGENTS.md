# AGENTS.md — Diario de Estudio
Web estática para registrar sesiones de estudio y motivarse viendo la racha de días seguidos. Proyecto didáctico: el código debe poder entenderlo alguien que empieza a programar.
## Stack y estructura
- HTML, CSS y JavaScript puros: sin frameworks, librerías, npm, bundler ni build. Funciona abriendo `index.html` con doble clic (`file://`): nada de módulos ES, `fetch` a archivos locales ni servidor.
- `index.html` (estructura), `styles.css` (estilos), `logic.js` (lógica pura, recibe "hoy" como parámetro), `app.js` (interfaz y datos).
- `logic.js` se carga antes que `app.js` y también se exporta a Node; `tests/*.test.js` lo prueban. Cada nombre se declara una sola vez entre los dos.
- `docs/constitution.md` (principios) y `specs/NNN-nombre/` (`spec.md` = qué y por qué; `plan.md` = cómo; `tasks.md` = tareas).
## Comandos
- Tests: `node --test`
## Convenciones
- Textos de la interfaz en español. Código simple, nombres descriptivos y comentarios solo donde aporten. Diseño limpio y responsive; cualquier pantalla nueva debe verse bien en el móvil.
## Datos
- localStorage, clave `study-diary-sessions`: array de `{ date: "AAAA-MM-DD", topic, minutes, createdAt }` (`createdAt` = `Date.now()`, ordena las sesiones del mismo día).
- localStorage, clave `study-diary-weekly-goal`: objetivo semanal como texto con los minutos (p. ej. `"300"`, de 1 a 10.080). Ausente o no válido = sin objetivo.
- Si cambias la forma de los datos, mantén compatibilidad con lo ya guardado o el usuario perderá sus sesiones.
## Fechas y racha (fácil equivocarse)
- Siempre fecha local. Nunca `toISOString()` ni `new Date("AAAA-MM-DD")`: se interpretan en UTC y desplazan el día.
- Racha = días consecutivos con al menos 1 sesión que terminan hoy; si hoy no hay sesión pero ayer sí, sigue viva desde ayer. Varias sesiones el mismo día = un día. Las fechas futuras no suman.
- Mejor racha = la serie más larga de días consecutivos con sesión en todo el historial (hasta hoy).
- Total semanal = minutos de todas las sesiones del lunes de esta semana a hoy (aquí cuenta cada sesión).
- Este mes = días distintos con sesión del día 1 del mes a hoy.
- Mapa de calor: periodo, sesión válida, redondeo y niveles en `specs/001-heat-map/spec.md` (sección 4 y CA-4.1).
- Objetivo semanal (detalle en `specs/002-objetivo-semanal/spec.md`): cumplido = total semanal ≥ objetivo; porcentaje = total redondeado al minuto y después hacia abajo. "Esta semana" y el progreso ignoran sesiones con minutos negativos o no numéricos o con fecha no válida.
- Todo se calcula a partir de las sesiones y no se guarda, salvo el objetivo semanal.
## Reglas: Spec-Driven Development (SDD)
- Lee `docs/constitution.md` y la spec activa (`specs/NNN-*/`) antes de tocar código. Si algo no está en la spec, no se implementa: se pregunta.
- Fases, con aprobación entre cada una: spec (requisitos en EARS) → clarificación → plan → tareas → implementación (una tarea cada vez: tests en rojo, código, tests en verde, marcar la tarea y parar) → validación de cada RF.
- Plantillas y detalle de cada fase: skill `sdd`. Skills en `.agents/skills/` (estándar) con copia idéntica en `.claude/skills/` (Claude Code); cambia las dos. Atajos para Claude Code: `/sdd-*` y agentes en `.claude/agents/` (la sesión arranca como coordinador).
## Forma de trabajar
- Haz solo lo que se pide: no añadas funcionalidades por tu cuenta. "Plan" o "proponme" = solo proponer, sin tocar archivos.
- Cambios pequeños y enfocados; no reescribas lo que ya funciona. Al terminar, resume qué has cambiado y qué debo revisar.
## Memoria
- Al empezar, lee `MEMORY.md`; al terminar una tarea, actualízalo (estado, decisiones con su porqué, errores a evitar). Máximo ~50 líneas. Si algo se vuelve regla permanente, propón moverlo a `AGENTS.md`. Nunca datos sensibles (claves, tokens, datos personales).
## Límites
- ✅ Siempre: respetar las reglas de fechas y racha, mantener los textos en español, actualizar `MEMORY.md` al terminar cada tarea.
- ⚠️ Pregunta antes: crear archivos nuevos, cambiar el formato de los datos guardados.
- 🚫 Nunca: añadir dependencias, frameworks o un paso de build.
## Verificación
- `node --test` en verde y, después de cada cambio, el MCP de Chrome DevTools: abre `index.html`, prueba la funcionalidad, revisa la consola y comprueba la vista móvil.
- Para empezar de cero: DevTools → Application → Local Storage → borrar la clave `study-diary-sessions`.
