import { load, transaction, newId } from "@/lib/db.js";
import { json, unauthorized, badRequest, readJson, currentUser } from "@/lib/http.js";
import {
  validateMovement,
  isValidMonth,
  monthOf,
  sortMovements,
  budgetStatus,
  budgetAlerts,
} from "@/lib/finance.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/movements?month=YYYY-MM  (sin month: todos)
export async function GET(request) {
  const user = currentUser(request);
  if (!user) return unauthorized();
  const month = new URL(request.url).searchParams.get("month");
  if (month && !isValidMonth(month)) return badRequest("Mes no válido.");

  const db = load();
  let movements = db.movements.filter((m) => m.userId === user.id);
  if (month) movements = movements.filter((m) => monthOf(m.date) === month);
  return json({ movements: sortMovements(movements) });
}

// POST /api/movements  { type, amount, date, categoryId, description }
export async function POST(request) {
  const user = currentUser(request);
  if (!user) return unauthorized();
  const body = await readJson(request);

  const result = transaction((db) => {
    const categories = db.categories.filter((c) => c.userId === user.id);
    const { value, errors } = validateMovement(body, categories);
    if (!value) return { errors };
    const movement = { id: newId(), userId: user.id, ...value, createdAt: new Date().toISOString() };
    db.movements.push(movement);

    // Avisos de presupuesto del mes del movimiento (80 % y 100 %).
    const month = monthOf(movement.date);
    const status = budgetStatus(
      db.budgets.filter((b) => b.userId === user.id),
      db.movements.filter((m) => m.userId === user.id),
      categories,
      month
    );
    const alerts = movement.type === "gasto" ? budgetAlerts(status).filter((a) => a.categoryId === movement.categoryId) : [];
    return { movement, alerts };
  });

  if (result.errors) return badRequest("Revisa los datos del movimiento.", result.errors);
  return json(result, 201);
}
