"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { api } from "@/lib/api";
import type { BlogPost } from "@/lib/types";

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPosts(await api.listPosts());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function removePost(id: string) {
    if (!confirm("¿Eliminar entrada?")) return;
    await api.deletePost(id);
    load();
  }

  return (
    <AppShell
      title="Blog"
      subtitle={`${posts.length} entradas`}
      action={
        <Link href="/blog/new" className="app-btn-primary !min-h-9 !px-3">
          <Plus size={18} />
        </Link>
      }
    >
      {loading ? (
        <div className="py-12 text-center text-[var(--app-muted)]">
          Cargando…
        </div>
      ) : posts.length === 0 ? (
        <div className="app-card text-center">
          <p className="text-[var(--app-muted)]">Sin entradas aún</p>
          <Link href="/blog/new" className="app-btn-primary mt-4 inline-flex">
            Crear primera entrada
          </Link>
        </div>
      ) : (
        <ul className="content-grid lg:grid-cols-1 xl:grid-cols-2">
          {posts.map((post) => (
            <li key={post.id} className="app-card !p-0">
              <Link
                href={`/blog/${post.id}`}
                className="flex items-center gap-3 p-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold">{post.title}</p>
                    {post.published ? (
                      <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                        LIVE
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-full bg-zinc-500/15 px-2 py-0.5 text-[10px] font-semibold text-zinc-400">
                        BORRADOR
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--app-muted)]">
                    {post.date} · {post.category || "Sin categoría"}
                  </p>
                </div>
                <ChevronRight size={18} className="text-[var(--app-muted)]" />
              </Link>
              <div className="flex justify-end border-t border-[var(--app-border)] px-4 py-2">
                <button
                  type="button"
                  onClick={() => removePost(post.id)}
                  className="flex items-center gap-1 text-xs text-red-400"
                >
                  <Trash2 size={14} /> Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
