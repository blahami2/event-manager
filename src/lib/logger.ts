import { createHash } from "crypto";

/**
 * Structured logging wrapper.
 *
 * Outputs JSON entries with: level, message, context, timestamp.
 *
 * Uses console.warn for info/debug/warn and console.error for error,
 * which are the only console methods permitted by the ESLint config.
 *
 * See docs/ARCHITECTURE.md Section 6 for logging rules.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  readonly level: LogLevel;
  readonly message: string;
  readonly context: Record<string, unknown>;
  readonly timestamp: string;
}

function emit(level: LogLevel, message: string, context: Record<string, unknown> = {}): void {
  const entry: LogEntry = {
    level,
    message,
    context,
    timestamp: new Date().toISOString(),
  };

  const serialised = JSON.stringify(entry);

  if (level === "error") {
    console.error(serialised);
  } else {
    console.warn(serialised);
  }
}

export const logger = {
  debug(message: string, context?: Record<string, unknown>): void {
    emit("debug", message, context);
  },
  info(message: string, context?: Record<string, unknown>): void {
    emit("info", message, context);
  },
  warn(message: string, context?: Record<string, unknown>): void {
    emit("warn", message, context);
  },
  error(message: string, context?: Record<string, unknown>): void {
    emit("error", message, context);
  },
} as const;

/**
 * Mask an email address for safe logging.
 *
 * `john@example.com` → `j***@example.com`
 */
export function maskEmail(email: string): string {
  const atIndex = email.indexOf("@");
  if (atIndex < 0) {
    return "***";
  }
  const local = email.substring(0, atIndex);
  const domain = email.substring(atIndex);
  return `${local.charAt(0)}***${domain}`;
}

/**
 * Hash an IP address with SHA-256 for safe logging.
 *
 * Returns a deterministic 64-character hex digest.
 */
export function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex");
}
