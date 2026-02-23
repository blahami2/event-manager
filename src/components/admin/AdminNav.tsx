"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { createBrowserClient } from "@/lib/auth/supabase-client";

const navItems = [
  { href: "/admin", labelKey: "dashboard" },
  { href: "/admin/registrations", labelKey: "registrations" },
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
    <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-lg" aria-label="Admin navigation">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="mr-4 text-base font-semibold text-slate-900">{t("title")}</span>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {t(item.labelKey)}
              </Link>
            ))}
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            {t("logout")}
          </button>
        </div>
      </div>
    </nav>
  );
}
