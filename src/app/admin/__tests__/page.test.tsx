/**
 * @vitest-environment node
 */
import { describe, it, expect, vi } from "vitest";

const mockRedirect = vi.hoisted(() => vi.fn((url: string) => {
  const err = new Error(`NEXT_REDIRECT:${url}`);
  (err as unknown as { digest?: string }).digest = `NEXT_REDIRECT;${url}`;
  throw err;
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

import AdminIndexPage from "../page";

describe("AdminIndexPage", () => {
  it("redirects to /admin/registrations (dashboard retired)", () => {
    // Since the dashboard was folded into the registrations page, this
    // route should silently forward so bookmarks still work.
    expect(() => AdminIndexPage()).toThrow(/NEXT_REDIRECT/);
    expect(mockRedirect).toHaveBeenCalledWith("/admin/registrations");
  });
});
