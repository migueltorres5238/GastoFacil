import { destroySession, readCookie, clearSessionCookie, SESSION_COOKIE } from "@/lib/auth.js";
import { json } from "@/lib/http.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  destroySession(readCookie(request, SESSION_COOKIE));
  return json({ ok: true }, 200, { "Set-Cookie": clearSessionCookie() });
}
