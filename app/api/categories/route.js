import { load, transaction, newId } from "@/lib/db.js";
import { json, unauthorized, badRequest, readJson, currentUser } from "@/lib/http.js";
import { validateCategoryName, CUSTOM_COLORS } from "@/lib/finance.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const user = currentUser(request);
  if (!user) return unauthorized();
  const db = load();
  const categories = db.categories
    .filter((c) => c.userId === user.id)
    .map((c) => ({ ...c, movementCount: db.movements.filter((m) => m.categoryId === c.id).length }));
  return json({ categories });
}

// POST /api/categories  { name }
export async function POST(request) {
  const user = currentUser(request);
  if (!user) return unauthorized();
  const { name } = await readJson(request);

  const result = transaction((db) => {
    const mine = db.categories.filter((c) => c.userId === user.id);
    const { value, error } = validateCategoryName(name, mine);
    if (!value) return { error };
    const customCount = mine.filter((c) => !c.predefined).length;
    const category = {
      id: newId(),
      userId: user.id,
      name: value,
      color: CUSTOM_COLORS[customCount % CUSTOM_COLORS.length],
      predefined: false,
    };
    db.categories.push(category);
    return { category };
  });

  if (result.error) return badRequest(result.error, { name: result.error });
  return json(result, 201);
}
