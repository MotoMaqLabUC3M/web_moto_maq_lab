"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { ExternalLink, X } from "lucide-react";
import { blocksToPlainExcerpt, blocksToPreviewHtml, mediaUrl } from "@/lib/blocks";
import type { BlogBlock, Department } from "@/lib/types";

export type BlogPreviewData = {
  title: string;
  author: string;
  category: string;
  date: string;
  locale: string;
  excerpt?: string;
  coverImage?: string;
  blocks: BlogBlock[];
  slug?: string;
  published?: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  post: BlogPreviewData;
  departments: Department[];
  onOpenPublic?: () => void;
};

function formatDate(date: string, locale: string) {
  try {
    return new Date(date).toLocaleDateString(locale === "en" ? "en-US" : "es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return date;
  }
}

function findAuthorMember(author: string, departments: Department[]) {
  const members = departments.flatMap((dep) =>
    (dep.members ?? []).map((m) => ({ ...m, department: dep.title_es })),
  );
  return (
    members.find((m) => m.name.toLowerCase() === author.toLowerCase()) ?? null
  );
}

export function BlogPostPreviewModal({
  open,
  onClose,
  post,
  departments,
  onOpenPublic,
}: Props) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const isEnglish = post.locale === "en";
  const excerpt = post.excerpt || blocksToPlainExcerpt(post.blocks, 280);
  const cover = post.coverImage
    ? post.coverImage.startsWith("blob:") ||
      post.coverImage.startsWith("http://") ||
      post.coverImage.startsWith("https://")
      ? post.coverImage
      : mediaUrl(post.coverImage)
    : "";
  const authorMember = findAuthorMember(post.author, departments);
  const contentHtml = blocksToPreviewHtml(post.blocks);

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="blog-preview-title"
        className="blog-preview-modal flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-[var(--app-border)] bg-[var(--app-bg)] shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--app-border)] px-4 py-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--app-muted)]">
              Vista previa
            </p>
            <h2 id="blog-preview-title" className="font-semibold">
              {post.title || "Sin título"}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {onOpenPublic ? (
              <button
                type="button"
                onClick={onOpenPublic}
                className="app-btn-ghost !min-h-9 !px-3 text-sm"
              >
                <ExternalLink size={16} />
                Web
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="app-btn-ghost !min-h-9 !px-3"
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto">
          <div
            className={
              cover
                ? "blog-preview-hero blog-preview-hero--photo"
                : "blog-preview-hero"
            }
            style={
              cover
                ? ({ ["--preview-hero-bg" as string]: `url('${cover}')` } as React.CSSProperties)
                : undefined
            }
          >
            <div className="blog-preview-hero__inner">
              {post.category ? (
                <span className="blog-preview-badge">{post.category}</span>
              ) : null}
              <h1>{post.title}</h1>
              {excerpt ? <p>{excerpt}</p> : null}
            </div>
          </div>

          <div className="blog-preview-meta">
            <div>
              <span>{isEnglish ? "Author" : "Autor"}</span>
              <strong>{post.author}</strong>
            </div>
            <div>
              <span>{isEnglish ? "Date" : "Fecha"}</span>
              <strong>{formatDate(post.date, post.locale)}</strong>
            </div>
            <div>
              <span>{isEnglish ? "Category" : "Categoría"}</span>
              <strong>{post.category || "—"}</strong>
            </div>
          </div>

          <article
            className="blog-preview-article"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />

          {authorMember ? (
            <div className="blog-preview-author">
              {authorMember.image_path ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mediaUrl(authorMember.image_path)}
                  alt={authorMember.name}
                  className="h-14 w-14 rounded-xl object-cover"
                />
              ) : null}
              <div>
                <p className="text-xs uppercase tracking-wide text-[var(--app-muted)]">
                  {isEnglish ? "Written by" : "Escrito por"}
                </p>
                <p className="font-semibold">{authorMember.name}</p>
                <p className="text-sm text-[var(--app-muted)]">
                  {isEnglish
                    ? authorMember.role_en || authorMember.role_es
                    : authorMember.role_es}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
