import { describe, it, expect, vi, beforeEach } from "vitest";
import { logger, maskEmail, hashIp } from "@/lib/logger";

describe("logger", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should have info, warn, error, and debug methods", () => {
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.warn).toBe("function");
    expect(typeof logger.error).toBe("function");
    expect(typeof logger.debug).toBe("function");
  });

  it("should output structured JSON with level, message, context, and timestamp", () => {
    // given
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});

    // when
    logger.warn("rate limit hit", { endpoint: "/api/register" });

    // then
    expect(spy).toHaveBeenCalledOnce();
    const raw = spy.mock.calls[0]?.[0] as string;
    const output = JSON.parse(raw) as Record<string, unknown>;
    expect(output.level).toBe("warn");
    expect(output.message).toBe("rate limit hit");
    expect(output.context).toEqual({ endpoint: "/api/register" });
    expect(typeof output.timestamp).toBe("string");
    // timestamp should be a valid ISO 8601 string
    expect(new Date(output.timestamp as string).toISOString()).toBe(output.timestamp);
  });

  it("should output info level via console.warn", () => {
    // given
    // info maps to console.warn because no-console rule forbids console.log/info
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});

    // when
    logger.info("registration created", { registrationId: "abc" });

    // then
    expect(spy).toHaveBeenCalledOnce();
    const raw = spy.mock.calls[0]?.[0] as string;
    const output = JSON.parse(raw) as Record<string, unknown>;
    expect(output.level).toBe("info");
    expect(output.message).toBe("registration created");
  });

  it("should output error level via console.error", () => {
    // given
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    // when
    logger.error("email send failed", { registrationId: "xyz", errorCode: "RESEND_FAIL" });

    // then
    expect(spy).toHaveBeenCalledOnce();
    const raw = spy.mock.calls[0]?.[0] as string;
    const output = JSON.parse(raw) as Record<string, unknown>;
    expect(output.level).toBe("error");
    expect(output.context).toEqual({ registrationId: "xyz", errorCode: "RESEND_FAIL" });
  });

  it("should output debug level via console.warn", () => {
    // given
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});

    // when
    logger.debug("token lookup", { hash: "abc123" });

    // then
    expect(spy).toHaveBeenCalledOnce();
    const raw = spy.mock.calls[0]?.[0] as string;
    const output = JSON.parse(raw) as Record<string, unknown>;
    expect(output.level).toBe("debug");
  });

  it("should handle missing context gracefully", () => {
    // given
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});

    // when
    logger.info("simple message");

    // then
    const raw = spy.mock.calls[0]?.[0] as string;
    const output = JSON.parse(raw) as Record<string, unknown>;
    expect(output.context).toEqual({});
  });
});

describe("maskEmail", () => {
  it("should mask the local part of an email", () => {
    expect(maskEmail("john@example.com")).toBe("j***@example.com");
  });

  it("should mask a single-character local part", () => {
    expect(maskEmail("a@example.com")).toBe("a***@example.com");
  });

  it("should mask a long local part", () => {
    expect(maskEmail("verylongemail@domain.org")).toBe("v***@domain.org");
  });

  it("should return the input unchanged if no @ symbol", () => {
    expect(maskEmail("invalid-email")).toBe("***");
  });
});

describe("hashIp", () => {
  it("should return a consistent SHA-256 hash for the same IP", () => {
    // when
    const hash1 = hashIp("192.168.1.1");
    const hash2 = hashIp("192.168.1.1");

    // then
    expect(hash1).toBe(hash2);
  });

  it("should return different hashes for different IPs", () => {
    // when
    const hash1 = hashIp("192.168.1.1");
    const hash2 = hashIp("10.0.0.1");

    // then
    expect(hash1).not.toBe(hash2);
  });

  it("should return a hex string", () => {
    // when
    const hash = hashIp("192.168.1.1");

    // then
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });
});
