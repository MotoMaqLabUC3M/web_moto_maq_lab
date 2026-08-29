"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useConfirm } from "@/components/ConfirmProvider";
import { SortableList } from "@/components/SortableList";
import { api } from "@/lib/api";
import { groupPostsBySlug, type BlogArticleGroup } from "@/lib/blog";
import type { BlogPost, BlogSection } from "@/lib/types";

export default function BlogSectionPage({
  params,
}: {
  params: Promise<{ sectionId: string }>;
}) {
  const [sectionId, setSectionId] = useState("");
  const [section, setSection] = useState<BlogSection | null>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const confirm = useConfirm();

  useEffect(() => {
    params.then((p) => setSectionId(p.sectionId));
  }, [params]);

  const load = useCallback(async () => {
    if (!sectionId) return;
    const sections = await api.listSections();
    const sec = sections.find((s) => s.id === sectionId) ?? null;
    setSection(sec);
    setPosts(sec?.posts ?? []);
  }, [sectionId]);

  useEffect(() => {
    load();
  }, [load]);

  const articles = useMemo(() => groupPostsBySlug(posts), [posts]);

  async function removeArticle(group: BlogArticleGroup) {
    const locales = group.posts.map((p) => p.locale.toUpperCase()).join(" + ");
    const ok = await confirm({
      title: "Eliminar entrada",
      message:
        group.posts.length > 1
          ? `¿Seguro que quieres eliminar «${group.primary.title}»? Se borrarán las versiones ${locales}.`
          : `¿Seguro que quieres eliminar «${group.primary.title}»? Esta acción no se puede deshacer.`,
      confirmLabel: "Eliminar",
    });
    if (!ok) return;
    for (const post of group.posts) {
      await api.deletePost(post.id);
    }
    load();
  }

  async function reorderArticles(slugs: string[]) {
    const bySlug = new Map(articles.map((a) => [a.slug, a]));
    const ids = slugs
      .map((slug) => bySlug.get(slug)?.primary.id)
      .filter((id): id is string => Boolean(id));
    await api.reorderPosts(sectionId, ids);
    setPosts((prev) => {
      const byId = new Map(prev.map((p) => [p.id, p]));
      const slugOrder = new Map(slugs.map((slug, index) => [slug, index]));
      return [...prev]
        .map((post) => {
          const order = slugOrder.get(post.slug);
          return order === undefined
            ? post
            : { ...post, sort_order: order };
        })
        .sort((a, b) => {
          if (a.sort_order !== b.sort_order) {
            return a.sort_order - b.sort_order;
          }
          return a.locale.localeCompare(b.locale);
        });
    });
  }

  return (
    <AppShell
      title={section?.title_es ?? "Sección"}
      subtitle="Una fila por artículo · ES/EN son traducciones del mismo"
      action={
        <Link href="/blog" className="app-btn-ghost !min-h-9 !px-3">
          <ArrowLeft size={18} />
        </Link>
      }
    >
      <div className="mb-4 flex justify-end">
        <Link
          href={`/blog/new?section=${sectionId}`}
          className="app-btn-primary"
        >
          <Plus size={18} /> Entrada
        </Link>
      </div>

      {articles.length === 0 ? (
        <div className="py-12 text-center text-[var(--app-muted)]">
          No hay entradas en esta sección.
        </div>
      ) : (
        <SortableList
          items={articles}
          getId={(group) => group.slug}
          onReorder={reorderArticles}
          renderItem={(group, { dragHandle }) => {
            const allPublished = group.posts.every((p) => p.published);
            const anyPublished = group.posts.some((p) => p.published);

            return (
              <div className="app-card flex items-center gap-1 !p-0 lg:active:scale-100">
                {dragHandle}
                <Link
                  href={`/blog/${group.primary.id}`}
                  className="flex flex-1 items-center gap-3 p-4 pl-0"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold">
                        {group.primary.title}
                      </p>
                      {allPublished ? (
                        <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                          LIVE
                        </span>
                      ) : anyPublished ? (
                        <span className="shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                          PARCIAL
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-full bg-zinc-500/15 px-2 py-0.5 text-[10px] font-semibold text-zinc-400">
                          BORRADOR
                        </span>
                      )}
                      <span className="flex shrink-0 gap-1">
                        {group.posts.map((p) => (
                          <span
                            key={p.id}
                            className={
                              p.published
                                ? "rounded-full bg-[var(--app-surface-2)] px-2 py-0.5 text-[10px] font-semibold text-[var(--app-text)]"
                                : "rounded-full bg-[var(--app-surface-2)] px-2 py-0.5 text-[10px] font-semibold text-[var(--app-muted)]"
                            }
                          >
                            {p.locale.toUpperCase()}
                          </span>
                        ))}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--app-muted)]">
                      {group.primary.date}
                      {group.primary.category
                        ? ` · ${group.primary.category}`
                        : ""}
                      {group.posts.length > 1 ? " · traducido" : ""}
                    </p>
                  </div>
                  <ChevronRight
                    size={18}
                    className="text-[var(--app-muted)]"
                  />
                </Link>
                <button
                  type="button"
                  onClick={() => removeArticle(group)}
                  className="mr-3 rounded-lg p-2 text-red-400 active:bg-red-500/10"
                  aria-label="Eliminar entrada"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          }}
        />
      )}
    </AppShell>
  );
}
