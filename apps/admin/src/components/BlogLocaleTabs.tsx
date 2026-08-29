"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiClientError } from "@/lib/api";
import { useConfirm } from "@/components/ConfirmProvider";
import type { BlogPost } from "@/lib/types";

type Locale = "es" | "en";

type Props = {
  post: BlogPost;
  onCreateTranslation: (locale: Locale) => Promise<void>;
};

export function BlogLocaleTabs({ post, onCreateTranslation }: Props) {
  const [available, setAvailable] = useState<Record<Locale, boolean>>({
    es: post.locale === "es",
    en: post.locale === "en",
  });
  const [switching, setSwitching] = useState<Locale | null>(null);
  const router = useRouter();
  const confirm = useConfirm();

  useEffect(() => {
    let cancelled = false;

    async function checkLocales() {
      const next: Record<Locale, boolean> = {
        es: post.locale === "es",
        en: post.locale === "en",
      };

      for (const locale of ["es", "en"] as Locale[]) {
        if (locale === post.locale) continue;
        try {
          await api.lookupPost(post.slug, locale);
          next[locale] = true;
        } catch (err) {
          if (!(err instanceof ApiClientError) || err.status !== 404) {
            next[locale] = false;
          }
        }
      }

      if (!cancelled) setAvailable(next);
    }

    checkLocales();
    return () => {
      cancelled = true;
    };
  }, [post.slug, post.locale]);

  async function switchTo(locale: Locale) {
    if (locale === post.locale || switching) return;

    if (available[locale]) {
      setSwitching(locale);
      try {
        const sibling = await api.lookupPost(post.slug, locale);
        router.push(`/blog/${sibling.id}`);
      } finally {
        setSwitching(null);
      }
      return;
    }

    const label = locale === "es" ? "español" : "inglés";
    const ok = await confirm({
      title: `Crear versión en ${label}`,
      message: `No hay versión en ${label} todavía. ¿Quieres crearla a partir de esta entrada?`,
      confirmLabel: "Crear",
      destructive: false,
    });
    if (!ok) return;

    setSwitching(locale);
    try {
      await onCreateTranslation(locale);
    } finally {
      setSwitching(null);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-medium text-[var(--app-muted)]">Idioma</p>
      <div className="flex gap-2">
        {(["es", "en"] as Locale[]).map((locale) => {
          const active = post.locale === locale;
          const exists = available[locale];
          const busy = switching === locale;

          return (
            <button
              key={locale}
              type="button"
              disabled={busy}
              onClick={() => switchTo(locale)}
              className={
                active
                  ? "app-btn-primary !min-h-9 flex-1 !py-2"
                  : "app-btn-ghost !min-h-9 flex-1 !py-2" +
                    (exists ? "" : " opacity-70")
              }
            >
              {busy
                ? "…"
                : locale === "es"
                  ? "Español"
                  : "English"}
              {!active && !exists ? " +" : null}
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-[var(--app-muted)]">
        Cada idioma es una entrada distinta. Pulsa el otro idioma para editarlo
        o crear la traducción.
      </p>
    </div>
  );
}
