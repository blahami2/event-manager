"use client";

import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/admin";

export interface StatsStripData {
  readonly total: number;
  readonly confirmed: number;
  readonly cancelled: number;
  readonly totalAdults: number;
  readonly totalChildren: number;
}

export interface StatsStripProps {
  readonly stats: StatsStripData | null;
}

/**
 * Compact at-a-glance stats strip for the top of the registrations page.
 * Renders five small tiles: Total / Confirmed / Cancelled / Adults /
 * Children. While stats are loading, each tile shows a shimmering
 * placeholder so the page layout never jumps.
 */
export function StatsStrip({ stats }: StatsStripProps): React.ReactElement {
  const t = useTranslations("admin.registrations");

  const items: ReadonlyArray<{
    readonly labelKey: string;
    readonly value: number | null;
    readonly accent?: "success" | "danger";
  }> = [
    { labelKey: "statsTotal", value: stats?.total ?? null },
    {
      labelKey: "statsConfirmed",
      value: stats?.confirmed ?? null,
      accent: "success",
    },
    {
      labelKey: "statsCancelled",
      value: stats?.cancelled ?? null,
      accent: "danger",
    },
    { labelKey: "statsAdults", value: stats?.totalAdults ?? null },
    { labelKey: "statsChildren", value: stats?.totalChildren ?? null },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((item) => (
        <div
          key={item.labelKey}
          className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] px-4 py-3"
        >
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[color:var(--color-text-tertiary)]">
            {t(item.labelKey)}
          </p>
          {item.value === null ? (
            <Skeleton shape="text" className="mt-2 h-6 w-12" />
          ) : (
            <p
              className={[
                "mt-1 text-xl font-semibold tabular-nums tracking-tight",
                item.accent === "success" && "text-[color:var(--color-success)]",
                item.accent === "danger" && "text-[color:var(--color-danger)]",
                !item.accent && "text-[color:var(--color-text-primary)]",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {item.value}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
