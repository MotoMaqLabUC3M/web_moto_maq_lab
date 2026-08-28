"use client";

import dynamic from "next/dynamic";
import { FormEvent, useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PublishToggleButton } from "@/components/PublishToggleButton";
import { api } from "@/lib/api";
import { blocksToPlainExcerpt } from "@/lib/blocks";
import type { BlogBlock } from "@/lib/types";

const BlogEditor = dynamic(
  () => import("@/components/BlogEditor").then((m) => m.BlogEditor),
  { ssr: false, loading: () => <div className="h-48 animate-pulse rounded-2xl bg-[var(--app-surface)]" /> },
);

export default function NewBlogPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("MOTO-MAQLAB-UC3M");
  const [category, setCategory] = useState("");
  const [locale, setLocale] = useState("es");
  const [published, setPublished] = useState(false);
  const blocksRef = useRef<BlogBlock[]>([]);
  const handleBlocksChange = useCallback((blocks: BlogBlock[]) => {
    blocksRef.current = blocks;
  }, []);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const post = await api.createPost({
        title,
        author,
        category,
        locale,
        published,
        blocks: blocksRef.current,
        excerpt: blocksToPlainExcerpt(blocksRef.current),
        date: new Date().toISOString().slice(0, 10),
      });
      router.replace(`/blog/${post.id}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell
      title="Nueva entrada"
      subtitle="Editor estilo Notion"
      action={
        <Link href="/blog" className="app-btn-ghost !min-h-9 !px-3">
          <ArrowLeft size={18} />
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="mx-auto space-y-4 lg:max-w-3xl">
        <input
          className="app-input text-base font-semibold"
          placeholder="Título"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            className="app-input"
            placeholder="Autor"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          />
          <input
            className="app-input"
            placeholder="Categoría"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>
        <select
          className="app-input w-full"
          value={locale}
          onChange={(e) => setLocale(e.target.value)}
        >
          <option value="es">Español</option>
          <option value="en">English</option>
        </select>

        <BlogEditor initialBlocks={[]} slug={title || "draft"} onChange={handleBlocksChange} />

        <div className="sticky bottom-24 flex gap-3 lg:static">
          <button
            type="submit"
            disabled={saving}
            className="app-btn-primary min-h-11 flex-1 disabled:opacity-60 lg:flex-none lg:px-8"
          >
            <Save size={18} />
            {saving ? "Guardando…" : "Guardar entrada"}
          </button>
          <PublishToggleButton
            published={published}
            onToggle={setPublished}
            disabled={saving}
          />
        </div>
      </form>
    </AppShell>
  );
}
