"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocale, useTranslations } from "next-intl";
import {
  accommodationLabel,
  staySummaryLabel,
  statusLabel,
} from "@/i18n/labels";
import { parseIsoDate } from "@/lib/date/iso-date";
import { RegistrationStatus } from "@/types/registration";
import type { RegistrationOutput } from "@/types/registration";
import { Badge, Button, ConfirmDialog } from "@/components/ui/admin";
import {
  containTabFocus,
  getFocusableElements,
} from "@/components/ui/admin/focus-scope";

export interface RegistrationDrawerProps {
  readonly registration: RegistrationOutput | null;
  readonly onClose: () => void;
  readonly onEdit: (registration: RegistrationOutput) => void;
  readonly onCancel: (registrationId: string) => void;
  readonly onResendEmail: (registrationId: string) => void;
  readonly onReconfirm?: (registrationId: string) => void;
  readonly resendingId?: string | null;
}

/**
 * Render a stored `YYYY-MM-DD` calendar date in the same style as the other
 * dates in this panel.
 *
 * Formatted in UTC because the value is a calendar date anchored to UTC
 * midnight — rendering it in the viewer's local zone would show the previous
 * day for anyone west of Greenwich. Falls back to the raw value if it is not
 * parseable, so bad data is visible rather than silently blank.
 */
function formatCalendarDate(isoDate: string, locale: string): string {
  const parsed = parseIsoDate(isoDate);
  if (!parsed) return isoDate;
  return parsed.toLocaleDateString(locale, {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Render an admin-set custom stay range; a single-day range collapses to one date. */
function formatDateRange(start: string, end: string, locale: string): string {
  return start === end
    ? formatCalendarDate(start, locale)
    : `${formatCalendarDate(start, locale)} – ${formatCalendarDate(end, locale)}`;
}

function formatDate(date: Date, locale: string): string {
  return new Date(date).toLocaleString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Side drawer that slides in from the right with full registration details.
 * Escape or backdrop click closes. Does not replace Edit — Edit is a separate
 * modal opened from the drawer footer, so editing flows stay isolated from
 * read-only review.
 */
export function RegistrationDrawer({
  registration,
  onClose,
  onEdit,
  onCancel,
  onResendEmail,
  onReconfirm,
  resendingId,
}: RegistrationDrawerProps): React.ReactElement | null {
  const locale = useLocale();
  const t = useTranslations("admin.registrations");
  const tTable = useTranslations("admin.registrations.table");
  const tEdit = useTranslations("admin.registrations.edit");
  const tEnums = useTranslations();
  const tCommon = useTranslations("common");
  const layerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  useEffect(() => {
    if (!registration) return;
    openerRef.current = document.activeElement as HTMLElement | null;
    const layer = layerRef.current;
    const background = Array.from(document.body.children).filter(
      (element): element is HTMLElement =>
        element instanceof HTMLElement && element !== layer,
    );
    const previousBackgroundState = background.map((element) => ({
      element,
      inert: element.hasAttribute("inert"),
      ariaHidden: element.getAttribute("aria-hidden"),
    }));
    for (const element of background) {
      element.setAttribute("inert", "");
      element.setAttribute("aria-hidden", "true");
    }

    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const panel = panelRef.current;
    const first = panel ? getFocusableElements(panel)[0] : undefined;
    (first ?? panel)?.focus();

    return () => {
      document.body.style.overflow = original;
      for (const { element, inert, ariaHidden } of previousBackgroundState) {
        if (!inert) element.removeAttribute("inert");
        if (ariaHidden === null) element.removeAttribute("aria-hidden");
        else element.setAttribute("aria-hidden", ariaHidden);
      }
      openerRef.current?.focus();
    };
  }, [registration]);

  useEffect(() => {
    if (!registration) return;
    const handleKey = (e: KeyboardEvent): void => {
      // The nested confirmation owns Escape while it is open. This mirrors
      // Modal's disableEscapeClose contract and prevents one key press from
      // dismissing two dialog layers.
      if (e.key === "Escape" && !confirmingCancel) {
        e.preventDefault();
        onClose();
      } else if (e.key === "Tab" && !confirmingCancel && panelRef.current) {
        containTabFocus(e, panelRef.current);
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
    };
  }, [registration, onClose, confirmingCancel]);

  if (!registration) return null;
  if (typeof document === "undefined") return null;

  const isCancelled = registration.status === RegistrationStatus.CANCELLED;

  const tree = (
    <div ref={layerRef} className="fixed inset-0 z-50 flex admin-fade-in">
      <button
        type="button"
        aria-label={tCommon("close")}
        onClick={onClose}
        className="flex-1 bg-black/60 backdrop-blur-sm focus:outline-none"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={registration.name}
        tabIndex={-1}
        className="admin-slide-in-right flex w-full max-w-md flex-col overflow-hidden border-l border-border-default bg-surface-raised focus:outline-none sm:max-w-md"
      >
        <div className="flex items-center justify-between gap-4 border-b border-border-subtle px-6 py-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-tertiary">
              {t("drawer.eyebrow")}
            </p>
            <h2 className="mt-1 truncate text-base font-semibold tracking-tight text-text-primary">
              {registration.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={tCommon("close")}
            className="rounded-md p-1.5 text-text-tertiary transition-colors duration-150 hover:bg-admin-hover hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>
        </div>

        <div className="admin-scroll flex-1 overflow-y-auto px-6 py-5">
          <dl className="space-y-5">
            <Field label={tTable("status")}>
              <Badge
                variant={isCancelled ? "danger" : "success"}
              >
                {statusLabel(registration.status, tEnums)}
              </Badge>
            </Field>

            <Field label={tTable("email")}>
              <a
                href={`mailto:${registration.email}`}
                className="break-all font-mono text-sm text-text-primary hover:text-accent"
              >
                {registration.email}
              </a>
            </Field>

            <div className="grid grid-cols-2 gap-5">
              <Field label={tTable("adults")}>
                <span className="font-mono text-xl tabular-nums text-text-primary">
                  {registration.adultsCount}
                </span>
              </Field>
              <Field label={tTable("children")}>
                <span className="font-mono text-xl tabular-nums text-text-primary">
                  {registration.childrenCount}
                </span>
              </Field>
            </div>

            <Field label={tTable("stay")}>
              <span className="text-sm text-text-primary">
                {staySummaryLabel(
                  registration.stay,
                  registration.stayStartDate,
                  registration.stayEndDate,
                  tEnums,
                )}
              </span>
            </Field>
            <Field label={tTable("dateRange")}>
              {registration.stayStartDate && registration.stayEndDate ? (
                <span className="text-sm text-text-primary">
                  {formatDateRange(registration.stayStartDate, registration.stayEndDate, locale)}
                </span>
              ) : (
                <span className="text-sm text-text-tertiary">
                  {tTable("dateRangeDefault")}
                </span>
              )}
            </Field>
            <Field label={tTable("accommodation")}>
              <span className="text-sm text-text-primary">
                {accommodationLabel(registration.accommodation, tEnums)}
              </span>
            </Field>

            <Field label={tTable("notes")}>
              {registration.notes ? (
                <p className="whitespace-pre-wrap break-words text-sm text-text-primary">
                  {registration.notes}
                </p>
              ) : (
                <span className="text-sm text-text-tertiary">{"\u2014"}</span>
              )}
            </Field>

            <Field label={tTable("created")}>
              <span className="font-mono text-sm tabular-nums text-text-secondary">
                {formatDate(registration.createdAt, locale)}
              </span>
            </Field>
          </dl>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border-subtle bg-surface-base/60 px-6 py-4">
          {isCancelled ? (
            onReconfirm ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onReconfirm(registration.id)}
                className="text-success hover:bg-success-muted hover:text-success"
              >
                {tEdit("reactivate")}
              </Button>
            ) : (
              <span />
            )
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmingCancel(true)}
              className="text-danger hover:bg-danger-muted hover:text-danger"
            >
              {tTable("cancel")}
            </Button>
          )}
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              loading={resendingId === registration.id}
              onClick={() => onResendEmail(registration.id)}
              disabled={isCancelled}
            >
              {tTable("resendEmail")}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onEdit(registration)}
            >
              {tTable("edit")}
            </Button>
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={confirmingCancel}
        title={tTable("confirmCancel")}
        message={tTable("confirmCancel")}
        confirmLabel={tTable("yes")}
        dismissLabel={tTable("no")}
        variant="danger"
        onConfirm={() => {
          setConfirmingCancel(false);
          onCancel(registration.id);
        }}
        onDismiss={() => setConfirmingCancel(false)}
      />
    </div>
  );

  return createPortal(tree, document.body);
}

function Field({
  label,
  children,
}: {
  readonly label: string;
  readonly children: React.ReactNode;
}): React.ReactElement {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-tertiary">
        {label}
      </dt>
      <dd className="mt-1.5">{children}</dd>
    </div>
  );
}
