export const dynamic = "force-dynamic";

import Link from "next/link";
import { getRegistrationStats } from "@/lib/usecases/admin-actions";
import { StatsCard } from "@/components/admin/StatsCard";

export default async function AdminDashboardPage(): Promise<React.ReactElement> {
  const stats = await getRegistrationStats();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label="Total Registrations" value={stats.total} />
        <StatsCard label="Confirmed" value={stats.confirmed} />
        <StatsCard label="Cancelled" value={stats.cancelled} />
        <StatsCard label="Total Guests" value={stats.totalGuests} />
      </div>

      <div className="mt-8 flex gap-4">
        <Link
          href="/admin/registrations"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          View Registrations
        </Link>
        <Link
          href="/api/admin/registrations/export"
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Export CSV
        </Link>
      </div>
    </div>
  );
}
