import Link from "next/link";

/**
 * 404 page – shown when a route is not found.
 */
export default function NotFound(): React.ReactElement {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="max-w-md text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-6 text-lg text-gray-600">Page not found</p>
        <Link
          href="/"
          className="rounded-md bg-black px-6 py-2 text-white hover:bg-gray-800"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
