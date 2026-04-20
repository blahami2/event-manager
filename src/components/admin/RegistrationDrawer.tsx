"use client";

import { useCallback, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { createPortal } from "react-dom";
import { RegistrationStatus } from "@/types/registration";
import type { RegistrationOutput } from "@/types/registration";
import {
  accommodationLabel,
  stayLabel,
  statusLabel,
} from "@/i18n/labels";
import { Badge, Button } from "@/components/ui/admin";

export interface RegistrationDrawerProps {
  /** The registration to display. When `null`, the drawer renders nothing. */
  readonly registration: RegistrationOutput | null;
  readonly onClose: () => void;
  readonly onEdit: (registration: RegistrationOutput) => void;
  readonly onCancel: (registrationId: string) => void;
  readonly onResendEmail: (registrationId: string) => void;
}

function formatDateTime(date: Date): string {
  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Side-drawer detail view for a registration. Slides in from the right.
 *
 * Closed via Escape, clicking the backdrop, or the explicit close button.
 * Renders the full record, timestamps, and all three actions (Edit,
 * Cancel, Resend) for the common review flow.
 */
export function RegistrationDrawer({
  registration,
  onClose,
  onEdit,
  onCancel,
  onResendEmail,
}: RegistrationDrawerProps): React.ReactElement | null {
  const t = useTranslations("admin.registrations");
  const tTable = useTranslations("admin.registrations.table");
  const tEnums = useTranslations();
  const panelRef = useRef<HTMLDivElement | null>(null);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!registration) return;
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    },
    [registration, onClose],
  );

  useEffect(() => {
    if (!registration) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [registration, handleKeyDown]);

  if (!registration) return null;
  if (typeof document === "undefined") return null;

  const isCancelled = registration.status === RegistrationStatus.CANCELLED;

  const tree = (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-backdrop-in"
      onClick={onClose}
    >
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={t("drawerTitle")}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-md flex-col border-l border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] shadow-[var(--shadow-lg)]"
        style={{ animation: "admin-modal-in var(--motion-base) var(--ease-emphasized) both" }}
      >
        {/* Header */}
        <header className="flex items-start justify-between gap-3 border-b border-[color:var(--color-border)] px-6 py-5">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[color:var(--color-text-tertiary)]">
              {t("drawerTitle")}
            </p>
            <h2 className="mt-1 truncate text-lg font-semibold tracking-tight text-[color:var(--color-text-primary)]">
              {registration.name}
            </h2>
            <p className="truncate text-sm text-[color:var(--color-text-secondary)]">
              {registration.email}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("drawerClose")}
            className="rounded-md p-1.5 text-[color:var(--color-text-secondary)] transition-colors hover:bg-[color:var(--color-surface-3)] hover:text-[color:var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)]/60"
          >
            <svg className="h-4 w-4" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>
        </header>

        {/* Body (scrollable) */}
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          <div>
            <Badge
              variant={
                registration.status === RegistrationStatus.CONFIRMED
                  ? "success"
                  : "danger"
              }
            >
              {statusLabel(registration.status, tEnums)}
            </Badge>
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
            <DetailField label={tTable("stay")}>
              {stayLabel(registration.stay, tEnums)}
            </DetailField>
            <DetailField label={tTable("accommodation")}>
              {accommodationLabel(registration.accommodation, tEnums)}
            </DetailField>
            <DetailField label={tTable("adults")}>
              <span className="tabular-nums">{registration.adultsCount}</span>
            </DetailField>
            <DetailField label={tTable("children")}>
              <span className="tabular-nums">{registration.childrenCount}</span>
            </DetailField>
          </dl>

          {registration.notes ? (
            <div>
              <dt className="text-[10px] font-medium uppercase tracking-[0.14em] text-[color:var(--color-text-tertiary)]">
                {tTable("notes")}
              </dt>
              <dd className="mt-1.5 whitespace-pre-wrap break-words rounded-[var(--radius-md)] bg-[color:var(--color-surface-2)] p-3 text-sm text-[color:var(--color-text-primary)]">
                {registration.notes}
              </dd>
            </div>
          ) : null}

          <dl className="space-y-2 border-t border-[color:var(--color-border)] pt-4 text-xs">
            <MetaRow label={t("drawerCreated")} value={formatDateTime(registration.createdAt)} />
            <MetaRow label={t("drawerUpdated")} value={formatDateTime(registration.updatedAt)} />
            <MetaRow label={t("drawerId")} value={registration.id} mono />
          </dl>
        </div>

        {/* Footer actions */}
        <footer className="flex items-center justify-end gap-2 border-t border-[color:var(--color-border)] px-6 py-4">
          <Button variant="secondary" onClick={() => onEdit(registration)}>
            {tTable("edit")}
          </Button>
          {!isCancelled ? (
            <>
              <Button
                variant="ghost"
                onClick={() => onResendEmail(registration.id)}
              >
                {tTable("resendEmail")}
              </Button>
              <Button
                variant="danger"
                onClick={() => onCancel(registration.id)}
              >
                {tTable("cancel")}
              </Button>
            </>
          ) : null}
        </footer>
      </aside>
    </div>
  );

  return createPortal(tree, document.body);
}

function DetailField({
  label,
  children,
}: {
  readonly label: string;
  readonly children: React.ReactNode;
}): React.ReactElement {
  return (
    <div>
      <dt className="text-[10px] font-medium uppercase tracking-[0.14em] text-[color:var(--color-text-tertiary)]">
        {label}
      </dt>
      <dd className="mt-0.5 text-[color:var(--color-text-primary)]">{children}</dd>
    </div>
  );
}

function MetaRow({
  label,
  value,
  mono = false,
}: {
  readonly label: string;
  readonly value: string;
  readonly mono?: boolean;
}): React.ReactElement {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-[color:var(--color-text-tertiary)]">{label}</dt>
      <dd
        className={[
          "text-right text-[color:var(--color-text-secondary)]",
          mono && "font-mono",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {value}
      </dd>
    </div>
  );
}
