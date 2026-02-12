"use client";

interface ErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

/**
 * Admin error boundary – catches errors within `/admin` routes.
 *
 * Shows an admin-specific message with a retry button.
 * No stack traces or internal details are exposed.
 */
export default function AdminError({ reset }: ErrorProps): React.ReactElement {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="max-w-md text-center">
        <h1 className="mb-4 text-2xl font-bold">Admin Error</h1>
        <p className="mb-6 text-gray-600">
          Something went wrong in the admin panel. Please try again or contact
          support if the issue persists.
        </p>
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-black px-6 py-2 text-white hover:bg-gray-800"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
