"use client";

import { AdminNav } from "@/components/admin/AdminNav";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { RegistrationsHeader } from "@/components/admin/RegistrationsHeader";
import { StatsStrip } from "@/components/admin/StatsStrip";

export function HarnessClient(): React.ReactElement {
  return <div className="min-h-screen bg-surface-base text-text-primary"><AdminNav /><main className="space-y-6 px-4 py-8"><RegistrationsHeader total={12} onAdd={() => undefined} /><StatsStrip stats={{ total: 12, confirmed: 10, cancelled: 2, totalAdults: 20, totalChildren: 7 }} /><BulkActionBar count={2} onClear={() => undefined} onResend={() => undefined} exportHref="/export" /></main></div>;
}
