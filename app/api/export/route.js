import { load } from "@/lib/db.js";
import { unauthorized, badRequest, currentUser } from "@/lib/http.js";
import { toCSV, isValidMonth, monthOf } from "@/lib/finance.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/export?month=YYYY-MM  (sin month: todos los movimientos)
export async function GET(request) {
  const user = currentUser(request);
  if (!user) return unauthorized();
  const month = new URL(request.url).searchParams.get("month");
  if (month && !isValidMonth(month)) return badRequest("Mes no válido.");

  const db = load();
  let movements = db.movements.filter((m) => m.userId === user.id);
  if (month) movements = movements.filter((m) => monthOf(m.date) === month);
  const categories = db.categories.filter((c) => c.userId === user.id);

  const filename = month ? `gastofacil-${month}.csv` : "gastofacil-movimientos.csv";
  return new Response(toCSV(movements, categories), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
