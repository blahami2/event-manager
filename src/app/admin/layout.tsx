import type { Metadata } from "next";
import { AdminNav } from "@/components/admin/AdminNav";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";

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
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-end py-2">
          <LanguageSwitcher />
        </div>
      </div>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
