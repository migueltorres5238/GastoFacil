// Registro, inicio de sesión y sesiones con cookie httpOnly.
// Las contraseñas se guardan cifradas con bcrypt (nunca en texto plano).
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { load, transaction, newId } from "./db.js";
import { DEFAULT_CATEGORIES } from "./finance.js";

export const SESSION_COOKIE = "gf_session";
const SESSION_DAYS = 7;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
let dummyHash = null;

export function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email };
}

export function validateRegistration({ name, email, password }) {
  const errors = {};
  const cleanName = typeof name === "string" ? name.trim() : "";
  const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (cleanName.length < 2 || cleanName.length > 60) errors.name = "Escribe tu nombre (2 a 60 caracteres).";
  if (!EMAIL_RE.test(cleanEmail)) errors.email = "Escribe un correo válido.";
  if (typeof password !== "string" || password.length < 8) errors.password = "La contraseña debe tener al menos 8 caracteres.";
  else if (password.length > 72) errors.password = "La contraseña admite máximo 72 caracteres.";
  return { errors, name: cleanName, email: cleanEmail };
}

export async function registerUser(input) {
  const { errors, name, email } = validateRegistration(input || {});
  if (Object.keys(errors).length) return { user: null, errors };

  if (load().users.some((u) => u.email === email)) {
    return { user: null, errors: { email: "Ya existe una cuenta con ese correo." } };
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  const user = transaction((db) => {
    if (db.users.some((u) => u.email === email)) return null;
    const u = { id: newId(), name, email, passwordHash, createdAt: new Date().toISOString() };
    db.users.push(u);
    for (const c of DEFAULT_CATEGORIES) {
      db.categories.push({ id: newId(), userId: u.id, name: c.name, color: c.color, predefined: true });
    }
    return u;
  });

  if (!user) return { user: null, errors: { email: "Ya existe una cuenta con ese correo." } };
  return { user, errors: {} };
}

export async function verifyLogin(email, password) {
  const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const user = load().users.find((u) => u.email === cleanEmail);
  if (!user || typeof password !== "string") {
    // Hash de relleno para que el tiempo de respuesta no revele si el correo existe.
    if (!dummyHash) dummyHash = await bcrypt.hash("relleno-gastofacil", 10);
    await bcrypt.compare(String(password ?? ""), dummyHash);
    return null;
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  return ok ? user : null;
}

export function createSession(userId) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  transaction((db) => {
    db.sessions = db.sessions.filter((s) => s.expiresAt > Date.now());
    db.sessions.push({ token: hashToken(token), userId, expiresAt });
  });
  return token;
}

export function destroySession(token) {
  if (!token) return;
  const hashed = hashToken(token);
  transaction((db) => {
    db.sessions = db.sessions.filter((s) => s.token !== hashed);
  });
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function readCookie(request, name) {
  const header = request.headers.get("cookie") || "";
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === name) return decodeURIComponent(part.slice(idx + 1).trim());
  }
  return null;
}

export function getSessionUser(request) {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token) return null;
  const hashed = hashToken(token);
  const db = load();
  const session = db.sessions.find((s) => s.token === hashed && s.expiresAt > Date.now());
  if (!session) return null;
  return db.users.find((u) => u.id === session.userId) || null;
}

export function sessionCookie(token) {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 24 * 60 * 60}`;
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
