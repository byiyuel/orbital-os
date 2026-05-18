import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getGlobalInterestRates } from "./fred";

describe("getGlobalInterestRates", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    vi.stubGlobal("fetch", vi.fn());
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("returns null and logs a warning if FRED_API_KEY is missing", async () => {
    delete process.env.FRED_API_KEY;

    const result = await getGlobalInterestRates();

    expect(result).toBeNull();
    expect(console.warn).toHaveBeenCalledWith("FRED_API_KEY is missing.");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("fetches data and returns observations on success", async () => {
    process.env.FRED_API_KEY = "test_api_key";

    const mockObservations = [{ date: "2023-01-01", value: "4.33" }];
    const mockResponse = {
      ok: true,
      json: async () => ({ observations: mockObservations }),
    };

    vi.mocked(fetch).mockResolvedValueOnce(mockResponse as Response);

    const result = await getGlobalInterestRates();

    expect(result).toEqual(mockObservations);
    expect(fetch).toHaveBeenCalledWith(
      "https://api.stlouisfed.org/fred/series/observations?series_id=FEDFUNDS&api_key=test_api_key&file_type=json",
      { next: { revalidate: 86400 } }
    );
  });

  it("returns null and logs an error if the response is not ok", async () => {
    process.env.FRED_API_KEY = "test_api_key";

    const mockResponse = {
      ok: false,
    };

    vi.mocked(fetch).mockResolvedValueOnce(mockResponse as Response);

    const result = await getGlobalInterestRates();

    expect(result).toBeNull();
    expect(console.error).toHaveBeenCalledWith("FRED Fetch Error:", expect.any(Error));
  });

  it("returns null and logs an error on network failure", async () => {
    process.env.FRED_API_KEY = "test_api_key";

    const networkError = new Error("Network failure");
    vi.mocked(fetch).mockRejectedValueOnce(networkError);

    const result = await getGlobalInterestRates();

    expect(result).toBeNull();
    expect(console.error).toHaveBeenCalledWith("FRED Fetch Error:", networkError);
  });
});
