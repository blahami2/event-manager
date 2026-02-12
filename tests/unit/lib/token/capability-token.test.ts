import { describe, it, expect } from "vitest";
import { generateToken, hashToken } from "@/lib/token/capability-token";

describe("generateToken", () => {
  it("should return an object with raw and hash properties", () => {
    // when
    const token = generateToken();

    // then
    expect(token).toHaveProperty("raw");
    expect(token).toHaveProperty("hash");
    expect(typeof token.raw).toBe("string");
    expect(typeof token.hash).toBe("string");
  });

  it("should generate a raw token that is at least 32 bytes when decoded", () => {
    // when
    const token = generateToken();

    // then
    // base64url: convert _ to /, - to + then decode
    const base64 = token.raw.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = Buffer.from(base64, "base64");
    expect(decoded.length).toBeGreaterThanOrEqual(32);
  });

  it("should generate a URL-safe raw token", () => {
    // when
    const token = generateToken();

    // then
    expect(token.raw).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("should generate unique tokens on each call", () => {
    // when
    const token1 = generateToken();
    const token2 = generateToken();

    // then
    expect(token1.raw).not.toBe(token2.raw);
    expect(token1.hash).not.toBe(token2.hash);
  });

  it("should return a hash that matches hashing the raw token", () => {
    // when
    const token = generateToken();

    // then
    expect(token.hash).toBe(hashToken(token.raw));
  });
});

describe("hashToken", () => {
  it("should produce the same hash for the same input (deterministic)", () => {
    // given
    const raw = "test-token-value";

    // when
    const hash1 = hashToken(raw);
    const hash2 = hashToken(raw);

    // then
    expect(hash1).toBe(hash2);
  });

  it("should produce different hashes for different inputs", () => {
    // when
    const hash1 = hashToken("token-a");
    const hash2 = hashToken("token-b");

    // then
    expect(hash1).not.toBe(hash2);
  });

  it("should return a 64-character hex string (SHA-256)", () => {
    // when
    const hash = hashToken("some-token");

    // then
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });
});
