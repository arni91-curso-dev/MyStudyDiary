// Diario de Estudio: interfaz (formulario, datos guardados y pintar la página).
// Los cálculos y las fechas están en logic.js, que se carga antes que este archivo.

// Si logic.js no se ha cargado, avisamos en la página en vez de fallar sin explicación.
if (typeof buildHeatMap !== "function") {
  document.getElementById("load-error").hidden = false;
  throw new Error("No se ha cargado logic.js");
}

const STORAGE_KEY = "study-diary-sessions";
const GOAL_STORAGE_KEY = "study-diary-weekly-goal";

// Elementos de la página
const form = document.getElementById("session-form");
const dateInput = document.getElementById("date");
const topicInput = document.getElementById("topic");
const minutesInput = document.getElementById("minutes");
const formError = document.getElementById("form-error");
const streakDays = document.getElementById("streak-days");
const streakLabel = document.getElementById("streak-label");
const bestStreakDays = document.getElementById("best-streak-days");
const bestStreakUnit = document.getElementById("best-streak-unit");
const weekMinutesTotal = document.getElementById("week-minutes-total");
const monthDaysCount = document.getElementById("month-days-count");
const monthDaysUnit = document.getElementById("month-days-unit");
const sessionList = document.getElementById("session-list");
const emptyMessage = document.getElementById("empty-message");
const heatMap = document.getElementById("heat-map");
const heatMapEmpty = document.getElementById("heat-map-empty");
const heatMapLegend = document.getElementById("heat-map-legend");
const heatMapDetail = document.getElementById("heat-map-detail");
const goalForm = document.getElementById("goal-form");
const goalInput = document.getElementById("goal-input");
const goalError = document.getElementById("goal-error");
const goalInvite = document.getElementById("goal-invite");
const goalProgressText = document.getElementById("goal-progress-text");
const goalDone = document.getElementById("goal-done");
const goalBar = document.querySelector(".goal-bar");
const goalBarFill = document.getElementById("goal-bar-fill");

// Día seleccionado en el mapa de calor y minutos de cada día del mapa.
// Solo viven mientras la página está abierta: no se guardan.
let selectedDateKey = null;
let heatMapMinutes = {};

// ---------- Fecha de hoy ----------

// La única función que lee el reloj. La interfaz pasa este valor a la lógica de logic.js.
function todayKey() {
  return toDateKey(new Date());
}

// ---------- Datos (localStorage) ----------

function loadSessions() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    console.error("No se han podido leer las sesiones guardadas:", error);
    return [];
  }
}

// Devuelve true si se ha guardado bien y false si el navegador no lo ha permitido.
function saveSessions(sessions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    return true;
  } catch (error) {
    console.error("No se han podido guardar las sesiones:", error);
    return false;
  }
}

// Objetivo semanal: devuelve el texto guardado tal cual (o null). Lo valida logic.js.
// Si el navegador no deja leer, se trata como "sin objetivo".
function loadGoal() {
  try {
    return localStorage.getItem(GOAL_STORAGE_KEY);
  } catch (error) {
    console.error("No se ha podido leer el objetivo semanal:", error);
    return null;
  }
}

// Guarda los minutos como texto sin ceros delante ("300"). Devuelve true si se ha podido.
function saveGoal(minutes) {
  try {
    localStorage.setItem(GOAL_STORAGE_KEY, String(minutes));
    return true;
  } catch (error) {
    console.error("No se ha podido guardar el objetivo semanal:", error);
    return false;
  }
}

// Borra el objetivo guardado. Devuelve true si se ha podido.
function removeGoal() {
  try {
    localStorage.removeItem(GOAL_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error("No se ha podido borrar el objetivo semanal:", error);
    return false;
  }
}

// ---------- Pintar la página ----------

function renderStreak(sessions) {
  const streak = calculateStreak(sessions, todayKey());
  streakDays.textContent = streak;
  streakLabel.textContent = streak === 1 ? "día seguido" : "días seguidos";

  const bestStreak = calculateBestStreak(sessions, todayKey());
  bestStreakDays.textContent = bestStreak;
  bestStreakUnit.textContent = bestStreak === 1 ? "día" : "días";
}

function renderWeekMinutes(sessions, today) {
  weekMinutesTotal.textContent = formatMinutes(calculateWeekMinutes(sessions, today));
}

function renderWeeklyGoal(sessions, today) {
  const model = buildWeeklyGoalProgress(sessions, today, loadGoal());

  goalInvite.hidden = model.hasGoal;
  goalProgressText.hidden = !model.hasGoal;
  goalBar.hidden = !model.hasGoal;
  goalDone.hidden = !(model.hasGoal && model.isMet);

  if (model.hasGoal) {
    goalProgressText.textContent = model.text;
    goalBarFill.style.width = `${model.percent}%`;
  }
}

function renderMonthDays(sessions) {
  const monthDays = calculateMonthStudyDays(sessions, todayKey());
  monthDaysCount.textContent = monthDays;
  monthDaysUnit.textContent = monthDays === 1 ? "día" : "días";
}

function renderSessions(sessions) {
  // Más reciente primero: por fecha y, en el mismo día, por orden de registro.
  const sorted = [...sessions].sort((a, b) => {
    if (a.date !== b.date) {
      return a.date < b.date ? 1 : -1;
    }
    return b.createdAt - a.createdAt;
  });

  sessionList.innerHTML = "";
  emptyMessage.hidden = sorted.length > 0;

  for (const session of sorted) {
    const item = document.createElement("li");
    item.className = "session-item";

    const info = document.createElement("div");

    const topic = document.createElement("p");
    topic.className = "session-topic";
    topic.textContent = session.topic; // textContent evita que se interprete como HTML

    const date = document.createElement("p");
    date.className = "session-date";
    date.textContent = formatDate(session.date);

    const minutes = document.createElement("span");
    minutes.className = "session-minutes";
    minutes.textContent = formatMinutes(Number(session.minutes) || 0);

    info.append(topic, date);
    item.append(info, minutes);
    sessionList.append(item);
  }
}

// ---------- Mapa de calor (spec 001) ----------

// Letras de los días a la izquierda: solo lunes, miércoles y viernes (filas 0, 2 y 4).
const DAY_LABELS = ["L", "", "X", "", "V", "", ""];

function cellId(dateKey) {
  return `day-${dateKey}`;
}

// Crea un elemento con su clase y, si se indica, su texto.
function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  element.className = className;
  if (text) {
    element.textContent = text;
  }
  return element;
}

function renderHeatMap(sessions) {
  const today = todayKey();
  const model = buildHeatMap(sessions, today);

  // Al abrir la página, o si el día elegido ya no está en el periodo (medianoche), se vuelve a hoy.
  if (!selectedDateKey || !isInPeriod(selectedDateKey, today)) {
    selectedDateKey = today;
  }

  heatMap.innerHTML = "";
  heatMapMinutes = {};

  // Fila de meses: un hueco para la columna de letras y uno por semana. Solo es visual.
  const monthsRow = makeElement("div", "heat-months");
  monthsRow.setAttribute("aria-hidden", "true");
  monthsRow.append(makeElement("span", "heat-month"));
  for (let column = 0; column < model.weeks.length; column++) {
    const label = model.monthLabels.find((month) => month.column === column);
    monthsRow.append(makeElement("span", "heat-month", label ? label.text : ""));
  }
  heatMap.append(monthsRow);

  // Una fila por día de la semana (lunes a domingo) y una casilla por semana.
  for (let row = 0; row < 7; row++) {
    const rowElement = makeElement("div", "heat-row");
    rowElement.setAttribute("role", "row");

    const dayLabel = makeElement("span", "heat-day-label", DAY_LABELS[row]);
    dayLabel.setAttribute("aria-hidden", "true");
    rowElement.append(dayLabel);

    for (const week of model.weeks) {
      const day = week[row];
      if (!day) {
        // Día futuro de esta semana: hueco sin casilla.
        const gap = makeElement("span", "heat-gap");
        gap.setAttribute("aria-hidden", "true");
        rowElement.append(gap);
        continue;
      }
      heatMapMinutes[day.date] = day.minutes;

      const cell = makeElement("div", `heat-cell level-${day.level}`);
      cell.id = cellId(day.date);
      cell.dataset.date = day.date;
      cell.setAttribute("role", "gridcell");
      cell.setAttribute("aria-label", describeDay(day.date, day.minutes));
      if (day.isToday) {
        cell.classList.add("is-today");
      }
      rowElement.append(cell);
    }
    heatMap.append(rowElement);
  }

  renderHeatMapLegend();
  heatMapEmpty.hidden = model.hasStudy;
  selectDay(selectedDateKey, true);
}

// Leyenda generada a partir de los tramos de logic.js, para que siempre coincida.
function renderHeatMapLegend() {
  heatMapLegend.innerHTML = "";
  heatMapLegend.append(makeElement("span", "legend-title", "Minutos al día:"));
  getLevelRanges().forEach((range, level) => {
    const item = makeElement("span", "legend-item");
    const swatch = makeElement("span", `heat-swatch level-${level}`);
    swatch.setAttribute("aria-hidden", "true");
    item.append(swatch, range);
    heatMapLegend.append(item);
  });
}

// Selecciona un día: lo marca, actualiza la línea de detalle y, si se pide, avisa a los
// lectores de pantalla (aria-activedescendant). Con el ratón no se avisa, para no llenar de anuncios.
function selectDay(dateKey, announce) {
  if (!(dateKey in heatMapMinutes)) {
    return; // no es un día visible del mapa
  }
  const previous = heatMap.querySelector(".is-selected");
  if (previous) {
    previous.classList.remove("is-selected");
    previous.setAttribute("aria-selected", "false");
  }
  const cell = document.getElementById(cellId(dateKey));
  cell.classList.add("is-selected");
  cell.setAttribute("aria-selected", "true");

  selectedDateKey = dateKey;
  heatMapDetail.textContent = describeDay(dateKey, heatMapMinutes[dateKey]);
  if (announce) {
    heatMap.setAttribute("aria-activedescendant", cellId(dateKey));
  }
}

// Un solo listener por tipo de evento para todo el mapa (las casillas se vuelven a crear al pintar).
heatMap.addEventListener("mouseover", (event) => {
  const cell = event.target.closest(".heat-cell");
  if (cell) {
    selectDay(cell.dataset.date, false);
  }
});

heatMap.addEventListener("click", (event) => {
  const cell = event.target.closest(".heat-cell");
  if (cell) {
    selectDay(cell.dataset.date, true);
  }
});

heatMap.addEventListener("keydown", (event) => {
  const arrows = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
  if (!arrows.includes(event.key)) {
    return; // el resto de teclas (Tab incluido) funciona con normalidad
  }
  event.preventDefault(); // que las flechas no desplacen la página
  selectDay(moveSelection(selectedDateKey, event.key, todayKey()), true);
});

function render() {
  const sessions = loadSessions();
  // Un solo "hoy" para "Esta semana" y el objetivo: así las dos cifras siempre coinciden.
  const today = todayKey();
  renderStreak(sessions);
  renderWeekMinutes(sessions, today);
  renderWeeklyGoal(sessions, today);
  renderMonthDays(sessions);
  renderHeatMap(sessions);
  renderSessions(sessions);
}

// ---------- Formulario ----------

// Comprueba los datos del formulario.
// Devuelve null si todo está bien, o el mensaje de error y el campo que hay que corregir.
function validate(date, topic, minutes) {
  if (!date) {
    return { message: "Elige una fecha.", input: dateInput };
  }
  if (date > todayKey()) {
    return { message: "La fecha no puede ser posterior a hoy.", input: dateInput };
  }
  if (!topic) {
    return { message: "Escribe el tema que has estudiado.", input: topicInput };
  }
  if (!Number.isInteger(minutes) || minutes <= 0) {
    return { message: "Los minutos deben ser un número entero mayor que 0.", input: minutesInput };
  }
  return null;
}

function resetForm() {
  dateInput.value = todayKey();
  dateInput.max = todayKey();
  topicInput.value = "";
  minutesInput.value = "";
  topicInput.focus();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const date = dateInput.value;
  const topic = topicInput.value.trim();
  const minutes = Number(minutesInput.value);

  const error = validate(date, topic, minutes);
  if (error) {
    formError.textContent = error.message;
    error.input.focus(); // lleva el cursor al campo que hay que corregir
    return;
  }

  const sessions = loadSessions();
  sessions.push({ date, topic, minutes, createdAt: Date.now() });
  if (!saveSessions(sessions)) {
    // No borramos el formulario para que no se pierda lo escrito.
    formError.textContent =
      "No se ha podido guardar la sesión. Comprueba que el navegador permite guardar datos y vuelve a intentarlo.";
    return;
  }

  formError.textContent = "";
  // En el mapa queda seleccionado el día de la sesión que se acaba de guardar.
  if (isInPeriod(date, todayKey())) {
    selectedDateKey = date;
  }
  resetForm();
  render();
});

// ---------- Formulario del objetivo semanal ----------

// Solo se valida al enviar (botón o Intro): mientras se escribe, el mensaje se queda visible.
goalForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const result = parseWeeklyGoal(goalInput.value);
  if (result.status === "error") {
    // No se guarda nada y el texto escrito se queda en el campo.
    goalError.textContent =
      "El objetivo debe ser un número entero de minutos entre 1 y 10.080. Déjalo vacío o pon 0 para quitarlo.";
    goalInput.focus();
    return;
  }

  const saved = result.status === "valid" ? saveGoal(result.minutes) : removeGoal();
  if (!saved) {
    goalError.textContent = "No se ha podido guardar el objetivo. Inténtalo de nuevo.";
    goalInput.focus();
    return;
  }

  goalError.textContent = "";
  if (result.status === "remove") {
    goalInput.value = "";
  }
  render(); // recalcula todas las estadísticas con el "hoy" de ahora
  goalInput.focus();
});

// ---------- Inicio ----------

dateInput.value = todayKey();
dateInput.max = todayKey();
// El campo del objetivo muestra lo guardado sin ceros delante ("0300" → "300"), o vacío.
const savedGoal = parseWeeklyGoal(loadGoal());
goalInput.value = savedGoal.status === "valid" ? String(savedGoal.minutes) : "";
render();
