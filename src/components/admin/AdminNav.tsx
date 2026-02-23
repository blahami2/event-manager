"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { createBrowserClient } from "@/lib/auth/supabase-client";

const navItems = [
  { href: "/admin", labelKey: "dashboard" },
  { href: "/admin/registrations", labelKey: "registrations" },
  { href: "/admin/settings", labelKey: "settings" },
] as const;

export function AdminNav(): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("admin.nav");

  async function handleLogout(): Promise<void> {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  return (
    <nav className="border-b border-border-dark bg-dark-secondary font-body text-white" aria-label="Admin navigation">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-lg font-bold">{t("title")}</span>
            <div className="h-6 w-px bg-border-dark" aria-hidden="true" />
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? "border-b-2 border-accent bg-admin-accent-soft text-white"
                    : "text-admin-text-secondary hover:text-white"
                }`}
              >
                {t(item.labelKey)}
              </Link>
            ))}
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-md border border-border-dark bg-dark-secondary px-4 py-2 text-sm font-medium text-admin-text-secondary transition-all hover:border-admin-text-secondary hover:bg-admin-hover hover:text-admin-text-primary"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {t("logout")}
          </button>
        </div>
      </div>
    </nav>
  );
}
