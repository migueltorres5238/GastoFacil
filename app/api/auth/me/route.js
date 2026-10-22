import { publicUser } from "@/lib/auth.js";
import { json, unauthorized, currentUser } from "@/lib/http.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const user = currentUser(request);
  if (!user) return unauthorized();
  return json({ user: publicUser(user) });
}
