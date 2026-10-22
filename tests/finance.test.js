// Pruebas unitarias de la lógica de negocio. Ejecutar con: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validateMovement,
  monthlySummary,
  budgetStatus,
  budgetAlerts,
  evolution,
  toCSV,
  shiftMonth,
  isValidDate,
} from "../lib/finance.js";

const cats = [
  { id: "c1", name: "Comida", color: "#000" },
  { id: "c2", name: "Transporte", color: "#111" },
];

const mov = (type, amount, date, categoryId, description = "", createdAt = "2026-01-01T00:00:00Z") => ({
  id: Math.random().toString(36),
  type,
  amount,
  date,
  categoryId,
  description,
  createdAt,
});

test("valida un gasto correcto", () => {
  const { value, errors } = validateMovement({ type: "gasto", amount: "120.555", date: "2026-10-01", categoryId: "c1" }, cats);
  assert.deepEqual(errors, {});
  assert.equal(value.amount, 120.56);
});

test("rechaza monto, fecha y categoría inválidos", () => {
  const { value, errors } = validateMovement({ type: "gasto", amount: -5, date: "2026-02-30", categoryId: "x" }, cats);
  assert.equal(value, null);
  assert.ok(errors.amount && errors.date && errors.categoryId);
});

test("fechas y meses", () => {
  assert.equal(isValidDate("2024-02-29"), true);
  assert.equal(isValidDate("2025-02-29"), false);
  assert.equal(shiftMonth("2026-01", -1), "2025-12");
  assert.equal(shiftMonth("2026-12", 1), "2027-01");
});

test("resumen mensual por categoría", () => {
  const ms = [
    mov("ingreso", 1000, "2026-10-01", "c1"),
    mov("gasto", 300, "2026-10-02", "c1"),
    mov("gasto", 100, "2026-10-03", "c2"),
    mov("gasto", 50, "2026-09-30", "c2"),
  ];
  const s = monthlySummary(ms, cats, "2026-10");
  assert.equal(s.ingresos, 1000);
  assert.equal(s.gastos, 400);
  assert.equal(s.saldo, 600);
  assert.deepEqual(s.byCategory.map((c) => c.name), ["Comida", "Transporte"]);
});

test("avisos de presupuesto al 80 % y 100 %", () => {
  const budgets = [
    { categoryId: "c1", limit: 500 },
    { categoryId: "c2", limit: 100 },
  ];
  const ms = [mov("gasto", 400, "2026-10-02", "c1"), mov("gasto", 120, "2026-10-03", "c2")];
  const status = budgetStatus(budgets, ms, cats, "2026-10");
  assert.equal(status.find((s) => s.categoryId === "c1").level, "aviso");
  assert.equal(status.find((s) => s.categoryId === "c2").level, "excedido");
  assert.equal(budgetAlerts(status).length, 2);

  const under = budgetStatus(budgets, [mov("gasto", 399, "2026-10-02", "c1")], cats, "2026-10");
  assert.equal(under[0].level, "ok");
});

test("evolución con saldo acumulado", () => {
  const ms = [mov("ingreso", 500, "2026-01-10", "c1"), mov("gasto", 200, "2026-10-01", "c1")];
  const ev = evolution(ms, "2026-10", 6);
  assert.equal(ev.length, 6);
  assert.equal(ev[0].month, "2026-05");
  assert.equal(ev[0].acumulado, 500);
  assert.equal(ev[5].acumulado, 300);
});

test("exporta CSV con encabezado, comillas y protección de fórmulas", () => {
  const csv = toCSV([mov("gasto", 10, "2026-10-01", "c1", 'Tacos, "al pastor"'), mov("gasto", 5, "2026-10-02", "c2", "=HACK()")], cats);
  const lines = csv.replace("﻿", "").trim().split("\r\n");
  assert.equal(lines[0], "Fecha,Tipo,Categoría,Descripción,Monto");
  assert.equal(lines[1], '2026-10-01,gasto,Comida,"Tacos, ""al pastor""",10.00');
  assert.equal(lines[2], "2026-10-02,gasto,Transporte,'=HACK(),5.00");
});
