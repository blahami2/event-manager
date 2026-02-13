/**
 * T-034: Security Headers verification
 *
 * Verifies that next.config.js exports the correct security headers
 * via the `headers()` async function.
 */
import { describe, it, expect } from "vitest";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const nextConfig = require("../../next.config.js");

interface HeaderEntry {
  key: string;
  value: string;
}

interface HeaderBlock {
  source: string;
  headers: HeaderEntry[];
}

function getCatchAllBlock(blocks: HeaderBlock[]): HeaderBlock {
  const block = blocks.find((b: HeaderBlock) => b.source === "/:path*");
  if (!block) {
    throw new Error("No catch-all header block found for /:path*");
  }
  return block;
}

function getHeader(block: HeaderBlock, key: string): HeaderEntry {
  const header = block.headers.find((h: HeaderEntry) => h.key === key);
  if (!header) {
    throw new Error(`Header ${key} not found`);
  }
  return header;
}

describe("T-034: Security Headers", () => {
  let headerBlocks: HeaderBlock[];

  beforeAll(async () => {
    expect(nextConfig.headers).toBeDefined();
    expect(typeof nextConfig.headers).toBe("function");
    headerBlocks = await nextConfig.headers();
  });

  it("should apply headers to all routes (/:path*)", () => {
    const catchAll = getCatchAllBlock(headerBlocks);
    expect(catchAll).toBeDefined();
  });

  const requiredHeaders: [string, string][] = [
    ["X-Content-Type-Options", "nosniff"],
    ["X-Frame-Options", "DENY"],
    ["X-XSS-Protection", "1; mode=block"],
    ["Referrer-Policy", "strict-origin-when-cross-origin"],
    ["Permissions-Policy", "camera=(), microphone=(), geolocation=()"],
  ];

  for (const [key, expected] of requiredHeaders) {
    it(`should set ${key}`, () => {
      const catchAll = getCatchAllBlock(headerBlocks);
      const header = getHeader(catchAll, key);
      expect(header.value).toBe(expected);
    });
  }

  it("should set Strict-Transport-Security for production", () => {
    const catchAll = getCatchAllBlock(headerBlocks);
    const hsts = catchAll.headers.find(
      (h: HeaderEntry) => h.key === "Strict-Transport-Security"
    );
    if (process.env.NODE_ENV === "production") {
      expect(hsts).toBeDefined();
      const hstsHeader = getHeader(catchAll, "Strict-Transport-Security");
      expect(hstsHeader.value).toContain("max-age=");
      expect(hstsHeader.value).toContain("includeSubDomains");
    } else {
      expect(hsts).toBeUndefined();
    }
  });

  it("should set Content-Security-Policy", () => {
    const catchAll = getCatchAllBlock(headerBlocks);
    const csp = getHeader(catchAll, "Content-Security-Policy");
    expect(csp.value).toContain("'self'");
    expect(csp.value).toContain("*.supabase.co");
    expect(csp.value).toContain("resend.com");
  });
});
