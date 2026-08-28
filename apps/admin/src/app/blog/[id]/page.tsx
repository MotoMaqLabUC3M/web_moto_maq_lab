"use client";

import dynamic from "next/dynamic";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PublishToggleButton } from "@/components/PublishToggleButton";
import { api } from "@/lib/api";
import { blocksToPlainExcerpt } from "@/lib/blocks";
import type { BlogBlock, BlogPost } from "@/lib/types";

const BlogEditor = dynamic(
  () => import("@/components/BlogEditor").then((m) => m.BlogEditor),
  { ssr: false, loading: () => <div className="h-48 animate-pulse rounded-2xl bg-[var(--app-surface)]" /> },
);

export default function EditBlogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [postId, setPostId] = useState("");
  const [post, setPost] = useState<BlogPost | null>(null);
  const [editorBlocks, setEditorBlocks] = useState<BlogBlock[] | null>(null);
  const blocksRef = useRef<BlogBlock[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    params.then((p) => setPostId(p.id));
  }, [params]);

  const load = useCallback(async () => {
    if (!postId) return;
    const data = await api.getPost(postId);
    setPost(data);
    const loaded = data.blocks ?? [];
    blocksRef.current = loaded;
    setEditorBlocks(loaded);
  }, [postId]);

  useEffect(() => {
    load();
  }, [load]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!post) return;
    setSaving(true);
    try {
      await api.updatePost(post.id, {
        title: post.title,
        author: post.author,
        category: post.category,
        locale: post.locale,
        published: post.published,
        blocks: blocksRef.current,
        excerpt: blocksToPlainExcerpt(blocksRef.current),
        date: post.date,
      });
    } finally {
      setSaving(false);
    }
  }

  const handleBlocksChange = useCallback((blocks: BlogBlock[]) => {
    blocksRef.current = blocks;
  }, []);

  if (!post || editorBlocks === null) {
    return (
      <div className="app-shell items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--app-accent)] border-t-transparent" />
      </div>
    );
  }

  return (
    <AppShell
      title="Editar entrada"
      subtitle={post.slug}
      action={
        <Link href="/blog" className="app-btn-ghost !min-h-9 !px-3">
          <ArrowLeft size={18} />
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="mx-auto space-y-4 lg:max-w-3xl">
        <input
          className="app-input text-base font-semibold"
          value={post.title}
          onChange={(e) => setPost({ ...post, title: e.target.value })}
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            className="app-input"
            value={post.author}
            onChange={(e) => setPost({ ...post, author: e.target.value })}
          />
          <input
            className="app-input"
            value={post.category}
            onChange={(e) => setPost({ ...post, category: e.target.value })}
          />
        </div>
        <select
          className="app-input w-full"
          value={post.locale}
          onChange={(e) => setPost({ ...post, locale: e.target.value })}
        >
          <option value="es">Español</option>
          <option value="en">English</option>
        </select>

        <BlogEditor
          initialBlocks={editorBlocks}
          slug={post.slug}
          onChange={handleBlocksChange}
        />

        <div className="sticky bottom-24 flex gap-3 lg:static">
          <button
            type="submit"
            disabled={saving}
            className="app-btn-primary min-h-11 flex-1 disabled:opacity-60 lg:flex-none lg:px-8"
          >
            <Save size={18} />
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
          <PublishToggleButton
            published={post.published}
            onToggle={(published) => setPost({ ...post, published })}
            disabled={saving}
          />
        </div>
      </form>
    </AppShell>
  );
}
