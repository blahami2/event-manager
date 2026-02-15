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
      <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label={t("totalRegistrations")} value={stats.total} />
        <StatsCard label={t("confirmed")} value={stats.confirmed} />
        <StatsCard label={t("cancelled")} value={stats.cancelled} />
        <StatsCard label={t("totalGuests")} value={stats.totalGuests} />
      </div>

      <div className="mt-8 flex gap-4">
        <Link
          href="/admin/registrations"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          {t("viewRegistrations")}
        </Link>
        <Link
          href="/api/admin/registrations/export"
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          {t("exportCsv")}
        </Link>
      </div>
    </div>
  );
}
