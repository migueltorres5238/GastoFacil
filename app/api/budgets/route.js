import { load, transaction } from "@/lib/db.js";
import { json, unauthorized, badRequest, readJson, currentUser } from "@/lib/http.js";
import { validateBudgetLimit, budgetStatus, isValidMonth, currentMonth } from "@/lib/finance.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/budgets?month=YYYY-MM
export async function GET(request) {
  const user = currentUser(request);
  if (!user) return unauthorized();
  const month = new URL(request.url).searchParams.get("month") || currentMonth();
  if (!isValidMonth(month)) return badRequest("Mes no válido.");

  const db = load();
  const categories = db.categories.filter((c) => c.userId === user.id);
  const budgets = db.budgets.filter((b) => b.userId === user.id);
  const status = budgetStatus(budgets, db.movements.filter((m) => m.userId === user.id), categories, month);
  return json({ month, budgets, status });
}

// PUT /api/budgets  { limits: { [categoryId]: number | null } }
export async function PUT(request) {
  const user = currentUser(request);
  if (!user) return unauthorized();
  const { limits } = await readJson(request);
  if (!limits || typeof limits !== "object") return badRequest("Faltan los presupuestos.");

  const result = transaction((db) => {
    const ids = new Set(db.categories.filter((c) => c.userId === user.id).map((c) => c.id));
    const errors = {};
    const parsed = {};
    for (const [categoryId, raw] of Object.entries(limits)) {
      if (!ids.has(categoryId)) continue;
      const { value, error } = validateBudgetLimit(raw);
      if (error) errors[categoryId] = error;
      else parsed[categoryId] = value;
    }
    if (Object.keys(errors).length) return { errors };

    for (const [categoryId, value] of Object.entries(parsed)) {
      db.budgets = db.budgets.filter((b) => !(b.userId === user.id && b.categoryId === categoryId));
      if (value !== null && value > 0) db.budgets.push({ userId: user.id, categoryId, limit: value });
    }
    return { budgets: db.budgets.filter((b) => b.userId === user.id) };
  });

  if (result.errors) return badRequest("Revisa los montos.", result.errors);
  return json(result);
}
