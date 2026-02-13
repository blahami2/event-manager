import type { Metadata } from "next";
import { AdminNav } from "@/components/admin/AdminNav";

export const metadata: Metadata = {
  title: "Admin | Birthday Celebration",
  description: "Admin panel for event management",
};

/**
 * Admin layout wraps all /admin/* routes.
 *
 * Auth protection is handled at two levels:
 * 1. Next.js middleware (src/middleware.ts) redirects unauthenticated
 *    browser requests to /admin/login (lightweight cookie check).
 * 2. API route handlers use verifyAdmin() for full session + allowlist
 *    verification on every mutation.
 *
 * The /admin/login page is excluded from the middleware redirect
 * via the route matcher pattern.
 */
export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
