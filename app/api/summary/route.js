import { load } from "@/lib/db.js";
import { json, unauthorized, badRequest, currentUser } from "@/lib/http.js";
import {
  monthlySummary,
  evolution,
  totalBalance,
  budgetStatus,
  budgetAlerts,
  isValidMonth,
  currentMonth,
  monthOf,
  sortMovements,
} from "@/lib/finance.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/summary?month=YYYY-MM  → todo lo que necesita el panel en una sola llamada
export async function GET(request) {
  const user = currentUser(request);
  if (!user) return unauthorized();
  const month = new URL(request.url).searchParams.get("month") || currentMonth();
  if (!isValidMonth(month)) return badRequest("Mes no válido.");

  const db = load();
  const categories = db.categories.filter((c) => c.userId === user.id);
  const movements = db.movements.filter((m) => m.userId === user.id);
  const budgets = db.budgets.filter((b) => b.userId === user.id);
  const status = budgetStatus(budgets, movements, categories, month);

  return json({
    month,
    summary: monthlySummary(movements, categories, month),
    evolution: evolution(movements, month, 6),
    balance: totalBalance(movements),
    budgets: status,
    alerts: budgetAlerts(status),
    recent: sortMovements(movements.filter((m) => monthOf(m.date) === month)).slice(0, 5),
    categories,
  });
}
