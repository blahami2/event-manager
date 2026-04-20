/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";

// Mock next/navigation's `redirect`. The helper throws a sentinel error so we
// can assert the redirect target without the test environment actually
// performing navigation.
const redirectMock = vi.fn((target: string) => {
  throw new Error(`redirect:${target}`);
});

vi.mock("next/navigation", () => ({
  redirect: (target: string) => redirectMock(target),
}));

// Import after the mock so the module picks the mocked implementation up.
import AdminIndexPage from "../page";

describe("/admin index route", () => {
  it("should redirect to /admin/registrations when rendered", () => {
    // given
    redirectMock.mockClear();

    // when
    // - redirect() throws the sentinel error so the function never returns
    expect(() => AdminIndexPage()).toThrow(/redirect:\/admin\/registrations/);

    // then
    expect(redirectMock).toHaveBeenCalledWith("/admin/registrations");
  });
});
