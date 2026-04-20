import type { Metadata } from "next";
import { AdminNav } from "@/components/admin/AdminNav";
import { ToastProvider } from "@/components/ui/admin";

export const metadata: Metadata = {
  title: "Admin | Birthday Celebration",
  description: "Admin panel for event management",
};

/**
 * Admin shell. Wraps every admin page in:
 *  - `AdminNav` sticky top navigation.
 *  - `ToastProvider` so any descendant can `useToast().success(...)` etc.
 *  - A padded `<main>` container.
 */
export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-[color:var(--color-surface-0)] font-body text-[color:var(--color-text-primary)]">
        <AdminNav />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
