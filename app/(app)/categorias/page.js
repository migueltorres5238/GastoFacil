"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client.js";

export default function CategoriasPage() {
  const [categories, setCategories] = useState(null);
  const [name, setName] = useState("");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [message, setMessage] = useState({ text: "", ok: true });

  const load = useCallback(async () => {
    const d = await api("/api/categories");
    setCategories(d.categories);
  }, []);

  useEffect(() => {
    load().catch((err) => setMessage({ text: err.message, ok: false }));
  }, [load]);

  async function add(e) {
    e.preventDefault();
    try {
      await api("/api/categories", { method: "POST", body: { name } });
      setName("");
      setMessage({ text: "Categoría creada.", ok: true });
      load();
    } catch (err) {
      setMessage({ text: err.message, ok: false });
    }
  }

  async function rename(id) {
    try {
      await api(`/api/categories/${id}`, { method: "PUT", body: { name: editName } });
      setEditId(null);
      setMessage({ text: "Categoría actualizada.", ok: true });
      load();
    } catch (err) {
      setMessage({ text: err.message, ok: false });
    }
  }

  async function remove(c) {
    const extra = c.movementCount ? ` Sus ${c.movementCount} movimiento(s) pasarán a "Otros".` : "";
    if (!window.confirm(`¿Eliminar la categoría "${c.name}"?${extra}`)) return;
    try {
      await api(`/api/categories/${c.id}`, { method: "DELETE" });
      setMessage({ text: "Categoría eliminada.", ok: true });
      load();
    } catch (err) {
      setMessage({ text: err.message, ok: false });
    }
  }

  const predefined = (categories || []).filter((c) => c.predefined);
  const custom = (categories || []).filter((c) => !c.predefined);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Categorías</h1>
          <p className="muted">Las predefinidas no se pueden borrar; agrega las tuyas.</p>
        </div>
      </div>

      <form className="card inline-form" onSubmit={add}>
        <label className="field">
          <span>Nueva categoría</span>
          <input type="text" maxLength={30} placeholder="Ej. Gimnasio" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <button type="submit" className="btn btn-primary" disabled={!name.trim()}>
          Agregar
        </button>
        {message.text && <span className={message.ok ? "form-msg ok" : "form-msg error"}>{message.text}</span>}
      </form>

      {categories === null ? (
        <p className="muted">Cargando…</p>
      ) : (
        <div className="grid-2">
          <section className="card">
            <h2>Predefinidas</h2>
            <ul className="cat-list">
              {predefined.map((c) => (
                <li key={c.id}>
                  <span className="dot" style={{ background: c.color }} aria-hidden="true" />
                  <span className="cat-list-name">{c.name}</span>
                  <small className="muted">{c.movementCount} mov.</small>
                </li>
              ))}
            </ul>
          </section>

          <section className="card">
            <h2>Personalizadas</h2>
            {custom.length === 0 ? (
              <p className="empty">Todavía no tienes categorías propias.</p>
            ) : (
              <ul className="cat-list">
                {custom.map((c) => (
                  <li key={c.id}>
                    <span className="dot" style={{ background: c.color }} aria-hidden="true" />
                    {editId === c.id ? (
                      <>
                        <input
                          className="cat-edit-input"
                          type="text"
                          maxLength={30}
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          aria-label="Nuevo nombre"
                          autoFocus
                        />
                        <button type="button" className="btn btn-link btn-sm" onClick={() => rename(c.id)}>Guardar</button>
                        <button type="button" className="btn btn-link btn-sm" onClick={() => setEditId(null)}>Cancelar</button>
                      </>
                    ) : (
                      <>
                        <span className="cat-list-name">{c.name}</span>
                        <small className="muted">{c.movementCount} mov.</small>
                        <button type="button" className="btn btn-link btn-sm" onClick={() => { setEditId(c.id); setEditName(c.name); }}>
                          Renombrar
                        </button>
                        <button type="button" className="btn btn-link btn-sm danger" onClick={() => remove(c)}>
                          Eliminar
                        </button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
