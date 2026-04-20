export const dynamic = "force-dynamic";

import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getRegistrationStats } from "@/lib/usecases/admin-actions";
import { StatsCard } from "@/components/admin/StatsCard";

export default async function AdminDashboardPage(): Promise<React.ReactElement> {
  const [stats, t] = await Promise.all([
    getRegistrationStats(),
    getTranslations("admin.dashboard"),
  ]);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[color:var(--color-text-tertiary)]">
          Admin
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[color:var(--color-text-primary)]">
          {t("title")}
        </h1>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatsCard label={t("totalRegistrations")} value={stats.total} />
        <StatsCard label={t("confirmed")} value={stats.confirmed} />
        <StatsCard label={t("cancelled")} value={stats.cancelled} />
        <StatsCard label={t("totalAdults")} value={stats.totalAdults} />
        <StatsCard label={t("totalChildren")} value={stats.totalChildren} />
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <Link
          href="/admin/registrations"
          className="inline-flex items-center justify-center rounded-[var(--radius-md)] bg-[color:var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-[filter] hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-surface-0)]"
        >
          {t("viewRegistrations")}
        </Link>
        <a
          href="/api/admin/registrations/export"
          download
          className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-4 py-2 text-sm font-medium text-[color:var(--color-text-primary)] transition-colors hover:bg-[color:var(--color-surface-3)] hover:border-[color:var(--color-border-strong)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-border-strong)]"
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
              d="M12 10v6m0 0l-3-3m3 3l3-3M3 17v3a2 2 0 002 2h14a2 2 0 002-2v-3"
            />
          </svg>
          {t("exportCsv")}
        </a>
      </div>
    </div>
  );
}
