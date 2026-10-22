"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client.js";

export default function AuthForm({ mode }) {
  const router = useRouter();
  const isRegister = mode === "register";
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setError("");
    try {
      await api(isRegister ? "/api/auth/register" : "/api/auth/login", {
        method: "POST",
        body: isRegister ? form : { email: form.email, password: form.password },
      });
      router.replace("/panel");
    } catch (err) {
      setErrors(err.errors || {});
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-side">
        <div className="brand brand-lg">
          <span className="brand-mark" aria-hidden="true">$</span>
          GastoFácil
        </div>
        <p className="auth-pitch">Registra tus gastos en segundos y mira en qué se va tu dinero cada mes.</p>
        <ul className="auth-points">
          <li>Categorías y presupuestos por mes</li>
          <li>Avisos al llegar al 80 % y al 100 %</li>
          <li>Tus datos se quedan en tu computadora</li>
        </ul>
      </div>

      <form className="auth-card" onSubmit={submit} noValidate>
        <h1>{isRegister ? "Crear cuenta" : "Iniciar sesión"}</h1>

        {isRegister && (
          <label className="field">
            <span>Nombre</span>
            <input type="text" autoComplete="name" value={form.name} onChange={set("name")} required autoFocus />
            {errors.name && <small className="error">{errors.name}</small>}
          </label>
        )}

        <label className="field">
          <span>Correo</span>
          <input type="email" autoComplete="email" value={form.email} onChange={set("email")} required autoFocus={!isRegister} />
          {errors.email && <small className="error">{errors.email}</small>}
        </label>

        <label className="field">
          <span>Contraseña</span>
          <input
            type="password"
            autoComplete={isRegister ? "new-password" : "current-password"}
            value={form.password}
            onChange={set("password")}
            required
          />
          {errors.password && <small className="error">{errors.password}</small>}
          {isRegister && !errors.password && <small className="hint">Mínimo 8 caracteres.</small>}
        </label>

        {error && Object.keys(errors).length === 0 && <p className="form-msg error">{error}</p>}

        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? "Un momento…" : isRegister ? "Crear cuenta" : "Entrar"}
        </button>

        <p className="auth-switch">
          {isRegister ? (
            <>
              ¿Ya tienes cuenta? <Link href="/login">Inicia sesión</Link>
            </>
          ) : (
            <>
              ¿No tienes cuenta? <Link href="/registro">Regístrate</Link>
            </>
          )}
        </p>
      </form>
    </div>
  );
}
