"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

/** Visual intent of a toast. */
export type ToastVariant = "success" | "error" | "info";

/** Options accepted when creating a toast. */
export interface ToastOptions {
  /**
   * Auto-dismiss duration in milliseconds. Pass `0` to disable auto-dismiss
   * (caller will dismiss explicitly via the returned id). Default: 4500ms
   * for success/info, 6500ms for errors (errors deserve more reading time).
   */
  readonly durationMs?: number;
}

interface Toast {
  readonly id: string;
  readonly variant: ToastVariant;
  readonly message: string;
  readonly durationMs: number;
}

interface ToastApi {
  /** Show a success toast. Returns the toast id. */
  success(message: string, options?: ToastOptions): string;
  /** Show an error toast. */
  error(message: string, options?: ToastOptions): string;
  /** Show an info toast. */
  info(message: string, options?: ToastOptions): string;
  /** Dismiss a toast by id. No-op if the id is unknown. */
  dismiss(id: string): void;
}

const ToastContext = createContext<ToastApi | null>(null);

const DEFAULT_DURATION_MS: Record<ToastVariant, number> = {
  success: 4500,
  info: 4500,
  error: 6500,
};

/**
 * Stable id generator. We deliberately avoid `crypto.randomUUID()` here —
 * toast ids never leave the client, uniqueness within a short-lived session
 * is all that's needed, and a cheap counter keeps the tests deterministic.
 */
function createIdGenerator(): () => string {
  let counter = 0;
  return () => {
    counter += 1;
    return `toast-${counter}-${Date.now().toString(36)}`;
  };
}

/**
 * Provider for the toast system. Wrap the admin layout in this and every
 * descendant can call `useToast()` to surface feedback.
 */
export function ToastProvider({
  children,
}: {
  readonly children: React.ReactNode;
}): React.ReactElement {
  const [toasts, setToasts] = useState<ReadonlyArray<Toast>>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  const genIdRef = useRef<() => string>(createIdGenerator());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (variant: ToastVariant, message: string, options?: ToastOptions): string => {
      const id = genIdRef.current();
      const durationMs =
        options?.durationMs ?? DEFAULT_DURATION_MS[variant];
      const toast: Toast = { id, variant, message, durationMs };
      setToasts((prev) => [...prev, toast]);

      if (durationMs > 0) {
        const timer = setTimeout(() => {
          dismiss(id);
        }, durationMs);
        timersRef.current.set(id, timer);
      }
      return id;
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (message, options) => push("success", message, options),
      error: (message, options) => push("error", message, options),
      info: (message, options) => push("info", message, options),
      dismiss,
    }),
    [push, dismiss],
  );

  // Clear all timers on unmount to avoid setState on unmounted component.
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const timer of timers.values()) {
        clearTimeout(timer);
      }
      timers.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

/**
 * Hook: returns the toast API. Must be used inside a `<ToastProvider>`.
 * Throws a helpful error if called outside the provider so bugs surface
 * immediately rather than silently no-op'ing.
 */
export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) {
    throw new Error(
      "useToast() must be called within a <ToastProvider>. " +
        "Wrap the admin layout with <ToastProvider>.",
    );
  }
  return api;
}

// ---------------------------------------------------------------------------
// Viewport — renders the stack of visible toasts in a top-right portal.
// ---------------------------------------------------------------------------

const VARIANT_CLASSES: Record<ToastVariant, string> = {
  success:
    "border-admin-success/40 bg-[color:var(--color-surface-2)] text-admin-text-primary",
  error:
    "border-admin-danger/40 bg-[color:var(--color-surface-2)] text-admin-text-primary",
  info:
    "border-border-dark bg-[color:var(--color-surface-2)] text-admin-text-primary",
};

const VARIANT_ICON_CLASSES: Record<ToastVariant, string> = {
  success: "text-admin-success",
  error: "text-admin-danger",
  info: "text-admin-text-secondary",
};

function ToastViewport({
  toasts,
  onDismiss,
}: {
  readonly toasts: ReadonlyArray<Toast>;
  readonly onDismiss: (id: string) => void;
}): React.ReactElement | null {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed right-4 top-4 z-[60] flex w-full max-w-sm flex-col gap-2"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>,
    document.body,
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  readonly toast: Toast;
  readonly onDismiss: (id: string) => void;
}): React.ReactElement {
  const role = toast.variant === "error" ? "alert" : "status";
  return (
    <div
      data-toast-id={toast.id}
      role={role}
      className={`pointer-events-auto flex items-start gap-3 rounded-lg border p-3 pr-2 shadow-lg shadow-black/20 backdrop-blur animate-toast-in ${VARIANT_CLASSES[toast.variant]}`}
    >
      <ToastIcon variant={toast.variant} />
      <p className="flex-1 pt-0.5 text-sm leading-snug">{toast.message}</p>
      <button
        type="button"
        aria-label="Close"
        onClick={() => onDismiss(toast.id)}
        className="rounded p-1 text-admin-text-secondary transition-colors hover:bg-admin-hover hover:text-admin-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
      >
        <svg
          className="h-3.5 w-3.5"
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 6l12 12M6 18L18 6"
          />
        </svg>
      </button>
    </div>
  );
}

function ToastIcon({ variant }: { readonly variant: ToastVariant }): React.ReactElement {
  const cls = `mt-0.5 h-4 w-4 shrink-0 ${VARIANT_ICON_CLASSES[variant]}`;
  if (variant === "success") {
    return (
      <svg className={cls} aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M5 13l4 4L19 7" />
      </svg>
    );
  }
  if (variant === "error") {
    return (
      <svg className={cls} aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    );
  }
  return (
    <svg className={cls} aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
