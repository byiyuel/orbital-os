import { describe, it, expect } from "vitest";
import { isCacheFresh, buildCachedResponse, WB_INDICATORS } from "@/lib/cache";

describe("isCacheFresh", () => {
  it("returns true for recent timestamps", () => {
    const now = new Date();
    expect(isCacheFresh(now)).toBe(true);
  });

  it("returns true for timestamps within 24 hours", () => {
    const recent = new Date(Date.now() - 23 * 60 * 60 * 1000); // 23 hours ago
    expect(isCacheFresh(recent)).toBe(true);
  });

  it("returns false for timestamps older than 24 hours", () => {
    const old = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
    expect(isCacheFresh(old)).toBe(false);
  });

  it("handles ISO string input", () => {
    const now = new Date().toISOString();
    expect(isCacheFresh(now)).toBe(true);
  });
});

describe("buildCachedResponse", () => {
  it("wraps data with cache metadata", () => {
    const data = { value: 42 };
    const result = buildCachedResponse(data, "fresh");
    expect(result.data).toEqual(data);
    expect(result.source).toBe("fresh");
    expect(result.cachedAt).toBeDefined();
    expect(result.isStale).toBe(false);
  });

  it("marks old timestamps as stale", () => {
    const oldDate = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const result = buildCachedResponse({}, "cache", oldDate);
    expect(result.isStale).toBe(true);
  });
});

describe("WB_INDICATORS", () => {
  it("has all required indicator codes", () => {
    expect(WB_INDICATORS.GDP_NOMINAL).toBe("NY.GDP.MKTP.CD");
    expect(WB_INDICATORS.GDP_GROWTH).toBe("NY.GDP.MKTP.KD.ZG");
    expect(WB_INDICATORS.INFLATION).toBe("FP.CPI.TOTL.ZG");
    expect(WB_INDICATORS.UNEMPLOYMENT).toBe("SL.UEM.TOTL.ZS");
  });
});
