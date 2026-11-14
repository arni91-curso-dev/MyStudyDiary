// Tests del mapa de calor (spec 001). La zona horaria se fija antes de cargar nada,
// para que el resultado no dependa del ordenador y se puedan probar los cambios de hora reales.
process.env.TZ = "Europe/Madrid";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
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
  LEVEL_LIMITS,
  HEAT_MAP_WEEKS,
} = require("../logic.js");

// Crea sesiones de prueba a partir de pares [fecha, minutos].
function sessionsFrom(pairs) {
  return pairs.map(([date, minutes], index) => ({ date, topic: "Prueba", minutes, createdAt: index }));
}

// Todas las fechas (no huecos) del modelo, en orden de calendario.
function allDays(model) {
  const days = [];
  for (const week of model.weeks) {
    for (const day of week) {
      if (day) days.push(day);
    }
  }
  return days;
}

// ---------- T2: validez y periodo (RF-1, RF-3, RNF-6) ----------

test("addDaysKey suma y resta días cruzando meses, años y cambios de hora", () => {
  assert.equal(addDaysKey("2026-11-14", 1), "2026-11-15");
  assert.equal(addDaysKey("2026-12-31", 1), "2027-01-01");
  assert.equal(addDaysKey("2026-03-01", -1), "2026-02-28");
  assert.equal(addDaysKey("2026-03-28", 2), "2026-03-30"); // cambio de hora de marzo
  assert.equal(addDaysKey("2026-10-24", 2), "2026-10-26"); // cambio de hora de octubre
  assert.equal(addDaysKey("2026-11-09", -77), "2026-08-24");
});

test("isValidDateKey solo acepta días reales con formato AAAA-MM-DD", () => {
  assert.equal(isValidDateKey("2026-11-12"), true);
  assert.equal(isValidDateKey("2028-02-29"), true); // bisiesto
  assert.equal(isValidDateKey("2026-02-29"), false);
  assert.equal(isValidDateKey("2026-02-30"), false);
  assert.equal(isValidDateKey("2026-13-01"), false);
  assert.equal(isValidDateKey("2026-2-3"), false);
  assert.equal(isValidDateKey(""), false);
  assert.equal(isValidDateKey(null), false);
  assert.equal(isValidDateKey(undefined), false);
  assert.equal(isValidDateKey(20261112), false);
});

test("parseMinutes acepta números mayores que 0 y devuelve 0 en el resto", () => {
  assert.equal(parseMinutes(45), 45);
  assert.equal(parseMinutes("45"), 45);
  assert.equal(parseMinutes(12.5), 12.5);
  assert.equal(parseMinutes(0), 0);
  assert.equal(parseMinutes(-5), 0);
  assert.equal(parseMinutes("abc"), 0);
  assert.equal(parseMinutes(NaN), 0);
  assert.equal(parseMinutes(Infinity), 0);
  assert.equal(parseMinutes(null), 0);
  assert.equal(parseMinutes(undefined), 0);
  assert.equal(parseMinutes(true), 0);
});

test("isValidSession exige fecha real y minutos mayores que 0", () => {
  assert.equal(isValidSession({ date: "2026-11-12", minutes: 30 }), true);
  assert.equal(isValidSession({ date: "2026-11-12", minutes: "30" }), true);
  assert.equal(isValidSession({ date: "2026-11-12", minutes: 0 }), false);
  assert.equal(isValidSession({ date: "2026-02-30", minutes: 30 }), false);
  assert.equal(isValidSession({ minutes: 30 }), false);
  assert.equal(isValidSession(null), false);
  assert.equal(isValidSession("sesión"), false);
});

test("periodo: si hoy es lunes tiene 78 días y empieza en lunes", () => {
  const { startKey, endKey } = getHeatMapPeriod("2026-11-09");
  assert.equal(startKey, "2026-08-24");
  assert.equal(endKey, "2026-11-09");
  assert.equal(allDays(buildHeatMap([], "2026-11-09")).length, 78);
});

test("periodo: si hoy es domingo tiene 84 días", () => {
  const { startKey } = getHeatMapPeriod("2026-11-15");
  assert.equal(startKey, "2026-08-24");
  assert.equal(allDays(buildHeatMap([], "2026-11-15")).length, 84);
});

test("periodo: cruza el cambio de año", () => {
  assert.equal(getHeatMapPeriod("2027-01-06").startKey, "2026-10-19");
});

test("isInPeriod incluye el inicio y hoy, y excluye lo de fuera", () => {
  const today = "2026-11-14";
  assert.equal(isInPeriod("2026-08-24", today), true);
  assert.equal(isInPeriod("2026-11-14", today), true);
  assert.equal(isInPeriod("2026-08-23", today), false);
  assert.equal(isInPeriod("2026-11-15", today), false);
  assert.equal(isInPeriod("no es fecha", today), false);
});

// ---------- T3: minutos y niveles (RF-2, RF-3, RF-4) ----------

test("suma por día: se suman las sesiones del mismo día", () => {
  const totals = sumMinutesByDay(sessionsFrom([["2026-11-12", 20], ["2026-11-12", 15]]), "2026-08-24", "2026-11-14");
  assert.equal(totals["2026-11-12"], 35);
});

test("suma por día: el total se redondea al minuto", () => {
  const totals = sumMinutesByDay(
    sessionsFrom([
      ["2026-11-10", 12.5],
      ["2026-11-11", 0.3],
      ["2026-11-12", 10.3333],
      ["2026-11-12", 19.6667],
    ]),
    "2026-08-24",
    "2026-11-14"
  );
  assert.equal(totals["2026-11-10"], 13);
  assert.equal(totals["2026-11-11"] || 0, 0);
  assert.equal(totals["2026-11-12"], 30);
});

test("suma por día: ignora sesiones no válidas, futuras y anteriores al periodo", () => {
  const totals = sumMinutesByDay(
    sessionsFrom([
      ["2026-11-12", -5],
      ["2026-11-12", "abc"],
      ["2026-02-30", 30],
      ["2026-11-15", 30], // futura
      ["2026-08-23", 30], // antes del periodo
      ["2026-08-24", 30], // primer día del periodo
    ]),
    "2026-08-24",
    "2026-11-14"
  );
  assert.deepEqual({ ...totals }, { "2026-08-24": 30 });
});

test("niveles: límites exactos de cada tramo", () => {
  const casos = [[0, 0], [1, 1], [29, 1], [30, 2], [59, 2], [60, 3], [119, 3], [120, 4], [1441, 4]];
  for (const [minutos, nivel] of casos) {
    assert.equal(minutesToLevel(minutos), nivel, `${minutos} min debería ser nivel ${nivel}`);
  }
});

test("leyenda: los tramos salen de LEVEL_LIMITS", () => {
  assert.deepEqual(LEVEL_LIMITS, [30, 60, 120]);
  assert.deepEqual(getLevelRanges(), ["0 min", "1–29", "30–59", "60–119", "120+"]);
});

// ---------- T4: modelo del mapa (RF-1, RF-2, RF-4, RF-6, CA-8.2, CA-8.3, RNF-6, RNF-7) ----------

test("modelo: 12 semanas de 7 días, con huecos después de hoy", () => {
  const model = buildHeatMap([], "2026-11-12"); // jueves
  assert.equal(HEAT_MAP_WEEKS, 12);
  assert.equal(model.weeks.length, 12);
  for (const week of model.weeks) assert.equal(week.length, 7);
  const currentWeek = model.weeks[11];
  assert.equal(currentWeek[3].date, "2026-11-12");
  assert.equal(currentWeek[4], null);
  assert.equal(currentWeek[5], null);
  assert.equal(currentWeek[6], null);
  assert.equal(model.weeks[0][0].date, "2026-08-24");
});

test("modelo: solo hoy está marcado como hoy", () => {
  const today = "2026-11-12";
  const marked = allDays(buildHeatMap([], today)).filter((day) => day.isToday);
  assert.deepEqual(marked.map((day) => day.date), [today]);
});

test("modelo: minutos y nivel de cada día", () => {
  const model = buildHeatMap(sessionsFrom([["2026-11-10", 45], ["2026-11-10", 30], ["2026-11-11", 10]]), "2026-11-12");
  const byDate = Object.fromEntries(allDays(model).map((day) => [day.date, day]));
  assert.equal(byDate["2026-11-10"].minutes, 75);
  assert.equal(byDate["2026-11-10"].level, 3);
  assert.equal(byDate["2026-11-11"].level, 1);
  assert.equal(byDate["2026-11-09"].level, 0);
});

test("modelo: hasStudy solo con algún día con minutos", () => {
  assert.equal(buildHeatMap([], "2026-11-12").hasStudy, false);
  assert.equal(buildHeatMap(sessionsFrom([["2026-11-10", 0], ["2026-11-10", -3]]), "2026-11-12").hasStudy, false);
  assert.equal(buildHeatMap(sessionsFrom([["2026-11-10", 0.3]]), "2026-11-12").hasStudy, false);
  assert.equal(buildHeatMap(sessionsFrom([["2026-01-01", 60]]), "2026-11-12").hasStudy, false); // fuera del periodo
  assert.equal(buildHeatMap(sessionsFrom([["2026-11-10", 5]]), "2026-11-12").hasStudy, true);
});

test("modelo: datos dañados o que no son una lista dan un mapa vacío sin errores", () => {
  for (const dañado of [null, undefined, "texto", 42, {}, [null, 5, "x", { date: "2026-11-10" }]]) {
    const model = buildHeatMap(dañado, "2026-11-12");
    assert.equal(model.weeks.length, 12);
    assert.equal(model.hasStudy, false);
  }
});

test("modelo: no modifica la lista de sesiones que recibe", () => {
  const sessions = sessionsFrom([["2026-11-10", 12.5], ["2026-11-11", 30]]);
  const copia = JSON.parse(JSON.stringify(sessions));
  buildHeatMap(sessions, "2026-11-12");
  assert.deepEqual(sessions, copia);
});

test("etiquetas de mes: en la primera columna y donde el lunes cambia de mes", () => {
  // Lunes de las columnas: 24/08, 31/08, 07/09 ... 05/10 ... 02/11, 09/11
  const { monthLabels } = buildHeatMap([], "2026-11-14");
  assert.deepEqual(monthLabels, [
    { column: 0, text: "ago" },
    { column: 2, text: "sep" },
    { column: 6, text: "oct" },
    { column: 10, text: "nov" },
  ]);
});

test("etiquetas de mes: si las columnas 0 y 1 tienen etiqueta, solo queda la de la 1", () => {
  // Lunes de las columnas: 31/08, 07/09, ...
  const { monthLabels } = buildHeatMap([], "2026-11-18");
  assert.deepEqual(monthLabels[0], { column: 1, text: "sep" });
  assert.equal(monthLabels.some((label) => label.column === 0), false);
});

test("etiquetas de mes: un día 1 futuro de esta semana no tiene etiqueta", () => {
  // Hoy es lunes 30/11; el 1/12 es mañana.
  const { monthLabels } = buildHeatMap([], "2026-11-30");
  assert.equal(monthLabels.some((label) => label.text === "dic"), false);
});

test("etiquetas de mes: cruzan de diciembre a enero", () => {
  const texts = buildHeatMap([], "2027-01-06").monthLabels.map((label) => label.text);
  assert.deepEqual(texts, ["oct", "nov", "dic", "ene"]);
});

test("cambio de hora: 84 fechas distintas y seguidas en marzo y en octubre", () => {
  for (const today of ["2026-04-12", "2026-11-01"]) {
    const dates = allDays(buildHeatMap([], today)).map((day) => day.date);
    assert.equal(dates.length, 84);
    assert.equal(new Set(dates).size, 84);
    for (let i = 1; i < dates.length; i++) {
      assert.equal(addDaysKey(dates[i - 1], 1), dates[i], `después de ${dates[i - 1]} debería ir ${dates[i]}`);
    }
  }
});

test("rendimiento: 5000 sesiones en menos de 100 ms", () => {
  const sessions = [];
  for (let i = 0; i < 5000; i++) {
    sessions.push({ date: addDaysKey("2026-11-14", -(i % 900)), topic: "Prueba", minutes: (i % 150) + 1, createdAt: i });
  }
  const start = performance.now();
  buildHeatMap(sessions, "2026-11-14");
  const elapsed = performance.now() - start;
  assert.ok(elapsed < 100, `ha tardado ${elapsed.toFixed(1)} ms`);
});

test("zona horaria: el mismo día guardado sale igual en cualquier zona", () => {
  const sessions = sessionsFrom([["2026-11-10", 45], ["2026-11-12", 90]]);
  const original = process.env.TZ;
  const resultados = ["Europe/Madrid", "America/New_York", "Asia/Tokyo"].map((zona) => {
    process.env.TZ = zona;
    return JSON.stringify(buildHeatMap(sessions, "2026-11-12"));
  });
  process.env.TZ = original;
  assert.equal(new Set(resultados).size, 1);
});

test("reloj mal puesto: el periodo se mueve con 'hoy' y no falla", () => {
  const sessions = sessionsFrom([["2026-11-10", 45]]);
  const adelantado = buildHeatMap(sessions, "2030-01-15"); // la sesión queda antes del periodo
  assert.equal(adelantado.hasStudy, false);
  assert.equal(adelantado.weeks.length, 12);
  const atrasado = buildHeatMap(sessions, "2025-01-15"); // la sesión queda en el futuro
  assert.equal(atrasado.hasStudy, false);
  assert.equal(atrasado.weeks.length, 12);
});

// ---------- T5: detalle y teclado (RF-5) ----------

test("detalle: fecha completa y minutos, o 'sin estudio'", () => {
  assert.equal(describeDay("2026-11-12", 90), "jueves, 12 de noviembre de 2026: 1 h 30 min");
  assert.equal(describeDay("2026-11-10", 0), "martes, 10 de noviembre de 2026: sin estudio");
  assert.equal(describeDay("2026-11-10", 13), "martes, 10 de noviembre de 2026: 13 min");
  assert.equal(describeDay("2026-11-10", 100000), "martes, 10 de noviembre de 2026: 1666 h 40 min");
});

test("teclado: izquierda y derecha cambian de semana", () => {
  const today = "2026-11-14";
  assert.equal(moveSelection("2026-11-11", "ArrowLeft", today), "2026-11-04");
  assert.equal(moveSelection("2026-11-04", "ArrowRight", today), "2026-11-11");
});

test("teclado: arriba y abajo cambian de día sin salir de la semana", () => {
  const today = "2026-11-14";
  assert.equal(moveSelection("2026-11-11", "ArrowUp", today), "2026-11-10");
  assert.equal(moveSelection("2026-11-11", "ArrowDown", today), "2026-11-12");
  assert.equal(moveSelection("2026-11-02", "ArrowUp", today), "2026-11-02"); // lunes: no sube
  assert.equal(moveSelection("2026-11-08", "ArrowDown", today), "2026-11-08"); // domingo: no baja
});

test("teclado: no pasa de hoy ni del inicio del periodo", () => {
  const today = "2026-11-12"; // jueves
  assert.equal(moveSelection("2026-11-12", "ArrowDown", today), "2026-11-12"); // viernes es futuro
  assert.equal(moveSelection("2026-11-06", "ArrowRight", today), "2026-11-06"); // 13/11 es futuro
  assert.equal(moveSelection("2026-08-26", "ArrowLeft", today), "2026-08-26"); // antes del periodo
});

test("teclado: las demás teclas no cambian nada", () => {
  const today = "2026-11-14";
  for (const key of ["Enter", "a", "Tab", "Home", "Escape"]) {
    assert.equal(moveSelection("2026-11-11", key, today), "2026-11-11");
  }
});
