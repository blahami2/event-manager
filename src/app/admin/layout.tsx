import type { Metadata } from "next";
import { AdminNav } from "@/components/admin/AdminNav";

export const metadata: Metadata = {
  title: "Admin | Birthday Celebration",
  description: "Admin panel for event management",
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <div className="min-h-screen bg-dark-primary font-body text-admin-text-primary">
      <AdminNav />
      <main className="mx-auto max-w-7xl px-6 py-8 sm:px-8 lg:px-10">
        {children}
      </main>
    </div>
  );
}
