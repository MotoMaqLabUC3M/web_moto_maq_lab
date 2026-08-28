"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { BottomNav } from "./BottomNav";
import { BrandLogo } from "./BrandLogo";
import { Sidebar } from "./Sidebar";

export function AppShell({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(() =>
    typeof window !== "undefined" ? isAuthenticated() : false,
  );

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--app-bg)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--app-accent)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh bg-[var(--app-bg)]">
      <Sidebar />

      <div className="flex min-h-dvh flex-1 flex-col lg:min-w-0">
        {/* Desktop SaaS top bar */}
        <header className="saas-topbar hidden lg:flex">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-semibold tracking-tight">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-0.5 truncate text-sm text-[var(--app-muted)]">
                {subtitle}
              </p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>

        {/* Mobile app header */}
        <header className="app-header flex items-start justify-between gap-3 lg:hidden">
          <div className="min-w-0">
            <BrandLogo href="/dashboard" height={32} className="mb-2 h-8 w-auto object-contain" />
            <h1 className="text-xl font-bold">{title}</h1>
            {subtitle ? (
              <p className="mt-0.5 text-sm text-[var(--app-muted)]">
                {subtitle}
              </p>
            ) : null}
          </div>
          {action}
        </header>

        <main className="app-main">{children}</main>
        <BottomNav />
      </div>
    </div>
  );
}
