"use client";

import { useState } from "react";
import { formatMoney, monthShort, monthLabel } from "@/lib/client.js";

/** Gasto por categoría: barras horizontales con monto y porcentaje. */
export function CategoryBars({ data, total }) {
  if (!data || data.length === 0) {
    return <p className="empty">Aún no hay gastos este mes.</p>;
  }
  const max = Math.max(...data.map((d) => d.total));
  return (
    <ul className="cat-bars">
      {data.map((d) => {
        const pct = total > 0 ? Math.round((d.total / total) * 100) : 0;
        return (
          <li key={d.id}>
            <div className="cat-bar-head">
              <span className="cat-name">
                <span className="dot" style={{ background: d.color }} aria-hidden="true" />
                {d.name}
              </span>
              <span className="cat-amount">
                {formatMoney(d.total)} <small>{pct} %</small>
              </span>
            </div>
            <div className="bar-track" aria-hidden="true">
              <div className="bar-fill" style={{ width: `${(d.total / max) * 100}%`, background: d.color }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function niceMax(v) {
  if (v <= 0) return 100;
  const exp = Math.pow(10, Math.floor(Math.log10(v)));
  const f = v / exp;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return nice * exp;
}

function shortMoney(v) {
  const a = Math.abs(v);
  if (a >= 1000) return `$${(v / 1000).toFixed(a >= 10000 ? 0 : 1)}k`;
  return `$${Math.round(v)}`;
}

/** Evolución mensual: barras de ingresos y gastos + línea de saldo acumulado. */
export function EvolutionChart({ data }) {
  const [hover, setHover] = useState(null);
  if (!data || data.length === 0) return null;

  const W = 900;
  const H = 280;
  const pad = { top: 16, right: 16, bottom: 30, left: 52 };
  const iw = W - pad.left - pad.right;
  const ih = H - pad.top - pad.bottom;

  const values = data.flatMap((d) => [d.ingresos, d.gastos, d.acumulado]);
  const top = niceMax(Math.max(0, ...values));
  const bottom = Math.min(0, ...values) < 0 ? -niceMax(-Math.min(...values)) : 0;
  const y = (v) => pad.top + ((top - v) / (top - bottom)) * ih;
  const band = iw / data.length;
  const barW = Math.min(22, band / 3);
  const cx = (i) => pad.left + band * i + band / 2;

  const ticks = [];
  for (let i = 0; i <= 4; i++) ticks.push(bottom + ((top - bottom) * i) / 4);

  const line = data.map((d, i) => `${i === 0 ? "M" : "L"}${cx(i)},${y(d.acumulado)}`).join(" ");
  const h = hover !== null ? data[hover] : null;

  return (
    <div className="chart-wrap">
      <div className="legend">
        <span><i className="sw sw-in" /> Ingresos</span>
        <span><i className="sw sw-out" /> Gastos</span>
        <span><i className="sw sw-line" /> Saldo acumulado</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Ingresos, gastos y saldo de los últimos meses">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={W - pad.right} y1={y(t)} y2={y(t)} className={t === 0 ? "axis-zero" : "grid"} />
            <text x={pad.left - 8} y={y(t) + 4} textAnchor="end" className="tick">
              {shortMoney(t)}
            </text>
          </g>
        ))}
        {data.map((d, i) => (
          <g key={d.month} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <rect x={pad.left + band * i} y={pad.top} width={band} height={ih} className={hover === i ? "hover-band on" : "hover-band"} />
            <rect x={cx(i) - barW - 1} y={y(d.ingresos)} width={barW} height={Math.max(0, y(0) - y(d.ingresos))} rx="3" className="bar-in" />
            <rect x={cx(i) + 1} y={y(d.gastos)} width={barW} height={Math.max(0, y(0) - y(d.gastos))} rx="3" className="bar-out" />
            <text x={cx(i)} y={H - 10} textAnchor="middle" className="tick">
              {monthShort(d.month)}
            </text>
          </g>
        ))}
        <path d={line} className="saldo-line" />
        {data.map((d, i) => (
          <circle key={d.month} cx={cx(i)} cy={y(d.acumulado)} r={hover === i ? 5 : 3.5} className="saldo-dot" />
        ))}
      </svg>
      <div className="chart-tip" aria-live="polite">
        {h ? (
          <>
            <strong>{monthLabel(h.month)}</strong> · Ingresos {formatMoney(h.ingresos)} · Gastos {formatMoney(h.gastos)} · Saldo acumulado {formatMoney(h.acumulado)}
          </>
        ) : (
          <span className="muted">Pasa el cursor sobre un mes para ver el detalle.</span>
        )}
      </div>
    </div>
  );
}

/** Barra de progreso de presupuesto. */
export function BudgetBar({ item }) {
  const width = Math.min(100, item.pct);
  return (
    <div className={`budget-bar level-${item.level}`}>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${width}%` }} />
        <span className="mark-80" title="80 %" />
      </div>
      <div className="budget-meta">
        <span>
          {formatMoney(item.spent)} de {formatMoney(item.limit)}
        </span>
        <span className="pct">{item.pct} %</span>
      </div>
    </div>
  );
}
