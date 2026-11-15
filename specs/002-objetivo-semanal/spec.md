# Spec 002 — Objetivo semanal de estudio

Estado: **implementada**
Referencia: `docs/constitution.md`. Formato de referencia: `specs/001-heat-map/spec.md`.

## 1. Contexto y objetivo

El diario ya muestra "Esta semana", el total de minutos estudiados desde el lunes hasta hoy. Es una cifra sin referencia: no dice si es mucho o poco para lo que la persona quería estudiar.

**Objetivo:** permitir fijar un **objetivo semanal en minutos** y ver, justo debajo de "Esta semana", cuánto se lleva de él, con un texto y una barra de progreso.

**Por qué:** tener una meta concreta y ver cómo se acerca motiva a estudiar un poco más cada semana, y celebrar cuando se cumple refuerza el hábito.

## 2. Usuarios

- **Estudiante que quiere una meta:** fija cuántos minutos quiere estudiar cada semana y consulta su avance.
- **Estudiante sin objetivo:** aún no lo ha fijado (o lo ha quitado) y necesita saber que puede hacerlo.
- **Persona que usa teclado, lector de pantalla o no distingue bien los colores:** necesita la misma información sin depender del ratón ni del color.

## 3. Historias de usuario

- **HU-1.** Como estudiante, quiero fijar cuántos minutos quiero estudiar cada semana, para tener una meta clara.
- **HU-2.** Como estudiante, quiero ver cuánto llevo de mi objetivo y qué porcentaje es, para saber cuánto me falta.
- **HU-3.** Como estudiante, quiero ver un mensaje cuando cumplo el objetivo, para sentir que lo he conseguido.
- **HU-4.** Como estudiante, quiero cambiar o quitar el objetivo cuando quiera, para adaptarlo a mi ritmo.
- **HU-5.** Como estudiante sin objetivo, quiero ver una invitación a fijarlo, para descubrir que existe esta opción.

## 4. Definiciones

- **Objetivo semanal:** un número entero de minutos, de 1 a 10.080 (los minutos de una semana), ambos incluidos. Es **el mismo para todas las semanas** hasta que el usuario lo cambie o lo quite.
- **Sin objetivo:** no hay objetivo guardado, se ha quitado, el valor guardado no es válido o no se puede leer el almacenamiento.
- **Sesión que cuenta para la semana:** sesión con fecha "AAAA-MM-DD" válida (el día existe, con dos cifras en mes y día), entre el lunes de esta semana y hoy (ambos incluidos, fecha local), y con minutos que se puedan leer como número mayor o igual que 0. No cuentan: minutos negativos ("-30") o no numéricos ("abc", vacíos o ausentes); fechas mal escritas o inexistentes ("2026-11-1", "2026-13-01", "2026-02-30", "16/11/2026"); fechas futuras.
- **Total de la semana:** la suma de los minutos de las sesiones que cuentan para la semana, contando cada sesión (varias el mismo día suman). Es **el mismo cálculo que usa "Esta semana"**, así que las dos cifras coinciden siempre. Nunca es negativo. Para el progreso se usa **redondeado al minuto entero más cercano**.
- **Formato de minutos:** el mismo que ya usa "Esta semana": 45 → "45 min", 120 → "2 h", 268 → "4 h 28 min".
- **Porcentaje:** primero se redondea el total al minuto; después, total redondeado ÷ objetivo × 100, **redondeado hacia abajo** a un entero, con un máximo de 100. Así "100 %" no puede salir sin haber llegado al objetivo (299 / 300 → 99 %).
- **Objetivo cumplido:** el total redondeado es **mayor o igual** que el objetivo (300 / 300 ya es cumplido).

## 5. Requisitos funcionales

Notación EARS:
- **Ubicuo:** "El sistema deberá…"
- **Por evento:** "Cuando…, el sistema deberá…"
- **Por estado:** "Mientras…, el sistema deberá…"
- **No deseado:** "Si…, entonces el sistema deberá…"

### RF-1. Bloque y formulario del objetivo
- **CA-1.1** El sistema deberá mostrar un bloque propio titulado "Objetivo semanal" justo debajo de "Esta semana".
- **CA-1.2** El bloque deberá contener un formulario propio, separado del de "Nueva sesión", con un campo de texto con la etiqueta visible "Objetivo semanal (min)" y un botón "Guardar objetivo".
- **CA-1.3** El campo deberá admitir cualquier texto, para que la validación (RF-2) y sus mensajes sean siempre los del diario y nunca los del navegador.
- **CA-1.4** Cuando se abra la página, el sistema deberá mostrar en el campo el objetivo guardado como número sin ceros delante (p. ej. "300").
- **CA-1.5** Mientras no haya objetivo, el campo deberá estar vacío al abrir la página.
- **CA-1.6** Cuando el usuario pulse Intro en el campo del objetivo, el sistema deberá hacer lo mismo que al pulsar "Guardar objetivo" y no deberá enviar el formulario de "Nueva sesión".

### RF-2. Validación del objetivo
- **CA-2.1** Cuando el usuario pulse "Guardar objetivo" o Intro en el campo, el sistema deberá validar el texto escrito y clasificarlo en uno de tres resultados: **válido**, **quitar** o **error**. No se valida mientras se escribe.
- **CA-2.2** El sistema deberá quitar antes de validar los espacios y tabuladores de delante y de detrás (" 300 " → "300").
- **CA-2.3** El resultado será **válido** solo si lo que queda son únicamente cifras 0-9 y el número es un entero de 1 a 10.080. Los ceros de delante se ignoran ("0300" → 300).
- **CA-2.4** El resultado será **quitar** si lo que queda está vacío (campo vacío o solo espacios) o es el número 0 escrito solo con cifras ("0", "00").
- **CA-2.5** El resultado será **error** en cualquier otro caso. Por ejemplo: "1.000", "10.080", "+300", "-0", "-5", "1e3", "12,5", "300 min", "abc", "10081", "20000".

### RF-3. Guardar, quitar y mensajes
- **CA-3.1** Cuando el resultado sea **válido**, el sistema deberá guardar el objetivo y actualizar el progreso al momento, sin recargar la página.
- **CA-3.2** Cuando el resultado sea **quitar**, el sistema deberá borrar el objetivo guardado, vaciar el campo y mostrar la invitación de RF-5.
- **CA-3.3** Si el resultado es **error**, entonces el sistema deberá: no guardar nada y mantener el objetivo y el progreso anteriores; dejar en el campo el texto escrito; mostrar el mensaje "El objetivo debe ser un número entero de minutos entre 1 y 10.080. Déjalo vacío o pon 0 para quitarlo."; y llevar el foco al campo.
- **CA-3.4** Si no se puede guardar ni borrar el objetivo en el almacenamiento (lleno o bloqueado), tanto al guardar como al quitar, entonces el sistema deberá: mostrar el mensaje "No se ha podido guardar el objetivo. Inténtalo de nuevo."; dejar en el campo el texto escrito; mantener el progreso con el objetivo anterior; y llevar el foco al campo.
- **CA-3.5** El sistema deberá mostrar los dos mensajes de CA-3.3 y CA-3.4 en un único espacio de mensajes situado justo debajo del campo, dentro del bloque "Objetivo semanal". Nunca se muestran a la vez: el último sustituye al anterior.
- **CA-3.6** Cuando se guarde o se quite el objetivo con éxito, el sistema deberá ocultar el mensaje que hubiera y dejar el foco en el campo.
- **CA-3.7** Mientras el usuario edita el campo tras un error, el sistema deberá mantener visible el mensaje hasta el siguiente intento de guardar.

### RF-4. Progreso hacia el objetivo
- **CA-4.1** Mientras haya objetivo y no esté cumplido, el sistema deberá mostrar el texto "<total> / <objetivo> (<porcentaje> %)", con total y objetivo en el formato de minutos de la sección 4. Ejemplos: 120 / 300 → "2 h / 5 h (40 %)"; 268 / 300 → "4 h 28 min / 5 h (89 %)"; 0 / 45 → "0 min / 45 min (0 %)".
- **CA-4.2** Mientras haya objetivo, el sistema deberá mostrar una barra de progreso cuya parte llena sea el mismo porcentaje del texto (de 0 a 100).
- **CA-4.3** Cuando ocurra uno de estos eventos, el sistema deberá recalcular con el "hoy" de ese momento todas las estadísticas (racha, mejor racha, "Esta semana", "Este mes", mapa de calor y progreso del objetivo), sin recargar la página: guardar una sesión; guardar, cambiar o quitar el objetivo con éxito; abrir o recargar la página. Fuera de esta lista no se recalcula nada.

### RF-5. Sin objetivo
- **CA-5.1** Mientras no haya objetivo, el sistema deberá ocultar el texto y la barra de progreso y mostrar la invitación "Fija un objetivo semanal para ver cuánto te falta cada semana."
- **CA-5.2** Mientras no haya objetivo, el sistema deberá seguir mostrando "Esta semana" igual que con objetivo.

### RF-6. Objetivo cumplido
- **CA-6.1** Mientras el objetivo esté cumplido, el sistema deberá mostrar el mensaje "¡Objetivo cumplido!" en el bloque, junto al progreso.
- **CA-6.2** Mientras el objetivo esté cumplido, el sistema deberá mostrar la barra al 100 % y el texto "<total> / <objetivo>" sin porcentaje, con el total real aunque supere el objetivo. Ejemplos: 300 / 300 → "5 h / 5 h"; 350 / 300 → "5 h 50 min / 5 h".
- **CA-6.3** Mientras el objetivo no esté cumplido o no haya objetivo, el sistema no deberá mostrar "¡Objetivo cumplido!".

### RF-7. Total de la semana y datos dañados
- **CA-7.1** El sistema deberá calcular "Esta semana" y el progreso del objetivo con el mismo total de la semana (sección 4), de modo que las dos cifras coincidan siempre.
- **CA-7.2** Si una sesión tiene minutos negativos o no numéricos, o una fecha que no es "AAAA-MM-DD" válida, entonces el sistema no deberá contarla ni en "Esta semana" ni en el progreso, sin mostrar errores. **Esto cambia "Esta semana"**: hasta ahora esas sesiones podían sumar o restar (p. ej. una sesión de hoy con -30 min restaba).
- **CA-7.3** El total de la semana nunca deberá ser negativo.

### RF-8. Datos
- **CA-8.1** El sistema deberá guardar el objetivo en localStorage con la clave `study-diary-weekly-goal`, como texto con el número de minutos sin ceros delante (p. ej. "300"). Al quitar el objetivo se borra esa clave.
- **CA-8.2** El sistema no deberá leer, cambiar ni borrar la clave `study-diary-sessions` al guardar o quitar el objetivo; las sesiones guardadas siguen intactas.
- **CA-8.3** Cuando se abra la página, el sistema deberá leer el valor guardado aplicando las mismas reglas que al campo (RF-2): **válido** = hay objetivo; cualquier otro resultado = sin objetivo.
- **CA-8.4** Si el valor guardado no es válido, entonces el sistema deberá tratarlo como "sin objetivo" (RF-5), sin mostrar errores ni romper el resto del diario. Ejemplos: ausente (null) → sin objetivo; "abc" → sin objetivo; "0300" → objetivo 300; " 300 " → objetivo 300; "300.0" → sin objetivo; "20000" → sin objetivo.
- **CA-8.5** Si no se puede leer el almacenamiento (bloqueado), entonces el sistema deberá mostrar el estado "sin objetivo" sin errores no controlados y el resto del diario deberá seguir funcionando.
- **CA-8.6** El sistema deberá calcular el progreso, el porcentaje y el estado cumplido siempre a partir de las sesiones y del objetivo; no se guardan.

## 6. Requisitos no funcionales

- **RNF-1. Móvil:** de 320 px de ancho en adelante, todo el bloque (título, campo, botón, texto, barra y mensajes) se apila en una sola columna y se ve completo sin desplazamiento horizontal. El campo y el botón tendrán una zona táctil de al menos 44 × 44 px.
- **RNF-2. Teclado y foco:**
  - Todo se podrá usar solo con el teclado (Tab hasta el campo, escribir, Intro o Tab hasta el botón y Espacio/Intro).
  - El campo y el botón mostrarán el foco visible igual que el resto de controles del diario.
  - La etiqueta estará vinculada al campo: tocarla o pulsarla lleva el foco al campo.
  - El foco se comporta como dicen CA-3.3, CA-3.4 y CA-3.6.
- **RNF-3. Lectores de pantalla:**
  - Una sola fuente de información: el progreso se lee en el texto; la barra es decorativa y queda oculta a los lectores de pantalla.
  - Los cambios del texto de progreso, de la invitación y de "¡Objetivo cumplido!" se anuncian de forma educada (sin interrumpir lo que se esté leyendo).
  - Los mensajes de error (CA-3.3 y CA-3.4) se anuncian como alerta y quedan asociados al campo.
- **RNF-4. Contraste:**
  - El texto del progreso, la invitación, "¡Objetivo cumplido!" y los mensajes de error tendrán un contraste mínimo de 4,5:1 con el fondo del bloque.
  - La parte llena de la barra tendrá un contraste mínimo de 3:1 frente a la parte vacía y frente al fondo del bloque.
  - El color no será la única forma de transmitir el progreso: el texto da la misma información.
- **RNF-5. Alto contraste:** en modo de colores forzados (comprobable con la emulación "forced-colors: active" de Chrome DevTools), la parte llena de la barra se distingue de la vacía, el texto y los mensajes siguen visibles, y el campo y el botón mantienen borde y foco visibles.
- **RNF-6. Zoom:** con el texto al 200 %, nada se solapa ni se sale de la pantalla.
- **RNF-7. Coherencia visual:** respetar el estilo actual del diario. Sin animaciones nuevas.
- **RNF-8. Fechas locales:** la semana se calcula con la fecha local del dispositivo, como "Esta semana".
- **RNF-9. Sin conexión:** funciona sin internet, igual que el resto del diario.
- **RNF-10. Pruebas sin interfaz (principio 3 de la constitución):** el total de la semana, el progreso (texto), el porcentaje, el estado cumplido y la validación (texto en bruto → válido / quitar / error, con el número si es válido) se pueden probar sin interfaz, recibiendo "hoy" y el valor en bruto como parámetros.

## 7. Casos límite

Salvo que se indique otra cosa, objetivo 300 (= "5 h").

| Caso | Comportamiento esperado |
|---|---|
| Objetivo "1" o "10080" | Válidos; se guardan como "1" y "10080". |
| Objetivo "0300" | Válido; se guarda "300" y el campo muestra "300" al recargar. |
| " 300 " o con tabuladores alrededor | Válido; se guarda "300". |
| Vacío, solo espacios, "0" o "00" | Quitar: se borra el objetivo, se vacía el campo y sale la invitación. |
| "10081", "20000", "-5", "-0", "+300", "1.000", "10.080", "1e3", "12,5", "300 min", "abc" | Error: mensaje de CA-3.3, el texto se queda en el campo, foco en el campo y se mantiene el objetivo anterior. |
| Error y después fallo del almacenamiento | Solo se ve el último mensaje (CA-3.5). |
| Error y después guardado con éxito | El mensaje desaparece; foco en el campo (CA-3.6). |
| Almacenamiento bloqueado al guardar o al quitar | Mensaje de CA-3.4; texto en el campo; progreso con el objetivo anterior. |
| Almacenamiento bloqueado al leer | Sin objetivo, sin errores no controlados (CA-8.5). |
| Valor guardado null, "abc", "300.0", "20000" | Sin objetivo (CA-8.4). |
| Valor guardado "0300" o " 300 " | Objetivo 300 (CA-8.4). |
| Intro en el campo del objetivo | Se valida el objetivo; no se crea ninguna sesión. |
| Total 0 | "0 min / 5 h (0 %)", barra vacía. |
| Total 100,4 (dato antiguo con decimales) | Se redondea a 100: "1 h 40 min / 5 h (33 %)". |
| Total 299 | "4 h 59 min / 5 h (99 %)", sin "¡Objetivo cumplido!". |
| Total 299,6 | Se redondea a 300: "5 h / 5 h", barra al 100 % y "¡Objetivo cumplido!". |
| Total 300 (exactamente el objetivo) | "5 h / 5 h", barra al 100 % y "¡Objetivo cumplido!". |
| Total 350 | "5 h 50 min / 5 h", barra al 100 % y "¡Objetivo cumplido!". |
| Total 100.000 (error al escribir una sesión) | "1666 h 40 min / 5 h", cumplido, barra al 100 %, sin romper el diseño. |
| Objetivo 1, total 0 | "0 min / 1 min (0 %)". |
| Objetivo 1, total 1 | "1 min / 1 min" y "¡Objetivo cumplido!". |
| Objetivo 10.080, total 10.079 | "167 h 59 min / 168 h (99 %)", sin cumplido. |
| Objetivo 45, total 0 | "0 min / 45 min (0 %)". |
| Se baja el objetivo por debajo del total (de 300 a 200 con total 250) | Pasa a cumplido al momento: "4 h 10 min / 3 h 20 min". |
| Se sube el objetivo por encima del total (de 200 a 300 con total 250) | Deja de estar cumplido: "4 h 10 min / 5 h (83 %)". |
| Sesión de esta semana con -30 min | No cuenta ni en "Esta semana" ni en el progreso (CA-7.2). |
| Sesión de esta semana con minutos "abc" o sin minutos | No cuenta (CA-7.2). |
| Sesión con fecha "2026-11-1" o "2026-02-30" | No cuenta (CA-7.2). |
| Única sesión de la semana con -30 min | Total 0 (nunca negativo): "0 min / 5 h (0 %)". |
| Hoy domingo "2026-11-15" | La semana va del lunes "2026-11-09" al "2026-11-15". |
| Hoy lunes "2026-11-16" | Empieza semana nueva: solo cuentan las sesiones de "2026-11-16"; las del domingo "2026-11-15" ya no. El objetivo se mantiene. |
| Hoy lunes "2026-11-16": sesión registrada el domingo a las 23:59 (fecha "2026-11-15") y otra el lunes a las 00:30 (fecha "2026-11-16") | Solo cuenta la del lunes. |
| Hoy domingo "2026-10-25" (cambio de hora de otoño) | La semana va del "2026-10-19" al "2026-10-25", 7 días; la sesión del "2026-10-18" no cuenta. |
| Hoy domingo "2026-03-29" (cambio de hora de primavera) | La semana va del "2026-03-23" al "2026-03-29", 7 días; la sesión del "2026-03-22" no cuenta. |
| Hoy viernes "2027-01-01" | La semana empieza el lunes "2026-12-28": cuentan las sesiones del "2026-12-28" al "2027-01-01". |
| Sesión con fecha futura (hoy "2026-11-15", sesión "2026-11-20") | No suma. |
| Se registra una sesión de un día anterior al lunes | No cambia el progreso. |
| La página sigue abierta al pasar la medianoche del domingo | Se actualiza solo con los eventos de CA-4.3, igual que la racha. |
| El dispositivo cambia de zona horaria o tiene el reloj mal puesto | Se usa la fecha local del dispositivo. No se intenta corregir. |
| Se modifica el objetivo desde otra pestaña | Se ve al recargar. |

## 8. Fuera de alcance (esta versión)

- Un objetivo distinto para cada semana o historial de semanas cumplidas.
- Objetivos diarios, mensuales o por tema.
- Objetivos en sesiones o días en lugar de minutos.
- Notificaciones, recordatorios o avisos fuera de la página.
- Animaciones o efectos al cumplir el objetivo.
- Sincronizar el objetivo entre pestañas o dispositivos.
- Cambiar el formato o la posición de "Esta semana" (solo cambia qué sesiones cuenta, CA-7.2).

## 9. Criterios de finalización

- [x] Se cumplen todos los criterios de aceptación de RF-1 a RF-8.
- [x] Se cumplen los requisitos no funcionales de RNF-1 a RNF-10.
- [x] Todos los casos límite de la sección 7 se han comprobado con tests (`node --test`) o en el navegador.
- [x] Las pruebas automáticas de RNF-10 pasan con `node --test`.
- [x] Verificado en el navegador con Chrome DevTools: ratón y teclado, consola sin errores, vista móvil a 375 px y 320 px sin desplazamiento horizontal, y emulación "forced-colors: active".
- [x] `AGENTS.md`, sección "Datos": documentada la clave `study-diary-weekly-goal` y su formato (texto con el número de minutos, p. ej. "300"; ausente o no válido = sin objetivo).
- [x] `AGENTS.md`, sección "Fechas y racha": documentadas la definición de objetivo cumplido y del porcentaje (redondear el total al minuto, después hacia abajo), que "Esta semana" no cuenta sesiones con minutos negativos o no numéricos ni con fecha no válida, y la excepción a "Todo se calcula a partir de las sesiones; no se guarda": el objetivo semanal sí se guarda.
- [x] Las sesiones que ya estaban guardadas en `study-diary-sessions` siguen intactas.

## 10. Supuestos y dudas abiertas

Dudas: ninguna.
