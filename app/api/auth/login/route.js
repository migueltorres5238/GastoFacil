import { verifyLogin, createSession, sessionCookie, publicUser } from "@/lib/auth.js";
import { json, readJson } from "@/lib/http.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  const { email, password } = await readJson(request);
  const user = await verifyLogin(email, password);
  if (!user) return json({ error: "Correo o contraseña incorrectos." }, 401);
  const token = createSession(user.id);
  return json({ user: publicUser(user) }, 200, { "Set-Cookie": sessionCookie(token) });
}
