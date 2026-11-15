// Tests de las funciones de fechas, formato y estadísticas que ya existían.
// Comprueban que siguen funcionando igual después de moverlas a logic.js.
// La zona horaria se fija antes de cargar nada, para que el resultado no dependa del ordenador.
process.env.TZ = "Europe/Madrid";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
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
} = require("../logic.js");

// Crea sesiones de prueba a partir de pares [fecha, minutos].
function sessionsFrom(pairs) {
  return pairs.map(([date, minutes], index) => ({ date, topic: "Prueba", minutes, createdAt: index }));
}

// ---------- Fechas ----------

test("toDateKey da la fecha local con ceros a la izquierda", () => {
  assert.equal(toDateKey(new Date(2026, 0, 5)), "2026-01-05");
  assert.equal(toDateKey(new Date(2026, 10, 14, 0, 30)), "2026-11-14"); // sesión a las 00:30
  assert.equal(toDateKey(new Date(2026, 10, 14, 23, 59)), "2026-11-14");
});

test("fromDateKey crea la fecha a medianoche local, no en UTC", () => {
  const date = fromDateKey("2026-03-29");
  assert.equal(date.getFullYear(), 2026);
  assert.equal(date.getMonth(), 2);
  assert.equal(date.getDate(), 29);
  assert.equal(date.getHours(), 0);
});

test("previousDayKey cruza meses, años y cambios de hora", () => {
  assert.equal(previousDayKey("2026-03-01"), "2026-02-28");
  assert.equal(previousDayKey("2028-03-01"), "2028-02-29"); // año bisiesto
  assert.equal(previousDayKey("2026-01-01"), "2025-12-31");
  assert.equal(previousDayKey("2026-03-30"), "2026-03-29"); // cambio de hora de marzo
  assert.equal(previousDayKey("2026-10-26"), "2026-10-25"); // cambio de hora de octubre
});

test("startOfWeekKey devuelve el lunes de la semana", () => {
  assert.equal(startOfWeekKey("2026-11-09"), "2026-11-09"); // lunes
  assert.equal(startOfWeekKey("2026-11-14"), "2026-11-09"); // sábado
  assert.equal(startOfWeekKey("2026-11-15"), "2026-11-09"); // domingo
  assert.equal(startOfWeekKey("2026-01-01"), "2025-12-29"); // cruza el año
  assert.equal(startOfWeekKey("2026-03-29"), "2026-03-23"); // domingo del cambio de hora
});

// ---------- Formato ----------

test("formatDate da el texto exacto en español sin depender de Intl", () => {
  assert.equal(formatDate("2026-11-12"), "jueves, 12 de noviembre de 2026");
  assert.equal(formatDate("2026-11-15"), "domingo, 15 de noviembre de 2026");
  assert.equal(formatDate("2026-01-01"), "jueves, 1 de enero de 2026");
  assert.equal(formatDate("2026-09-07"), "lunes, 7 de septiembre de 2026");
});

test("formatMinutes pasa minutos a horas y minutos", () => {
  assert.equal(formatMinutes(268), "4 h 28 min");
  assert.equal(formatMinutes(45), "45 min");
  assert.equal(formatMinutes(120), "2 h");
  assert.equal(formatMinutes(0), "0 min");
});

test("formatMinutes redondea al minuto (datos antiguos con decimales)", () => {
  assert.equal(formatMinutes(12.5), "13 min");
  assert.equal(formatMinutes(242.8), "4 h 3 min");
  assert.equal(formatMinutes(119.6), "2 h");
});

// ---------- Racha ----------

test("racha: días seguidos que terminan hoy", () => {
  const sessions = sessionsFrom([["2026-11-12", 30], ["2026-11-13", 30], ["2026-11-14", 30]]);
  assert.equal(calculateStreak(sessions, "2026-11-14"), 3);
});

test("racha: si hoy no hay sesión pero ayer sí, sigue viva desde ayer", () => {
  const sessions = sessionsFrom([["2026-11-12", 30], ["2026-11-13", 30]]);
  assert.equal(calculateStreak(sessions, "2026-11-14"), 2);
});

test("racha: si ni hoy ni ayer hay sesión, vale 0", () => {
  const sessions = sessionsFrom([["2026-11-11", 30], ["2026-11-12", 30]]);
  assert.equal(calculateStreak(sessions, "2026-11-14"), 0);
});

test("racha: varias sesiones el mismo día cuentan como un día", () => {
  const sessions = sessionsFrom([["2026-11-13", 10], ["2026-11-14", 10], ["2026-11-14", 20]]);
  assert.equal(calculateStreak(sessions, "2026-11-14"), 2);
});

test("racha: las fechas futuras no suman", () => {
  const sessions = sessionsFrom([["2026-11-14", 30], ["2026-11-15", 30], ["2026-11-16", 30]]);
  assert.equal(calculateStreak(sessions, "2026-11-14"), 1);
});

test("racha: atraviesa el cambio de hora sin saltarse días", () => {
  const sessions = sessionsFrom([["2026-03-28", 30], ["2026-03-29", 30], ["2026-03-30", 30]]);
  assert.equal(calculateStreak(sessions, "2026-03-30"), 3);
});

// ---------- Mejor racha ----------

test("mejor racha: la serie más larga del historial", () => {
  const sessions = sessionsFrom([
    ["2026-10-01", 30], ["2026-10-02", 30], ["2026-10-03", 30], ["2026-10-04", 30],
    ["2026-11-13", 30], ["2026-11-14", 30],
  ]);
  assert.equal(calculateBestStreak(sessions, "2026-11-14"), 4);
});

test("mejor racha: no cuenta fechas futuras", () => {
  const sessions = sessionsFrom([["2026-11-14", 30], ["2026-11-15", 30], ["2026-11-16", 30]]);
  assert.equal(calculateBestStreak(sessions, "2026-11-14"), 1);
});

test("mejor racha: sin sesiones vale 0", () => {
  assert.equal(calculateBestStreak([], "2026-11-14"), 0);
});

// ---------- Semana ----------

test("semana: suma desde el lunes hasta hoy, cada sesión cuenta", () => {
  const sessions = sessionsFrom([
    ["2026-11-08", 100], // domingo anterior: fuera
    ["2026-11-09", 30], // lunes
    ["2026-11-14", 45], // hoy
    ["2026-11-14", 20], // hoy otra vez: también suma
    ["2026-11-15", 60], // mañana: futuro, fuera
  ]);
  assert.equal(calculateWeekMinutes(sessions, "2026-11-14"), 95);
});

// Spec 002 (RF-7): las sesiones dañadas no cuentan y el total nunca es negativo.

test("semana: los minutos negativos no cuentan y el total nunca es negativo", () => {
  const sessions = sessionsFrom([
    ["2026-11-15", 60],
    ["2026-11-15", -30],
  ]);
  assert.equal(calculateWeekMinutes(sessions, "2026-11-15"), 60);
  assert.equal(calculateWeekMinutes(sessionsFrom([["2026-11-15", -30]]), "2026-11-15"), 0);
});

test("semana: minutos no numéricos, vacíos o ausentes no cuentan; texto numérico sí", () => {
  const sessions = sessionsFrom([
    ["2026-11-15", "abc"],
    ["2026-11-15", ""],
    ["2026-11-15", null],
    ["2026-11-15"], // sin minutos
    ["2026-11-15", "45"], // texto con un número: cuenta
  ]);
  assert.equal(calculateWeekMinutes(sessions, "2026-11-15"), 45);
});

test("semana: las fechas que no son AAAA-MM-DD válidas no cuentan", () => {
  const sessions = sessionsFrom([
    ["2026-11-1", 30],
    ["2026-13-01", 30],
    ["2026-02-30", 30],
    ["16/11/2026", 30],
    ["2026-11-10", 20], // válida: cuenta
  ]);
  assert.equal(calculateWeekMinutes(sessions, "2026-11-15"), 20);
});

test("semana: hoy domingo cuenta del lunes 9 al domingo 15", () => {
  const sessions = sessionsFrom([
    ["2026-11-08", 100], // domingo anterior: fuera
    ["2026-11-09", 10],
    ["2026-11-15", 20],
  ]);
  assert.equal(calculateWeekMinutes(sessions, "2026-11-15"), 30);
});

test("semana: el lunes empieza una semana nueva", () => {
  const sessions = [
    { date: "2026-11-15", topic: "Prueba", minutes: 40, createdAt: new Date(2026, 10, 15, 23, 59).getTime() },
    { date: "2026-11-16", topic: "Prueba", minutes: 25, createdAt: new Date(2026, 10, 16, 0, 30).getTime() },
  ];
  assert.equal(calculateWeekMinutes(sessions, "2026-11-16"), 25);
});

test("semana: semanas con cambio de hora", () => {
  // Otoño: el domingo 25 de octubre de 2026 cambia la hora; la semana empieza el lunes 19.
  const october = sessionsFrom([
    ["2026-10-18", 100], // domingo anterior: fuera
    ["2026-10-19", 15],
    ["2026-10-25", 10],
  ]);
  assert.equal(calculateWeekMinutes(october, "2026-10-25"), 25);
  // Primavera: el domingo 29 de marzo de 2026 cambia la hora; la semana empieza el lunes 23.
  const march = sessionsFrom([
    ["2026-03-22", 100], // domingo anterior: fuera
    ["2026-03-23", 15],
    ["2026-03-29", 10],
  ]);
  assert.equal(calculateWeekMinutes(march, "2026-03-29"), 25);
});

test("semana: cruza el cambio de año", () => {
  const sessions = sessionsFrom([
    ["2026-12-27", 100], // domingo anterior: fuera
    ["2026-12-28", 30], // lunes
    ["2027-01-01", 20], // hoy
  ]);
  assert.equal(calculateWeekMinutes(sessions, "2027-01-01"), 50);
});

test("semana: las fechas futuras no suman", () => {
  const sessions = sessionsFrom([
    ["2026-11-15", 30],
    ["2026-11-20", 60], // futuro
  ]);
  assert.equal(calculateWeekMinutes(sessions, "2026-11-15"), 30);
});

test("semana: no modifica la lista que recibe", () => {
  const sessions = sessionsFrom([
    ["2026-11-15", "30"],
    ["2026-11-15", -10],
    ["2026-11-1", 20],
  ]);
  const copy = structuredClone(sessions);
  calculateWeekMinutes(sessions, "2026-11-15");
  assert.deepEqual(sessions, copy);
});

// ---------- Mes ----------

test("mes: días distintos desde el día 1 hasta hoy", () => {
  const sessions = sessionsFrom([
    ["2026-10-31", 30], // mes anterior: fuera
    ["2026-11-01", 30],
    ["2026-11-01", 15], // mismo día: cuenta una vez
    ["2026-11-14", 30],
    ["2026-11-20", 30], // futuro: fuera
  ]);
  assert.equal(calculateMonthStudyDays(sessions, "2026-11-14"), 2);
});
