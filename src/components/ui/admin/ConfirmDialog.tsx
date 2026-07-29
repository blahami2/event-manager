"use client";

import { Button } from "./Button";
import { Modal } from "./Modal";

export type ConfirmDialogVariant = "info" | "danger";

export interface ConfirmDialogProps {
  readonly open: boolean;
  readonly title: string;
  readonly message: string;
  readonly confirmLabel: string;
  readonly dismissLabel: string;
  readonly onConfirm: () => void;
  readonly onDismiss: () => void;
  /**
   * Visual emphasis for the confirm action. `"danger"` paints the confirm
   * button red — use for destructive choices (cancel, delete). `"info"`
   * (default) renders a neutral primary button.
   */
  readonly variant?: ConfirmDialogVariant;
  /**
   * If the confirm action is asynchronous and the caller wants to show
   * progress on the button, passing `true` marks it busy.
   */
  readonly loading?: boolean;
}

/**
 * ConfirmDialog — a small wrapper around `Modal` for yes/no confirmations.
 * Kept as a separate component because it centralises the button order and
 * variant mapping, and it's the #1 repeated pattern in the admin UI.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  dismissLabel,
  onConfirm,
  onDismiss,
  variant = "info",
  loading = false,
}: ConfirmDialogProps): React.ReactElement {
  const handleDismiss = (): void => {
    if (!loading) onDismiss();
  };

  return (
    <Modal
      open={open}
      onClose={handleDismiss}
      title={title}
      size="sm"
      disableEscapeClose={loading}
      disableBackdropClose={loading}
    >
      <p className="mb-6 text-sm text-text-secondary">{message}</p>
      <div className="flex justify-end gap-3">
        <Button
          variant="secondary"
          size="md"
          onClick={handleDismiss}
          disabled={loading}
        >
          {dismissLabel}
        </Button>
        <Button
          variant={variant === "danger" ? "danger" : "primary"}
          size="md"
          onClick={onConfirm}
          loading={loading}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
