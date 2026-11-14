// Diario de Estudio: lógica pura (fechas, formato y estadísticas).
// Aquí no se toca la página ni se lee el reloj: la fecha de hoy llega siempre como parámetro.
// Este archivo lo usan la página (con un <script> normal) y los tests (con node --test).
// Las fechas se guardan como texto "AAAA-MM-DD" en hora local (nunca UTC).

// Nombres fijos en español: así el texto es igual en cualquier navegador y en Node.
const WEEKDAY_NAMES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

// ---------- Fechas (siempre en hora local) ----------

// Convierte un Date en "AAAA-MM-DD" usando la fecha local del usuario.
function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Convierte "AAAA-MM-DD" en un Date local (a medianoche local, no UTC).
function fromDateKey(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

// Devuelve el día anterior a una fecha "AAAA-MM-DD".
function previousDayKey(key) {
  const date = fromDateKey(key);
  date.setDate(date.getDate() - 1);
  return toDateKey(date);
}

// Devuelve el lunes de la semana de una fecha "AAAA-MM-DD".
// getDay() da 0 el domingo, 1 el lunes...; (getDay() + 6) % 7 son los días que hay que retroceder.
function startOfWeekKey(key) {
  const date = fromDateKey(key);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return toDateKey(date);
}

// ---------- Formato ----------

// Texto legible para la lista, por ejemplo "jueves, 13 de noviembre de 2026".
function formatDate(key) {
  const date = fromDateKey(key);
  const weekday = WEEKDAY_NAMES[date.getDay()];
  const month = MONTH_NAMES[date.getMonth()];
  return `${weekday}, ${date.getDate()} de ${month} de ${date.getFullYear()}`;
}

// Pasa minutos a texto legible: 268 → "4 h 28 min", 45 → "45 min", 120 → "2 h".
function formatMinutes(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) {
    return `${minutes} min`;
  }
  if (minutes === 0) {
    return `${hours} h`;
  }
  return `${hours} h ${minutes} min`;
}

// ---------- Racha ----------

// Cuenta los días seguidos con al menos una sesión que terminan hoy.
// Si hoy aún no hay sesión pero ayer sí, la racha sigue viva y se cuenta desde ayer.
function calculateStreak(sessions, todayKey) {
  const studiedDays = new Set(sessions.map((session) => session.date));

  let day = todayKey;
  if (!studiedDays.has(day)) {
    day = previousDayKey(day);
  }

  let streak = 0;
  while (studiedDays.has(day)) {
    streak++;
    day = previousDayKey(day);
  }
  return streak;
}

// Busca la serie más larga de días consecutivos con sesión en todo el historial.
// Las fechas futuras no cuentan y varias sesiones el mismo día valen como un solo día.
function calculateBestStreak(sessions, todayKey) {
  const pastDays = sessions.map((session) => session.date).filter((date) => date <= todayKey);
  const days = [...new Set(pastDays)].sort(); // "AAAA-MM-DD" se ordena bien como texto

  let best = 0;
  let current = 0;
  let previousDay = null;
  for (const day of days) {
    // Si el día anterior a este es el último que hemos visto, la serie continúa.
    current = previousDayKey(day) === previousDay ? current + 1 : 1;
    best = Math.max(best, current);
    previousDay = day;
  }
  return best;
}

// ---------- Semana ----------

// Suma los minutos de las sesiones desde el lunes de esta semana hasta hoy.
// Aquí cada sesión cuenta, aunque haya varias el mismo día. Las fechas futuras no suman.
function calculateWeekMinutes(sessions, todayKey) {
  const monday = startOfWeekKey(todayKey);
  return sessions
    .filter((session) => session.date >= monday && session.date <= todayKey)
    .reduce((total, session) => total + (Number(session.minutes) || 0), 0);
}

// ---------- Mes ----------

// Cuenta los días distintos con al menos una sesión desde el día 1 de este mes hasta hoy.
// Las fechas del mes actual empiezan por "AAAA-MM", los mismos 7 caracteres que hoy.
// Varias sesiones el mismo día cuentan como un solo día. Las fechas futuras no suman.
function calculateMonthStudyDays(sessions, todayKey) {
  const currentMonth = todayKey.slice(0, 7);
  const days = new Set(
    sessions
      .filter((session) => session.date.slice(0, 7) === currentMonth && session.date <= todayKey)
      .map((session) => session.date)
  );
  return days.size;
}

// ---------- Mapa de calor (spec 001) ----------

const HEAT_MAP_WEEKS = 12;
// Minutos a partir de los cuales se sube de nivel: 1-29 → 1, 30-59 → 2, 60-119 → 3, 120+ → 4.
const LEVEL_LIMITS = [30, 60, 120];
const MONTH_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

// Suma (o resta, si n es negativo) días a una fecha. Usa setDate, nunca milisegundos,
// porque por los cambios de hora no todos los días duran 24 horas.
function addDaysKey(key, n) {
  const date = fromDateKey(key);
  date.setDate(date.getDate() + n);
  return toDateKey(date);
}

// true si es un texto "AAAA-MM-DD" de un día que existe (descarta, por ejemplo, el 30 de febrero).
function isValidDateKey(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  // Si la fecha no existe, al convertirla y volver a texto sale otro día.
  return toDateKey(fromDateKey(value)) === value;
}

// Lee los minutos guardados: un número (o texto con un número) mayor que 0. Si no, 0.
function parseMinutes(value) {
  if (typeof value !== "number" && typeof value !== "string") {
    return 0;
  }
  const minutes = Number(value);
  return Number.isFinite(minutes) && minutes > 0 ? minutes : 0;
}

// Una sesión vale para el mapa si su fecha existe y sus minutos son mayores que 0.
function isValidSession(session) {
  return (
    typeof session === "object" &&
    session !== null &&
    isValidDateKey(session.date) &&
    parseMinutes(session.minutes) > 0
  );
}

// El periodo va del lunes de hace 11 semanas hasta hoy: la semana actual y las 11 anteriores.
function getHeatMapPeriod(todayKey) {
  const startKey = addDaysKey(startOfWeekKey(todayKey), -(HEAT_MAP_WEEKS - 1) * 7);
  return { startKey, endKey: todayKey };
}

function isInPeriod(dateKey, todayKey) {
  const { startKey, endKey } = getHeatMapPeriod(todayKey);
  return isValidDateKey(dateKey) && dateKey >= startKey && dateKey <= endKey;
}

// Suma los minutos de las sesiones válidas de cada día del periodo y redondea cada total al minuto.
// Devuelve un objeto { "AAAA-MM-DD": minutos }.
function sumMinutesByDay(sessions, startKey, endKey) {
  const totals = {};
  for (const session of sessions) {
    if (!isValidSession(session) || session.date < startKey || session.date > endKey) {
      continue;
    }
    totals[session.date] = (totals[session.date] || 0) + parseMinutes(session.minutes);
  }
  for (const date of Object.keys(totals)) {
    totals[date] = Math.round(totals[date]);
  }
  return totals;
}

// Nivel de color de un día: 0 sin estudio y de 1 a 4 según los tramos de LEVEL_LIMITS.
function minutesToLevel(minutes) {
  if (minutes <= 0) {
    return 0;
  }
  return 1 + LEVEL_LIMITS.filter((limit) => minutes >= limit).length;
}

// Textos de la leyenda, sacados de LEVEL_LIMITS: ["0 min", "1–29", "30–59", "60–119", "120+"].
function getLevelRanges() {
  const ranges = ["0 min"];
  let from = 1;
  for (const limit of LEVEL_LIMITS) {
    ranges.push(`${from}–${limit - 1}`);
    from = limit;
  }
  ranges.push(`${from}+`);
  return ranges;
}

// Construye el modelo del mapa: 12 semanas (columnas) de 7 días (lunes a domingo).
// Cada día es { date, minutes, level, isToday } o null si es un día futuro de esta semana.
function buildHeatMap(sessions, todayKey) {
  const safeSessions = Array.isArray(sessions) ? sessions : []; // datos dañados → mapa vacío
  const { startKey, endKey } = getHeatMapPeriod(todayKey);
  const totals = sumMinutesByDay(safeSessions, startKey, endKey);

  const weeks = [];
  let monthLabels = [];
  let hasStudy = false;
  let monday = startKey;
  let previousMonth = null;

  for (let column = 0; column < HEAT_MAP_WEEKS; column++) {
    // La etiqueta del mes va donde el lunes cambia de mes (y en la primera columna).
    const month = fromDateKey(monday).getMonth();
    if (column === 0 || month !== previousMonth) {
      monthLabels.push({ column, text: MONTH_SHORT[month] });
    }
    previousMonth = month;

    const days = [];
    for (let row = 0; row < 7; row++) {
      const date = addDaysKey(monday, row);
      if (date > todayKey) {
        days.push(null); // día futuro: hueco
        continue;
      }
      const minutes = totals[date] || 0;
      if (minutes > 0) {
        hasStudy = true;
      }
      days.push({ date, minutes, level: minutesToLevel(minutes), isToday: date === todayKey });
    }
    weeks.push(days);
    monday = addDaysKey(monday, 7);
  }

  // Si las columnas 0 y 1 tienen etiqueta se solaparían: dejamos solo la de la 1.
  if (monthLabels.length > 1 && monthLabels[1].column === 1) {
    monthLabels = monthLabels.slice(1);
  }

  return { weeks, monthLabels, hasStudy, startKey, endKey };
}

// Texto de un día para la línea de detalle y los lectores de pantalla.
// Recibe los minutos ya redondeados: "jueves, 12 de noviembre de 2026: 1 h 30 min".
function describeDay(dateKey, minutes) {
  const amount = minutes > 0 ? formatMinutes(minutes) : "sin estudio";
  return `${formatDate(dateKey)}: ${amount}`;
}

// Nueva fecha seleccionada al pulsar una flecha. Izquierda/derecha: semana anterior/siguiente.
// Arriba/abajo: día anterior/siguiente sin salir de la semana. Si el destino no existe, no se mueve.
function moveSelection(dateKey, keyName, todayKey) {
  const weekday = fromDateKey(dateKey).getDay(); // 0 domingo, 1 lunes...
  let target;
  if (keyName === "ArrowLeft") {
    target = addDaysKey(dateKey, -7);
  } else if (keyName === "ArrowRight") {
    target = addDaysKey(dateKey, 7);
  } else if (keyName === "ArrowUp" && weekday !== 1) {
    target = addDaysKey(dateKey, -1);
  } else if (keyName === "ArrowDown" && weekday !== 0) {
    target = addDaysKey(dateKey, 1);
  } else {
    return dateKey;
  }
  return isInPeriod(target, todayKey) ? target : dateKey;
}

// En Node (tests) exportamos las funciones; en el navegador `module` no existe y no hace nada.
if (typeof module !== "undefined") {
  module.exports = {
    toDateKey,
    fromDateKey,
    previousDayKey,
    startOfWeekKey,
    formatDate,
    formatMinutes,
    calculateStreak,
    calculateBestStreak,
    calculateWeekMinutes,
    calculateMonthStudyDays,
    HEAT_MAP_WEEKS,
    LEVEL_LIMITS,
    addDaysKey,
    isValidDateKey,
    parseMinutes,
    isValidSession,
    getHeatMapPeriod,
    isInPeriod,
    sumMinutesByDay,
    minutesToLevel,
    getLevelRanges,
    buildHeatMap,
    describeDay,
    moveSelection,
  };
}
