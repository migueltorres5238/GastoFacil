// Lógica de negocio: validaciones, resúmenes mensuales, presupuestos y CSV.
// Funciones puras (sin acceso a disco) para poder probarlas con `npm test`.

export const DEFAULT_CATEGORIES = [
  { name: "Comida", color: "#e07a3f" },
  { name: "Transporte", color: "#3b82c4" },
  { name: "Escuela", color: "#7c5cc4" },
  { name: "Entretenimiento", color: "#d4497a" },
  { name: "Otros", color: "#7a8a8f" },
];

export const CUSTOM_COLORS = [
  "#2f9e75", "#c99a2e", "#5b6fd6", "#b0563a", "#3aa0a8", "#9c5bb5", "#6b8e23", "#cc5f5f",
];

export const ALERT_WARNING = 0.8; // aviso al 80 %
export const ALERT_EXCEEDED = 1.0; // aviso al 100 %

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-\d{2}$/;

export function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

export function isValidDate(value) {
  if (typeof value !== "string" || !DATE_RE.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function isValidMonth(value) {
  if (typeof value !== "string" || !MONTH_RE.test(value)) return false;
  const m = Number(value.slice(5, 7));
  return m >= 1 && m <= 12;
}

export function currentMonth(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function shiftMonth(month, delta) {
  const [y, m] = month.split("-").map(Number);
  const idx = y * 12 + (m - 1) + delta;
  const ny = Math.floor(idx / 12);
  const nm = (idx % 12) + 1;
  return `${ny}-${String(nm).padStart(2, "0")}`;
}

export function monthOf(date) {
  return date.slice(0, 7);
}

/**
 * Valida los datos de un movimiento.
 * @returns {{ value: object|null, errors: Record<string,string> }}
 */
export function validateMovement(input, categories) {
  const errors = {};
  const data = input || {};

  const type = data.type;
  if (type !== "ingreso" && type !== "gasto") {
    errors.type = "Elige si es ingreso o gasto.";
  }

  const amount = typeof data.amount === "string" ? Number(data.amount.replace(",", ".")) : Number(data.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    errors.amount = "El monto debe ser mayor a 0.";
  } else if (amount > 1_000_000_000) {
    errors.amount = "El monto es demasiado grande.";
  }

  if (!isValidDate(data.date)) {
    errors.date = "La fecha no es válida.";
  }

  const category = categories.find((c) => c.id === data.categoryId);
  if (!category) {
    errors.categoryId = "Elige una categoría.";
  }

  const description = typeof data.description === "string" ? data.description.trim() : "";
  if (description.length > 200) {
    errors.description = "La descripción admite máximo 200 caracteres.";
  }

  if (Object.keys(errors).length > 0) return { value: null, errors };
  return {
    value: { type, amount: round2(amount), date: data.date, categoryId: category.id, description },
    errors: {},
  };
}

export function validateCategoryName(name, categories, ignoreId = null) {
  const clean = typeof name === "string" ? name.trim() : "";
  if (clean.length < 1) return { value: null, error: "Escribe un nombre." };
  if (clean.length > 30) return { value: null, error: "Máximo 30 caracteres." };
  const dup = categories.some((c) => c.id !== ignoreId && c.name.toLowerCase() === clean.toLowerCase());
  if (dup) return { value: null, error: "Ya existe una categoría con ese nombre." };
  return { value: clean, error: null };
}

export function validateBudgetLimit(limit) {
  if (limit === null || limit === "" || limit === undefined) return { value: null, error: null }; // sin presupuesto
  const n = Number(limit);
  if (!Number.isFinite(n) || n < 0) return { value: null, error: "El presupuesto debe ser 0 o mayor." };
  if (n > 1_000_000_000) return { value: null, error: "El presupuesto es demasiado grande." };
  return { value: round2(n), error: null };
}

function totals(movements) {
  let ingresos = 0;
  let gastos = 0;
  for (const m of movements) {
    if (m.type === "ingreso") ingresos += m.amount;
    else gastos += m.amount;
  }
  return { ingresos: round2(ingresos), gastos: round2(gastos), saldo: round2(ingresos - gastos) };
}

/** Totales del mes y gasto por categoría. */
export function monthlySummary(movements, categories, month) {
  const inMonth = movements.filter((m) => monthOf(m.date) === month);
  const byCat = new Map();
  for (const m of inMonth) {
    if (m.type !== "gasto") continue;
    byCat.set(m.categoryId, (byCat.get(m.categoryId) || 0) + m.amount);
  }
  const byCategory = categories
    .map((c) => ({ id: c.id, name: c.name, color: c.color, total: round2(byCat.get(c.id) || 0) }))
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);

  return { month, ...totals(inMonth), count: inMonth.length, byCategory };
}

/** Ingresos, gastos y saldo acumulado de los últimos `n` meses hasta `month`. */
export function evolution(movements, month, n = 6) {
  const first = shiftMonth(month, -(n - 1));
  let acumulado = round2(
    movements.filter((m) => monthOf(m.date) < first).reduce((s, m) => s + (m.type === "ingreso" ? m.amount : -m.amount), 0)
  );
  const out = [];
  for (let i = 0; i < n; i++) {
    const key = shiftMonth(first, i);
    const t = totals(movements.filter((m) => monthOf(m.date) === key));
    acumulado = round2(acumulado + t.saldo);
    out.push({ month: key, ingresos: t.ingresos, gastos: t.gastos, saldo: t.saldo, acumulado });
  }
  return out;
}

export function totalBalance(movements) {
  return totals(movements).saldo;
}

/** Estado del presupuesto de cada categoría que tiene uno definido. */
export function budgetStatus(budgets, movements, categories, month) {
  const spentByCat = new Map();
  for (const m of movements) {
    if (m.type === "gasto" && monthOf(m.date) === month) {
      spentByCat.set(m.categoryId, (spentByCat.get(m.categoryId) || 0) + m.amount);
    }
  }
  return categories
    .map((c) => {
      const budget = budgets.find((b) => b.categoryId === c.id);
      if (!budget || !(budget.limit > 0)) return null;
      const spent = round2(spentByCat.get(c.id) || 0);
      const pct = spent / budget.limit;
      let level = "ok";
      if (pct >= ALERT_EXCEEDED) level = "excedido";
      else if (pct >= ALERT_WARNING) level = "aviso";
      return {
        categoryId: c.id,
        name: c.name,
        color: c.color,
        limit: budget.limit,
        spent,
        remaining: round2(budget.limit - spent),
        pct: Math.round(pct * 1000) / 10,
        level,
      };
    })
    .filter(Boolean);
}

export function budgetAlerts(statusList) {
  return statusList
    .filter((s) => s.level !== "ok")
    .map((s) => ({
      categoryId: s.categoryId,
      name: s.name,
      level: s.level,
      pct: s.pct,
      message:
        s.level === "excedido"
          ? `Superaste el presupuesto de ${s.name} (${s.pct} %).`
          : `Ya usaste el ${s.pct} % del presupuesto de ${s.name}.`,
    }));
}

function csvCell(value) {
  const s = String(value ?? "");
  // Evita inyección de fórmulas al abrir el CSV en Excel.
  const safe = /^[=+\-@\t\r]/.test(s) && !/^-?\d/.test(s) ? `'${s}` : s;
  return /[",\n\r;]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/** CSV con BOM (para que Excel respete los acentos). */
export function toCSV(movements, categories) {
  const catName = new Map(categories.map((c) => [c.id, c.name]));
  const rows = [["Fecha", "Tipo", "Categoría", "Descripción", "Monto"]];
  const sorted = [...movements].sort((a, b) => (a.date === b.date ? a.createdAt.localeCompare(b.createdAt) : a.date.localeCompare(b.date)));
  for (const m of sorted) {
    rows.push([m.date, m.type, catName.get(m.categoryId) || "Sin categoría", m.description, m.amount.toFixed(2)]);
  }
  return "﻿" + rows.map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

export function sortMovements(movements) {
  return [...movements].sort((a, b) => (a.date === b.date ? b.createdAt.localeCompare(a.createdAt) : b.date.localeCompare(a.date)));
}
