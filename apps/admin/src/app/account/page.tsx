"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { api } from "@/lib/api";
import { clearToken } from "@/lib/auth";
import type { User } from "@/lib/types";

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    api.me().then(setUser).catch(() => setUser(null));
  }, []);

  function logout() {
    clearToken();
    router.replace("/login");
  }

  return (
    <AppShell title="Cuenta" subtitle="Sesión admin">
      <div className="lg:grid lg:max-w-3xl lg:grid-cols-2 lg:gap-6">
      <div className="app-card space-y-4">
        {user ? (
          <>
            <div>
              <p className="text-xs text-[var(--app-muted)]">Usuario</p>
              <p className="text-lg font-semibold">{user.username}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--app-muted)]">Rol</p>
              <p className="font-medium capitalize">{user.role}</p>
            </div>
          </>
        ) : (
          <p className="text-[var(--app-muted)]">Cargando…</p>
        )}
        <button type="button" onClick={logout} className="app-btn-ghost w-full lg:hidden">
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </div>

      <div className="app-card mt-6 space-y-3 lg:mt-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--app-muted)]">
          Conexión
        </p>
        <p className="text-sm text-[var(--app-muted)]">
          API backend
        </p>
        <p className="break-all font-mono text-xs text-[var(--app-text)]">
          {process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"}
        </p>
      </div>
      </div>
    </AppShell>
  );
}
