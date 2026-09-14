"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, Save, Trash2, User, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useConfirm } from "@/components/ConfirmProvider";
import { api } from "@/lib/api";
import { mediaUrl } from "@/lib/blocks";
import type { Department, TeamMember } from "@/lib/types";

export default function EditMemberPage({
  params,
}: {
  params: Promise<{ deptId: string; memberId: string }>;
}) {
  const router = useRouter();
  const [deptId, setDeptId] = useState("");
  const [memberId, setMemberId] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [member, setMember] = useState<TeamMember | null>(null);
  const [name, setName] = useState("");
  const [roleES, setRoleES] = useState("");
  const [roleEN, setRoleEN] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);
  const confirm = useConfirm();

  useEffect(() => {
    params.then((p) => {
      setDeptId(p.deptId);
      setMemberId(p.memberId);
    });
  }, [params]);

  const load = useCallback(async () => {
    if (!memberId) return;
    const deps = await api.listDepartments();
    setDepartments(deps);
    const found = deps
      .flatMap((d) => d.members ?? [])
      .find((m) => m.id === memberId);
    if (!found) {
      setMember(null);
      return;
    }
    setMember(found);
    setName(found.name);
    setRoleES(found.role_es);
    setRoleEN(found.role_en);
    setDepartmentId(found.department_id);
    setPhotoPreview(null);
  }, [memberId]);

  useEffect(() => {
    load();
  }, [load]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!member) return;
    setSaving(true);
    try {
      const updated = await api.updateMember(member.id, {
        name,
        role_es: roleES,
        role_en: roleEN,
        department_id: departmentId,
      });
      setMember(updated);
      if (departmentId !== deptId) {
        router.replace(`/team/${departmentId}/${member.id}`);
      }
    } finally {
      setSaving(false);
    }
  }

  async function onPhoto(file: File | undefined) {
    if (!member || !file) return;
    setUploading(true);
    try {
      const updated = await api.uploadMemberPhoto(member.id, file);
      setMember(updated);
      setPhotoPreview(URL.createObjectURL(file));
    } finally {
      setUploading(false);
    }
  }

  async function removePhoto() {
    if (!member?.image_path) return;
    setUploading(true);
    try {
      const updated = await api.removeMemberPhoto(member.id);
      setMember(updated);
      setPhotoPreview(null);
      if (photoRef.current) photoRef.current.value = "";
    } finally {
      setUploading(false);
    }
  }

  async function removeMember() {
    if (!member) return;
    const ok = await confirm({
      title: "Eliminar miembro",
      message: `¿Seguro que quieres eliminar a ${member.name}? Esta acción no se puede deshacer.`,
      confirmLabel: "Eliminar",
    });
    if (!ok) return;
    await api.deleteMember(member.id);
    router.replace(`/team/${deptId}`);
  }

  if (!member) {
    return (
      <div className="app-shell items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--app-accent)] border-t-transparent" />
      </div>
    );
  }

  const imageSrc = photoPreview ?? (member.image_path ? mediaUrl(member.image_path) : null);

  return (
    <AppShell
      title="Editar miembro"
      subtitle={member.name}
      action={
        <Link href={`/team/${deptId}`} className="app-btn-ghost !min-h-9 !px-3">
          <ArrowLeft size={18} />
        </Link>
      }
    >
      <form
        onSubmit={onSubmit}
        className="mx-auto max-w-lg space-y-4"
      >
        <div className="app-card flex items-center gap-4">
          <label className="relative shrink-0 cursor-pointer">
            {imageSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageSrc}
                alt={member.name}
                className="h-24 w-24 rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-xl border border-dashed border-[var(--app-border)] bg-[var(--app-surface-2)] text-[var(--app-muted)]">
                <User size={32} />
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--app-accent)] text-white shadow">
              {uploading ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Camera size={15} />
              )}
            </span>
            <input
              ref={photoRef}
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => onPhoto(e.target.files?.[0])}
            />
          </label>
          <div className="min-w-0 flex-1 text-sm text-[var(--app-muted)]">
            <p className="font-medium text-[var(--app-fg)]">Foto de perfil</p>
            <p>JPG, PNG o WebP.</p>
            {member.image_path || photoPreview ? (
              <button
                type="button"
                onClick={removePhoto}
                disabled={uploading}
                className="mt-2 inline-flex items-center gap-1 text-red-400"
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
        <label className="block space-y-1">
          <span className="text-xs font-medium text-[var(--app-muted)]">
            Departamento
          </span>
          <select
            className="app-input w-full"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
          >
            {departments.map((dep) => (
              <option key={dep.id} value={dep.id}>
                {dep.title_es}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="app-btn-primary min-h-11 flex-1 disabled:opacity-60"
          >
            <Save size={18} />
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
          <button
            type="button"
            onClick={removeMember}
            className="app-btn-ghost min-h-11 text-red-400"
          >
            <Trash2 size={18} />
            Eliminar
          </button>
        </div>
      </form>
    </AppShell>
  );
}
