"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { createBrowserClient } from "@/lib/auth/supabase-client";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { useState } from "react";

const navItems = [
  { href: "/admin/registrations", labelKey: "registrations" },
  { href: "/admin/settings", labelKey: "settings" },
] as const;

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(href + "/");
}

export function AdminNav(): React.ReactElement | null {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("admin.nav");
  const [mobileOpen, setMobileOpen] = useState(false);

  // Login is the only /admin/* page that renders without the authenticated
  // chrome — the nav relies on a session and would otherwise appear as a
  // broken, half-loaded UI above the sign-in form.
  if (pathname?.startsWith("/admin/login")) {
    return null;
  }

  async function handleLogout(): Promise<void> {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  return (
    <nav
      className="sticky top-0 z-40 border-b border-border-default bg-surface-base/90 backdrop-blur-md"
      aria-label={t("navigationLabel")}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-8">
            <Link
              href="/admin"
              className="group flex min-w-0 items-center gap-2"
              aria-label={t("title")}
            >
              <span
                aria-hidden="true"
                className="inline-block h-5 w-5 rounded-sm bg-accent transition-transform duration-200 group-hover:rotate-[8deg]"
              />
              <span className="truncate font-heading text-base tracking-[0.22em] text-text-primary">
                {t("title")}
              </span>
            </Link>

            <ul className="hidden items-center gap-1 md:flex">
              {navItems.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`relative inline-flex h-14 items-center px-3 text-sm transition-colors duration-150 ${
                        active
                          ? "font-semibold text-text-primary"
                          : "font-medium text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      {t(item.labelKey)}
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none absolute inset-x-3 bottom-0 h-[2px] rounded-full transition-all duration-200 ${
                          active ? "bg-accent opacity-100" : "bg-transparent opacity-0"
                        }`}
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <LanguageSwitcher />
            <div
              className="h-6 w-px bg-border-default"
              aria-hidden="true"
            />
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-md border border-border-default bg-transparent px-3 py-1.5 text-sm font-medium text-text-secondary transition-colors duration-150 hover:border-border-strong hover:bg-surface-raised hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
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
          <button
            type="button"
            className="inline-flex rounded-md border border-border-default p-2 text-text-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-ring md:hidden"
            aria-label={t(mobileOpen ? "closeMenu" : "openMenu")}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>
        {mobileOpen ? (
          <div className="space-y-3 border-t border-border-subtle py-3 md:hidden">
            <ul className="grid gap-1">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    aria-current={isActive(pathname, item.href) ? "page" : undefined}
                    className="block rounded-md px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-raised hover:text-text-primary"
                  >
                    {t(item.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle pt-3">
              <LanguageSwitcher />
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-md border border-border-default px-3 py-2 text-sm font-medium text-text-secondary"
              >
                {t("logout")}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </nav>
  );
}
