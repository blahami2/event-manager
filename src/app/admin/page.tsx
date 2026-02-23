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
    <div>
      <h1 className="font-heading text-3xl uppercase tracking-widest text-admin-text-primary">{t("title")}</h1>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label={t("totalRegistrations")} value={stats.total} />
        <StatsCard label={t("confirmed")} value={stats.confirmed} />
        <StatsCard label={t("cancelled")} value={stats.cancelled} />
        <StatsCard label={t("totalAdults")} value={stats.totalAdults} />
        <StatsCard label={t("totalChildren")} value={stats.totalChildren} />
      </div>

      <div className="mt-8 flex gap-4">
        <Link
          href="/admin/registrations"
          className="border-2 border-accent bg-accent px-4 py-2 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-transparent hover:text-accent"
        >
          {t("viewRegistrations")}
        </Link>
        <Link
          href="/api/admin/registrations/export"
          className="border border-border-dark bg-transparent px-4 py-2 text-sm font-medium text-admin-text-secondary transition-colors hover:border-[#555] hover:text-white"
        >
          {t("exportCsv")}
        </Link>
      </div>
    </div>
  );
}
