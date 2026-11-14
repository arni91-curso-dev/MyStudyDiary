# Tareas 001 — Mapa de calor de estudio

Basadas en `plan.md` (aprobado, v2). Cada tarea:
- se hace con los tests primero;
- termina con `node --test` en verde;
- se marca aquí al acabar.

El commit es único y se hace al final (T9), como dice el plan (P2).

- [x] **T1. Lógica existente a `logic.js`** (hecha el 2026-11-14: 17 tests en verde y verificada con el MCP) (plan §2 "Se mueven", D1, D2, D8, D10, D11, D12)
  - Crear `tests/stats.test.js` para `toDateKey`, `fromDateKey`, `previousDayKey`, `startOfWeekKey`, `formatDate` (texto exacto, sin `Intl`), `formatMinutes` y las cuatro `calculate*` con hoy como parámetro.
  - Crear `logic.js` con esas funciones y cargarlo en `index.html` antes de `app.js`.
  - Borrar las copias de `app.js` y pasarles `todayKey()` en las llamadas.
  - Comprobar al cargar que `logic.js` existe; si no, mostrar `#load-error`.
  - Actualizar la estructura en `AGENTS.md`.
  - Verificar: `node --test` y, con el MCP, que la app se ve y funciona igual.
  - **RF:** ninguno del mapa directamente. Prepara la base para todos: RNF-9 y CA-8.2 (los datos y el comportamiento no cambian).
- [x] **T2. Validez y periodo** (hecha) (plan §2)
  - `addDaysKey`, `isValidDateKey`, `parseMinutes`, `isValidSession`, `getHeatMapPeriod` e `isInPeriod`, con sus tests.
  - **RF:** RF-1, RF-3 y RNF-6.
- [x] **T3. Minutos y niveles** (hecha) (plan §2, D9, D13)
  - `sumMinutesByDay` (con redondeo), `minutesToLevel`, `getLevelRanges` y `LEVEL_LIMITS`, con sus tests.
  - **RF:** RF-2, RF-3 y RF-4.
- [x] **T4. Modelo del mapa** (hecha) (plan §3)
  - `buildHeatMap` con semanas, huecos, hoy, `hasStudy` y etiquetas de mes, con sus tests (incluidos el cambio de hora, el cambio de año y el rendimiento).
  - **RF:** RF-1, RF-2, RF-4, RF-6, CA-8.2, CA-8.3 y RNF-7.
- [x] **T5. Detalle y teclado** (hecha) (plan §2)
  - `describeDay` y `moveSelection`, con sus tests.
  - **RF:** RF-5.
- [x] **T6. Estructura y estilos** (hecha) (plan §4: HTML y CSS)
  - La sección en `index.html` y los estilos de la rejilla, la paleta, hoy, el seleccionado, el foco, la leyenda, el alto contraste y el zoom.
  - **RF:** RF-1, RF-2, RF-4, RF-6, y RNF-1 a RNF-5.
- [x] **T7. Pintado e interacción** (hecha) (plan §4: `renderHeatMap`, D5, D6, D7)
  - Rejilla ARIA, leyenda generada, línea de detalle, ratón, toque, teclado y la selección del día guardado.
  - **RF:** RF-5, RF-7 y RF-8.
- [x] **T8. Verificación completa** (hecha: 47 tests y verificación con el MCP) (plan §6)
  - `node --test`.
  - Con el MCP: todo lo de la sección 6 del plan.
  - La lista de comprobación de `local-dates`.
  - **RF:** RF-1 a RF-8, como comprobación final.
- [x] **T9. Cierre** (hecha) (plan §8)
  - Reglas del mapa en `AGENTS.md`, `MEMORY.md` y **un solo commit**.
  - **RF:** criterios de finalización de la spec.
