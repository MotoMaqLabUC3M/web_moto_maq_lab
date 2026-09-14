"use client";

import dynamic from "next/dynamic";
import {
  FormEvent,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, Save } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { BlogPostMetaFields } from "@/components/BlogPostMetaFields";
import {
  BlogPostPreviewModal,
  type BlogPreviewData,
} from "@/components/BlogPostPreviewModal";
import { PublishToggleButton } from "@/components/PublishToggleButton";
import { api } from "@/lib/api";
import { blocksToPlainExcerpt } from "@/lib/blocks";
import type { BlogBlock, BlogSection, Department } from "@/lib/types";

const BlogEditor = dynamic(
  () => import("@/components/BlogEditor").then((m) => m.BlogEditor),
  {
    ssr: false,
    loading: () => (
      <div className="h-48 animate-pulse rounded-2xl bg-[var(--app-surface)]" />
    ),
  },
);

export default function NewBlogPage() {
  return (
    <Suspense
      fallback={
        <div className="app-shell items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--app-accent)] border-t-transparent" />
        </div>
      }
    >
      <NewBlogForm />
    </Suspense>
  );
}

function NewBlogForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetSection = searchParams.get("section") ?? "";

  const [sections, setSections] = useState<BlogSection[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [sectionId, setSectionId] = useState(presetSection);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("MOTO-MAQLAB-UC3M");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [locale, setLocale] = useState("es");
  const [published, setPublished] = useState(false);
  const [pendingCover, setPendingCover] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const blocksRef = useRef<BlogBlock[]>([]);
  const handleBlocksChange = useCallback((blocks: BlogBlock[]) => {
    blocksRef.current = blocks;
  }, []);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.listSections().then(setSections).catch(() => setSections([]));
    api.listDepartments().then(setDepartments).catch(() => setDepartments([]));
  }, []);

  useEffect(() => {
    if (presetSection) setSectionId(presetSection);
  }, [presetSection]);

  useEffect(() => {
    if (!pendingCover) {
      setCoverPreview(null);
      return;
    }
    const url = URL.createObjectURL(pendingCover);
    setCoverPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingCover]);

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
        section_id: sectionId || undefined,
        blocks: blocksRef.current,
        excerpt: blocksToPlainExcerpt(blocksRef.current),
        date,
      });
      if (pendingCover) {
        await api.uploadCover(post.id, pendingCover);
      }
      router.replace(`/blog/${post.id}`);
    } finally {
      setSaving(false);
    }
  }

  const backHref = sectionId ? `/blog/section/${sectionId}` : "/blog";

  const preview: BlogPreviewData = {
    title,
    author,
    category,
    date,
    locale,
    excerpt: blocksToPlainExcerpt(blocksRef.current),
    coverImage: undefined,
    blocks: blocksRef.current,
    published,
  };

  return (
    <AppShell
      title="Nueva entrada"
      subtitle="Editor estilo Notion"
      action={
        <Link href={backHref} className="app-btn-ghost !min-h-9 !px-3">
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

        <BlogPostMetaFields
          author={author}
          onAuthorChange={setAuthor}
          category={category}
          onCategoryChange={setCategory}
          date={date}
          onDateChange={setDate}
          sectionId={sectionId}
          onSectionChange={setSectionId}
          sections={sections}
          locale={locale}
          coverPreviewUrl={coverPreview}
          onCoverSelect={setPendingCover}
        />

        <label className="block space-y-1">
          <span className="text-xs font-medium text-[var(--app-muted)]">
            Idioma
          </span>
          <select
            className="app-input w-full"
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
          >
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
        </label>

        <BlogEditor
          initialBlocks={[]}
          slug={title || "draft"}
          onChange={handleBlocksChange}
        />

        <div className="sticky bottom-24 flex flex-wrap gap-3 lg:static">
          <button
            type="submit"
            disabled={saving || !sectionId}
            className="app-btn-primary min-h-11 flex-1 disabled:opacity-60 lg:flex-none lg:px-8"
          >
            <Save size={18} />
            {saving ? "Guardando…" : "Guardar entrada"}
          </button>
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="app-btn-ghost min-h-11 flex-1 lg:flex-none lg:px-6"
          >
            <Eye size={18} />
            Preview
          </button>
          <PublishToggleButton
            published={published}
            onToggle={setPublished}
            disabled={saving}
          />
        </div>
      </form>

      <BlogPostPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        post={{
          ...preview,
          coverImage: coverPreview ?? undefined,
        }}
        departments={departments}
      />
    </AppShell>
  );
}
