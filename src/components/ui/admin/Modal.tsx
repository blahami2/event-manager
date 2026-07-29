"use client";

import { useCallback, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { containTabFocus, getFocusableElements } from "./focus-scope";

export interface ModalProps {
  /** Whether the modal is open. When false, nothing renders. */
  readonly open: boolean;
  /** Invoked when the user requests to close (backdrop, Escape, close X). */
  readonly onClose: () => void;
  /** Accessible title rendered in the header and referenced by `aria-labelledby`. */
  readonly title: string;
  /** Optional string for the aria-describedby (rendered in a sr-only node). */
  readonly description?: string;
  /** Additional className applied to the dialog panel. */
  readonly className?: string;
  readonly children: React.ReactNode;
  /** Size of the modal panel. Defaults to `md`. */
  readonly size?: "sm" | "md" | "lg";
  /**
   * If `true`, the Escape key is ignored. Useful for destructive flows that
   * want to force a deliberate choice. Defaults to `false`.
   */
  readonly disableEscapeClose?: boolean;
  /**
   * If `true`, clicking the backdrop is ignored. Defaults to `false`.
   */
  readonly disableBackdropClose?: boolean;
}

const SIZE_CLASSES = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
} as const;

/**
 * Admin Modal — the single dialog primitive for admin surfaces.
 *
 * Accessibility implemented manually (not `<dialog>`) for:
 * 1. Consistent styling across browsers (Safari still drags with `<dialog>`).
 * 2. Deterministic focus trap tests without requiring browser-specific hooks.
 *
 * Contract:
 * - Escape closes (unless `disableEscapeClose`).
 * - Backdrop click closes (unless `disableBackdropClose`).
 * - First focusable element receives focus on open.
 * - Tab cycles focus within the dialog; Shift+Tab cycles backwards.
 * - On close, focus returns to the element that held focus before opening.
 * - When closed, the DOM is removed entirely (not hidden).
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  className = "",
  size = "md",
  disableEscapeClose = false,
  disableBackdropClose = false,
  children,
}: ModalProps): React.ReactElement | null {
  const t = useTranslations("common");
  const reactId = useId();
  const titleId = `${reactId}-title`;
  const descId = description ? `${reactId}-desc` : undefined;

  const panelRef = useRef<HTMLDivElement | null>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // Focus management: capture the previously focused element when the modal
  // opens, move focus inside the dialog, restore focus on close.
  //
  // Focus is moved synchronously in the effect because React has already
  // committed the DOM by this point — deferring with rAF introduces a race
  // window during which user interactions (e.g., immediate typing) can be
  // clobbered when the rAF callback later steals focus.
  useEffect(() => {
    if (!open) return;

    previousActiveElementRef.current =
      (document.activeElement as HTMLElement | null) ?? null;

    const panel = panelRef.current;
    if (panel) {
      const focusables = getFocusableElements(panel);
      const first = focusables[0];
      if (first) {
        first.focus();
      } else {
        panel.focus();
      }
    }

    return () => {
      const previous = previousActiveElementRef.current;
      if (previous && typeof previous.focus === "function") {
        previous.focus();
      }
    };
  }, [open]);

  // Keyboard: Escape closes, Tab traps within the panel.
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!open) return;
      if (event.key === "Escape" && !disableEscapeClose) {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === "Tab") {
        const panel = panelRef.current;
        if (!panel) return;
        containTabFocus(event, panel);
      }
    },
    [open, onClose, disableEscapeClose],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, handleKeyDown]);

  // Prevent body scroll while open.
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  if (!open) return null;
  if (typeof document === "undefined") return null;

  const handleBackdropClick = (): void => {
    if (disableBackdropClose) return;
    onClose();
  };

  const tree = (
    <div
      data-testid="modal-backdrop"
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md admin-fade-in"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className={[
          "w-full overflow-hidden rounded-xl",
          "border border-border-default bg-surface-raised shadow-overlay",
          "focus:outline-none admin-pop-in",
          SIZE_CLASSES[size],
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="flex items-center justify-between gap-4 border-b border-border-subtle px-6 py-4">
          <h2
            id={titleId}
            className="text-base font-semibold tracking-tight text-text-primary"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            className="rounded-md p-1.5 text-text-tertiary transition-colors duration-150 hover:bg-admin-hover hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
          >
            <svg
              className="h-4 w-4"
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
        {description ? (
          <span id={descId} className="sr-only">
            {description}
          </span>
        ) : null}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );

  return createPortal(tree, document.body);
}
