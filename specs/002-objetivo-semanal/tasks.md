# Tareas 002 — Objetivo semanal de estudio

Estado: **aprobado**.

Basadas en `plan.md` (aprobado). Cada tarea:
- se hace sola y en este orden; al terminarla se marca aquí y se para;
- las de lógica empiezan por los tests (en rojo) y terminan con `node --test` en verde (los 50 actuales incluidos);
- respeta la regla de nombres únicos entre `logic.js` y `app.js`.

Q1 resuelta: los tests del objetivo van en el archivo nuevo `tests/weekly-goal.test.js`. D9 confirmada: tras guardar "0300" el campo se queda tal como se escribió.

- [x] **T1. "Esta semana" ignora sesiones dañadas.** RF-7 (CA-7.1, CA-7.2, CA-7.3), RNF-8, CA-8.2 (plan §2 "Se modifica", D1)
  - Añadir a `tests/stats.test.js` los casos de semana del plan §6 (minutos negativos / no numéricos / ausentes, fechas no válidas, domingo, lunes nuevo, cambios de hora, cruce de año, futuro, no modifica la entrada).
  - Cambiar `calculateWeekMinutes` para que use `isValidSession` y `parseMinutes`.
  - Hecho cuando: los tests nuevos fallan antes del cambio y pasan después; `node --test` en verde sin haber modificado ningún test existente.

- [x] **T2. Validación del objetivo.** RF-2 (CA-2.2 a CA-2.5), CA-8.3, CA-8.4, RNF-10 (plan §2, §3, D2)
  - Tests de los grupos "Válido", "Quitar", "Error" y "Bruto no texto" del plan §6.
  - `MAX_WEEKLY_GOAL` y `parseWeeklyGoal(rawValue)`, exportadas en `module.exports`.
  - Hecho cuando: los tests fallan primero y después `node --test` está en verde; todos los ejemplos de CA-2.5 y CA-8.4 tienen su comprobación.

- [x] **T3. Porcentaje y modelo del progreso.** RF-4 (CA-4.1, CA-4.2), RF-5 (CA-5.1), RF-6, CA-7.1, CA-8.6, RNF-10 (plan §2, §3, D3)
  - Tests de los grupos "Porcentaje", "Progreso", "Sin objetivo", "Coincide con Esta semana" y "Semana nueva" del plan §6, con el texto exacto de cada caso de la sección 7 de la spec.
  - `calculateGoalPercent(totalMinutes, goalMinutes)` y `buildWeeklyGoalProgress(sessions, todayKey, rawGoal)`, exportadas.
  - Hecho cuando: los tests fallan primero y después `node --test` está en verde; 299 → "(99 %)" sin cumplido y 299,6 → "5 h / 5 h" cumplido.

- [x] **T4. Estructura y estilos del bloque.** RF-1 (CA-1.1, CA-1.2, CA-1.3), CA-3.5, RNF-1 a RNF-7 (plan §4 HTML y CSS, D5 a D8)
  - HTML del plan §4 dentro de `.stats`, entre "Esta semana" y "Este mes".
  - CSS: `.stats p` → `.stats > p`, bloque, barra, textos, zona táctil, `overflow-wrap` y reglas en el `@media (forced-colors: active)` existente.
  - Hecho cuando: con el MCP, el bloque sale justo debajo de "Esta semana"; "Mejor racha", "Esta semana" y "Este mes" se ven igual que antes; a 320 px no hay desplazamiento horizontal; campo y botón miden al menos 44 × 44 px; la consola no tiene errores.

- [x] **T5. Leer el objetivo y pintar el progreso.** CA-1.4, CA-1.5, RF-4, RF-5, RF-6, CA-4.3 (abrir y guardar sesión), CA-7.1, CA-8.3, CA-8.5 (plan §4 `app.js`, D4)
  - `GOAL_STORAGE_KEY`, `loadGoal()`, `renderWeeklyGoal(sessions, today)`; `render()` con un solo `todayKey()` que reciben `renderWeekMinutes` y `renderWeeklyGoal`; valor inicial del campo.
  - Hecho cuando: con el MCP, poniendo a mano `study-diary-weekly-goal` = "0300", " 300 ", "abc", "20000" o borrándola y recargando, se ve el campo y el estado que indica CA-8.4; con `getItem` bloqueado sale "sin objetivo" y el resto del diario funciona; guardar una sesión actualiza "Esta semana" y el progreso a la vez y con la misma cifra.

- [x] **T6. Formulario del objetivo: guardar, quitar y mensajes.** CA-1.6, CA-2.1, RF-3 (CA-3.1 a CA-3.7), CA-4.3, CA-8.1, CA-8.2 (plan §4 `submit`)
  - `saveGoal(minutes)`, `removeGoal()` y el listener `submit` de `#goal-form` según el pseudocódigo del plan.
  - Hecho cuando: con el MCP, "300" guarda "300" y actualiza al momento; "", "   ", "0" y "00" borran la clave, vacían el campo y muestran la invitación; "abc" muestra el mensaje de CA-3.3, conserva el texto y el objetivo anterior y deja el foco en el campo; con `setItem`/`removeItem` bloqueados sale el mensaje de CA-3.4; Intro en el campo no crea ninguna sesión; `study-diary-sessions` es idéntica antes y después.

- [x] **T7. Verificación completa.** RF-1 a RF-8, RNF-1 a RNF-10 (plan §6 "Con el MCP")
  - `node --test` y todos los puntos del plan §6 con el MCP de Chrome DevTools, más la lista de comprobación de la skill `local-dates`.
  - Hecho cuando: `node --test` en verde; cada caso límite de la sección 7 de la spec está comprobado por test o en el navegador (anotar cuál); teclado, árbol de accesibilidad, 375 y 320 px, zoom 200 %, `forced-colors: active` y contrastes revisados; consola sin errores.

- [x] **T8. Cierre: documentación y memoria.** Criterios de finalización de la spec (sección 9)
  - `AGENTS.md`, "Datos": clave `study-diary-weekly-goal` y su formato (texto con los minutos, p. ej. "300"; ausente o no válido = sin objetivo).
  - `AGENTS.md`, "Fechas y racha": objetivo cumplido, porcentaje (redondear el total al minuto y después hacia abajo), "Esta semana" no cuenta sesiones con minutos negativos o no numéricos ni con fecha no válida, y la excepción "el objetivo semanal sí se guarda".
  - `MEMORY.md`: estado, decisiones con su porqué y errores a evitar (máximo ~50 líneas).
  - `spec.md`: "Estado: implementada" y criterios de finalización marcados.
  - Hecho cuando: los cuatro puntos están escritos y revisados por el usuario; commit solo si el usuario lo pide.
