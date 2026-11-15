// Tests del objetivo semanal (spec 002): validación del objetivo y progreso de la semana.
process.env.TZ = "Europe/Madrid";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  MAX_WEEKLY_GOAL,
  parseWeeklyGoal,
  calculateGoalPercent,
  buildWeeklyGoalProgress,
  calculateWeekMinutes,
} = require("../logic.js");

test("MAX_WEEKLY_GOAL son los minutos de una semana", () => {
  assert.equal(MAX_WEEKLY_GOAL, 10080);
});

test("parseWeeklyGoal: válido (CA-2.2, CA-2.3)", () => {
  const cases = [
    ["1", 1],
    ["10080", 10080],
    ["300", 300],
    ["0300", 300],
    [" 300 ", 300],
    ["\t300\t", 300],
  ];
  for (const [raw, minutes] of cases) {
    assert.deepEqual(parseWeeklyGoal(raw), { status: "valid", minutes }, JSON.stringify(raw));
  }
});

test("parseWeeklyGoal: quitar (CA-2.4)", () => {
  for (const raw of ["", "   ", "\t", "0", "00"]) {
    assert.deepEqual(parseWeeklyGoal(raw), { status: "remove" }, JSON.stringify(raw));
  }
});

test("parseWeeklyGoal: error (CA-2.5)", () => {
  const cases = ["1.000", "10.080", "+300", "-0", "-5", "1e3", "12,5", "300 min", "abc", "10081", "20000", "300.0"];
  for (const raw of cases) {
    assert.deepEqual(parseWeeklyGoal(raw), { status: "error" }, JSON.stringify(raw));
  }
});

test("parseWeeklyGoal: solo quita espacios y tabuladores, no saltos de línea", () => {
  assert.deepEqual(parseWeeklyGoal("300\n"), { status: "error" });
});

test("parseWeeklyGoal: valor guardado en localStorage (CA-8.3, CA-8.4)", () => {
  assert.notEqual(parseWeeklyGoal(null).status, "valid");
  assert.equal(parseWeeklyGoal("abc").status, "error");
  assert.deepEqual(parseWeeklyGoal("0300"), { status: "valid", minutes: 300 });
  assert.deepEqual(parseWeeklyGoal(" 300 "), { status: "valid", minutes: 300 });
  assert.notEqual(parseWeeklyGoal("300.0").status, "valid");
  assert.notEqual(parseWeeklyGoal("20000").status, "valid");
});

test("parseWeeklyGoal: bruto que no es texto no es válido", () => {
  for (const raw of [null, undefined, 300]) {
    assert.notEqual(parseWeeklyGoal(raw).status, "valid", String(raw));
  }
});

// ---------- Porcentaje ----------

test("calculateGoalPercent: redondea hacia abajo con un máximo de 100", () => {
  const cases = [
    [120, 300, 40],
    [268, 300, 89],
    [299, 300, 99],
    [0, 45, 0],
    [100, 300, 33],
    [10079, 10080, 99],
    [300, 300, 100],
    [350, 300, 100],
  ];
  for (const [total, goal, percent] of cases) {
    assert.equal(calculateGoalPercent(total, goal), percent, `${total}/${goal}`);
  }
});

// ---------- Progreso ----------

// Hoy domingo 15-11-2026: la semana va del lunes 09-11 al 15-11.
const TODAY = "2026-11-15";

// Una sola sesión de hoy con los minutos indicados.
function sessionsWith(minutes) {
  return [{ date: TODAY, topic: "Repaso", minutes, createdAt: 1 }];
}

test("buildWeeklyGoalProgress: texto, porcentaje y cumplido (sección 7)", () => {
  const cases = [
    // [total, objetivo en bruto, texto, porcentaje, cumplido]
    [0, "300", "0 min / 5 h (0 %)", 0, false],
    [100.4, "300", "1 h 40 min / 5 h (33 %)", 33, false],
    [120, "300", "2 h / 5 h (40 %)", 40, false],
    [268, "300", "4 h 28 min / 5 h (89 %)", 89, false],
    [299, "300", "4 h 59 min / 5 h (99 %)", 99, false],
    [299.6, "300", "5 h / 5 h", 100, true],
    [300, "300", "5 h / 5 h", 100, true],
    [350, "300", "5 h 50 min / 5 h", 100, true],
    [100000, "300", "1666 h 40 min / 5 h", 100, true],
    [0, "1", "0 min / 1 min (0 %)", 0, false],
    [1, "1", "1 min / 1 min", 100, true],
    [0, "45", "0 min / 45 min (0 %)", 0, false],
    [10079, "10080", "167 h 59 min / 168 h (99 %)", 99, false],
    [250, "200", "4 h 10 min / 3 h 20 min", 100, true],
    [250, "300", "4 h 10 min / 5 h (83 %)", 83, false],
  ];
  for (const [total, rawGoal, text, percent, isMet] of cases) {
    const progress = buildWeeklyGoalProgress(total === 0 ? [] : sessionsWith(total), TODAY, rawGoal);
    assert.equal(progress.hasGoal, true, `${total}/${rawGoal}`);
    assert.equal(progress.text, text, `${total}/${rawGoal}`);
    assert.equal(progress.percent, percent, `${total}/${rawGoal}`);
    assert.equal(progress.isMet, isMet, `${total}/${rawGoal}`);
  }
});

test("buildWeeklyGoalProgress: devuelve el objetivo y el total redondeado", () => {
  assert.deepEqual(buildWeeklyGoalProgress(sessionsWith(299.6), TODAY, "0300"), {
    hasGoal: true,
    goalMinutes: 300,
    totalMinutes: 300,
    percent: 100,
    isMet: true,
    text: "5 h / 5 h",
  });
});

test("buildWeeklyGoalProgress: objetivo en bruto con espacios (CA-8.4)", () => {
  const progress = buildWeeklyGoalProgress(sessionsWith(120), TODAY, " 300 ");
  assert.equal(progress.goalMinutes, 300);
  assert.equal(progress.text, "2 h / 5 h (40 %)");
});

test("buildWeeklyGoalProgress: datos dañados no cuentan y el total nunca es negativo (CA-7.2, CA-7.3)", () => {
  const onlyNegative = buildWeeklyGoalProgress(sessionsWith(-30), TODAY, "300");
  assert.equal(onlyNegative.totalMinutes, 0);
  assert.equal(onlyNegative.text, "0 min / 5 h (0 %)");

  const mixed = [
    { date: TODAY, minutes: 60, createdAt: 1 },
    { date: TODAY, minutes: -30, createdAt: 2 },
    { date: TODAY, minutes: "abc", createdAt: 3 },
    { date: TODAY, createdAt: 4 },
    { date: "2026-11-1", minutes: 45, createdAt: 5 },
    { date: "2026-02-30", minutes: 45, createdAt: 6 },
  ];
  assert.equal(buildWeeklyGoalProgress(mixed, TODAY, "300").text, "1 h / 5 h (20 %)");
});

// ---------- Sin objetivo ----------

test("buildWeeklyGoalProgress: sin objetivo si el valor guardado falta o no es válido (RF-5, CA-8.4)", () => {
  for (const rawGoal of [null, undefined, "", "abc", "0", "00", "300.0", "20000", 300]) {
    assert.deepEqual(buildWeeklyGoalProgress(sessionsWith(120), TODAY, rawGoal), { hasGoal: false }, String(rawGoal));
  }
});

// ---------- Coincide con "Esta semana" ----------

test("buildWeeklyGoalProgress: el total es el de \"Esta semana\" redondeado (CA-7.1)", () => {
  const sessions = [
    { date: "2026-11-09", minutes: 30.4, createdAt: 1 },
    { date: "2026-11-12", minutes: "45", createdAt: 2 },
    { date: TODAY, minutes: 20, createdAt: 3 },
    { date: TODAY, minutes: -30, createdAt: 4 },
    { date: "2026-11-08", minutes: 90, createdAt: 5 },
    { date: "2026-11-20", minutes: 90, createdAt: 6 },
    { date: "16/11/2026", minutes: 90, createdAt: 7 },
  ];
  const progress = buildWeeklyGoalProgress(sessions, TODAY, "300");
  assert.equal(progress.totalMinutes, Math.round(calculateWeekMinutes(sessions, TODAY)));
  assert.equal(progress.totalMinutes, 95);
});

test("buildWeeklyGoalProgress: no modifica la lista de sesiones", () => {
  const sessions = sessionsWith(120);
  const copy = structuredClone(sessions);
  buildWeeklyGoalProgress(sessions, TODAY, "300");
  assert.deepEqual(sessions, copy);
});

// ---------- Semanas límite ----------

test("buildWeeklyGoalProgress: semana nueva el lunes 16-11-2026; el objetivo se mantiene", () => {
  const sessions = [
    { date: "2026-11-15", minutes: 120, createdAt: 1 }, // domingo 23:59
    { date: "2026-11-16", minutes: 30, createdAt: 2 }, // lunes 00:30
  ];
  assert.equal(buildWeeklyGoalProgress(sessions, "2026-11-15", "300").text, "2 h / 5 h (40 %)");
  const monday = buildWeeklyGoalProgress(sessions, "2026-11-16", "300");
  assert.equal(monday.goalMinutes, 300);
  assert.equal(monday.text, "30 min / 5 h (10 %)");
  assert.equal(buildWeeklyGoalProgress([sessions[0]], "2026-11-16", "300").text, "0 min / 5 h (0 %)");
});

test("buildWeeklyGoalProgress: semanas con cambio de hora y cruce de año", () => {
  const cases = [
    // [hoy, día anterior al lunes (no cuenta), lunes (cuenta)]
    ["2026-10-25", "2026-10-18", "2026-10-19"],
    ["2026-03-29", "2026-03-22", "2026-03-23"],
    ["2027-01-01", "2026-12-27", "2026-12-28"],
  ];
  for (const [today, before, monday] of cases) {
    const sessions = [
      { date: before, minutes: 60, createdAt: 1 },
      { date: monday, minutes: 60, createdAt: 2 },
      { date: today, minutes: 60, createdAt: 3 },
    ];
    assert.equal(buildWeeklyGoalProgress(sessions, today, "300").text, "2 h / 5 h (40 %)", today);
  }
});

test("buildWeeklyGoalProgress: una fecha futura no suma", () => {
  const sessions = [{ date: "2026-11-20", minutes: 300, createdAt: 1 }];
  assert.equal(buildWeeklyGoalProgress(sessions, TODAY, "300").text, "0 min / 5 h (0 %)");
});
