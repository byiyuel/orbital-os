/**
 * Caching utility that wraps fetch with timestamps and proper headers.
 * Provides consistent caching behavior across all API routes.
 */

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export interface CachedResponse<T> {
  data: T;
  cachedAt: string;
  isStale: boolean;
  source: "cache" | "fresh";
}

/**
 * Check if a cached timestamp is still fresh (less than 24 hours old).
 */
export function isCacheFresh(cachedAt: Date | string): boolean {
  const cached = typeof cachedAt === "string" ? new Date(cachedAt) : cachedAt;
  return Date.now() - cached.getTime() < CACHE_TTL;
}

/**
 * Fetch from World Bank API with proper error handling.
 * Uses Next.js fetch cache with 24h revalidation.
 */
export async function fetchWithCache(
  url: string,
  options?: { revalidate?: number }
): Promise<any> {
  const revalidate = options?.revalidate ?? 86400; // 24 hours default

  const res = await fetch(url, {
    next: { revalidate },
    headers: {
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

/**
 * Build a standardized API response with cache metadata.
 */
export function buildCachedResponse<T>(
  data: T,
  source: "cache" | "fresh",
  cachedAt?: Date
): CachedResponse<T> {
  const timestamp = cachedAt ?? new Date();
  return {
    data,
    cachedAt: timestamp.toISOString(),
    isStale: !isCacheFresh(timestamp),
    source,
  };
}

/**
 * World Bank API base URL and indicator constants.
 */
export const WB_API_BASE = "https://api.worldbank.org/v2";

export const WB_INDICATORS = {
  GDP_NOMINAL: "NY.GDP.MKTP.CD",
  GDP_GROWTH: "NY.GDP.MKTP.KD.ZG",
  INFLATION: "FP.CPI.TOTL.ZG",
  UNEMPLOYMENT: "SL.UEM.TOTL.ZS",
  INTEREST_RATE: "FR.INR.LEND",
  GDP_PER_CAPITA: "NY.GDP.PCAP.CD",
  DEBT_TO_GDP: "GC.DOD.TOTL.GD.ZS",
} as const;

export type WBIndicatorKey = keyof typeof WB_INDICATORS;
