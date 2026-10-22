// Capa de acceso a datos.
// Guarda usuarios, sesiones, categorías, movimientos y presupuestos en un
// archivo local (data/gastofacil.json). Toda la app lee y escribe solo por aquí,
// así que cambiar el almacenamiento (p. ej. a SQLite) no afecta la lógica.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const EMPTY = () => ({
  users: [],
  sessions: [],
  categories: [],
  movements: [],
  budgets: [],
});

function dataDir() {
  return process.env.GASTOFACIL_DATA_DIR || path.join(process.cwd(), "data");
}

function dbFile() {
  return path.join(dataDir(), "gastofacil.json");
}

export function load() {
  const file = dbFile();
  if (!fs.existsSync(file)) return EMPTY();
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    return { ...EMPTY(), ...parsed };
  } catch {
    // Archivo dañado: se respalda y se empieza de cero en lugar de tirar la app.
    fs.renameSync(file, `${file}.corrupto-${Date.now()}`);
    return EMPTY();
  }
}

export function save(db) {
  fs.mkdirSync(dataDir(), { recursive: true });
  const file = dbFile();
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), "utf8");
  fs.renameSync(tmp, file); // escritura atómica
}

/** Lee la base, aplica `fn` y guarda. Devuelve lo que regrese `fn`. */
export function transaction(fn) {
  const db = load();
  const result = fn(db);
  save(db);
  return result;
}

export function newId() {
  return crypto.randomUUID();
}
