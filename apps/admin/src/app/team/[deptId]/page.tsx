"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Camera, Plus, Trash2, User } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { api } from "@/lib/api";
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
  const [uploading, setUploading] = useState<string | null>(null);

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

  async function addMember(e: FormEvent) {
    e.preventDefault();
    await api.createMember(deptId, { name, role_es: roleES, role_en: roleEN });
    setName("");
    setRoleES("");
    setRoleEN("");
    setShowForm(false);
    load();
  }

  async function removeMember(id: string) {
    if (!confirm("¿Eliminar miembro?")) return;
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

  return (
    <AppShell
      title={department?.title_es ?? "Departamento"}
      subtitle="Miembros del equipo"
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
          <button type="submit" className="app-btn-primary w-full">
            Añadir
          </button>
        </form>
      ) : null}

      <ul className="space-y-3">
        {members.map((m) => (
          <li key={m.id} className="app-card flex gap-3">
            <label className="relative shrink-0 cursor-pointer">
              {m.image_path ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/${m.image_path}`}
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
            <div className="min-w-0 flex-1">
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
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
