"use client";

import { createContext, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/client.js";

const UserContext = createContext(null);
export const useUser = () => useContext(UserContext);

const NAV = [
  { href: "/panel", label: "Panel" },
  { href: "/movimientos", label: "Movimientos" },
  { href: "/presupuestos", label: "Presupuestos" },
  { href: "/categorias", label: "Categorías" },
];

export default function AppShell({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let alive = true;
    api("/api/auth/me")
      .then((d) => alive && setUser(d.user))
      .catch(() => alive && router.replace("/login"))
      .finally(() => alive && setChecking(false));
    return () => {
      alive = false;
    };
  }, [router]);

  async function logout() {
    await api("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.replace("/login");
  }

  if (checking || !user) {
    return <div className="loading-screen">Cargando…</div>;
  }

  return (
    <UserContext.Provider value={user}>
      <div className="shell">
        <header className="topbar">
          <Link href="/panel" className="brand">
            <span className="brand-mark" aria-hidden="true">$</span>
            GastoFácil
          </Link>
          <nav className="nav" aria-label="Secciones">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className={pathname === item.href ? "nav-link active" : "nav-link"}>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="user-box">
            <span className="user-name" title={user.email}>{user.name}</span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={logout}>
              Salir
            </button>
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
    </UserContext.Provider>
  );
}
