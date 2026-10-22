"use client";

import { useCallback, useEffect, useState } from "react";
import { api, thisMonth, monthLabel } from "@/lib/client.js";
import MonthPicker from "@/components/MonthPicker.js";
import Alerts from "@/components/Alerts.js";
import { BudgetBar } from "@/components/Charts.js";

export default function PresupuestosPage() {
  const [month, setMonth] = useState(thisMonth);
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState([]);
  const [limits, setLimits] = useState({});
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ text: "", ok: true });
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const [c, b] = await Promise.all([api("/api/categories"), api(`/api/budgets?month=${month}`)]);
    setCategories(c.categories);
    setStatus(b.status);
    const map = {};
    for (const cat of c.categories) {
      const found = b.budgets.find((x) => x.categoryId === cat.id);
      map[cat.id] = found ? String(found.limit) : "";
    }
    setLimits(map);
    setLoaded(true);
  }, [month]);

  useEffect(() => {
    load().catch((err) => setMessage({ text: err.message, ok: false }));
  }, [load]);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    setMessage({ text: "", ok: true });
    try {
      const payload = {};
      for (const [id, v] of Object.entries(limits)) payload[id] = v === "" ? null : v;
      await api("/api/budgets", { method: "PUT", body: { limits: payload } });
      await load();
      setMessage({ text: "Presupuestos guardados.", ok: true });
    } catch (err) {
      setErrors(err.errors || {});
      setMessage({ text: err.message, ok: false });
    } finally {
      setSaving(false);
    }
  }

  const statusById = new Map(status.map((s) => [s.categoryId, s]));
  const alerts = status
    .filter((s) => s.level !== "ok")
    .map((s) => ({
      categoryId: s.categoryId,
      level: s.level,
      message: s.level === "excedido" ? `Superaste el presupuesto de ${s.name} (${s.pct} %).` : `Ya usaste el ${s.pct} % del presupuesto de ${s.name}.`,
    }));

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Presupuestos</h1>
          <p className="muted">Límite mensual por categoría. Se aplica a todos los meses; el avance es de {monthLabel(month)}.</p>
        </div>
        <MonthPicker value={month} onChange={setMonth} />
      </div>

      <Alerts alerts={alerts} />

      <form className="card" onSubmit={save} noValidate>
        {!loaded ? (
          <p className="muted">Cargando…</p>
        ) : (
          <ul className="budget-edit">
            {categories.map((c) => {
              const s = statusById.get(c.id);
              return (
                <li key={c.id}>
                  <div className="budget-edit-row">
                    <span className="budget-name">
                      <span className="dot" style={{ background: c.color }} aria-hidden="true" />
                      {c.name}
                    </span>
                    <label className="money-input">
                      <span aria-hidden="true">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        placeholder="Sin límite"
                        aria-label={`Presupuesto de ${c.name}`}
                        value={limits[c.id] ?? ""}
                        onChange={(e) => setLimits((l) => ({ ...l, [c.id]: e.target.value }))}
                      />
                    </label>
                  </div>
                  {errors[c.id] && <small className="error">{errors[c.id]}</small>}
                  {s && <BudgetBar item={s} />}
                </li>
              );
            })}
          </ul>
        )}
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving || !loaded}>
            {saving ? "Guardando…" : "Guardar presupuestos"}
          </button>
          {message.text && <span className={message.ok ? "form-msg ok" : "form-msg error"}>{message.text}</span>}
        </div>
      </form>
    </div>
  );
}
