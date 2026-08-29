"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useConfirm } from "@/components/ConfirmProvider";
import { SortableList } from "@/components/SortableList";
import { api, ApiClientError } from "@/lib/api";
import { countArticlesBySlug } from "@/lib/blog";
import type { BlogSection } from "@/lib/types";

export default function BlogPage() {
  const [sections, setSections] = useState<BlogSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [titleES, setTitleES] = useState("");
  const [titleEN, setTitleEN] = useState("");
  const [subtitleES, setSubtitleES] = useState("");
  const [subtitleEN, setSubtitleEN] = useState("");
  const [layout, setLayout] = useState("grid");
  const confirm = useConfirm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setSections(await api.listSections());
    } catch {
      setSections([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createSection(e: FormEvent) {
    e.preventDefault();
    await api.createSection({
      title_es: titleES,
      title_en: titleEN,
      subtitle_es: subtitleES,
      subtitle_en: subtitleEN,
      layout,
      sort_order: sections.length,
    });
    setTitleES("");
    setTitleEN("");
    setSubtitleES("");
    setSubtitleEN("");
    setLayout("grid");
    setShowForm(false);
    load();
  }

  async function removeSection(id: string) {
    const sec = sections.find((s) => s.id === id);
    const ok = await confirm({
      title: "Eliminar sección",
      message: sec
        ? `¿Seguro que quieres eliminar «${sec.title_es}»? Solo se puede si no tiene entradas.`
        : "¿Seguro que quieres eliminar esta sección?",
      confirmLabel: "Eliminar",
    });
    if (!ok) return;
    try {
      await api.deleteSection(id);
      load();
    } catch (err) {
      if (err instanceof ApiClientError) {
        await confirm({
          title: "No se puede eliminar",
          message:
            "Esta sección tiene entradas. Muévelas o elimínalas antes de borrar la sección.",
          confirmLabel: "Entendido",
          destructive: false,
        });
      }
    }
  }

  async function reorderSections(ids: string[]) {
    await api.reorderSections(ids);
    setSections((prev) => {
      const byId = new Map(prev.map((s) => [s.id, s]));
      return ids
        .map((id, index) => {
          const sec = byId.get(id);
          return sec ? { ...sec, sort_order: index } : null;
        })
        .filter((s): s is BlogSection => s !== null);
    });
  }

  return (
    <AppShell
      title="Blog"
      subtitle={`${sections.length} secciones · arrastra para ordenar`}
      action={
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="app-btn-primary !min-h-9 !px-3 !py-2"
        >
          <Plus size={18} />
        </button>
      }
    >
      {showForm ? (
        <form onSubmit={createSection} className="app-card mb-4 space-y-3">
          <h2 className="font-semibold">Nueva sección</h2>
          <input
            className="app-input"
            placeholder="Título (ES)"
            value={titleES}
            onChange={(e) => setTitleES(e.target.value)}
            required
          />
          <input
            className="app-input"
            placeholder="Título (EN)"
            value={titleEN}
            onChange={(e) => setTitleEN(e.target.value)}
          />
          <input
            className="app-input"
            placeholder="Subtítulo (ES)"
            value={subtitleES}
            onChange={(e) => setSubtitleES(e.target.value)}
          />
          <input
            className="app-input"
            placeholder="Subtítulo (EN)"
            value={subtitleEN}
            onChange={(e) => setSubtitleEN(e.target.value)}
          />
          <select
            className="app-input"
            value={layout}
            onChange={(e) => setLayout(e.target.value)}
          >
            <option value="grid">Noticias (tarjetas)</option>
            <option value="newsletter">Newsletter (portadas PDF)</option>
          </select>
          <div className="flex gap-2">
            <button type="submit" className="app-btn-primary flex-1">
              Crear
            </button>
            <button
              type="button"
              className="app-btn-ghost"
              onClick={() => setShowForm(false)}
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : null}

      {loading ? (
        <div className="py-12 text-center text-[var(--app-muted)]">
          Cargando…
        </div>
      ) : sections.length === 0 ? (
        <div className="app-card text-center">
          <p className="text-[var(--app-muted)]">Sin secciones aún</p>
        </div>
      ) : (
        <SortableList
          items={sections}
          getId={(sec) => sec.id}
          onReorder={reorderSections}
          renderItem={(sec, { dragHandle }) => (
            <div className="app-card flex items-center gap-1 !p-0 lg:active:scale-100">
              {dragHandle}
              <Link
                href={`/blog/section/${sec.id}`}
                className="flex flex-1 items-center gap-3 p-4 pl-0"
              >
                <div className="flex-1">
                  <p className="font-semibold">{sec.title_es}</p>
                  <p className="text-xs text-[var(--app-muted)]">
                    {countArticlesBySlug(sec.posts)} artículo
                    {(countArticlesBySlug(sec.posts) !== 1 ? "s" : "")} ·{" "}
                    {sec.slug} ·{" "}
                    {sec.layout === "newsletter" ? "Newsletter" : "Noticias"}
                  </p>
                </div>
                <ChevronRight size={18} className="text-[var(--app-muted)]" />
              </Link>
              <button
                type="button"
                onClick={() => removeSection(sec.id)}
                className="mr-3 rounded-lg p-2 text-red-400 active:bg-red-500/10"
                aria-label="Eliminar sección"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        />
      )}
    </AppShell>
  );
}
