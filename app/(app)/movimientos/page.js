"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api, formatMoney, formatDate, thisMonth, monthLabel } from "@/lib/client.js";
import MonthPicker from "@/components/MonthPicker.js";
import MovementForm from "@/components/MovementForm.js";
import Alerts from "@/components/Alerts.js";

export default function MovimientosPage() {
  const [month, setMonth] = useState(thisMonth);
  const [allMonths, setAllMonths] = useState(false);
  const [movements, setMovements] = useState(null);
  const [categories, setCategories] = useState([]);
  const [typeFilter, setTypeFilter] = useState("todos");
  const [catFilter, setCatFilter] = useState("todas");
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const q = allMonths ? "" : `?month=${month}`;
      const [m, c] = await Promise.all([api(`/api/movements${q}`), api("/api/categories")]);
      setMovements(m.movements);
      setCategories(c.categories);
    } catch (err) {
      setError(err.message);
    }
  }, [month, allMonths]);

  useEffect(() => {
    load();
  }, [load]);

  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const filtered = useMemo(
    () =>
      (movements || []).filter(
        (m) => (typeFilter === "todos" || m.type === typeFilter) && (catFilter === "todas" || m.categoryId === catFilter)
      ),
    [movements, typeFilter, catFilter]
  );

  const totals = useMemo(() => {
    let ing = 0;
    let gas = 0;
    for (const m of filtered) m.type === "ingreso" ? (ing += m.amount) : (gas += m.amount);
    return { ing, gas };
  }, [filtered]);

  async function remove(m) {
    const label = m.description || catById.get(m.categoryId)?.name || "este movimiento";
    if (!window.confirm(`¿Eliminar "${label}" de ${formatMoney(m.amount)}?`)) return;
    try {
      await api(`/api/movements/${m.id}`, { method: "DELETE" });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  const exportHref = allMonths ? "/api/export" : `/api/export?month=${month}`;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Movimientos</h1>
          <p className="muted">{allMonths ? "Todos los meses" : monthLabel(month)}</p>
        </div>
        <div className="head-actions">
          {!allMonths && <MonthPicker value={month} onChange={setMonth} />}
          <label className="check">
            <input type="checkbox" checked={allMonths} onChange={(e) => setAllMonths(e.target.checked)} /> Todos
          </label>
        </div>
      </div>

      <Alerts alerts={alerts} />
      {error && <p className="form-msg error">{error}</p>}

      <div className="toolbar">
        <button type="button" className="btn btn-primary" onClick={() => { setShowForm((v) => !v); setEditing(null); }}>
          {showForm ? "Cerrar" : "+ Nuevo movimiento"}
        </button>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} aria-label="Filtrar por tipo">
          <option value="todos">Ingresos y gastos</option>
          <option value="gasto">Solo gastos</option>
          <option value="ingreso">Solo ingresos</option>
        </select>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} aria-label="Filtrar por categoría">
          <option value="todas">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <a className="btn btn-ghost" href={exportHref} download>
          Exportar CSV
        </a>
      </div>

      {showForm && categories.length > 0 && (
        <section className="card">
          <h2>Nuevo movimiento</h2>
          <MovementForm
            categories={categories}
            onSaved={(res) => {
              setAlerts(res.alerts || []);
              load();
            }}
          />
        </section>
      )}

      <section className="card table-card">
        {movements === null ? (
          <p className="muted">Cargando…</p>
        ) : filtered.length === 0 ? (
          <p className="empty">No hay movimientos con estos filtros.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Descripción</th>
                <th>Categoría</th>
                <th className="num">Monto</th>
                <th aria-label="Acciones" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) =>
                editing === m.id ? (
                  <tr key={m.id} className="editing-row">
                    <td colSpan={5}>
                      <MovementForm
                        categories={categories}
                        initial={m}
                        onCancel={() => setEditing(null)}
                        onSaved={(res) => {
                          setAlerts(res.alerts || []);
                          setEditing(null);
                          load();
                        }}
                      />
                    </td>
                  </tr>
                ) : (
                  <tr key={m.id}>
                    <td className="nowrap">{formatDate(m.date)}</td>
                    <td>{m.description || <span className="muted">—</span>}</td>
                    <td>
                      <span className="chip">
                        <span className="dot" style={{ background: catById.get(m.categoryId)?.color }} aria-hidden="true" />
                        {catById.get(m.categoryId)?.name || "Sin categoría"}
                      </span>
                    </td>
                    <td className={m.type === "ingreso" ? "num pos" : "num neg"}>
                      {m.type === "ingreso" ? "+" : "−"}
                      {formatMoney(m.amount)}
                    </td>
                    <td className="row-actions">
                      <button type="button" className="btn btn-link btn-sm" onClick={() => { setEditing(m.id); setShowForm(false); }}>
                        Editar
                      </button>
                      <button type="button" className="btn btn-link btn-sm danger" onClick={() => remove(m)}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3}>
                  {filtered.length} movimiento{filtered.length === 1 ? "" : "s"}
                </td>
                <td className="num" colSpan={2}>
                  <span className="pos">+{formatMoney(totals.ing)}</span> · <span className="neg">−{formatMoney(totals.gas)}</span>
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </section>
    </div>
  );
}
