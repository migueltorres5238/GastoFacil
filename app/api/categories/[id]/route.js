import { transaction } from "@/lib/db.js";
import { json, unauthorized, badRequest, notFound, readJson, currentUser } from "@/lib/http.js";
import { validateCategoryName } from "@/lib/finance.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PUT /api/categories/:id  { name }  (solo personalizadas)
export async function PUT(request, { params }) {
  const user = currentUser(request);
  if (!user) return unauthorized();
  const { id } = await params;
  const { name } = await readJson(request);

  const result = transaction((db) => {
    const mine = db.categories.filter((c) => c.userId === user.id);
    const category = mine.find((c) => c.id === id);
    if (!category) return { notFound: true };
    if (category.predefined) return { error: "Las categorías predefinidas no se pueden renombrar." };
    const { value, error } = validateCategoryName(name, mine, id);
    if (!value) return { error };
    category.name = value;
    return { category };
  });

  if (result.notFound) return notFound("Categoría");
  if (result.error) return badRequest(result.error, { name: result.error });
  return json(result);
}

// DELETE /api/categories/:id  (solo personalizadas; sus movimientos pasan a "Otros")
export async function DELETE(request, { params }) {
  const user = currentUser(request);
  if (!user) return unauthorized();
  const { id } = await params;

  const result = transaction((db) => {
    const mine = db.categories.filter((c) => c.userId === user.id);
    const category = mine.find((c) => c.id === id);
    if (!category) return { notFound: true };
    if (category.predefined) return { error: "Las categorías predefinidas no se pueden eliminar." };
    const otros = mine.find((c) => c.predefined && c.name === "Otros") || mine.find((c) => c.id !== id);
    let moved = 0;
    for (const m of db.movements) {
      if (m.userId === user.id && m.categoryId === id) {
        m.categoryId = otros.id;
        moved++;
      }
    }
    db.categories = db.categories.filter((c) => c.id !== id);
    db.budgets = db.budgets.filter((b) => b.categoryId !== id);
    return { ok: true, moved, movedTo: otros.name };
  });

  if (result.notFound) return notFound("Categoría");
  if (result.error) return badRequest(result.error);
  return json(result);
}
