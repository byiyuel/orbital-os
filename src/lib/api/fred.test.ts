import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getGlobalInterestRates } from "./fred";

describe("getGlobalInterestRates", () => {
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

  it("returns null and warns if FRED_API_KEY is missing", async () => {
    delete process.env.FRED_API_KEY;
    const result = await getGlobalInterestRates();
    expect(result).toBeNull();
    expect(console.warn).toHaveBeenCalledWith("FRED_API_KEY is missing.");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns observations on successful fetch", async () => {
    process.env.FRED_API_KEY = "test-key";
    const mockObservations = [{ date: "2023-01-01", value: "4.5" }];

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ observations: mockObservations })
    });

    const result = await getGlobalInterestRates();
    expect(result).toEqual(mockObservations);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("api.stlouisfed.org"),
      expect.any(Object)
    );
  });

  it("returns null and logs error on non-ok response status", async () => {
    process.env.FRED_API_KEY = "test-key";

    (global.fetch as any).mockResolvedValue({
      ok: false
    });

    const result = await getGlobalInterestRates();
    expect(result).toBeNull();
    expect(console.error).toHaveBeenCalledWith(
      "FRED Fetch Error:",
      expect.any(Error)
    );
  });

  it("returns null and logs error on network/fetch exception", async () => {
    process.env.FRED_API_KEY = "test-key";

    const networkError = new Error("Network Error");
    (global.fetch as any).mockRejectedValue(networkError);

    const result = await getGlobalInterestRates();
    expect(result).toBeNull();
    expect(console.error).toHaveBeenCalledWith(
      "FRED Fetch Error:",
      networkError
    );
  });
});
