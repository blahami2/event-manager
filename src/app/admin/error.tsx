"use client";

interface ErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

/**
 * Admin error boundary – catches errors within `/admin` routes.
 */
export default function AdminError({ reset }: ErrorProps): React.ReactElement {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="max-w-md text-center">
        <h1 className="mb-4 font-heading text-3xl uppercase tracking-widest text-admin-text-primary">Admin Error</h1>
        <p className="mb-6 text-admin-text-secondary">
          Something went wrong in the admin panel. Please try again or contact
          support if the issue persists.
        </p>
        <button
          type="button"
          onClick={reset}
          className="border-2 border-accent bg-accent px-6 py-2 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-transparent hover:text-accent"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
