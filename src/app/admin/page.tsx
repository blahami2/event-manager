import { redirect } from "next/navigation";

/**
 * The standalone dashboard was retired: its stats are now rendered directly
 * above the registrations list, so the extra click added no value. We keep
 * `/admin` as a route so bookmarks and the top-left logo click still work,
 * but silently forward to the list.
 */
export default function AdminIndexPage(): never {
  redirect("/admin/registrations");
}
