"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { accountNav, mainNav } from "@/lib/nav";

const mobileTabs = [...mainNav, accountNav];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav lg:hidden" aria-label="Navegación móvil">
      <ul className="grid grid-cols-4 gap-1">
        {mobileTabs.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition ${
                  active
                    ? "bg-[var(--app-accent-soft)] text-[var(--app-accent)]"
                    : "text-[var(--app-muted)]"
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
