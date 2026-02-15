import Link from "next/link";

/**
 * 404 page – shown when a route is not found.
 *
 * This page is statically prerendered at build time, so it cannot use
 * next-intl server APIs (which call cookies()/headers()). We use
 * hardcoded English text here. The client-side LanguageSwitcher still
 * works for navigation.
 */
export default function NotFound(): React.ReactElement {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-dark-primary p-4">
      <div className="max-w-md text-center">
        <h1 className="mb-4 font-heading text-6xl uppercase tracking-wider text-accent">
          404
        </h1>
        <p className="mb-6 text-lg text-text-gray">Page not found</p>
        <Link
          href="/"
          className="inline-block bg-accent px-10 py-[15px] font-heading text-2xl uppercase tracking-wide text-white border-3 border-accent transition-all duration-300 hover:bg-transparent hover:text-accent"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
