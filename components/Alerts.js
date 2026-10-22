"use client";

export default function Alerts({ alerts }) {
  if (!alerts || alerts.length === 0) return null;
  return (
    <div className="alerts" role="status">
      {alerts.map((a) => (
        <div key={a.categoryId} className={`alert alert-${a.level}`}>
          <strong>{a.level === "excedido" ? "Presupuesto superado" : "Cerca del límite"}</strong>
          <span>{a.message}</span>
        </div>
      ))}
    </div>
  );
}
