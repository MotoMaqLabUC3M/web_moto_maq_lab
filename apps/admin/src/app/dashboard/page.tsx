"use client";

import type { ComponentType } from "react";
import { useEffect, useState } from "react";
import { Activity, BookOpen, Globe, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { api } from "@/lib/api";
import type { DashboardStats } from "@/lib/types";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .stats()
      .then(setStats)
      .catch(() => setError("No se pudieron cargar las estadísticas."));
  }, []);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

  return (
    <AppShell
      title="Panel"
      subtitle="Contenido en vivo vía API — sin exportar JSON"
    >
      {error ? (
        <p className="text-center text-sm text-red-400 lg:text-left">{error}</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Departamentos"
          value={stats?.departments}
        />
        <StatCard icon={Users} label="Miembros" value={stats?.members} />
        <StatCard icon={BookOpen} label="Entradas" value={stats?.posts} />
        <StatCard
          icon={Activity}
          label="Publicadas"
          value={stats?.published}
          accent
        />
      </div>

      <div className="app-card mt-6 space-y-3">
        <div className="flex items-center gap-2 text-[var(--app-accent)]">
          <Globe size={18} />
          <h2 className="font-semibold">Sitio público</h2>
        </div>
        <p className="text-sm text-[var(--app-muted)]">
Los cambios que guardes en Equipo y Blog se sirven al instante desde
          la API. El sitio en{" "}
          <code className="rounded bg-black/30 px-1 py-0.5 text-xs">/</code> los
          consume vía{" "}
          <code className="rounded bg-black/30 px-1 py-0.5 text-xs">
            /api/v1/public/*
          </code>
          .
        </p>
        <dl className="grid gap-2 text-sm">
          <div className="flex flex-wrap gap-x-2">
            <dt className="text-[var(--app-muted)]">API:</dt>
            <dd className="font-mono text-xs break-all">{apiUrl}</dd>
          </div>
          <div className="flex flex-wrap gap-x-2">
            <dt className="text-[var(--app-muted)]">Equipo:</dt>
            <dd className="font-mono text-xs break-all">
              {apiUrl}/api/v1/public/team
            </dd>
          </div>
          <div className="flex flex-wrap gap-x-2">
            <dt className="text-[var(--app-muted)]">Blog:</dt>
            <dd className="font-mono text-xs break-all">
              {apiUrl}/api/v1/public/blog
            </dd>
          </div>
        </dl>
      </div>
    </AppShell>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  label: string;
  value?: number;
  accent?: boolean;
}) {
  return (
    <div className="app-card flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[var(--app-muted)]">{label}</span>
        <Icon
          size={18}
          className={accent ? "text-[var(--app-accent)]" : "text-[var(--app-muted)]"}
        />
      </div>
      <p className="text-3xl font-bold tabular-nums">
        {value ?? "—"}
      </p>
    </div>
  );
}
