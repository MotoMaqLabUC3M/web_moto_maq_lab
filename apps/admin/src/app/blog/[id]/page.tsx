"use client";

import dynamic from "next/dynamic";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, Save } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { BlogLocaleTabs } from "@/components/BlogLocaleTabs";
import { BlogPostMetaFields } from "@/components/BlogPostMetaFields";
import {
  BlogPostPreviewModal,
  type BlogPreviewData,
} from "@/components/BlogPostPreviewModal";
import { PublishToggleButton } from "@/components/PublishToggleButton";
import { api } from "@/lib/api";
import { blocksToPlainExcerpt } from "@/lib/blocks";
import type { BlogBlock, BlogPost, BlogSection, Department } from "@/lib/types";

const BlogEditor = dynamic(
  () => import("@/components/BlogEditor").then((m) => m.BlogEditor),
  {
    ssr: false,
    loading: () => (
      <div className="h-48 animate-pulse rounded-2xl bg-[var(--app-surface)]" />
    ),
  },
);

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "http://localhost:3000";

export default function EditBlogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [postId, setPostId] = useState("");
  const [post, setPost] = useState<BlogPost | null>(null);
  const [sections, setSections] = useState<BlogSection[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [editorBlocks, setEditorBlocks] = useState<BlogBlock[] | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const blocksRef = useRef<BlogBlock[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    params.then((p) => setPostId(p.id));
  }, [params]);

  useEffect(() => {
    api.listSections().then(setSections).catch(() => setSections([]));
    api.listDepartments().then(setDepartments).catch(() => setDepartments([]));
  }, []);

  const load = useCallback(async () => {
    if (!postId) return;
    const data = await api.getPost(postId);
    setPost(data);
    const loaded = data.blocks ?? [];
    blocksRef.current = loaded;
    setEditorBlocks(loaded);
    setCoverPreview(null);
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
        published: post.published,
        section_id: post.section_id,
        blocks: blocksRef.current,
        excerpt: blocksToPlainExcerpt(blocksRef.current),
        date: post.date,
        cover_image: post.cover_image ?? "",
      });
    } finally {
      setSaving(false);
    }
  }

  const handleBlocksChange = useCallback((blocks: BlogBlock[]) => {
    blocksRef.current = blocks;
  }, []);

  async function createTranslation(locale: "es" | "en") {
    if (!post) return;
    const created = await api.createPost({
      slug: post.slug,
      title: post.title,
      author: post.author,
      category: post.category,
      locale,
      section_id: post.section_id,
      blocks: blocksRef.current,
      excerpt: blocksToPlainExcerpt(blocksRef.current),
      date: post.date,
      published: false,
    });
    router.push(`/blog/${created.id}`);
  }

  async function onCoverSelect(file: File | null) {
    if (!post) return;

    if (!file) {
      setCoverUploading(true);
      try {
        const updated = await api.updatePost(post.id, {
          title: post.title,
          author: post.author,
          category: post.category,
          published: post.published,
          section_id: post.section_id,
          blocks: blocksRef.current,
          excerpt: blocksToPlainExcerpt(blocksRef.current),
          date: post.date,
          cover_image: "",
        });
        setPost(updated);
        setCoverPreview(null);
      } finally {
        setCoverUploading(false);
      }
      return;
    }

    const preview = URL.createObjectURL(file);
    setCoverPreview(preview);
    setCoverUploading(true);
    try {
      const updated = await api.uploadCover(post.id, file);
      setPost(updated);
    } finally {
      setCoverUploading(false);
      URL.revokeObjectURL(preview);
      setCoverPreview(null);
    }
  }

  function previewData(): BlogPreviewData | null {
    if (!post) return null;
    return {
      title: post.title,
      author: post.author,
      category: post.category,
      date: post.date,
      locale: post.locale,
      excerpt: blocksToPlainExcerpt(blocksRef.current),
      coverImage: coverPreview ?? post.cover_image,
      blocks: blocksRef.current,
      slug: post.slug,
      published: post.published,
    };
  }

  function openPublicPreview() {
    if (!post?.slug) return;
    const prefix = post.locale === "en" ? "news" : "noticia";
    window.open(`${SITE_URL}/${prefix}-${post.slug}.html`, "_blank");
  }

  if (!post || editorBlocks === null) {
    return (
      <div className="app-shell items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--app-accent)] border-t-transparent" />
      </div>
    );
  }

  const backHref = post.section_id
    ? `/blog/section/${post.section_id}`
    : "/blog";
  const preview = previewData();

  return (
    <AppShell
      title="Editar entrada"
      subtitle={`${post.slug} · ${post.locale.toUpperCase()}`}
      action={
        <Link href={backHref} className="app-btn-ghost !min-h-9 !px-3">
          <ArrowLeft size={18} />
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="mx-auto space-y-4 lg:max-w-3xl">
        <BlogLocaleTabs post={post} onCreateTranslation={createTranslation} />

        <input
          className="app-input text-base font-semibold"
          value={post.title}
          onChange={(e) => setPost({ ...post, title: e.target.value })}
          required
        />

        <BlogPostMetaFields
          author={post.author}
          onAuthorChange={(author) => setPost({ ...post, author })}
          category={post.category}
          onCategoryChange={(category) => setPost({ ...post, category })}
          date={post.date}
          onDateChange={(date) => setPost({ ...post, date })}
          sectionId={post.section_id ?? ""}
          onSectionChange={(section_id) =>
            setPost({ ...post, section_id: section_id || undefined })
          }
          sections={sections}
          locale={post.locale}
          coverImage={post.cover_image}
          coverPreviewUrl={coverPreview}
          onCoverSelect={onCoverSelect}
          coverUploading={coverUploading}
        />

        <BlogEditor
          key={post.id}
          initialBlocks={editorBlocks}
          slug={post.slug}
          onChange={handleBlocksChange}
        />

        <div className="sticky bottom-24 flex flex-wrap gap-3 lg:static">
          <button
            type="submit"
            disabled={saving}
            className="app-btn-primary min-h-11 flex-1 disabled:opacity-60 lg:flex-none lg:px-8"
          >
            <Save size={18} />
            {saving ? "Guardando…" : "Guardar cambios"}
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
            published={post.published}
            onToggle={(published) => setPost({ ...post, published })}
            disabled={saving}
          />
        </div>
      </form>

      {preview ? (
        <BlogPostPreviewModal
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          post={preview}
          departments={departments}
          onOpenPublic={post.published ? openPublicPreview : undefined}
        />
      ) : null}
    </AppShell>
  );
}
