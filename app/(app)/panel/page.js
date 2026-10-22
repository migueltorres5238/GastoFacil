"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api, formatMoney, formatDate, thisMonth, monthLabel } from "@/lib/client.js";
import { useUser } from "@/components/AppShell.js";
import MonthPicker from "@/components/MonthPicker.js";
import MovementForm from "@/components/MovementForm.js";
import Alerts from "@/components/Alerts.js";
import { CategoryBars, EvolutionChart, BudgetBar } from "@/components/Charts.js";

export default function PanelPage() {
  const user = useUser();
  const [month, setMonth] = useState(thisMonth);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      setData(await api(`/api/summary?month=${month}`));
    } catch (err) {
      setError(err.message);
    }
  }, [month]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <p className="form-msg error">{error}</p>;
  if (!data) return <p className="muted">Cargando…</p>;

  const { summary, evolution, balance, budgets, alerts, recent, categories } = data;
  const catById = new Map(categories.map((c) => [c.id, c]));
  const firstName = user?.name?.split(" ")[0] || "";

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Hola, {firstName}</h1>
          <p className="muted">Resumen de {monthLabel(month)}</p>
        </div>
        <MonthPicker value={month} onChange={setMonth} />
      </div>

      <Alerts alerts={alerts} />

      <section className="stats">
        <div className="stat">
          <span className="stat-label">Ingresos del mes</span>
          <span className="stat-value pos">{formatMoney(summary.ingresos)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Gastos del mes</span>
          <span className="stat-value neg">{formatMoney(summary.gastos)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Saldo del mes</span>
          <span className={summary.saldo >= 0 ? "stat-value" : "stat-value neg"}>{formatMoney(summary.saldo)}</span>
        </div>
        <div className="stat stat-accent">
          <span className="stat-label">Saldo total</span>
          <span className="stat-value">{formatMoney(balance)}</span>
        </div>
      </section>

      <div className="grid-2">
        <section className="card">
          <h2>Registro rápido</h2>
          <MovementForm
            compact
            categories={categories}
            onSaved={load}
          />
        </section>

        <section className="card">
          <div className="card-head">
            <h2>Gasto por categoría</h2>
            <span className="muted">{formatMoney(summary.gastos)}</span>
          </div>
          <CategoryBars data={summary.byCategory} total={summary.gastos} />
        </section>
      </div>

      <section className="card">
        <h2>Evolución de los últimos 6 meses</h2>
        <EvolutionChart data={evolution} />
      </section>

      <div className="grid-2">
        <section className="card">
          <div className="card-head">
            <h2>Presupuestos</h2>
            <Link href="/presupuestos" className="btn btn-link btn-sm">Editar</Link>
          </div>
          {budgets.length === 0 ? (
            <p className="empty">
              No has definido presupuestos. <Link href="/presupuestos">Define uno</Link> para recibir avisos al 80 % y 100 %.
            </p>
          ) : (
            <ul className="budget-list">
              {budgets.map((b) => (
                <li key={b.categoryId}>
                  <div className="budget-name">
                    <span className="dot" style={{ background: b.color }} aria-hidden="true" />
                    {b.name}
                  </div>
                  <BudgetBar item={b} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <div className="card-head">
            <h2>Últimos movimientos</h2>
            <Link href="/movimientos" className="btn btn-link btn-sm">Ver todos</Link>
          </div>
          {recent.length === 0 ? (
            <p className="empty">Sin movimientos este mes.</p>
          ) : (
            <ul className="recent">
              {recent.map((m) => {
                const c = catById.get(m.categoryId);
                return (
                  <li key={m.id}>
                    <span className="dot" style={{ background: c?.color }} aria-hidden="true" />
                    <div className="recent-main">
                      <span>{m.description || c?.name || "Movimiento"}</span>
                      <small className="muted">
                        {c?.name} · {formatDate(m.date)}
                      </small>
                    </div>
                    <span className={m.type === "ingreso" ? "amount pos" : "amount neg"}>
                      {m.type === "ingreso" ? "+" : "−"}
                      {formatMoney(m.amount)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
