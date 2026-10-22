"use client";

import { useEffect, useRef, useState } from "react";
import { api, todayISO } from "@/lib/client.js";

function emptyForm(categories) {
  return {
    type: "gasto",
    amount: "",
    date: todayISO(),
    categoryId: categories[0]?.id || "",
    description: "",
  };
}

/**
 * Formulario para registrar o editar un movimiento.
 * Props: categories, initial (movimiento a editar), onSaved({movement, alerts}), onCancel, compact
 */
export default function MovementForm({ categories, initial, onSaved, onCancel, compact = false }) {
  const [form, setForm] = useState(() => (initial ? { ...initial, amount: String(initial.amount) } : emptyForm(categories)));
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [msgOk, setMsgOk] = useState(true);
  const [saving, setSaving] = useState(false);
  const amountRef = useRef(null);

  useEffect(() => {
    if (!form.categoryId && categories.length) setForm((f) => ({ ...f, categoryId: categories[0].id }));
  }, [categories, form.categoryId]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    setMessage("");
    try {
      const body = { ...form, amount: form.amount };
      const data = initial
        ? await api(`/api/movements/${initial.id}`, { method: "PUT", body })
        : await api("/api/movements", { method: "POST", body });
      if (!initial) {
        setForm((f) => ({ ...emptyForm(categories), type: f.type, date: f.date, categoryId: f.categoryId }));
        setMsgOk(true);
        setMessage(form.type === "gasto" ? "Gasto registrado." : "Ingreso registrado.");
        amountRef.current?.focus();
      }
      onSaved?.(data);
    } catch (err) {
      setErrors(err.errors || {});
      setMsgOk(false);
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className={compact ? "movement-form compact" : "movement-form"} onSubmit={submit} noValidate>
      <div className="segmented" role="radiogroup" aria-label="Tipo">
        {["gasto", "ingreso"].map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={form.type === t}
            className={form.type === t ? `seg active seg-${t}` : "seg"}
            onClick={() => setForm((f) => ({ ...f, type: t }))}
          >
            {t === "gasto" ? "Gasto" : "Ingreso"}
          </button>
        ))}
      </div>

      <div className="form-grid">
        <label className="field">
          <span>Monto</span>
          <input
            ref={amountRef}
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={form.amount}
            onChange={set("amount")}
            autoFocus={!initial && !compact}
            required
          />
          {errors.amount && <small className="error">{errors.amount}</small>}
        </label>

        <label className="field">
          <span>Categoría</span>
          <select value={form.categoryId} onChange={set("categoryId")}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.categoryId && <small className="error">{errors.categoryId}</small>}
        </label>

        <label className="field">
          <span>Fecha</span>
          <input type="date" value={form.date} onChange={set("date")} required />
          {errors.date && <small className="error">{errors.date}</small>}
        </label>

        <label className="field field-wide">
          <span>Descripción (opcional)</span>
          <input type="text" maxLength={200} placeholder="Ej. camión a la escuela" value={form.description} onChange={set("description")} />
          {errors.description && <small className="error">{errors.description}</small>}
        </label>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Guardando…" : initial ? "Guardar cambios" : "Registrar"}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancelar
          </button>
        )}
        {message && <span className={msgOk ? "form-msg ok" : "form-msg error"}>{message}</span>}
      </div>
    </form>
  );
}
