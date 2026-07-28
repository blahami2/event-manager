"use client";

import { useCallback, useId, useState } from "react";
import { useTranslations } from "next-intl";
import {
  AccommodationOption,
  RegistrationStatus,
  StayOption,
} from "@/types/registration";
import type { RegistrationOutput } from "@/types/registration";
import {
  ACCOMMODATION_OPTIONS,
  ALL_STAY_OPTIONS,
  accommodationLabel,
  stayLabel,
} from "@/i18n/labels";
import { SUPPORTED_STAY_DATE_MAX, SUPPORTED_STAY_DATE_MIN } from "@/config/event";
import { defaultDateRangeForStay } from "@/lib/event/stay-dates";
import {
  Badge,
  Button,
  ConfirmDialog,
  Input,
  Modal,
  Select,
  Textarea,
} from "@/components/ui/admin";

/** Maximum allowed length for the notes field. Matches server-side validation. */
const NOTES_MAX_LENGTH = 500;

/**
 * Payload emitted by the edit modal. Mirrors `RegistrationInput` except that
 * `notes` is optional (omitted when blank to avoid an empty string landing
 * in the DB).
 *
 * The custom date range is always sent explicitly — a date pair when the admin
 * pinned one, `null` when they did not — so that clearing a previously pinned
 * range reaches the server as an instruction rather than as silence.
 */
export interface EditRegistrationPayload {
  readonly name: string;
  readonly email: string;
  readonly stay: StayOption;
  readonly accommodation: AccommodationOption;
  readonly adultsCount: number;
  readonly childrenCount: number;
  readonly notes?: string;
  readonly stayStartDate: string | null;
  readonly stayEndDate: string | null;
}

/**
 * The payload fields this modal can attach a server error message to.
 *
 * Exported because the caller decides whether a rejected save is something the
 * admin can fix in the form. A `400` naming only `registrationId` or `body`
 * describes a client bug with no input to point at; handing it to the modal
 * would leave Save looking dead — form open, nothing highlighted, no message.
 */
export const EDITABLE_FIELDS = [
  "name",
  "email",
  "stay",
  "accommodation",
  "adultsCount",
  "childrenCount",
  "notes",
  "stayStartDate",
  "stayEndDate",
] as const;

/** Which endpoint of the custom range a validation message belongs to. */
type DateRangeErrorField = "start" | "end";

interface DateRangeError {
  readonly field: DateRangeErrorField;
  readonly messageKey:
    | "errorDateRangeIncomplete"
    | "errorDateRangeOrder"
    | "errorDateRangeBounds";
}

/** Whether a `YYYY-MM-DD` value lies inside the supported window. */
function isWithinSupportedWindow(value: string): boolean {
  return value >= SUPPORTED_STAY_DATE_MIN && value <= SUPPORTED_STAY_DATE_MAX;
}

/**
 * Validate the custom range the admin typed.
 *
 * Mirrors the server-side `stayDateRangeSchema` rules that a user can trip in
 * the UI: the pair must be complete, must lie inside the supported window, and
 * must not be inverted. Any range within the window is allowed — that is the
 * point of issue #101. Calendar-validity is left to the native date input and
 * the server, which is why this compares the `YYYY-MM-DD` strings
 * lexicographically (equivalent to chronological order for that fixed-width
 * format).
 *
 * The window is also expressed as `min`/`max` on the inputs, which is what the
 * date picker enforces. This check covers the typed path, which the picker
 * does not constrain, so the admin gets the same message either way.
 */
function validateCustomRange(start: string, end: string): DateRangeError | null {
  if (!start) {
    return { field: "start", messageKey: "errorDateRangeIncomplete" };
  }
  if (!end) {
    return { field: "end", messageKey: "errorDateRangeIncomplete" };
  }
  if (!isWithinSupportedWindow(start)) {
    return { field: "start", messageKey: "errorDateRangeBounds" };
  }
  if (!isWithinSupportedWindow(end)) {
    return { field: "end", messageKey: "errorDateRangeBounds" };
  }
  if (end < start) {
    return { field: "end", messageKey: "errorDateRangeOrder" };
  }
  return null;
}

export interface EditRegistrationModalProps {
  readonly registration: RegistrationOutput;
  readonly onSave: (id: string, data: EditRegistrationPayload) => void;
  readonly onClose: () => void;
  /**
   * Optional reconfirm handler. When provided and the registration is
   * currently cancelled, the modal renders a Reactivate button in the
   * footer alongside Save.
   */
  readonly onReconfirm?: (id: string) => void;
  /**
   * Optional permanent-delete handler (issue #102). When provided, the modal
   * renders a destructive control that removes the registration outright,
   * gated behind an explicit confirmation.
   *
   * Optional rather than always-on so that callers which must not offer
   * deletion — a future read-mostly surface, a narrower role — simply do not
   * pass it and get exactly the previous modal.
   */
  readonly onDelete?: (id: string) => void | Promise<void>;
  /**
   * Field-level errors returned by the server (the `fields` map of a `400`
   * response), keyed by field name.
   *
   * The server owns the authoritative validation rules; without this channel a
   * rejected save would surface only as a generic toast, leaving the admin to
   * guess which field the server disliked. Local validation still wins while
   * the admin is actively editing, since it reflects the current form state.
   */
  readonly serverFieldErrors?: Readonly<Record<string, string>>;
}

export function EditRegistrationModal({
  registration,
  onSave,
  onClose,
  onReconfirm,
  onDelete,
  serverFieldErrors,
}: EditRegistrationModalProps): React.ReactElement {
  const t = useTranslations("admin.registrations.edit");
  const tEnums = useTranslations();
  const isCancelled = registration.status === RegistrationStatus.CANCELLED;

  // Form state uses proper enum types — no `as string` casting anywhere.
  const [name, setName] = useState(registration.name);
  const [email, setEmail] = useState(registration.email);
  const [stay, setStay] = useState<StayOption>(registration.stay);
  const [accommodation, setAccommodation] = useState<AccommodationOption>(
    registration.accommodation,
  );
  const [adultsCount, setAdultsCount] = useState(String(registration.adultsCount));
  const [childrenCount, setChildrenCount] = useState(String(registration.childrenCount));
  const [notes, setNotes] = useState(registration.notes ?? "");

  // Custom date range (issue #101). Enabled when the registration already
  // carries one; the stay option governs the dates while it stays disabled.
  const customDatesId = useId();
  const [hasCustomDates, setHasCustomDates] = useState(
    Boolean(registration.stayStartDate && registration.stayEndDate),
  );
  const [arrivalDate, setArrivalDate] = useState(registration.stayStartDate ?? "");
  const [departureDate, setDepartureDate] = useState(registration.stayEndDate ?? "");
  const [dateRangeError, setDateRangeError] = useState<DateRangeError | null>(null);
  /**
   * Whether the dates in the inputs are still the machine-generated defaults
   * for the selected stay option, as opposed to values the admin owns.
   *
   * Prefilled dates track the stay option: switching the option would otherwise
   * leave dates belonging to the previous one. Anything the admin typed, and
   * anything already stored on the registration, is theirs and is never
   * overwritten.
   */
  const [rangeIsPrefilled, setRangeIsPrefilled] = useState(false);

  /**
   * Whether the permanent-delete confirmation is showing.
   *
   * Deletion is never a single click: the control only opens this dialog, and
   * only the dialog's confirm button calls `onDelete`. Dismissing it — button,
   * Escape, or backdrop — leaves the registration untouched, so every escape
   * route from the dialog is the safe one.
   */
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  /** Seed both date inputs from a stay option and mark them machine-generated. */
  const prefillRangeFrom = useCallback((option: StayOption) => {
    const defaults = defaultDateRangeForStay(option);
    setArrivalDate(defaults.start);
    setDepartureDate(defaults.end);
    setRangeIsPrefilled(true);
  }, []);

  /**
   * Toggle the custom range. Enabling it on an empty form seeds the inputs with
   * the selected stay option's dates, which keeps the predefined options useful
   * as a starting point instead of forcing every range to be typed from
   * scratch. Values the admin already entered are never overwritten.
   */
  const handleToggleCustomDates = useCallback(() => {
    const next = !hasCustomDates;

    if (next && !arrivalDate && !departureDate) {
      prefillRangeFrom(stay);
    }

    if (!next) {
      setDateRangeError(null);
    }

    setHasCustomDates(next);
  }, [hasCustomDates, arrivalDate, departureDate, stay, prefillRangeFrom]);

  const handleStayChange = useCallback(
    (option: StayOption) => {
      setStay(option);
      if (hasCustomDates && rangeIsPrefilled) {
        prefillRangeFrom(option);
        setDateRangeError(null);
      }
    },
    [hasCustomDates, rangeIsPrefilled, prefillRangeFrom],
  );

  /** Record a manual edit: the range stops tracking the stay option. */
  const handleArrivalChange = useCallback((value: string) => {
    setArrivalDate(value);
    setRangeIsPrefilled(false);
  }, []);

  const handleDepartureChange = useCallback((value: string) => {
    setDepartureDate(value);
    setRangeIsPrefilled(false);
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      const rangeError = hasCustomDates
        ? validateCustomRange(arrivalDate, departureDate)
        : null;
      setDateRangeError(rangeError);
      if (rangeError) {
        return;
      }

      const trimmedNotes = notes.trim();
      onSave(registration.id, {
        name,
        email,
        stay,
        accommodation,
        adultsCount: Number(adultsCount),
        childrenCount: Number(childrenCount),
        ...(trimmedNotes ? { notes: trimmedNotes } : {}),
        stayStartDate: hasCustomDates ? arrivalDate : null,
        stayEndDate: hasCustomDates ? departureDate : null,
      });
    },
    [
      registration.id,
      name,
      email,
      stay,
      accommodation,
      adultsCount,
      childrenCount,
      notes,
      hasCustomDates,
      arrivalDate,
      departureDate,
      onSave,
    ],
  );

  /**
   * Render a range validation message.
   *
   * The window bounds are interpolated from the same constants the inputs and
   * the server rule use, so the message cannot drift from the rule it explains.
   * Keys without placeholders simply ignore the values.
   */
  const rangeMessage = (error: DateRangeError): string =>
    t(error.messageKey, {
      min: SUPPORTED_STAY_DATE_MIN,
      max: SUPPORTED_STAY_DATE_MAX,
    });

  // Local validation reflects the current form state, so it wins over a server
  // message that describes what was last submitted.
  const arrivalError =
    dateRangeError?.field === "start"
      ? rangeMessage(dateRangeError)
      : serverFieldErrors?.["stayStartDate"];
  const departureError =
    dateRangeError?.field === "end"
      ? rangeMessage(dateRangeError)
      : serverFieldErrors?.["stayEndDate"];

  /**
   * Server messages for the plain fields.
   *
   * The endpoint validates the entire payload, so any of these can be rejected.
   * Without somewhere to render the message the modal would stay open and
   * silent after a `400`, leaving the admin to guess what the server disliked.
   * Payload-level keys (`registrationId`, `body`) have no input to attach to
   * and are deliberately not shown here — they signal a client bug, not
   * something the admin can correct in the form.
   */
  const serverError = (field: string): string | undefined => serverFieldErrors?.[field];

  return (
    <Modal
      open
      onClose={onClose}
      title={t("title")}
      size="md"
      disableEscapeClose={confirmingDelete}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {isCancelled ? (
          <div className="flex items-start gap-3 rounded-md border border-border-subtle bg-surface-sunken/60 px-4 py-3">
            <Badge variant="danger">
              {t("cancelledStatus")}
            </Badge>
            <div className="flex-1 text-sm text-text-secondary">
              {t("cancelledNotice")}
            </div>
            {onReconfirm ? (
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() => onReconfirm(registration.id)}
              >
                {t("reactivate")}
              </Button>
            ) : null}
          </div>
        ) : null}
        <Input
          label={t("name")}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          {...(serverError("name") ? { error: serverError("name") } : {})}
        />
        <Input
          label={t("email")}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          {...(serverError("email") ? { error: serverError("email") } : {})}
        />
        <Select
          label={t("stay")}
          value={stay}
          onChange={(e) => handleStayChange(e.target.value as StayOption)}
          required
          {...(serverError("stay") ? { error: serverError("stay") } : {})}
        >
          {ALL_STAY_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {stayLabel(opt, tEnums)}
            </option>
          ))}
        </Select>
        <div className="rounded-md border border-border-subtle bg-surface-sunken/40 px-4 py-3">
          <div className="flex items-start gap-3">
            <input
              id={customDatesId}
              type="checkbox"
              checked={hasCustomDates}
              onChange={handleToggleCustomDates}
              className="mt-0.5 h-4 w-4 rounded border-border-default text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring"
            />
            <div className="flex-1">
              <label
                htmlFor={customDatesId}
                className="text-sm font-medium text-text-primary"
              >
                {t("customDates")}
              </label>
              <p className="mt-0.5 text-xs text-text-tertiary">
                {t("customDatesHelp")}
              </p>
            </div>
          </div>
          {hasCustomDates ? (
            <div className="mt-4 grid grid-cols-2 gap-4">
              <Input
                label={t("arrivalDate")}
                type="date"
                min={SUPPORTED_STAY_DATE_MIN}
                max={SUPPORTED_STAY_DATE_MAX}
                value={arrivalDate}
                onChange={(e) => handleArrivalChange(e.target.value)}
                {...(arrivalError ? { error: arrivalError } : {})}
              />
              <Input
                label={t("departureDate")}
                type="date"
                min={SUPPORTED_STAY_DATE_MIN}
                max={SUPPORTED_STAY_DATE_MAX}
                value={departureDate}
                onChange={(e) => handleDepartureChange(e.target.value)}
                {...(departureError ? { error: departureError } : {})}
              />
            </div>
          ) : null}
        </div>
        <Select
          label={t("accommodation")}
          value={accommodation}
          onChange={(e) => setAccommodation(e.target.value as AccommodationOption)}
          required
          {...(serverError("accommodation") ? { error: serverError("accommodation") } : {})}
        >
          {ACCOMMODATION_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {accommodationLabel(opt, tEnums)}
            </option>
          ))}
        </Select>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t("adultsCount")}
            type="number"
            min="1"
            value={adultsCount}
            onChange={(e) => setAdultsCount(e.target.value)}
            required
            {...(serverError("adultsCount") ? { error: serverError("adultsCount") } : {})}
          />
          <Input
            label={t("childrenCount")}
            type="number"
            min="0"
            value={childrenCount}
            onChange={(e) => setChildrenCount(e.target.value)}
            required
            {...(serverError("childrenCount") ? { error: serverError("childrenCount") } : {})}
          />
        </div>
        <Textarea
          label={t("notes")}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          maxLength={NOTES_MAX_LENGTH}
          {...(serverError("notes") ? { error: serverError("notes") } : {})}
        />
        <div className="-mx-6 -mb-5 mt-2 flex items-center justify-between gap-3 border-t border-border-subtle bg-surface-base/40 px-6 py-4">
          {/* Destructive action kept at the opposite end of the footer from
              Save, so a mis-aimed click lands on empty space rather than on
              the irreversible option. */}
          {onDelete ? (
            <Button
              variant="ghost"
              onClick={() => setConfirmingDelete(true)}
              className="text-danger hover:bg-danger-muted hover:text-danger"
            >
              {t("delete")}
            </Button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button variant="primary" type="submit">
              {t("save")}
            </Button>
          </div>
        </div>
      </form>
      {onDelete ? (
        <ConfirmDialog
          open={confirmingDelete}
          title={t("confirmDeleteTitle")}
          message={t("confirmDeleteMessage", {
            name: registration.name,
            email: registration.email,
          })}
          confirmLabel={t("confirmDeleteConfirm")}
          dismissLabel={t("confirmDeleteDismiss")}
          variant="danger"
          loading={deleting}
          onConfirm={() => {
            if (deleting) return;
            setDeleting(true);
            void Promise.resolve(onDelete(registration.id)).finally(() => {
              setDeleting(false);
              setConfirmingDelete(false);
            });
          }}
          onDismiss={() => setConfirmingDelete(false)}
        />
      ) : null}
    </Modal>
  );
}
