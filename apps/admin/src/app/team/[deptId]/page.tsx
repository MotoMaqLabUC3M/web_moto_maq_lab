"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Camera, Plus, Trash2, User, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useConfirm } from "@/components/ConfirmProvider";
import { SortableList } from "@/components/SortableList";
import { api } from "@/lib/api";
import { mediaUrl } from "@/lib/blocks";
import type { Department, TeamMember } from "@/lib/types";

export default function DepartmentPage({
  params,
}: {
  params: Promise<{ deptId: string }>;
}) {
  const [deptId, setDeptId] = useState("");
  const [department, setDepartment] = useState<Department | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [roleES, setRoleES] = useState("");
  const [roleEN, setRoleEN] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const createPhotoRef = useRef<HTMLInputElement>(null);
  const confirm = useConfirm();

  useEffect(() => {
    params.then((p) => setDeptId(p.deptId));
  }, [params]);

  const load = useCallback(async () => {
    if (!deptId) return;
    const deps = await api.listDepartments();
    const dep = deps.find((d) => d.id === deptId) ?? null;
    setDepartment(dep);
    setMembers(dep?.members ?? []);
  }, [deptId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!photo) {
      setPhotoPreview(null);
      return;
    }
    const url = URL.createObjectURL(photo);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  function clearPhoto() {
    setPhoto(null);
    if (createPhotoRef.current) createPhotoRef.current.value = "";
  }

  function resetForm() {
    setName("");
    setRoleES("");
    setRoleEN("");
    clearPhoto();
    setShowForm(false);
  }

  async function addMember(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const member = await api.createMember(deptId, {
        name,
        role_es: roleES,
        role_en: roleEN,
        sort_order: members.length,
      });
      if (photo) {
        await api.uploadMemberPhoto(member.id, photo);
      }
      resetForm();
      load();
    } finally {
      setSaving(false);
    }
  }

  async function removeMember(id: string) {
    const member = members.find((m) => m.id === id);
    const ok = await confirm({
      title: "Eliminar miembro",
      message: member
        ? `¿Seguro que quieres eliminar a ${member.name}? Esta acción no se puede deshacer.`
        : "¿Seguro que quieres eliminar este miembro? Esta acción no se puede deshacer.",
      confirmLabel: "Eliminar",
    });
    if (!ok) return;
    await api.deleteMember(id);
    load();
  }

  async function onPhoto(memberId: string, file: File | undefined) {
    if (!file) return;
    setUploading(memberId);
    try {
      await api.uploadMemberPhoto(memberId, file);
      load();
    } finally {
      setUploading(null);
    }
  }

  async function reorderMembers(ids: string[]) {
    await api.reorderMembers(deptId, ids);
    setMembers((prev) => {
      const byId = new Map(prev.map((m) => [m.id, m]));
      return ids
        .map((id, index) => {
          const member = byId.get(id);
          return member ? { ...member, sort_order: index } : null;
        })
        .filter((m): m is TeamMember => m !== null);
    });
  }

  return (
    <AppShell
      title={department?.title_es ?? "Departamento"}
      subtitle="Arrastra para ordenar los miembros"
      action={
        <Link href="/team" className="app-btn-ghost !min-h-9 !px-3">
          <ArrowLeft size={18} />
        </Link>
      }
    >
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="app-btn-primary"
        >
          <Plus size={18} /> Miembro
        </button>
      </div>

      {showForm ? (
        <form onSubmit={addMember} className="app-card mb-4 space-y-3">
          <div className="flex items-center gap-4">
            <label className="relative shrink-0 cursor-pointer">
              {photoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoPreview}
                  alt="Vista previa"
                  className="h-20 w-20 rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-dashed border-[var(--app-border)] bg-[var(--app-surface-2)] text-[var(--app-muted)]">
                  <User size={28} />
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--app-accent)] text-white shadow">
                <Camera size={14} />
              </span>
              <input
                ref={createPhotoRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
              />
            </label>
            <div className="min-w-0 flex-1 text-sm text-[var(--app-muted)]">
              <p className="font-medium text-[var(--app-fg)]">Foto de perfil</p>
              <p>Opcional. JPG, PNG o WebP.</p>
              {photo ? (
                <button
                  type="button"
                  onClick={clearPhoto}
                  className="mt-1 inline-flex items-center gap-1 text-red-400"
                >
                  <X size={14} /> Quitar foto
                </button>
              ) : null}
            </div>
          </div>
          <input
            className="app-input"
            placeholder="Nombre completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            className="app-input"
            placeholder="Rol (ES)"
            value={roleES}
            onChange={(e) => setRoleES(e.target.value)}
            required
          />
          <input
            className="app-input"
            placeholder="Rol (EN)"
            value={roleEN}
            onChange={(e) => setRoleEN(e.target.value)}
          />
          <button
            type="submit"
            className="app-btn-primary w-full"
            disabled={saving}
          >
            {saving ? "Guardando…" : "Añadir miembro"}
          </button>
        </form>
      ) : null}

      {members.length === 0 ? (
        <div className="py-12 text-center text-[var(--app-muted)]">
          No hay miembros en este departamento.
        </div>
      ) : (
        <SortableList
          items={members}
          getId={(m) => m.id}
          onReorder={reorderMembers}
          renderItem={(m, { dragHandle }) => (
            <div className="app-card flex gap-2 !p-3 lg:active:scale-100">
              {dragHandle}
              <label className="relative shrink-0 cursor-pointer">
                {m.image_path ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mediaUrl(m.image_path)}
                    alt={m.name}
                    className="h-16 w-16 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[var(--app-surface-2)] text-[var(--app-muted)]">
                    <User size={24} />
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--app-accent)] text-white shadow">
                  {uploading === m.id ? (
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Camera size={14} />
                  )}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onPhoto(m.id, e.target.files?.[0])}
                />
              </label>
              <div className="min-w-0 flex-1 self-center">
                <p className="truncate font-semibold">{m.name}</p>
                <p className="text-sm text-[var(--app-muted)]">{m.role_es}</p>
              </div>
              <button
                type="button"
                onClick={() => removeMember(m.id)}
                className="self-start rounded-lg p-2 text-red-400"
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
