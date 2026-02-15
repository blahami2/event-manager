"use client";

import { useTranslations } from "next-intl";

interface ErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

/**
 * Root error boundary – catches unhandled rendering errors.
 *
 * Shows a user-friendly message with a retry button.
 * No stack traces or internal details are exposed.
 */
export default function RootError({ reset }: ErrorProps): React.ReactElement {
  const t = useTranslations("errors");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-dark-primary p-4">
      <div className="max-w-md text-center">
        <h1 className="mb-4 font-heading text-3xl uppercase tracking-wider text-white">
          {t("somethingWentWrong")}
        </h1>
        <p className="mb-6 text-text-gray">
          {t("unexpectedRetry")}
        </p>
        <button
          type="button"
          onClick={reset}
          className="bg-accent px-10 py-[15px] font-heading text-2xl uppercase tracking-wide text-white border-3 border-accent transition-all duration-300 hover:bg-transparent hover:text-accent"
        >
          {t("tryAgain")}
        </button>
      </div>
    </div>
  );
}
