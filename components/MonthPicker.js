"use client";

import { addMonths, monthLabel, thisMonth } from "@/lib/client.js";

export default function MonthPicker({ value, onChange }) {
  const isCurrent = value === thisMonth();
  return (
    <div className="month-picker" role="group" aria-label="Mes">
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange(addMonths(value, -1))} aria-label="Mes anterior">
        ‹
      </button>
      <span className="month-label">{monthLabel(value)}</span>
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange(addMonths(value, 1))} aria-label="Mes siguiente">
        ›
      </button>
      {!isCurrent && (
        <button type="button" className="btn btn-link btn-sm" onClick={() => onChange(thisMonth())}>
          Hoy
        </button>
      )}
    </div>
  );
}
