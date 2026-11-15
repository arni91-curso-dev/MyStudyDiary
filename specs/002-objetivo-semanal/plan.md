# Plan 002 — Objetivo semanal de estudio

Estado: **aprobado**.
Implementa: `specs/002-objetivo-semanal/spec.md` (aprobada).
Respeta: `docs/constitution.md`. Las referencias "(P1)…(P6)" remiten a sus principios.

**Archivos nuevos:** solo **uno**, `tests/weekly-goal.test.js` (Q1 resuelta: se creó).

## 1. Archivos

| Archivo | Acción | Responsabilidad | RF |
|---|---|---|---|
| `logic.js` | Modificar | `calculateWeekMinutes` deja de contar sesiones dañadas. Nuevas funciones puras: validar el objetivo y construir el modelo del progreso. Sin DOM, sin localStorage, sin reloj (P3). | RF-2, RF-4, RF-5, RF-6, RF-7, CA-8.3, CA-8.4, CA-8.6, RNF-10 |
| `app.js` | Modificar | Leer, guardar y borrar la clave `study-diary-weekly-goal`; pintar el bloque; atender el formulario del objetivo; un solo "hoy" por `render()`. | RF-1, RF-3, RF-4, RF-5, RF-6, CA-4.3, RF-8 |
| `index.html` | Modificar | Bloque "Objetivo semanal" justo debajo de "Esta semana" (dentro de `.stats`, antes de "Este mes"), con su propio `<form>`. | RF-1, CA-3.5, RNF-2, RNF-3 |
| `styles.css` | Modificar | Estilos del bloque, barra, mensajes, móvil, zoom y alto contraste. | RNF-1, RNF-4 a RNF-7 |
| `tests/stats.test.js` | Modificar | Casos nuevos de `calculateWeekMinutes` (datos dañados, semanas límite). | RF-7, RNF-8 |
| `tests/weekly-goal.test.js` | Crear (Q1 resuelta) | Tests de validación y progreso del objetivo. | RF-2, RF-4 a RF-6, RNF-10 |
| `AGENTS.md` | Modificar (última tarea) | Lo que pide la sección 9 de la spec (Datos y Fechas y racha). | Criterios de finalización |
| `MEMORY.md` | Modificar (última tarea) | Estado, decisiones y errores a evitar. | — |
| `specs/002-objetivo-semanal/spec.md` | Modificar (última tarea) | "Estado: implementada" y marcar los criterios de finalización cumplidos. | — |

No se añade ninguna dependencia ni paso de build (P1). La clave `study-diary-sessions` no se toca (P5, CA-8.2); la clave nueva es independiente.

## 2. Funciones puras (`logic.js`)

Reciben **hoy** (`todayKey`) y el **valor en bruto** del objetivo como parámetros (RNF-10). Nombres en inglés, comentarios en español (P6).

### Se modifica

| Función | Cambio | RF |
|---|---|---|
| `calculateWeekMinutes(sessions, todayKey)` | Solo suma las sesiones que pasan `isValidSession(session)` (objeto, `isValidDateKey(date)` y `parseMinutes(minutes) > 0`) y cuya fecha está entre `startOfWeekKey(todayKey)` y `todayKey`. Suma `parseMinutes(session.minutes)` en lugar de `Number(...) \|\| 0`. Así ignora minutos negativos, no numéricos, vacíos o ausentes, fechas mal escritas o inexistentes y fechas futuras; el total nunca es negativo. Las sesiones de 0 min se excluyen, pero sumarían 0, así que el resultado es el mismo que dice la spec. | CA-7.1, CA-7.2, CA-7.3, RNF-8 |

Reutiliza `isValidSession`, `isValidDateKey`, `parseMinutes` y `startOfWeekKey`, ya probadas (incluidos domingo, cruce de año y cambio de hora). Las declaraciones `function` se elevan, así que da igual que `isValidSession` esté más abajo en el archivo.

**Tests actuales:** ninguno cambia. El único test de semana ("suma desde el lunes hasta hoy…", 95 min) solo usa datos válidos y sigue en verde. La spec cambia el comportamiento solo con datos dañados, que hoy no tienen test.

### Nuevas

| Nombre | Entrada → salida | RF |
|---|---|---|
| `MAX_WEEKLY_GOAL` | Constante `10080` (minutos de una semana). | CA-2.3 |
| `parseWeeklyGoal(rawValue)` | Clasifica un valor en bruto (texto del campo o lo leído de localStorage) en `{ status: "valid", minutes }`, `{ status: "remove" }` o `{ status: "error" }`. Algoritmo en la sección 3. | RF-2, CA-8.3, CA-8.4 |
| `calculateGoalPercent(totalMinutes, goalMinutes)` | Recibe el total **ya redondeado** y el objetivo. Devuelve `Math.min(100, Math.floor(totalMinutes * 100 / goalMinutes))`. Se multiplica antes de dividir: con enteros, si el cociente exacto es entero, el resultado es exacto (300 × 100 / 300 = 100, sin 99,999…). | Sección 4 de la spec, CA-4.1, CA-4.2 |
| `buildWeeklyGoalProgress(sessions, todayKey, rawGoal)` | Modelo del bloque. Si `parseWeeklyGoal(rawGoal)` no es `valid` → `{ hasGoal: false }`. Si lo es → `{ hasGoal: true, goalMinutes, totalMinutes, percent, isMet, text }` (sección 3). | RF-4, RF-5, RF-6, CA-7.1, CA-8.6 |

Reutiliza `formatMinutes` para el texto (sección 4 de la spec) y `calculateWeekMinutes` para el total (CA-7.1: el mismo cálculo que "Esta semana").

**Regla de nombres (AGENTS.md):** cada nombre nuevo se declara una sola vez entre `logic.js` y `app.js`, y se añade a `module.exports`. Se comprueba con una búsqueda antes de terminar cada tarea.

## 3. Algoritmo (pseudocódigo)

```
función parseWeeklyGoal(valor):
    si valor no es texto: devolver { status: "error" }        (null de localStorage → sin objetivo, CA-8.4)
    texto ← valor sin espacios ni tabuladores al principio y al final
            (regex /^[ \t]+|[ \t]+$/g; no se usa trim(): quitaría también saltos de línea
             y otros espacios que la spec no menciona)                                 (CA-2.2)
    si texto = "": devolver { status: "remove" }                                        (CA-2.4)
    si texto no cumple /^[0-9]+$/: devolver { status: "error" }                         (CA-2.5)
        ("+300", "-0", "1.000", "1e3", "12,5", "300 min", "abc" fallan aquí)
    número ← Number(texto)            ("0300" → 300; "00" → 0)                          (CA-2.3)
    si número = 0: devolver { status: "remove" }                                        (CA-2.4)
    si número > MAX_WEEKLY_GOAL: devolver { status: "error" }   ("10081", "20000")      (CA-2.5)
    devolver { status: "valid", minutes: número }                                       (CA-2.3)
```

```
función buildWeeklyGoalProgress(sesiones, hoy, objetivoEnBruto):
    resultado ← parseWeeklyGoal(objetivoEnBruto)
    si resultado.status ≠ "valid": devolver { hasGoal: falso }                          (RF-5, CA-8.3)
    objetivo ← resultado.minutes
    total ← redondear(calculateWeekMinutes(sesiones, hoy))                              (sección 4, CA-7.1)
    cumplido ← total ≥ objetivo                                                         (sección 4)
    si cumplido:
        porcentaje ← 100                                                                (CA-6.2)
        texto ← formatMinutes(total) + " / " + formatMinutes(objetivo)                  (CA-6.2)
    si no:
        porcentaje ← calculateGoalPercent(total, objetivo)                              (CA-4.1)
        texto ← formatMinutes(total) + " / " + formatMinutes(objetivo) + " (" + porcentaje + " %)"
    devolver { hasGoal: verdadero, goalMinutes: objetivo, totalMinutes: total,
               percent: porcentaje, isMet: cumplido, text: texto }
```

Ejemplos que salen de aquí (sección 7 de la spec): 299 → "4 h 59 min / 5 h (99 %)"; 299,6 → 300 → "5 h / 5 h", cumplido; 100,4 → 100 → "1 h 40 min / 5 h (33 %)"; 100 000 → "1666 h 40 min / 5 h", cumplido; objetivo 10 080 y total 10 079 → "167 h 59 min / 168 h (99 %)".

## 4. Interfaz

### HTML (dentro de `.stats`, entre `.week-minutes` y `.month-days`)
```
<section id="weekly-goal" class="weekly-goal" aria-labelledby="weekly-goal-title">
  h2#weekly-goal-title "Objetivo semanal"                                   (CA-1.1)
  form#goal-form novalidate                                                 (CA-1.2, CA-1.6)
    label for="goal-input" "Objetivo semanal (min)"                         (CA-1.2, RNF-2)
    input#goal-input type="text" inputmode="numeric" autocomplete="off"
          aria-describedby="goal-error"                                     (CA-1.3, RNF-3)
    p#goal-error.error role="alert"        (único espacio de mensajes)      (CA-3.5, RNF-3)
    button type="submit" "Guardar objetivo"                                 (CA-1.2)
  div#goal-status aria-live="polite"                                        (RNF-3)
    p#goal-invite  "Fija un objetivo semanal para ver cuánto te falta cada semana."   (CA-5.1)
    p#goal-progress-text                                                    (CA-4.1, CA-6.2)
    p#goal-done    "¡Objetivo cumplido!"                                    (CA-6.1)
  div.goal-bar aria-hidden="true"                                           (CA-4.2, RNF-3)
    div#goal-bar-fill.goal-bar-fill  (ancho = porcentaje %)
</section>
```
- Es un `<form>` aparte, hermano del de "Nueva sesión" (no anidado), así que Intro en el campo solo envía el del objetivo (CA-1.6).
- `type="text"` (no `number`) para que el navegador no valide ni bloquee caracteres y los mensajes sean siempre los del diario (CA-1.3). `novalidate` por la misma razón. `inputmode="numeric"` solo cambia el teclado del móvil.
- Los textos de `#goal-status` se muestran u ocultan con `hidden`; los textos fijos (invitación y "¡Objetivo cumplido!") están en el HTML.

### `app.js`
- **Constante:** `GOAL_STORAGE_KEY = "study-diary-weekly-goal"` (CA-8.1).
- **Datos:**
  - `loadGoal()` → texto o `null`; con `try/catch`: si el almacenamiento está bloqueado, devuelve `null` (CA-8.5).
  - `saveGoal(minutes)` → `localStorage.setItem(GOAL_STORAGE_KEY, String(minutes))` (sin ceros delante, CA-8.1) → `true`/`false`.
  - `removeGoal()` → `localStorage.removeItem(GOAL_STORAGE_KEY)` → `true`/`false` (CA-3.4).
  - Ninguna de las tres toca `study-diary-sessions` (CA-8.2).
- **`render()`:** calcula `const today = todayKey()` una vez y se lo pasa a `renderWeekMinutes(sessions, today)` y a `renderWeeklyGoal(sessions, today)`, para que "Esta semana" y el progreso usen el mismo día aunque la página se pinte justo a medianoche (CA-7.1, D4). El resto de `render*` no cambia.
- **`renderWeeklyGoal(sessions, today)`:** `model = buildWeeklyGoalProgress(sessions, today, loadGoal())`.
  - Sin objetivo: muestra `#goal-invite`; oculta `#goal-progress-text`, `#goal-done` y `.goal-bar` (CA-5.1, CA-6.3).
  - Con objetivo: oculta la invitación; `#goal-progress-text` ← `model.text`; `#goal-bar-fill` ← `width: percent%`; `#goal-done` visible solo si `model.isMet` (CA-4.1, CA-4.2, CA-6.1 a 6.3).
- **Al abrir la página:** `goalInput.value` ← `String(minutes)` si `parseWeeklyGoal(loadGoal())` es `valid`; si no, `""` (CA-1.4, CA-1.5). Después `render()` (CA-4.3).
- **`submit` de `#goal-form`** (CA-2.1: solo al enviar; no hay listener de `input`, así el mensaje sigue visible mientras se edita, CA-3.7):
  ```
  preventDefault
  resultado ← parseWeeklyGoal(goalInput.value)
  si error:   goalError ← mensaje de CA-3.3; foco al campo; terminar   (no se guarda ni se repinta)
  si valid:   ok ← saveGoal(resultado.minutes)
  si remove:  ok ← removeGoal()
  si no ok:   goalError ← mensaje de CA-3.4; foco al campo; terminar   (texto intacto, progreso anterior)
  goalError ← ""                                                         (CA-3.6)
  si remove:  goalInput.value ← ""                                       (CA-3.2)
  render()                                                               (CA-3.1, CA-4.3)
  foco al campo                                                          (CA-3.6)
  ```
  Con un objetivo válido, el campo se queda con el texto escrito (la spec solo pide normalizar al recargar, CA-1.4).
- **Guardar una sesión:** ya llama a `render()`, que ahora incluye el objetivo (CA-4.3). No se añade ningún temporizador (CA-4.3: fuera de la lista no se recalcula).

### CSS
- **Bloque:** `.weekly-goal` con el mismo estilo de renglón que `.stats p` (borde inferior `--rule`, `padding: 8px 0`). El `h2` del bloque, más pequeño que los títulos de sección. El campo y el botón usan las reglas generales `input`, `button`, `:focus-visible` y `.error` (foco igual que el resto, RNF-2; en el móvil el botón ya se estira, RNF-1). Zona táctil ≥ 44 × 44 px: el input mide ~44 px de alto con su `padding`; se fija `min-height: 44px` en ambos para asegurarlo.
- **Selector `.stats p`:** pasa a `.stats > p` para que sus bordes y su color gris no se apliquen a los párrafos del bloque nuevo. No cambia nada de lo que ya se ve (las tres cifras son hijos directos de `.stats`).
- **Barra** (RNF-4): pista `background: var(--grid)` con borde `1px solid #8290a8` (3,15:1 frente al papel, como el nivel 0 del mapa); parte llena `var(--ink)` (#1B3A8C: unos 10:1 frente al papel y más de 3:1 frente a la pista). Alto fijo (~12 px), ancho 100 %. Sin `transition` (RNF-7).
- **Textos** (RNF-4): progreso en `var(--ink)`, invitación en `var(--muted)` (#5B6475, más de 4,5:1), "¡Objetivo cumplido!" en `var(--ink)` y negrita, error en `var(--error)` (ya usado). Contrastes a comprobar con el MCP.
- **Alto contraste** (RNF-5), dentro del `@media (forced-colors: active)` existente: `.goal-bar` y `.goal-bar-fill` con `forced-color-adjust: none`; pista `background: Canvas` y `border: 1px solid CanvasText`; parte llena `background: Highlight`. El botón ya tiene borde con `.sheet button`; el input conserva su borde del sistema.
- **Móvil y zoom** (RNF-1, RNF-6): todo en una columna (el `form` ya es `flex-direction: column`); `#goal-progress-text` con `overflow-wrap: anywhere` para que "1666 h 40 min / 5 h" no desborde a 320 px ni con zoom al 200 %.

## 5. Decisiones técnicas

| # | Decisión | Por qué | Alternativa descartada |
|---|---|---|---|
| D1 | Corregir `calculateWeekMinutes` reutilizando `isValidSession` y `parseMinutes` | Una sola regla de "sesión válida" para el mapa y la semana; ya probadas; cumple CA-7.2 y CA-7.3 sin código nuevo | **Una función nueva solo para el objetivo:** "Esta semana" y el progreso podrían no coincidir (CA-7.1). **Validar dentro del `reduce` a mano:** duplica reglas que ya existen. |
| D2 | `parseWeeklyGoal` propia, con regex `^[0-9]+$` | Cumple exactamente CA-2.3 a CA-2.5 | **`parseMinutes` o `Number()`:** aceptan "1e3", "+300", "12.5", " 300 " con saltos de línea… |
| D3 | `buildWeeklyGoalProgress` recibe el objetivo **en bruto** y lo valida dentro | La misma función sirve para lo leído de localStorage (CA-8.3, CA-8.4) y se prueba sin interfaz (RNF-10) | **Que `app.js` valide antes y pase un número:** la regla de CA-8.4 quedaría en la interfaz, sin tests. |
| D4 | Un solo `todayKey()` por `render()` para "Esta semana" y el objetivo | Las dos cifras salen del mismo día aunque el pintado cruce la medianoche (CA-7.1) | **Que cada `render*` lea el reloj:** podrían diferir un instante a las 00:00. |
| D5 | Campo `type="text"` + `inputmode="numeric"` + `novalidate` | Mensajes siempre del diario (CA-1.3) y teclado numérico en el móvil | **`type="number"`:** el navegador valida, rechaza texto y da `value = ""` con "abc", así que no se podría distinguir de "vacío" (quitar vs. error). |
| D6 | Barra con dos `div` y `aria-hidden="true"` | Decorativa y oculta a lectores (RNF-3); fácil de colorear en alto contraste (RNF-5) | **`<progress>`:** lo anuncian los lectores (dos fuentes de información) y su estilo cambia mucho entre navegadores y en `forced-colors`. |
| D7 | Un `aria-live="polite"` alrededor de invitación, progreso y "cumplido"; `role="alert"` solo en `#goal-error` | Anuncios educados del progreso y alerta para errores (RNF-3), como `#form-error` | **`role="alert"` también en el progreso:** interrumpiría la lectura en cada guardado. |
| D8 | El bloque va dentro de `.stats`, justo después de "Esta semana" | Es literal en CA-1.1; "Esta semana" no se mueve (sección 8 de la spec) | **Después de "Este mes" o como sección aparte:** no quedaría "justo debajo de Esta semana". |
| D9 | Normalizar "0300" → "300" solo al guardar en localStorage, no en el campo tras guardar | La spec pide "300" al guardar (CA-8.1) y al recargar (CA-1.4), no al momento | **Reescribir el campo al guardar:** no está en la spec (P2). |

## 6. Estrategia de tests (`node --test`)

- Mismo formato que los existentes: `process.env.TZ = "Europe/Madrid"` en la primera línea, `require("node:test")`, `require("node:assert/strict")`, `require("../logic.js")`; hoy fijo en cada test; nombres y mensajes en español (P4, P6).
- Cada tarea de lógica: primero los tests en rojo, luego el código, luego todo en verde (los 50 actuales incluidos).

### `tests/stats.test.js` — semana (se añaden; los actuales no cambian)
| Casos | Cubre |
|---|---|
| Sesión de hoy con -30 → no cuenta; única sesión con -30 → 0 (nunca negativo) | CA-7.2, CA-7.3 |
| Minutos "abc", `""`, `null`, ausentes → no cuentan; "45" (texto) sí cuenta | CA-7.2 |
| Fechas "2026-11-1", "2026-13-01", "2026-02-30", "16/11/2026" → no cuentan | CA-7.2 |
| Hoy domingo "2026-11-15": cuenta del "2026-11-09" al "2026-11-15" | RNF-8 |
| Hoy lunes "2026-11-16": la sesión del "2026-11-15" (23:59) no cuenta, la del "2026-11-16" (00:30) sí | RNF-8 |
| Hoy "2026-10-25" y "2026-03-29" (cambios de hora): no cuentan "2026-10-18" ni "2026-03-22"; sí el lunes de cada semana | RNF-8 |
| Hoy "2027-01-01": cuentan del "2026-12-28" al "2027-01-01" | RNF-8 |
| Fecha futura "2026-11-20" con hoy "2026-11-15" → no suma | Sección 4 |
| No modifica la lista que recibe | CA-8.2 |

### `tests/weekly-goal.test.js` (Q1 resuelta)
| Grupo | Casos | Cubre |
|---|---|---|
| Válido | "1", "10080", "300", "0300" → 300, " 300 ", "\t300\t" | CA-2.2, CA-2.3 |
| Quitar | "", "   ", "0", "00" | CA-2.4 |
| Error | "1.000", "10.080", "+300", "-0", "-5", "1e3", "12,5", "300 min", "abc", "10081", "20000", "300.0" | CA-2.5, CA-8.4 |
| Bruto no texto | `null`, `undefined`, `300` (número) → no `valid` | CA-8.3, CA-8.4 |
| Porcentaje | 120/300 → 40; 268/300 → 89; 299/300 → 99; 0/45 → 0; 10079/10080 → 99; 350/300 → 100 (tope) | Sección 4 |
| Progreso (texto exacto) | Todos los totales de la sección 7 de la spec con objetivo 300: 0, 100,4, 299, 299,6, 300, 350, 100 000; objetivo 1 con total 0 y 1; objetivo 45 con 0; objetivo 10080 con 10079; bajar a 200 y subir a 300 con total 250 | CA-4.1, CA-4.2, RF-6 |
| Sin objetivo | Bruto `null`, "abc", "0", "20000" → `{ hasGoal: false }` | RF-5, CA-8.4 |
| Coincide con "Esta semana" | `totalMinutes === Math.round(calculateWeekMinutes(...))` con datos válidos y dañados | CA-7.1 |
| Semana nueva | Hoy lunes "2026-11-16" con sesiones del domingo → total 0, objetivo intacto | Sección 7 |

### Con el MCP de Chrome DevTools (lo que `node --test` no cubre)
- Posición del bloque, campo vacío / con "300" al abrir (CA-1.1, CA-1.4, CA-1.5).
- Guardar, quitar ("", "0") y error con mensajes, foco y texto conservado (RF-3); Intro en el campo no crea sesión (CA-1.6).
- Fallo del almacenamiento: sustituir `Storage.prototype.setItem`/`removeItem` por una función que lanza, y `getItem` para CA-8.5 (CA-3.4, CA-8.5).
- `localStorage` tras guardar: `study-diary-weekly-goal` = "300" y `study-diary-sessions` idéntica a antes (CA-8.1, CA-8.2).
- Recalcular al guardar una sesión y al guardar/quitar el objetivo (CA-4.3).
- Árbol de accesibilidad: etiqueta vinculada, `aria-describedby`, barra oculta, `aria-live` y `role="alert"` (RNF-2, RNF-3).
- Teclado solo (RNF-2); vista a 375 y 320 px sin desplazamiento horizontal y zona táctil ≥ 44 px (RNF-1); zoom 200 % (RNF-6); `forced-colors: active` (RNF-5); contrastes (RNF-4).
- Consola sin errores y lista de comprobación de la skill `local-dates`.

## 7. Cobertura de requisitos

| RF | Dónde se resuelve |
|---|---|
| RF-1 Bloque y formulario | HTML `#weekly-goal` y `#goal-form`, `type="text"` (D5), valor inicial en `app.js` |
| RF-2 Validación | `parseWeeklyGoal`, `MAX_WEEKLY_GOAL` |
| RF-3 Guardar, quitar y mensajes | `submit` de `#goal-form`, `saveGoal`, `removeGoal`, `#goal-error` |
| RF-4 Progreso | `buildWeeklyGoalProgress`, `calculateGoalPercent`, `renderWeeklyGoal`, `render()` |
| RF-5 Sin objetivo | `hasGoal: false`, `#goal-invite` |
| RF-6 Cumplido | `isMet`, texto sin porcentaje, `#goal-done`, barra al 100 % |
| RF-7 Total y datos dañados | `calculateWeekMinutes` corregida (D1), un solo "hoy" (D4) |
| RF-8 Datos | `GOAL_STORAGE_KEY`, `loadGoal`/`saveGoal`/`removeGoal`, `parseWeeklyGoal` al leer |
| RNF-1 a RNF-7 | HTML y CSS (sección 4), verificados con el MCP |
| RNF-8 | `startOfWeekKey` y tests de semana |
| RNF-9 | Sin recursos externos |
| RNF-10 | Funciones puras de la sección 2 y sus tests |

## 8. Riesgos

- **`aria-live` al abrir la página:** algunos lectores anuncian el contenido inicial. Se acepta; se comprueba con el MCP.
- **Mismo mensaje de error dos veces seguidas:** con `role="alert"`, si el texto no cambia, algunos lectores no lo repiten. Es igual que en `#form-error`; se acepta.

## 9. Preguntas para el usuario

- **Q1.** ¿Se puede crear `tests/weekly-goal.test.js` (AGENTS.md pide preguntar antes de crear archivos)? Alternativa: añadir esos tests a `tests/stats.test.js`. **Resuelta:** sí, se crea el archivo nuevo `tests/weekly-goal.test.js`.
- **D9.** **Confirmada:** tras guardar "0300" el campo se queda tal como se escribió; "300" solo en localStorage y al recargar.
