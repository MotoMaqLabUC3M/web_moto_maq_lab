"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { BrandLogo } from "@/components/BrandLogo";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.login(username, password);
      setToken(res.token);
      router.replace("/team");
    } catch {
      setError("Usuario o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh">
      {/* Desktop branding panel */}
      <aside className="relative hidden w-[45%] overflow-hidden bg-[var(--app-surface)] lg:flex lg:items-center lg:justify-center lg:p-12">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(225,6,0,0.18),transparent_55%)]" />
        <BrandLogo height={72} className="relative h-[72px] w-auto object-contain" />
      </aside>

      {/* Form — mobile full screen, desktop centered card */}
      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm animate-slide-up space-y-8">
          <div className="text-center lg:text-left">
            <div className="mb-4 flex justify-center lg:justify-start">
              <BrandLogo height={56} className="h-14 w-auto object-contain" />
            </div>
            <h2 className="text-2xl font-bold">Iniciar sesión</h2>
            <p className="mt-1 text-sm text-[var(--app-muted)]">
              Accede al panel de administración
            </p>
          </div>

          <form
            onSubmit={onSubmit}
            className="space-y-4 lg:rounded-2xl lg:border lg:border-[var(--app-border)] lg:bg-[var(--app-surface)] lg:p-8"
          >
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--app-muted)]">
                Usuario
              </label>
              <input
                className="app-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--app-muted)]">
                Contraseña
              </label>
              <input
                className="app-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            {error ? (
              <p className="text-center text-sm text-red-400 lg:text-left">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={loading}
              className="app-btn-primary w-full disabled:opacity-60"
            >
              {loading ? "Entrando…" : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
