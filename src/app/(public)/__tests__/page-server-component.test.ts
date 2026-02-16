/**
 * @vitest-environment node
 */
import { readFileSync } from "fs";
import { describe, it, expect } from "vitest";

describe("HomePage", () => {
  it("is a Server Component (no use client directive)", () => {
    const content = readFileSync("src/app/(public)/page.tsx", "utf-8");
    expect(content).not.toContain("use client");
  });
});
