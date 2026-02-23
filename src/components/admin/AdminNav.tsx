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
    <nav
      className="sticky top-0 z-40 border-b border-border-dark bg-dark-primary/80 font-body text-white shadow-sm backdrop-blur-md transition-all"
      aria-label="Admin navigation"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <span className="text-xl font-heading tracking-widest text-white">{t("title")}</span>
            <div className="h-6 w-px bg-border-dark/60" aria-hidden="true" />
            <div className="flex gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    pathname === item.href
                      ? "bg-accent/10 text-accent shadow-inner ring-1 ring-accent/20"
                      : "text-admin-text-secondary hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {t(item.labelKey)}
                </Link>
              ))}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="group flex items-center gap-2 rounded-lg border border-border-dark/80 bg-white/5 px-4 py-2 text-sm font-medium text-admin-text-secondary backdrop-blur-sm transition-all duration-200 hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            <svg
              className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            {t("logout")}
          </button>
        </div>
      </div>
    </nav>
  );
}
