"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, User, X } from "lucide-react";
import { api } from "@/lib/api";
import { mediaUrl } from "@/lib/blocks";
import type { BlogSection, Department, TeamMember } from "@/lib/types";

const TEAM_AUTHOR = "MOTO-MAQLAB-UC3M";

type AuthorOption =
  | { kind: "team" }
  | { kind: "member"; member: TeamMember; department: string }
  | { kind: "custom" };

type Props = {
  author: string;
  onAuthorChange: (author: string) => void;
  category: string;
  onCategoryChange: (category: string) => void;
  date: string;
  onDateChange: (date: string) => void;
  sectionId: string;
  onSectionChange: (sectionId: string) => void;
  sections: BlogSection[];
  locale?: string;
  coverImage?: string;
  coverPreviewUrl?: string | null;
  onCoverSelect?: (file: File | null) => void;
  coverUploading?: boolean;
  canUploadCover?: boolean;
};

function findAuthorOption(
  author: string,
  members: Array<TeamMember & { department: string }>,
): AuthorOption {
  if (!author || author === TEAM_AUTHOR) return { kind: "team" };
  const member = members.find(
    (m) => m.name.toLowerCase() === author.toLowerCase(),
  );
  if (member) return { kind: "member", member, department: member.department };
  return { kind: "custom" };
}

export function BlogPostMetaFields({
  author,
  onAuthorChange,
  category,
  onCategoryChange,
  date,
  onDateChange,
  sectionId,
  onSectionChange,
  sections,
  locale = "es",
  coverImage,
  coverPreviewUrl,
  onCoverSelect,
  coverUploading = false,
  canUploadCover = true,
}: Props) {
  const coverRef = useRef<HTMLInputElement>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [authorKey, setAuthorKey] = useState("team");
  const [customAuthor, setCustomAuthor] = useState("");

  const members = useMemo(
    () =>
      departments.flatMap((dep) =>
        (dep.members ?? []).map((member) => ({
          ...member,
          department: dep.title_es,
        })),
      ),
    [departments],
  );

  useEffect(() => {
    api.listDepartments().then(setDepartments).catch(() => setDepartments([]));
    api
      .listPosts()
      .then((posts) => {
        const unique = [
          ...new Set(
            posts.map((p) => p.category?.trim()).filter(Boolean) as string[],
          ),
        ].sort((a, b) => a.localeCompare(b, "es"));
        setCategories(unique);
      })
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    const option = findAuthorOption(author, members);
    if (option.kind === "team") {
      setAuthorKey("team");
      setCustomAuthor("");
    } else if (option.kind === "member") {
      setAuthorKey(option.member.id);
      setCustomAuthor("");
    } else {
      setAuthorKey("custom");
      setCustomAuthor(author);
    }
  }, [author, members]);

  const selectedMember =
    authorKey !== "team" && authorKey !== "custom"
      ? members.find((m) => m.id === authorKey)
      : null;

  const coverSrc =
    coverPreviewUrl ?? (coverImage ? mediaUrl(coverImage) : null);

  function onAuthorSelect(value: string) {
    setAuthorKey(value);
    if (value === "team") {
      onAuthorChange(TEAM_AUTHOR);
      return;
    }
    if (value === "custom") {
      onAuthorChange(customAuthor);
      return;
    }
    const member = members.find((m) => m.id === value);
    if (member) onAuthorChange(member.name);
  }

  return (
    <div className="space-y-4">
      {canUploadCover && onCoverSelect ? (
        <div className="app-card space-y-3">
          <p className="text-sm font-semibold">Portada</p>
          <div className="flex items-start gap-4">
            <label className="relative shrink-0 cursor-pointer">
              {coverSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coverSrc}
                  alt="Portada"
                  className="h-28 w-44 rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-28 w-44 items-center justify-center rounded-xl border border-dashed border-[var(--app-border)] bg-[var(--app-surface-2)] text-[var(--app-muted)]">
                  <Camera size={28} />
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--app-accent)] text-white shadow">
                {coverUploading ? (
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Camera size={14} />
                )}
              </span>
              <input
                ref={coverRef}
                type="file"
                accept="image/*"
                className="hidden"
                disabled={coverUploading}
                onChange={(e) => onCoverSelect(e.target.files?.[0] ?? null)}
              />
            </label>
            <div className="min-w-0 flex-1 text-sm text-[var(--app-muted)]">
              <p className="font-medium text-[var(--app-fg)]">
                Imagen de portada
              </p>
              <p>
                Se muestra en la tarjeta del blog y en el hero del artículo. JPG,
                PNG o WebP.
              </p>
              {coverSrc ? (
                <button
                  type="button"
                  className="mt-2 inline-flex items-center gap-1 text-red-400"
                  onClick={() => {
                    onCoverSelect(null);
                    if (coverRef.current) coverRef.current.value = "";
                  }}
                >
                  <X size={14} /> Quitar
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <div className="app-card space-y-3">
        <p className="text-sm font-semibold">Autor</p>
        <select
          className="app-input"
          value={authorKey}
          onChange={(e) => onAuthorSelect(e.target.value)}
        >
          <option value="team">{TEAM_AUTHOR} (equipo)</option>
          {departments.map((dep) => (
            <optgroup key={dep.id} label={dep.title_es}>
              {(dep.members ?? []).map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} — {member.role_es}
                </option>
              ))}
            </optgroup>
          ))}
          <option value="custom">Otro autor…</option>
        </select>

        {authorKey === "custom" ? (
          <input
            className="app-input"
            placeholder="Nombre del autor"
            value={customAuthor}
            onChange={(e) => {
              setCustomAuthor(e.target.value);
              onAuthorChange(e.target.value);
            }}
          />
        ) : null}

        {selectedMember ? (
          <div className="flex items-center gap-3 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-2)] p-3">
            {selectedMember.image_path ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mediaUrl(selectedMember.image_path)}
                alt={selectedMember.name}
                className="h-14 w-14 rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--app-surface)] text-[var(--app-muted)]">
                <User size={22} />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold">{selectedMember.name}</p>
              <p className="text-sm text-[var(--app-muted)]">
                {locale === "en"
                  ? selectedMember.role_en || selectedMember.role_es
                  : selectedMember.role_es}
              </p>
              <p className="text-xs text-[var(--app-muted)]">
                {selectedMember.department}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-xs font-medium text-[var(--app-muted)]">
            Categoría
          </span>
          <input
            className="app-input"
            list="blog-category-suggestions"
            placeholder="Formación, Competición…"
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
          />
          <datalist id="blog-category-suggestions">
            {categories.map((cat) => (
              <option key={cat} value={cat} />
            ))}
          </datalist>
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-medium text-[var(--app-muted)]">
            Fecha
          </span>
          <input
            type="date"
            className="app-input"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
          />
        </label>
      </div>

      <label className="block space-y-1">
        <span className="text-xs font-medium text-[var(--app-muted)]">
          Sección
        </span>
        <select
          className="app-input w-full"
          value={sectionId}
          onChange={(e) => onSectionChange(e.target.value)}
          required
        >
          <option value="" disabled>
            Elige sección
          </option>
          {sections.map((sec) => (
            <option key={sec.id} value={sec.id}>
              {sec.title_es}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
