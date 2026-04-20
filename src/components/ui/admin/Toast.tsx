"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";

/**
 * Returns `false` on the server and during the very first client render,
 * then `true` once hydration has completed. Avoids the "setState in effect"
 * lint warning while still deferring portal rendering to post-hydration.
 */
function useIsMounted(): boolean {
  return useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
}

export type ToastVariant = "success" | "error" | "info";

interface Toast {
  readonly id: string;
  readonly variant: ToastVariant;
  readonly message: string;
}

interface ToastContextValue {
  readonly success: (message: string) => void;
  readonly error: (message: string) => void;
  readonly info: (message: string) => void;
  readonly dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);
const DEFAULT_DURATION_MS = 5000;

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `toast-${idCounter}-${Date.now()}`;
}

/**
 * Provide an imperative toast API to the admin tree. Place once near the top
 * of the admin layout (client side). Toasts render into a portal at the end
 * of <body> so they're immune to transform/overflow on ancestor nodes.
 */
export function ToastProvider({
  children,
}: {
  readonly children: React.ReactNode;
}): React.ReactElement {
  const [toasts, setToasts] = useState<ReadonlyArray<Toast>>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string): void => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (variant: ToastVariant, message: string): void => {
      const id = nextId();
      setToasts((prev) => [...prev, { id, variant, message }]);
      const timer = setTimeout(() => dismiss(id), DEFAULT_DURATION_MS);
      timersRef.current.set(id, timer);
    },
    [dismiss],
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      success: (message) => push("success", message),
      error: (message) => push("error", message),
      info: (message) => push("info", message),
      dismiss,
    }),
    [push, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast() must be called inside <ToastProvider>");
  }
  return ctx;
}

const VARIANT_ICON: Record<ToastVariant, React.ReactElement> = {
  success: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M4.93 19.07L19.07 4.93M19.07 19.07L4.93 4.93" />
    </svg>
  ),
  info: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
    </svg>
  ),
};

const VARIANT_COLORS: Record<ToastVariant, string> = {
  success: "text-success",
  error: "text-danger",
  info: "text-text-secondary",
};

function ToastViewport({
  toasts,
  onDismiss,
}: {
  readonly toasts: ReadonlyArray<Toast>;
  readonly onDismiss: (id: string) => void;
}): React.ReactElement | null {
  const mounted = useIsMounted();
  if (!mounted) return null;
  return createPortal(
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-end gap-2 px-4 sm:inset-x-auto sm:right-4"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.variant === "error" ? "alert" : "status"}
          data-variant={t.variant}
          className="pointer-events-auto admin-slide-in-right flex w-full max-w-sm items-start gap-3 rounded-lg border border-border-default bg-surface-overlay px-4 py-3 shadow-pop"
        >
          <span className={`mt-0.5 shrink-0 ${VARIANT_COLORS[t.variant]}`}>{VARIANT_ICON[t.variant]}</span>
          <p className="flex-1 text-sm text-text-primary">{t.message}</p>
          <button
            type="button"
            onClick={() => onDismiss(t.id)}
            aria-label="Dismiss"
            className="shrink-0 rounded-sm p-0.5 text-text-tertiary transition-colors duration-150 hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>,
    document.body,
  );
}
