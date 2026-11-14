# Plan 001 — Mapa de calor de estudio

Estado: **aprobado, v2** (2026-11-14). Revisado tras el QA de la spec y el plan juntos (32 hallazgos resueltos; cambios en la sección 10).
Implementa: `specs/001-heat-map/spec.md` (aprobada, v2).
Respeta: `docs/constitution.md`. Las referencias "(P1)…(P6)" remiten a sus principios.

**Permiso para archivos nuevos:** aprobar este plan cuenta como el permiso que pide `AGENTS.md` ("Pregunta antes: crear archivos nuevos"), solo para los archivos marcados como **Crear** en la sección 1.

## 1. Archivos

| Archivo | Acción | Responsabilidad | RF |
|---|---|---|---|
| `logic.js` | **Crear** | Todas las funciones **puras** del diario: fechas, formato, estadísticas existentes (racha, mejor racha, semana, mes) y mapa de calor. No toca el DOM ni lee el reloj: hoy llega como parámetro (P3). Sirve tanto para el navegador como para Node (D1). | RF-1 a 6, 8 |
| `app.js` | Modificar | Solo interfaz: lee el reloj (`todayKey()`) y las sesiones, pinta, guarda qué día está seleccionado y atiende el ratón, el toque y el teclado. Al empezar comprueba que `logic.js` ha cargado (D11). | RF-1, 2, 5, 6, 7, 8 |
| `index.html` | Modificar | Nueva sección entre la racha y el formulario, `<script src="logic.js">` antes de `app.js` y un aviso para cuando no carga (D11). | RF-1, 4, 5, 6 |
| `styles.css` | Modificar | Rejilla, paleta de los 5 niveles, marca de hoy, día seleccionado, foco, leyenda, línea de detalle, alto contraste y zoom. | RF-1, 2, 4, 5; RNF-1 a 5 |
| `tests/heat-map.test.js` | **Crear** | Pruebas del mapa de calor con `node --test` (P4). | RNF-9 y los casos límite |
| `tests/stats.test.js` | **Crear** | Pruebas de las estadísticas que ya existían, para asegurar que siguen igual al pasarlas a `logic.js` (P4). | Las reglas actuales de `AGENTS.md` |
| `AGENTS.md` | Modificar | Estructura con `logic.js` y `tests/`, y reglas del mapa (periodo, sesión válida, redondeo y niveles) en "Fechas y racha" (P2). | Criterio de finalización |
| `MEMORY.md` | Modificar | Estado y decisiones. | — |

El formato de los datos guardados no cambia y no se añade ninguna dependencia (P1, P5).

## 2. Funciones puras (`logic.js`)

Todas trabajan con fechas en texto `"AAAA-MM-DD"` y reciben **hoy como parámetro** (`todayKey`) cuando lo necesitan. Los nombres van en inglés y los comentarios en español (P6).

### Se mueven desde `app.js`, sin cambiar lo que devuelven

| Función | Cambio |
|---|---|
| `toDateKey`, `fromDateKey`, `previousDayKey`, `startOfWeekKey`, `formatMinutes` | Ninguno |
| `formatDate(key)` | Deja de usar `Intl`: usa las listas fijas `WEEKDAY_NAMES` y `MONTH_NAMES`. El texto es idéntico ("jueves, 13 de noviembre de 2026") y no depende del entorno (D8). |
| `calculateStreak(sessions, todayKey)`, `calculateBestStreak(sessions, todayKey)`, `calculateWeekMinutes(sessions, todayKey)`, `calculateMonthStudyDays(sessions, todayKey)` | Reciben **hoy como parámetro** en vez de leer el reloj (P3, D10). La lógica no cambia. |

`todayKey()` **se queda en `app.js`**: es la única función que lee el reloj, y la interfaz se lo pasa a las demás.

### Nuevas

| Función | Entrada → salida | RF |
|---|---|---|
| `addDaysKey(key, n)` | Suma o resta `n` días con `setDate`, nunca con milisegundos | RF-1, RNF-6 |
| `isValidDateKey(value)` | `true` si es un texto `AAAA-MM-DD` de un día real (pasar a `Date` y volver da el mismo texto) | RF-3 |
| `parseMinutes(value)` | `Number(value)` si es finito y mayor que 0; si no, `0` | RF-3 |
| `isValidSession(session)` | Fecha válida y `parseMinutes(minutes) > 0` | RF-3 |
| `getHeatMapPeriod(todayKey)` | `{ startKey, endKey }`: el lunes de hace 11 semanas y hoy | RF-1 |
| `isInPeriod(dateKey, todayKey)` | `true` si `startKey ≤ dateKey ≤ todayKey` | RF-5, 7 |
| `sumMinutesByDay(sessions, startKey, endKey)` | Un objeto `{ fecha: minutos }` con las sesiones válidas del periodo, y cada total **redondeado** con `Math.round` | RF-2, RF-3 |
| `minutesToLevel(minutes)` | 0–4 según `LEVEL_LIMITS` | RF-4 |
| `getLevelRanges()` | `["0 min", "1–29", "30–59", "60–119", "120+"]`, generado a partir de `LEVEL_LIMITS` para la leyenda (D9) | RF-4 |
| `buildHeatMap(sessions, todayKey)` | El modelo completo del mapa (sección 3) | RF-1 a 4, 6 |
| `describeDay(dateKey, minutes)` | "jueves, 12 de noviembre de 2026: 1 h 30 min" o "…: sin estudio". Recibe minutos ya redondeados. | RF-5 |
| `moveSelection(dateKey, keyName, todayKey)` | La nueva fecha al pulsar `ArrowLeft`/`ArrowRight` (±7) o `ArrowUp`/`ArrowDown` (±1 dentro de la misma semana). Con cualquier otra tecla, o si el destino no existe, devuelve la misma fecha. | CA-5.5 |

**Constantes:**
- `HEAT_MAP_WEEKS = 12`
- `LEVEL_LIMITS = [30, 60, 120]`
- `MONTH_SHORT = ["ene", …, "dic"]`
- `MONTH_NAMES = ["enero", …]`
- `WEEKDAY_NAMES = ["domingo", "lunes", …]`

**Regla de nombres (D12):** cada nombre se declara **solo una vez** entre `logic.js` y `app.js`. Lo que se mueve a `logic.js` se borra de `app.js` en el mismo paso, y se comprueba con una búsqueda de los nombres.

## 3. Algoritmo del mapa (pseudocódigo)

```
función buildHeatMap(sesiones, hoy):
    si sesiones no es una lista: sesiones ← lista vacía                         (CA-8.3)
    { inicio, fin } ← getHeatMapPeriod(hoy)                                      (RF-1)
        inicio ← addDaysKey(startOfWeekKey(hoy), -77)   (11 semanas × 7)
        fin    ← hoy
    minutosPorDía ← sumMinutesByDay(sesiones, inicio, fin)                       (RF-3)
        para cada sesión:
            si no es válida → saltar                                             (CA-3.2)
            si fecha < inicio o fecha > fin → saltar                             (CA-2.3)
            total[fecha] += parseMinutes(minutos)                                (CA-3.1)
        para cada fecha: total[fecha] ← redondear(total[fecha])                  (sección 4 de la spec)
    semanas ← [];  etiquetasMes ← [];  hayEstudio ← falso
    lunes ← inicio;  mesAnterior ← ninguno
    para columna c = 0..11:                                                      (CA-1.2)
        mesDelLunes ← mes de lunes
        si c = 0 o mesDelLunes ≠ mesAnterior:                                    (CA-1.5)
            añadir { columna: c, texto: MONTH_SHORT[mesDelLunes] } a etiquetasMes
        mesAnterior ← mesDelLunes
        días ← lista de 7
        para fila f = 0..6 (lunes..domingo):                                     (CA-1.3)
            fecha ← addDaysKey(lunes, f)
            si fecha > hoy: días[f] ← nada (hueco)                               (CA-2.1)
            si no:
                min ← minutosPorDía[fecha] o 0
                días[f] ← { fecha, minutos: min, nivel: minutesToLevel(min),
                            esHoy: fecha = hoy }                                 (CA-4.1, CA-2.2)
                si min > 0: hayEstudio ← verdadero                               (RF-6)
        añadir días a semanas
        lunes ← addDaysKey(lunes, 7)
    si etiquetasMes tiene etiqueta en la columna 0 y en la 1: quitar la de la 0 (CA-1.5)
    devolver { semanas, etiquetasMes, hayEstudio, inicio, fin }
```

```
función moveSelection(fecha, tecla, hoy):
    si tecla es ArrowLeft:  destino ← addDaysKey(fecha, -7)
    si tecla es ArrowRight: destino ← addDaysKey(fecha, +7)
    si tecla es ArrowUp:    si fecha es lunes:  devolver fecha;  destino ← addDaysKey(fecha, -1)
    si tecla es ArrowDown:  si fecha es domingo: devolver fecha;  destino ← addDaysKey(fecha, +1)
    otra tecla: devolver fecha                                                   (CA-5.5)
    si no isInPeriod(destino, hoy): devolver fecha
    devolver destino
```

Notas:
- **Cambio de hora:** todas las fechas salen de `addDaysKey`, que usa `setDate`. Así ningún día se duplica ni se salta (RNF-6).
- **Etiquetas de mes:** se basan en los lunes, que nunca son futuros, así que no puede salir un mes sin casillas. Dos meses distintos están separados al menos por 4 columnas, salvo entre las columnas 0 y 1, y ese caso se resuelve quitando la etiqueta de la columna 0.
- **Rendimiento:** una sola pasada por las sesiones (O(n)) más 84 casillas (RNF-7).

## 4. Cómo se pinta en la interfaz

### Accesibilidad (D5): patrón de rejilla ARIA con `aria-activedescendant`
- El contenedor es `role="grid"` con `tabindex="0"`: es la única parada de Tab.
- Con `role="grid"`, los lectores de pantalla pasan a modo foco, así que **las flechas llegan al mapa** también si el lector estaba en modo lectura (CA-5.6).
- El foco **no se mueve** de la rejilla. `aria-activedescendant` apunta al id de la casilla seleccionada, y el lector lee su `aria-label` cada vez que cambia.
- Cada casilla tiene `role="gridcell"` y un `aria-label` con el texto completo de `describeDay`. Así se puede leer también al recorrer la página sin entrar en el mapa (CA-5.8).
- La línea de detalle es **solo visual**: no lleva `aria-live`. Por eso pasar el ratón por encima no genera anuncios (CA-5.9), y al usar el teclado no se lee nada dos veces.
- La fila de meses y las letras L, X y V llevan `aria-hidden="true"`, porque cada casilla ya dice su fecha completa.

### HTML (sección nueva entre la racha y el formulario)
```
<section class="heat-map-section" aria-labelledby="heat-map-title">
  h2#heat-map-title "Últimas 12 semanas"                                (CA-6.1)
  p#heat-map-empty  mensaje de CA-6.2                                   (RF-6)
  div.heat-map-scroll                 (desplazamiento solo con zoom, RNF-4)
    div#heat-map role="grid" tabindex="0"
         aria-label="Mapa de calor de las últimas 12 semanas"
         aria-activedescendant="…"                                      (CA-5.5, 5.6)
  div#heat-map-legend                 (lo rellena el JS con getLevelRanges)  (CA-4.3)
  p#heat-map-detail                   (línea de detalle, solo visual)   (CA-5.1)
</section>
```
Además, al principio de `<main>` va un `p#load-error` oculto: "No se ha podido cargar la aplicación. Recarga la página." (D11).

### Estructura que genera `renderHeatMap(sessions)` en `app.js` (orden por filas, para ARIA)
```
div.heat-months  aria-hidden    → 12 huecos, con texto solo en las columnas con etiqueta   (CA-1.5)
div role="row"  (×7, lunes..domingo; display: contents)                                    (CA-1.3)
    span.heat-day-label aria-hidden  → "L", "", "X", "", "V", "", "" (filas 0, 2 y 4)       (CA-1.4)
    ×12: div role="gridcell" id="day-AAAA-MM-DD" class="heat-cell level-N [is-today] [is-selected]"
         data-date aria-label=describeDay(...)            o bien un div vacío (día futuro)  (RF-2, RF-4)
```
- El modelo está por semanas (columnas) y el HTML se genera por filas, recorriendo `semanas[c].días[f]`. La rejilla CSS los coloca como columnas.
- `display: contents` en las filas mantiene la rejilla de CSS y conserva el rol ARIA en los navegadores modernos. Se comprueba con el árbol de accesibilidad del MCP.

### Pasos de `renderHeatMap(sessions)`
1. `today = todayKey()` y `model = buildHeatMap(sessions, today)`.
2. Si `selectedDateKey` está fuera del periodo, por ejemplo al pasar la medianoche, vuelve a `today` (CA-5.2).
3. Se vacía `#heat-map` y se vuelve a construir, igual que la lista de sesiones (D7), y se pone `aria-activedescendant`.
4. Se rellena la leyenda con `getLevelRanges()` y una muestra de color por nivel (CA-4.3, D9).
5. Se muestra u oculta `#heat-map-empty` según `model.hasStudy` (RF-6).
6. `#heat-map-detail` ← `describeDay` del día seleccionado (CA-5.1).

### Estado de la interfaz
`selectedDateKey` empieza en hoy (CA-5.2) y **no se guarda** en el almacenamiento (CA-8.1).

### Interacción (un listener por tipo de evento en `#heat-map`, que delega en las casillas, D6)
- **`mouseover` y `click`** sobre una casilla con `data-date`: seleccionan esa fecha. Funciona igual con ratón, dedo y lápiz (CA-5.3).
- **`keydown`:**
  - Si `moveSelection` devuelve una fecha distinta, se selecciona y se hace `preventDefault()` para que la página no se desplace.
  - Las demás teclas no se tocan, y Tab sale con normalidad (CA-5.5).
- **`select(fecha)`** solo hace tres cosas (CA-5.7):
  - mover la clase `is-selected`;
  - actualizar `aria-activedescendant`;
  - actualizar la línea de detalle.
- **Al guardar una sesión:** el formulario pone `selectedDateKey` en la fecha guardada si `isInPeriod`, llama a `render()` y el foco vuelve a "Tema", como ahora (CA-7.1).

### CSS
- **Rejilla** (RNF-1):
  - `#heat-map` es `display: grid` con las columnas `auto repeat(12, minmax(0, 32px))` y `gap: 4px`.
  - Las casillas tienen `aspect-ratio: 1`.
  - A 375 px quedan unos 315 px útiles: casillas de unos 21 px, con centros separados unos 25 px. A 320 px caben sin desplazamiento.
- **Paleta** (RNF-2, contrastes calculados frente al papel `#fbfcfe`):

  | Nivel | Color | Contraste |
  |---|---|---|
  | 0 | relleno `#eef2f8` y borde `#8290a8` | borde 3,15:1 |
  | 1 | `#7690c7` | 3,11:1 |
  | 2 | `#4f6db5` | 4,89:1 |
  | 3 | `#2f4fa0` | 7,45:1 |
  | 4 | `#1b3a8c` (la tinta) | 10,07:1 |

- **Hoy** (CA-2.2): un punto central de unos 6 px hecho con `::after`.
  - En los niveles 0 y 1, el punto es azul tinta: contraste de 9,21:1 y 3,24:1.
  - En los niveles 2 a 4, el punto es del color del papel: 4,89:1, 7,45:1 y 10,07:1.
- **Día seleccionado:** `outline: 2px solid var(--ink)` con `outline-offset: 1px`. Se dibuja por fuera, sobre el hueco de 4 px, con 10,07:1 frente al papel. Como el punto de hoy va por dentro, las dos marcas nunca se pisan.
- **Foco del mapa:** `#heat-map:focus-visible` lleva un contorno en el contenedor, no en la casilla. Así no hay tres marcas sobre la misma casilla.
- **Alto contraste** (RNF-3), con `@media (forced-colors: active)`:
  - las casillas llevan un borde `CanvasText`;
  - el día seleccionado, un contorno `Highlight`;
  - el punto de hoy, el color `CanvasText`.
- **Zoom:** `.heat-map-scroll { overflow-x: auto }` solo actúa si el contenido no cabe (RNF-4).

## 5. Decisiones técnicas

| # | Decisión | Por qué | Alternativa descartada |
|---|---|---|---|
| D1 | La lógica va en un `logic.js` cargado con un `<script>` normal y que se exporta a Node con `if (typeof module !== "undefined") module.exports = {...}` | Funciona con `file://` (P1) y en `node --test` (P4) sin módulos ES ni build | **Módulos ES:** en `file://` los bloquea el navegador. **Copiar las funciones en el test:** se podrían desincronizar del código real. |
| D2 | `logic.js` no lee el reloj: hoy llega siempre como parámetro | Pruebas deterministas con cualquier "hoy" (P3) | **`new Date()` dentro:** habría que falsear el reloj en cada test. |
| D3 | El modelo del mapa (`buildHeatMap`) es un dato, separado del pintado | Se prueba sin DOM (P3) | **Calcular mientras se pinta:** no se podría probar con `node --test`. |
| D4 | Línea de detalle fija y solo visual en vez de un globo flotante | Nunca se sale de la pantalla y no hay nada que cerrar (CA-5.1, 5.3) | **Globo flotante:** se desborda en los bordes y en el móvil hay que gestionar cuándo cerrarlo. |
| D5 | Rejilla ARIA (`role="grid"`) con `aria-activedescendant` y `aria-label` en cada casilla | Las flechas funcionan aunque el lector esté en modo lectura; el foco no se mueve; las casillas se pueden leer; el ratón no anuncia nada (CA-5.5, 5.6, 5.8, 5.9) | **`role="group"` y `aria-live`:** el lector se queda las flechas y el ratón genera anuncios. **84 botones con "roving tabindex":** más código y 84 elementos que reciben foco. |
| D6 | Delegación de eventos en el contenedor | 3 listeners en total; se vuelven a pintar sin duplicarlos | **Un listener por casilla:** más código y riesgo de duplicarlos en cada pintado. |
| D7 | Se vuelve a pintar entero el mapa en cada `render()` | 84 casillas no cuestan nada; es el mismo patrón que la lista | **Actualizar solo la casilla que cambia:** más complejo y sin beneficio apreciable. |
| D8 | Nombres de días y meses en listas fijas, también en `formatDate` | Mismo resultado en cualquier navegador y en Node; los tests no dependen de los datos de idiomas instalados | **`Intl`/`toLocaleDateString`:** varía según el entorno ("nov." con punto, Node sin datos de idiomas…). |
| D9 | Los tramos están en una constante (`LEVEL_LIMITS`) y la leyenda se genera con `getLevelRanges()` | Una sola fuente de verdad para la lógica, la leyenda y los tests | **Leyenda escrita a mano en el HTML:** se puede desincronizar. |
| D10 | Las `calculate*` existentes pasan a `logic.js` y reciben hoy como parámetro, con tests en `tests/stats.test.js` | La constitución no admite cambios que incumplan P3, y P4 pide probar las reglas de cálculo | **Dejarlas como deuda:** incumpliría la constitución en el mismo cambio que la aplica. |
| D11 | `app.js` empieza comprobando `typeof buildHeatMap === "function"`; si no, muestra `#load-error` y se detiene | Si `logic.js` falta o tiene un error, el usuario ve un aviso en vez de una página que no funciona | **No comprobarlo:** la app fallaría sin ninguna explicación. |
| D12 | Cada nombre se declara una sola vez entre los dos scripts | Dos `const` con el mismo nombre rompen la app al cargar, y dos funciones iguales se pisan sin avisar | **Confiar en que no pase:** el error solo se vería en el navegador. |
| D13 | Redondear los minutos del día en `sumMinutesByDay` | El nivel, la leyenda y el detalle coinciden siempre, y se evitan los errores de sumar decimales | **Redondear solo el texto:** un día de color diría "0 min". |

## 6. Estrategia de tests (`node --test`)

- **Archivos:** `tests/heat-map.test.js` y `tests/stats.test.js`. Usan `require("node:test")`, `require("node:assert/strict")` y `require("../logic.js")`. No hace falta instalar nada (P4).
- **Cómo se lanza:** `node --test` desde la raíz, como dice `AGENTS.md`. Node ejecuta cada archivo en un proceso aparte, así que lo que configure uno no afecta a los demás.
- **Zona horaria:** la primera línea de cada test es `process.env.TZ = "Europe/Madrid"`, antes del `require`. Así el resultado no depende de la zona del ordenador y se pueden probar los cambios de hora reales. Comprobado: funciona en Windows con Node v26. Como `formatDate` ya no usa `Intl` (D8), los textos tampoco dependen de los datos de idiomas.
- **Hoy fijo en cada test** (D2).
- **Idioma:** los nombres de los `test(...)` y los mensajes de las comprobaciones van en español; el código, en inglés (P6).
- **Rendimiento:** es una prueba de verdad (no orientativa) con 5000 sesiones y un límite de 100 ms. En la práctica tarda unos pocos milisegundos, así que el margen es grande. Si falla, es una regresión real.

### `tests/heat-map.test.js`

| Grupo | Casos | Cubre |
|---|---|---|
| Periodo | Hoy lunes → 78 días y el inicio es un lunes; hoy domingo → 84 días; un periodo que cruza el cambio de año | RF-1, CA-2.1 |
| Fechas válidas | `"2026-11-12"` ✓; `"2026-02-30"` ✗; `"2028-02-29"` ✓; `"2026-2-3"` ✗; vacía, `null` o número ✗ | RF-3 |
| Minutos | `45` y `"45"` → 45; `12.5` → 12,5; `0`, `-5`, `"abc"`, `NaN`, `null` → 0 | RF-3 |
| Suma y redondeo | Dos sesiones el mismo día se suman; 12,5 → 13; 0,3 → 0; 29,9999 → 30; las no válidas, futuras o anteriores al periodo se ignoran | RF-2, RF-3, D13 |
| Niveles y leyenda | 0→0, 1→1, 29→1, 30→2, 59→2, 60→3, 119→3, 120→4, 1441→4; `getLevelRanges()` coincide con `LEVEL_LIMITS` | RF-4 |
| Modelo | 12 semanas × 7; `null` después de hoy; `isToday` solo en hoy; `hasStudy` falso con sesiones no válidas o con 0,3 min; entrada `null` o no lista → mapa vacío | RF-1, 2, 6, CA-8.3 |
| Etiquetas de mes | Lunes de un mes nuevo → etiqueta; día 1 futuro → sin etiqueta; columnas 0 y 1 → solo la de la 1; cruce de diciembre a enero | CA-1.5 |
| Cambio de hora | Periodos que incluyen el 29/03/2026 y el 25/10/2026: 84 fechas distintas y consecutivas | RNF-6 |
| Detalle | 90 → "…: 1 h 30 min"; 0 → "…: sin estudio"; 100 000 → "1666 h 40 min"; `formatDate` da exactamente "jueves, 12 de noviembre de 2026" | RF-5, D8 |
| Teclado | Izquierda y derecha ±7; arriba desde un lunes y abajo desde un domingo no se mueven; no pasa de hoy ni del inicio; `Enter` o `a` no cambian nada | CA-5.5 |
| Datos intactos | `buildHeatMap` no modifica la lista que recibe | CA-8.2 |
| Rendimiento | 5000 sesiones → menos de 100 ms | RNF-7 |

### `tests/stats.test.js` (lo que ya existía no cambia)
- **Racha:** hoy con sesión; hoy sin sesión pero ayer sí (sigue viva); varias sesiones el mismo día cuentan como 1; las fechas futuras no cuentan.
- **Mejor racha:** la serie más larga del historial, sin contar las futuras.
- **Semana:** suma desde el lunes; varias sesiones el mismo día se suman todas.
- **Mes:** días distintos desde el día 1 hasta hoy.

### Lo que no cubre `node --test`, y se verifica con el MCP de Chrome DevTools (P4)
- el pintado;
- el ratón, el toque y el teclado reales;
- el árbol de accesibilidad: rejilla, filas, casillas y `aria-activedescendant`;
- la actualización al guardar (RF-7);
- la vista a 375 y 320 px;
- el zoom al 200 %;
- el alto contraste (con `emulate`);
- el aviso cuando `logic.js` no carga;
- la consola sin errores;
- que las sesiones ya guardadas siguen intactas.

## 7. Cobertura de requisitos

| RF | Dónde se resuelve |
|---|---|
| RF-1 Periodo y disposición | `getHeatMapPeriod`, `buildHeatMap`, la rejilla CSS, las filas ARIA, las letras L/X/V y las etiquetas de mes |
| RF-2 Futuros y hoy | `buildHeatMap` (`null` e `isToday`), `sumMinutesByDay` y el punto de `.is-today` |
| RF-3 Datos de cada día | `isValidDateKey`, `parseMinutes`, `isValidSession` y `sumMinutesByDay` (con redondeo) |
| RF-4 Intensidad | `minutesToLevel`, `LEVEL_LIMITS`, `getLevelRanges`, la paleta y la leyenda generada |
| RF-5 Detalle | `describeDay`, `moveSelection`, la rejilla ARIA, la línea de detalle visual y los eventos delegados |
| RF-6 Sin estudio | `hasStudy`, `#heat-map-empty` y el título |
| RF-7 Actualización | `render()` al cargar y al guardar, con selección del día guardado |
| RF-8 Datos | Solo lectura; `buildHeatMap` no modifica la entrada; con datos ilegibles, `loadSessions` devuelve `[]` y se muestra el estado de RF-6 (CA-8.3) |

## 8. Orden de implementación (un solo commit al final, P2)

1. **Lógica:**
   - Crear `logic.js`: mover las funciones de fechas y formato (con `formatDate` sin `Intl`) y las `calculate*` con hoy como parámetro.
   - Cargar `logic.js` en `index.html`, borrar las copias de `app.js` (D12) y pasar `todayKey()` en las llamadas.
   - Crear `tests/stats.test.js`.
   - Actualizar la estructura en `AGENTS.md`.
   - Comprobar: `node --test` pasa y, con el MCP, la app se ve y funciona igual que antes.
2. **Mapa:**
   - Añadir las funciones del mapa a `logic.js` y crear `tests/heat-map.test.js`.
   - Añadir el HTML, el CSS y `renderHeatMap` con la interacción.
   - Añadir las reglas del mapa a `AGENTS.md`.
3. **Verificar:**
   - `node --test`.
   - Con el MCP de Chrome DevTools: todos los puntos de la sección 6, más la lista de comprobación de la skill `local-dates`.
4. **Cerrar:** actualizar `MEMORY.md` y hacer **un solo commit** con el código, los tests, `AGENTS.md` y la memoria (P2).

## 9. Riesgos

- **`display: contents` en las filas ARIA:** algunos navegadores antiguos pierden el rol. Se comprueba con el árbol de accesibilidad del MCP. Si falla, la alternativa es generar las filas con `display: grid` y `subgrid`.

## 10. Cambios de la v2 (QA de la spec y el plan juntos)

| Hallazgos | Solución |
|---|---|
| 1, 18 | Paleta con colores concretos y contrastes calculados; el punto de hoy va por dentro y el contorno del seleccionado por fuera |
| 2 | El foco se marca en el contenedor, no en la casilla |
| 3 | Las letras van en las filas 0, 2 y 4 (lunes, miércoles y viernes) |
| 4, 5 | `keyName` explícito; arriba y abajo no cambian de columna; las demás teclas se ignoran |
| 6, 7, 11 | Las etiquetas de mes se basan en los lunes y no se solapan en las columnas 0 y 1 |
| 8 | La prueba de rendimiento es real, con mucho margen |
| 9 | Los textos de los tests van en español |
| 10, 19, 20, 21 | Rejilla ARIA con `aria-activedescendant`, `aria-label` en cada casilla y sin `aria-live` |
| 12, 27 | `formatDate` sin `Intl`, y la zona horaria fija antes del `require` |
| 13 | La leyenda se genera a partir de `LEVEL_LIMITS` |
| 14, 15, 22 | Los minutos del día se redondean (D13) |
| 16, 17 | Quedan como diferencias aceptadas en la spec (solo con datos dañados o antiguos) |
| 23, 26 | Casos límite añadidos en la spec |
| 24 | Aviso `#load-error` (D11) |
| 25 | Regla de nombres únicos (D12) |
| 28 | Las `calculate*` reciben hoy como parámetro y tienen tests (D10) |
| 29, 30 | `AGENTS.md` se actualiza en el mismo paso en que cambia la estructura; un solo commit al final |
| 31 | Aprobar el plan da permiso para los archivos marcados como **Crear** |
| 32 | El paso 1 incluye la verificación con el MCP |
