import { describe, test, expect } from "vitest";
import { resolvePageAfterPageSizeChange } from "../page-size-logic";

/**
 * Unit tests for the page-size-change handler: the admin registrations
 * page must NOT reset the user to page 1 when the new page size still has
 * data on their current page. It only clamps when the current page would
 * exceed the new last page.
 */
describe("resolvePageAfterPageSizeChange", () => {
  test("should keep the current page when it is still within range of the new page size", () => {
    // given
    // - 80 rows, currently on page 2 with pageSize 20 (rows 21..40 visible)
    // - switching to pageSize 40 yields ceil(80/40)=2 pages. Page 2 is valid.

    // when
    const next = resolvePageAfterPageSizeChange({
      currentPage: 2,
      newPageSize: 40,
      total: 80,
    });

    // then
    expect(next).toBe(2);
  });

  test("should clamp to the new last page when the current page would be empty", () => {
    // given
    // - 60 rows on page 3 of 20/page. New pageSize 40 → 2 pages total.
    //   Page 3 would be empty; clamp to page 2, not back to page 1.

    // when
    const next = resolvePageAfterPageSizeChange({
      currentPage: 3,
      newPageSize: 40,
      total: 60,
    });

    // then
    expect(next).toBe(2);
  });

  test("should allow page 1 when total is zero", () => {
    // when
    const next = resolvePageAfterPageSizeChange({
      currentPage: 1,
      newPageSize: 20,
      total: 0,
    });

    // then
    // - with no data, page 1 is the only valid page
    expect(next).toBe(1);
  });

  test("should clamp to page 1 when reducing page size past the current page", () => {
    // given
    // - 10 rows, page 5 on pageSize 5. Switching to pageSize 100 → 1 page.
    //   Current page 5 exceeds the single page; clamp to 1.

    // when
    const next = resolvePageAfterPageSizeChange({
      currentPage: 5,
      newPageSize: 100,
      total: 10,
    });

    // then
    expect(next).toBe(1);
  });
});
