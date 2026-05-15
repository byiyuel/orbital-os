import { describe, it, expect } from "vitest";
import { checkRateLimit } from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  it("allows requests under the limit", () => {
    const testIp = `test-${Date.now()}-allow`;
    const result = checkRateLimit(testIp);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(29);
  });

  it("blocks requests over the limit", () => {
    const testIp = `test-${Date.now()}-block`;
    // Exhaust the limit
    for (let i = 0; i < 30; i++) {
      checkRateLimit(testIp);
    }
    const result = checkRateLimit(testIp);
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.resetIn).toBeGreaterThan(0);
  });

  it("tracks different IPs independently", () => {
    const ip1 = `test-${Date.now()}-ip1`;
    const ip2 = `test-${Date.now()}-ip2`;
    // Exhaust ip1
    for (let i = 0; i < 30; i++) checkRateLimit(ip1);
    // ip2 should still work
    const result = checkRateLimit(ip2);
    expect(result.success).toBe(true);
  });

  it("decrements remaining count", () => {
    const testIp = `test-${Date.now()}-decrement`;
    const r1 = checkRateLimit(testIp);
    const r2 = checkRateLimit(testIp);
    expect(r1.remaining).toBe(29);
    expect(r2.remaining).toBe(28);
  });
});
