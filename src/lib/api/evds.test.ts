import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getTurkeyInflation } from "./evds";

describe("getTurkeyInflation", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    global.fetch = vi.fn();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("should return null and warn when EVDS_API_KEY is missing", async () => {
    delete process.env.EVDS_API_KEY;
    const result = await getTurkeyInflation();
    expect(result).toBeNull();
    expect(console.warn).toHaveBeenCalledWith("EVDS_API_KEY is missing. Returning fallback data.");
  });

  it("should return data items when fetch is successful", async () => {
    process.env.EVDS_API_KEY = "test_key";
    const mockItems = [{ date: "2023-01", value: "10" }];

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ items: mockItems })
    });

    const result = await getTurkeyInflation();
    expect(result).toEqual(mockItems);
    expect(global.fetch).toHaveBeenCalled();
  });

  it("should return null and log an error when fetch response is not ok", async () => {
    process.env.EVDS_API_KEY = "test_key";

    (global.fetch as any).mockResolvedValue({
      ok: false
    });

    const result = await getTurkeyInflation();
    expect(result).toBeNull();
    expect(console.error).toHaveBeenCalledWith("Inflation Fetch Error:", new Error("EVDS API error"));
  });

  it("should return null and log an error when fetch throws an exception", async () => {
    process.env.EVDS_API_KEY = "test_key";
    const networkError = new Error("Network failure");

    (global.fetch as any).mockRejectedValue(networkError);

    const result = await getTurkeyInflation();
    expect(result).toBeNull();
    expect(console.error).toHaveBeenCalledWith("Inflation Fetch Error:", networkError);
  });
});
