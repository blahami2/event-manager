"use client";

import { useTranslations } from "next-intl";
import { StatsCard } from "@/components/admin/StatsCard";
import { SkeletonStat } from "@/components/ui/admin";

export interface RegistrationStats {
  readonly total: number;
  readonly confirmed: number;
  readonly cancelled: number;
  readonly totalAdults: number;
  readonly totalChildren: number;
}

export interface StatsStripProps {
  readonly stats: RegistrationStats | null;
}

/**
 * Compact row of aggregate stats displayed above the registrations list.
 * Renders skeletons while the stats are loading so the layout doesn't jump
 * when they arrive.
 */
export function StatsStrip({ stats }: StatsStripProps): React.ReactElement {
  const t = useTranslations("admin.dashboard");

  if (!stats) {
    return (
      <div className="grid grid-cols-3 gap-3">
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      <StatsCard label={t("totalRegistrations")} value={stats.total} accent />
      <StatsCard label={t("totalAdults")} value={stats.totalAdults} />
      <StatsCard label={t("totalChildren")} value={stats.totalChildren} />
    </div>
  );
}
