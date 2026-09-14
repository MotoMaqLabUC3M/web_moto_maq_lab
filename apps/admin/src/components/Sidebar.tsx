"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { accountNav, mainNav } from "@/lib/nav";
import { clearToken } from "@/lib/auth";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function logout() {
    clearToken();
    router.replace("/login");
  }

  return (
    <aside className="saas-sidebar hidden lg:flex">
      <div className="flex h-16 items-center border-b border-[var(--app-border)] px-5">
        <BrandLogo href="/dashboard" height={36} />
      </div>

      <nav className="flex-1 space-y-1 p-3" aria-label="Navegación principal">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--app-muted)]">
          Gestión
        </p>
        {mainNav.map(({ href, label, icon: Icon, description }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`saas-nav-item ${active ? "saas-nav-item--active" : ""}`}
            >
              <Icon size={18} strokeWidth={active ? 2.5 : 2} />
              <span className="flex-1">
                <span className="block text-sm font-medium">{label}</span>
                {description ? (
                  <span className="block text-[11px] text-[var(--app-muted)]">
                    {description}
                  </span>
                ) : null}
              </span>
            </Link>
          );
        })}

        <p className="mb-2 mt-6 px-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--app-muted)]">
          Sistema
        </p>
        {(() => {
          const AccountIcon = accountNav.icon;
          return (
        <Link
          href={accountNav.href}
          className={`saas-nav-item ${pathname.startsWith(accountNav.href) ? "saas-nav-item--active" : ""}`}
        >
          <AccountIcon size={18} />
          <span className="flex-1">
            <span className="block text-sm font-medium">{accountNav.label}</span>
            <span className="block text-[11px] text-[var(--app-muted)]">
              {accountNav.description}
            </span>
          </span>
        </Link>
          );
        })()}
      </nav>

      <div className="border-t border-[var(--app-border)] p-3">
        <button type="button" onClick={logout} className="saas-nav-item w-full">
          <LogOut size={18} />
          <span className="text-sm font-medium">Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
