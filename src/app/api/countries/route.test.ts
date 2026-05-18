import { describe, it, expect, vi } from "vitest";
import { GET } from "./route";
import { NextRequest } from "next/server";

// Mock the rate limiter
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: () => ({ success: true, remaining: 100 }),
  rateLimitResponse: () => new Response("Rate limited", { status: 429 }),
}));

describe("GET /api/countries", () => {
  it("should return all countries when no search param is provided", async () => {
    const req = new NextRequest("http://localhost/api/countries");
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.count).toBe(30);
    expect(data.countries.length).toBe(30);
  });

  it("should return filtered countries when a valid search param is provided", async () => {
    const req = new NextRequest("http://localhost/api/countries?search=United");
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    // Should return "United States" and "United Kingdom"
    expect(data.count).toBe(2);
    expect(data.countries.length).toBe(2);
    expect(data.countries[0].name).toBe("United States");
    expect(data.countries[1].name).toBe("United Kingdom");
  });

  it("should handle an excessively long search string by slicing it", async () => {
    // Generate a string longer than 100 characters (e.g., 200 characters)
    const longString = "a".repeat(200);
    const req = new NextRequest(`http://localhost/api/countries?search=${longString}`);
    const response = await GET(req);
    const data = await response.json();

    // Since it's sliced, the request shouldn't crash, and should probably just return 0 results
    expect(response.status).toBe(200);
    expect(data.count).toBe(0);
    expect(data.countries.length).toBe(0);
  });
});
