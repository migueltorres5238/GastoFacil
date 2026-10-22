import { transaction } from "@/lib/db.js";
import { json, unauthorized, badRequest, notFound, readJson, currentUser } from "@/lib/http.js";
import { validateMovement, monthOf, budgetStatus, budgetAlerts } from "@/lib/finance.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PUT /api/movements/:id
export async function PUT(request, { params }) {
  const user = currentUser(request);
  if (!user) return unauthorized();
  const { id } = await params;
  const body = await readJson(request);

  const result = transaction((db) => {
    const movement = db.movements.find((m) => m.id === id && m.userId === user.id);
    if (!movement) return { notFound: true };
    const categories = db.categories.filter((c) => c.userId === user.id);
    const { value, errors } = validateMovement(body, categories);
    if (!value) return { errors };
    Object.assign(movement, value, { updatedAt: new Date().toISOString() });

    const status = budgetStatus(
      db.budgets.filter((b) => b.userId === user.id),
      db.movements.filter((m) => m.userId === user.id),
      categories,
      monthOf(movement.date)
    );
    const alerts = movement.type === "gasto" ? budgetAlerts(status).filter((a) => a.categoryId === movement.categoryId) : [];
    return { movement, alerts };
  });

  if (result.notFound) return notFound("Movimiento");
  if (result.errors) return badRequest("Revisa los datos del movimiento.", result.errors);
  return json(result);
}

// DELETE /api/movements/:id
export async function DELETE(request, { params }) {
  const user = currentUser(request);
  if (!user) return unauthorized();
  const { id } = await params;

  const removed = transaction((db) => {
    const before = db.movements.length;
    db.movements = db.movements.filter((m) => !(m.id === id && m.userId === user.id));
    return db.movements.length < before;
  });

  if (!removed) return notFound("Movimiento");
  return json({ ok: true });
}
