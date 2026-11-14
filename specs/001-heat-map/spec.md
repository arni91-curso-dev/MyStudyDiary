# Spec 001 — Mapa de calor de estudio

Estado: **implementada** (v2, validada el 2026-11-14). La v1 se revisó en el QA de la spec (36 hallazgos) y la v2 en el QA de la spec y el plan juntos (32 hallazgos). Cambios en la sección 11.
Referencia: `docs/constitution.md`.

## 1. Contexto y objetivo

El Diario de Estudio ya muestra la racha actual, la mejor racha, los minutos de esta semana y los días estudiados este mes. Son cifras sueltas: no dejan ver de un vistazo **cómo se ha repartido el estudio en el tiempo**, qué semanas han ido bien y dónde ha habido huecos.

**Objetivo:** mostrar un mapa de calor, como el de contribuciones de GitHub, de las **últimas 12 semanas de calendario**. Cada día es una casilla, y el color es más intenso cuantos más minutos se han estudiado ese día.

**Por qué:** ver la constancia como un dibujo motiva a no "romper la cadena" y ayuda a detectar patrones, como estudiar menos los fines de semana, sin tener que leer la lista de sesiones.

## 2. Usuarios

- **Estudiante que usa el diario a diario:** quiere ver en segundos si está siendo constante y cuánto ha estudiado cada día.
- **Estudiante nuevo o que vuelve tras un parón:** aún no tiene sesiones recientes y necesita entender qué es el mapa y cómo se llena.
- **Persona que usa teclado, lector de pantalla o no distingue bien los colores:** necesita la misma información sin depender del ratón ni del color.

## 3. Historias de usuario

- **HU-1.** Como estudiante, quiero ver mis últimas 12 semanas de un vistazo, para saber si estoy siendo constante.
- **HU-2.** Como estudiante, quiero que los días con más minutos se vean más intensos, para distinguir los días flojos de los fuertes.
- **HU-3.** Como estudiante, quiero consultar la fecha y los minutos exactos de cualquier día del mapa (con ratón, dedo o teclado), para no tener que buscarlo en la lista.
- **HU-4.** Como estudiante nuevo, quiero ver el mapa vacío con una explicación, para entender que se irá llenando al registrar sesiones.
- **HU-5.** Como estudiante, quiero que el mapa se actualice en cuanto guardo una sesión, para ver el efecto al momento.

## 4. Definiciones

- **Periodo:** las 12 semanas de calendario (de lunes a domingo, fecha local) formadas por la semana actual y las 11 anteriores. Va desde el lunes de hace 11 semanas hasta hoy, ambos incluidos, así que tiene entre 78 días (si hoy es lunes) y 84 (si hoy es domingo).
- **Sesión válida:** una sesión guardada que cumple las dos condiciones siguientes. Las que no las cumplen se ignoran por completo en el mapa: no suman minutos ni cuentan como sesión.
  - Su fecha es un texto `AAAA-MM-DD` que corresponde a un día real del calendario.
  - Sus minutos se pueden leer como un número mayor que 0. Un número escrito como texto, como "45", también vale.
- **Minutos de un día:** la suma de los minutos de todas las sesiones válidas de esa fecha, **redondeada al minuto entero más cercano** (12,5 → 13; 0,3 → 0). Todo el mapa usa este valor: nivel, detalle y mensaje de RF-6.
- **Día con estudio:** un día cuyos minutos son mayores que 0.

## 5. Requisitos funcionales

Los criterios de aceptación usan la notación EARS:
- **Ubicuo:** "El sistema deberá…"
- **Por evento:** "Cuando…, el sistema deberá…"
- **Por estado:** "Mientras…, el sistema deberá…"
- **No deseado:** "Si…, entonces el sistema deberá…"

### RF-1. Periodo y disposición
- **CA-1.1** El sistema deberá mostrar todos los días del periodo (sección 4).
- **CA-1.2** El sistema deberá organizar el mapa en 12 columnas, una por semana, de la más antigua (izquierda) a la actual (derecha).
- **CA-1.3** El sistema deberá colocar los días de cada semana en filas de lunes (arriba) a domingo (abajo).
- **CA-1.4** El sistema deberá mostrar a la izquierda las etiquetas de los días "L", "X" y "V", en las filas de lunes, miércoles y viernes.
- **CA-1.5** El sistema deberá mostrar el nombre abreviado del mes (por ejemplo, "nov") en estos casos:
  - encima de la primera columna, con el mes de su lunes;
  - encima de cada columna cuyo lunes pertenezca a un mes distinto del de la columna anterior.

  Si la primera y la segunda columna tienen etiqueta, solo se mostrará la de la segunda, para que no se solapen. Como las etiquetas se basan en los lunes, que nunca son días futuros, ninguna etiqueta corresponde a un mes sin casillas visibles.

### RF-2. Días futuros y día de hoy
- **CA-2.1** El sistema no deberá dibujar casilla para los días de la semana actual posteriores a hoy; esos huecos quedarán vacíos.
- **CA-2.2** El sistema deberá marcar la casilla de hoy con una marca interior (un punto) que contraste al menos 3:1 con el color de la casilla en todos los niveles, también en el nivel 0. Esta marca será distinta de la del día seleccionado (CA-5.3), para que las dos se vean a la vez.
- **CA-2.3** Si existen sesiones con fecha posterior a hoy, entonces el sistema deberá ignorarlas en el mapa.

### RF-3. Datos de cada día
- **CA-3.1** El sistema deberá calcular los minutos de cada día del periodo según la sección 4. Aquí cada sesión cuenta, como en el total semanal.
- **CA-3.2** Si una sesión guardada no es válida (sección 4), entonces el sistema deberá ignorarla en el mapa sin mostrar ningún error al usuario ni romper el mapa.

### RF-4. Intensidad del color
- **CA-4.1** El sistema deberá asignar a cada día uno de estos 5 niveles fijos:

  | Nivel | Minutos del día |
  |---|---|
  | 0 | 0 (sin estudio) |
  | 1 | 1 a 29 |
  | 2 | 30 a 59 |
  | 3 | 60 a 119 |
  | 4 | 120 o más |

  Como los minutos del día ya están redondeados (sección 4), todo día cae en un tramo de la tabla y de la leyenda.

- **CA-4.2** El sistema deberá usar una sola tonalidad, la del color principal del diario, que va de más clara (nivel 1) a más oscura (nivel 4). El nivel 0 será una casilla neutra con borde visible.
- **CA-4.3** El sistema deberá mostrar junto al mapa una leyenda con los 5 niveles y sus tramos: "0 min", "1–29", "30–59", "60–119" y "120+".

### RF-5. Detalle de un día
- **CA-5.1** El sistema deberá mostrar debajo del mapa una línea de detalle fija con la fecha completa y los minutos del día seleccionado, con el mismo formato de fecha y de minutos que el resto del diario. Por ejemplo: "jueves, 12 de noviembre de 2026: 1 h 30 min".
- **CA-5.2** Cuando se abra la página, el sistema deberá mostrar en la línea de detalle el día de hoy.
- **CA-5.3** Cuando el usuario pase el ratón por una casilla, la toque o llegue a ella con el teclado, el sistema deberá mostrar ese día en la línea de detalle. Se queda el último día seleccionado; no hace falta cerrar nada.
- **CA-5.4** Cuando el día no tenga estudio, el sistema deberá escribir "sin estudio" en lugar de los minutos. Por ejemplo: "martes, 10 de noviembre de 2026: sin estudio".
- **CA-5.5** El sistema deberá permitir entrar al mapa con una sola pulsación de Tab y moverse entre días con las flechas del teclado:
  - izquierda y derecha cambian de semana (el mismo día de la semana);
  - arriba y abajo cambian de día dentro de la misma semana, sin pasar a otra columna.

  Si el destino no existe, porque está fuera del periodo o es un día futuro, la selección no cambia. El resto de teclas no hace nada en el mapa; Tab sale del mapa con normalidad.
- **CA-5.6** Cuando cambie el día seleccionado con el teclado, el sistema deberá anunciar a los lectores de pantalla la fecha y los minutos de ese día sin sacar el foco del mapa, y también cuando el lector de pantalla esté en modo de lectura.
- **CA-5.7** El sistema no deberá realizar ninguna otra acción al seleccionar una casilla: no filtra la lista ni navega a otro sitio.
- **CA-5.8** El sistema deberá ofrecer a los lectores de pantalla la fecha y los minutos de cada casilla también al recorrer la página sin entrar en el mapa.
- **CA-5.9** Seleccionar un día con el ratón no deberá generar anuncios para los lectores de pantalla; solo cambia la línea de detalle visible.

### RF-6. Sin estudio en el periodo
- **CA-6.1** El sistema deberá mostrar el mapa bajo el título "Últimas 12 semanas".
- **CA-6.2** Mientras no haya ningún día con estudio en el periodo, el sistema deberá mostrar el mapa con todas las casillas en nivel 0 y este mensaje: "Aún no hay sesiones en las últimas 12 semanas. Registra una y verás aparecer su día aquí."
- **CA-6.3** Cuando haya al menos un día con estudio en el periodo, el sistema deberá ocultar ese mensaje.

### RF-7. Actualización
- **CA-7.1** Cuando el usuario guarde una sesión, el sistema deberá actualizar el mapa al momento, sin recargar la página, y mostrar en la línea de detalle el día de esa sesión.
- **CA-7.2** Cuando se abra o recargue la página, el sistema deberá calcular el mapa a partir de las sesiones guardadas.

### RF-8. Datos
- **CA-8.1** El sistema deberá calcular el mapa siempre a partir de las sesiones guardadas, sin guardar ningún dato nuevo.
- **CA-8.2** El sistema no deberá cambiar la forma de los datos guardados ni perder ninguna sesión existente.
- **CA-8.3** Si no se pueden leer las sesiones guardadas (datos dañados o almacenamiento bloqueado), entonces el sistema deberá mostrar el estado de RF-6 sin errores no controlados.

## 6. Requisitos no funcionales

- **RNF-1. Móvil y tamaños de pantalla:**
  - De 320 px de ancho en adelante, el mapa deberá verse completo, con sus etiquetas, sin desplazamiento horizontal.
  - Desde 375 px, cada casilla medirá al menos 20 px, y la distancia entre los centros de dos casillas vecinas será de al menos 24 px.
  - En pantallas anchas, las casillas no medirán más de 32 px.
- **RNF-2. Accesibilidad:**
  - El color no deberá ser la única forma de transmitir la información; la leyenda y la línea de detalle también la dan.
  - Las casillas de nivel 1 a 4 tendrán un contraste mínimo de 3:1 con el fondo.
  - El borde del nivel 0 y la marca del día seleccionado tendrán también un contraste mínimo de 3:1 con el fondo.
  - La marca de hoy tendrá un contraste mínimo de 3:1 con la casilla.
- **RNF-3. Alto contraste:** con el modo de alto contraste del sistema, las casillas, la marca de hoy y la línea de detalle deberán seguir siendo visibles.
- **RNF-4. Zoom:** con el texto al 200 %, nada deberá solaparse. Solo en ese caso se permite desplazar el mapa a los lados.
- **RNF-5. Coherencia visual:** el mapa deberá respetar el estilo actual del diario.
- **RNF-6. Fechas locales:** todos los días se calcularán con la fecha local del dispositivo. Ningún día deberá duplicarse ni saltarse por el cambio de hora.
- **RNF-7. Rendimiento:** con 5000 sesiones guardadas, el mapa deberá calcularse y dibujarse en menos de 100 ms en un portátil normal.
- **RNF-8. Sin conexión:** el mapa deberá funcionar sin internet, igual que el resto del diario.
- **RNF-9. Pruebas:** las reglas del periodo, de la validez de las sesiones, de la suma de minutos y de los límites de cada nivel deberán poder probarse sin la interfaz, según la política de pruebas de la constitución.

## 7. Casos límite

| Caso | Comportamiento esperado |
|---|---|
| Hoy es lunes | El periodo tiene 78 días; la columna actual solo tiene la casilla de hoy. |
| Hoy es domingo | El periodo tiene 84 días; la columna actual está completa. |
| Varias sesiones el mismo día | Se suman los minutos. Por ejemplo: 20 + 15 = 35 min → nivel 2. |
| 29, 59 o 119 min | Niveles 1, 2 y 3. |
| Exactamente 30, 60 o 120 min | Niveles 2, 3 y 4. |
| Minutos con decimales (dato antiguo, por ejemplo 12,5) | Se suman y el total del día se redondea: 12,5 → 13 min, nivel 1. Un día con solo 0,3 min → 0 → "sin estudio", nivel 0. Las sumas como 29,9999 se redondean a 30 → nivel 2. |
| Decimales en la lista y en "Esta semana" | Todo el diario redondea los minutos al mostrarlos ("12,5" → "13 min"), igual que el mapa. *(Cambio del 2026-11-15: antes se mostraba el valor sin redondear y un total como 242,8 salía "4 h 2.8000000000000114 min" y se salía de la pantalla con el texto al 200 %.)* Solo pasa con datos antiguos o dañados; el formulario solo admite minutos enteros. |
| Sesiones no válidas y "Esta semana" | **Diferencia aceptada:** el total semanal sigue sumando lo que puede leer de cualquier sesión, aunque no sea válida, y el mapa las ignora. Solo pasa con datos dañados. |
| El día 1 de un mes es un día futuro de esta semana | No sale la etiqueta de ese mes, porque las etiquetas se basan en los lunes (CA-1.5). |
| Más de 1440 min en un día (por un error al escribir) | Nivel 4; la línea de detalle muestra el valor real (por ejemplo, "1666 h 40 min") sin romper el diseño. |
| Sesión con minutos no válidos (0, negativos, texto) o fecha imposible | Se ignora en el mapa (CA-3.2). |
| Día cuyas únicas sesiones no son válidas | Nivel 0, "sin estudio". **Diferencia aceptada:** la racha y "Este mes" sí cuentan ese día, porque solo miran si existe una sesión. Solo puede pasar con datos dañados, porque el formulario no deja guardar sesiones no válidas. |
| Días anteriores a la primera sesión del usuario | Se muestran en nivel 0 como cualquier día sin estudio, sin un trato especial. |
| Sesiones de antes del periodo | No aparecen en el mapa, pero siguen contando en la racha y en la mejor racha. |
| Sesiones con fecha futura | Se ignoran en el mapa (CA-2.3). |
| Datos dañados o almacenamiento bloqueado | Estado de RF-6, sin errores no controlados (CA-8.3). |
| El periodo cruza un cambio de mes o de año | Las semanas siguen siendo continuas y la etiqueta del mes aparece donde empieza cada mes (CA-1.5). |
| 29 de febrero dentro del periodo | Aparece una sola vez, en su sitio, como cualquier otro día. |
| El periodo incluye un cambio de hora (marzo/octubre) | Cada día aparece una sola vez (RNF-6). |
| El dispositivo cambia de zona horaria | "Hoy" pasa a ser la fecha local nueva; las fechas guardadas no cambian. |
| El reloj del dispositivo está mal puesto | El mapa usa la fecha del dispositivo, igual que el resto del diario. Si va adelantado o atrasado, el periodo se desplaza con él. No se intenta corregir. |
| Una parte de la aplicación no se carga | Se muestra un aviso en la página en vez de dejar la página rota sin explicación. |
| Se guarda una sesión con el lector de pantalla | El foco vuelve al formulario, como ahora, y se lee el campo que lo recibe. El mapa y la línea de detalle se actualizan sin anunciarse (CA-5.9). |
| La página sigue abierta al pasar la medianoche | El mapa se actualiza la próxima vez que se guarde una sesión o se recargue la página, igual que la racha. |
| Se registra una sesión de un día antiguo dentro del periodo | Esa casilla se actualiza al momento y la línea de detalle muestra ese día (CA-7.1). |
| Casillas del borde derecho o inferior en el móvil | El detalle sale en la línea fija bajo el mapa, así que nada se sale de la pantalla. |
| Dispositivo con pantalla táctil y ratón | La línea de detalle muestra el último día al que se ha pasado el ratón, que se ha tocado o al que se ha llegado con el teclado. |

## 8. Fuera de alcance (esta versión)

- Elegir el periodo (6 meses, un año…); siempre son 12 semanas.
- Niveles relativos al máximo de cada usuario o tramos configurables.
- Filtrar la lista de sesiones, o cualquier otra acción, al seleccionar un día.
- Ver los temas estudiados en cada día.
- Navegar a semanas anteriores al periodo.
- Actualizar el mapa cuando se cambian los datos desde otra pestaña (se actualiza al recargar).
- Validar o limitar los minutos máximos en el formulario.
- Exportar o compartir el mapa.
- Modo oscuro y animaciones del mapa.

## 9. Criterios de finalización

- [x] Se cumplen todos los criterios de aceptación de RF-1 a RF-8.
- [x] Se cumplen los requisitos no funcionales de RNF-1 a RNF-9.
- [x] Todos los casos límite de la sección 7 se han comprobado con tests o en el navegador (la zona horaria y el reloj mal puesto con tests; la medianoche con la página abierta, en Chrome, simulando el cambio de día sin recargar).
- [x] Las pruebas automáticas de RNF-9 pasan, según la política de pruebas de la constitución.
- [x] Verificado en el navegador:
  - La funcionalidad, con ratón, teclado y toque.
  - La consola sin errores.
  - La vista móvil a 375 px y a 320 px sin desplazamiento horizontal.
- [x] La definición de periodo, sesión válida y niveles está añadida a las reglas de fechas del proyecto, como pide la constitución (principio 2).
- [x] Las sesiones que ya estaban guardadas siguen intactas.

## 10. Dudas abiertas

Ninguna. Resuelta al aprobar la spec: el mapa va como sección propia entre el bloque de la racha y el formulario de "Nueva sesión".

## 11. Cambios de la v2 (QA de la spec y el plan juntos)

- **Minutos del día redondeados** (sección 4 y CA-4.1): así coinciden el nivel, la leyenda y el detalle, y se evitan los errores de las sumas con decimales.
- **Etiquetas de mes basadas en los lunes** (CA-1.5): no salen meses sin casillas ni etiquetas solapadas.
- **Marca de hoy distinta de la del día seleccionado** (CA-2.2 y RNF-2): las dos se ven a la vez en cualquier nivel.
- **Teclado:**
  - arriba y abajo no saltan de columna;
  - el resto de teclas no hace nada (CA-5.5).
- **Lectores de pantalla:**
  - funciona en modo lectura (CA-5.6 y CA-5.8);
  - el ratón no genera anuncios (CA-5.9).
- **Diferencias aceptadas con la lista y con "Esta semana"**, y casos nuevos: reloj mal puesto, fallo de carga y guardado con lector de pantalla (sección 7).
