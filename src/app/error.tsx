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
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="max-w-md text-center">
        <h1 className="mb-4 text-2xl font-bold">{t("somethingWentWrong")}</h1>
        <p className="mb-6 text-gray-600">
          {t("unexpectedRetry")}
        </p>
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-black px-6 py-2 text-white hover:bg-gray-800"
        >
          {t("tryAgain")}
        </button>
      </div>
    </div>
  );
}
