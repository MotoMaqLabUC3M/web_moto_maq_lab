"use client";

import { Globe, GlobeLock } from "lucide-react";

type Props = {
  published: boolean;
  onToggle: (published: boolean) => void;
  disabled?: boolean;
};

export function PublishToggleButton({
  published,
  onToggle,
  disabled,
}: Props) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onToggle(!published)}
      className={
        published
          ? "app-btn min-h-11 flex-1 border border-[var(--app-accent)] bg-[var(--app-accent-soft)] font-bold text-[var(--app-accent)] shadow-sm shadow-red-950/20 disabled:opacity-60 lg:flex-none lg:px-6"
          : "app-btn min-h-11 flex-1 border border-[var(--app-border)] bg-[var(--app-surface-2)] font-normal text-[var(--app-muted)] disabled:opacity-60 lg:flex-none lg:px-6"
      }
      aria-pressed={published}
    >
      {published ? (
        <>
          <Globe size={18} strokeWidth={2.5} />
          Publicado
        </>
      ) : (
        <>
          <GlobeLock size={18} />
          Publicar
        </>
      )}
    </button>
  );
}
