import { registerUser, createSession, sessionCookie, publicUser } from "@/lib/auth.js";
import { json, badRequest, readJson } from "@/lib/http.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  const body = await readJson(request);
  const { user, errors } = await registerUser(body);
  if (!user) return badRequest("Revisa los datos del registro.", errors);
  const token = createSession(user.id);
  return json({ user: publicUser(user) }, 201, { "Set-Cookie": sessionCookie(token) });
}
