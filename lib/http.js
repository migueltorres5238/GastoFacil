// Utilidades para las rutas de la API.
import { getSessionUser } from "./auth.js";

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers },
  });
}

export function unauthorized() {
  return json({ error: "Inicia sesión para continuar." }, 401);
}

export function badRequest(error, errors) {
  return json({ error, errors: errors || {} }, 400);
}

export function notFound(what = "Recurso") {
  return json({ error: `${what} no encontrado.` }, 404);
}

export async function readJson(request) {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? body : {};
  } catch {
    return {};
  }
}

/** Devuelve el usuario de la sesión o null. */
export function currentUser(request) {
  return getSessionUser(request);
}
