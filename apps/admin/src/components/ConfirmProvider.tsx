"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { AlertTriangle } from "lucide-react";

export type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

type PendingConfirm = ConfirmOptions & {
  resolve: (value: boolean) => void;
};

type ConfirmContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

function ConfirmModal({
  pending,
  onConfirm,
  onCancel,
}: {
  pending: PendingConfirm;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  return (
    <div
      className="confirm-backdrop fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center"
      role="presentation"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        className="confirm-dialog w-full max-w-md animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
            <AlertTriangle size={22} strokeWidth={2.25} />
          </div>
          <div className="min-w-0 pt-0.5">
            <h2 id="confirm-title" className="text-lg font-semibold">
              {pending.title}
            </h2>
            <p
              id="confirm-message"
              className="mt-1 text-sm leading-relaxed text-[var(--app-muted)]"
            >
              {pending.message}
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="app-btn-ghost w-full sm:w-auto"
          >
            {pending.cancelLabel ?? "Cancelar"}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={
              pending.destructive === false
                ? "app-btn-primary w-full sm:w-auto"
                : "app-btn-danger w-full sm:w-auto"
            }
          >
            {pending.confirmLabel ?? "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setPending({ ...options, resolve });
    });
  }, []);

  function close(result: boolean) {
    pending?.resolve(result);
    setPending(null);
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {mounted && pending
        ? createPortal(
            <ConfirmModal
              pending={pending}
              onConfirm={() => close(true)}
              onCancel={() => close(false)}
            />,
            document.body,
          )
        : null}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm debe usarse dentro de ConfirmProvider");
  }
  return ctx.confirm;
}
