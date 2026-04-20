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

/**
 * Admin top navigation. Sticky, hairline-bordered, with a clear active
 * state (accent-coloured pill). Uses semantic tokens throughout so the
 * look changes in one place.
 */
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
      className="sticky top-0 z-40 border-b border-[color:var(--color-border)] bg-[color:var(--color-surface-0)]/85 backdrop-blur-xl"
      aria-label="Admin navigation"
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link
            href="/admin"
            className="font-[var(--font-heading)] text-[15px] font-semibold uppercase tracking-[0.25em] text-[color:var(--color-text-primary)]"
          >
            <span className="text-[color:var(--color-accent)]">/</span>{" "}
            {t("title")}
          </Link>
          <div
            className="h-5 w-px bg-[color:var(--color-border)]"
            aria-hidden="true"
          />
          <div className="flex gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={[
                    "relative rounded-[var(--radius-sm)] px-3 py-1.5 text-sm font-medium",
                    "transition-colors duration-[var(--motion-fast)]",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)]/60",
                    isActive
                      ? "text-[color:var(--color-text-primary)]"
                      : "text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-2)] hover:text-[color:var(--color-text-primary)]",
                  ].join(" ")}
                >
                  {t(item.labelKey)}
                  {isActive ? (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-3 -bottom-[13px] h-[2px] bg-[color:var(--color-accent)]"
                    />
                  ) : null}
                </Link>
              );
            })}
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] px-3 py-1.5 text-sm font-medium text-[color:var(--color-text-secondary)] transition-colors duration-[var(--motion-fast)] hover:bg-[color:var(--color-surface-2)] hover:text-[color:var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-border-strong)]"
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
              strokeWidth={1.75}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          {t("logout")}
        </button>
      </div>
    </nav>
  );
}
