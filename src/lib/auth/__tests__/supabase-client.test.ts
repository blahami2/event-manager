import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @supabase/supabase-js before importing the module under test
const mockCreateClient = vi.fn();
vi.mock("@supabase/supabase-js", () => ({
  createClient: mockCreateClient,
}));

describe("supabase-client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();

    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
  });

  describe("createBrowserClient", () => {
    it("should return the same instance when called multiple times", async () => {
      // given
      const mockClient = { auth: {} };
      mockCreateClient.mockReturnValue(mockClient);
      const { createBrowserClient } = await import("../supabase-client");

      // when
      const client1 = createBrowserClient();
      const client2 = createBrowserClient();

      // then
      expect(client1).toBe(client2);
      expect(mockCreateClient).toHaveBeenCalledTimes(1);
    });

    it("should create client with correct URL and anon key when called", async () => {
      // given
      mockCreateClient.mockReturnValue({ auth: {} });
      const { createBrowserClient } = await import("../supabase-client");

      // when
      createBrowserClient();

      // then
      expect(mockCreateClient).toHaveBeenCalledWith(
        "https://test.supabase.co",
        "test-anon-key",
      );
    });

    it("should throw when environment variables are missing", async () => {
      // given
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      const { createBrowserClient } = await import("../supabase-client");

      // when/then
      expect(() => createBrowserClient()).toThrow(
        "Missing Supabase environment variables",
      );
    });

    it("should return a fresh instance after resetBrowserClient is called", async () => {
      // given
      const mockClient1 = { auth: {}, id: 1 };
      const mockClient2 = { auth: {}, id: 2 };
      mockCreateClient
        .mockReturnValueOnce(mockClient1)
        .mockReturnValueOnce(mockClient2);
      const { createBrowserClient, resetBrowserClient } = await import(
        "../supabase-client"
      );

      // when
      const client1 = createBrowserClient();
      resetBrowserClient();
      const client2 = createBrowserClient();

      // then
      expect(client1).not.toBe(client2);
      expect(mockCreateClient).toHaveBeenCalledTimes(2);
    });
  });

  describe("createServerClient", () => {
    it("should create a new client each time when called", async () => {
      // given
      mockCreateClient.mockReturnValue({ auth: {} });
      const { createServerClient } = await import("../supabase-client");

      // when
      createServerClient();
      createServerClient();

      // then - server clients are stateless, new instance each time is fine
      expect(mockCreateClient).toHaveBeenCalledTimes(2);
    });
  });

  describe("createAdminClient", () => {
    it("should create client with service role key when called", async () => {
      // given
      mockCreateClient.mockReturnValue({ auth: {} });
      const { createAdminClient } = await import("../supabase-client");

      // when
      createAdminClient();

      // then
      expect(mockCreateClient).toHaveBeenCalledWith(
        "https://test.supabase.co",
        "test-service-key",
        expect.objectContaining({
          auth: { autoRefreshToken: false, persistSession: false },
        }),
      );
    });
  });
});
