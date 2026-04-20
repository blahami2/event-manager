import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * The dashboard was folded into the registrations page in Tier C — the
 * compact stats strip at the top of `/admin/registrations` now surfaces
 * every number the standalone dashboard used to show, without an extra
 * click. `/admin` redirects there so existing bookmarks keep working.
 */
export default function AdminIndexPage(): never {
  redirect("/admin/registrations");
}
