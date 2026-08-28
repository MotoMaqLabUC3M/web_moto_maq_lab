"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { api } from "@/lib/api";
import type { Department } from "@/lib/types";

export default function TeamPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [titleES, setTitleES] = useState("");
  const [titleEN, setTitleEN] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setDepartments(await api.listDepartments());
    } catch {
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createDepartment(e: FormEvent) {
    e.preventDefault();
    await api.createDepartment({ title_es: titleES, title_en: titleEN });
    setTitleES("");
    setTitleEN("");
    setShowForm(false);
    load();
  }

  async function removeDepartment(id: string) {
    if (!confirm("¿Eliminar departamento y todos sus miembros?")) return;
    await api.deleteDepartment(id);
    load();
  }

  return (
    <AppShell
      title="Equipo"
      subtitle={`${departments?.length ?? 0} departamentos`}
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
        <form onSubmit={createDepartment} className="app-card mb-4 space-y-3">
          <h2 className="font-semibold">Nuevo departamento</h2>
          <input
            className="app-input"
            placeholder="Nombre (ES)"
            value={titleES}
            onChange={(e) => setTitleES(e.target.value)}
            required
          />
          <input
            className="app-input"
            placeholder="Nombre (EN)"
            value={titleEN}
            onChange={(e) => setTitleEN(e.target.value)}
          />
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
      ) : (
        <ul className="content-grid lg:grid-cols-1 xl:grid-cols-2">
          {departments.map((dep) => (
            <li key={dep.id} className="app-card flex items-center gap-3 !p-0">
              <Link
                href={`/team/${dep.id}`}
                className="flex flex-1 items-center gap-3 p-4"
              >
                <div className="flex-1">
                  <p className="font-semibold">{dep.title_es}</p>
                  <p className="text-xs text-[var(--app-muted)]">
                    {dep.members?.length ?? 0} miembros · {dep.slug}
                  </p>
                </div>
                <ChevronRight size={18} className="text-[var(--app-muted)]" />
              </Link>
              <button
                type="button"
                onClick={() => removeDepartment(dep.id)}
                className="mr-3 rounded-lg p-2 text-red-400 active:bg-red-500/10"
                aria-label="Eliminar departamento"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
