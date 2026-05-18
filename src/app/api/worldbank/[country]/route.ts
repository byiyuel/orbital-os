import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import {
  fetchWithCache,
  WB_API_BASE,
  WB_INDICATORS,
} from "@/lib/cache";

interface WorldBankEntry {
  date: string;
  value: number | null;
  country: { value: string };
  countryiso3code: string;
}

interface TimeSeriesEntry {
  year: number;
  gdp: number | null;
  gdpGrowth: number | null;
  inflation: number | null;
}

/**
 * GET /api/worldbank/[country]
 * Fetch GDP, inflation, growth from World Bank API.
 * Uses Next.js fetch caching (24h) — no database required.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ country: string }> }
) {
  const { country } = await params;
  const countryCode = country.toUpperCase();

  // Rate limiting
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "127.0.0.1";
  const limit = checkRateLimit(ip);
  if (!limit.success) return rateLimitResponse(limit.resetIn);

  try {
    // Fetch all three indicators in parallel from World Bank
    const [gdpData, growthData, inflationData] = await Promise.all([
      fetchWithCache(
        `${WB_API_BASE}/country/${countryCode}/indicator/${WB_INDICATORS.GDP_NOMINAL}?format=json&date=2010:2024&per_page=50`
      ).catch(() => null),
      fetchWithCache(
        `${WB_API_BASE}/country/${countryCode}/indicator/${WB_INDICATORS.GDP_GROWTH}?format=json&date=2010:2024&per_page=50`
      ).catch(() => null),
      fetchWithCache(
        `${WB_API_BASE}/country/${countryCode}/indicator/${WB_INDICATORS.INFLATION}?format=json&date=2010:2024&per_page=50`
      ).catch(() => null),
    ]);

    // Validate at least one source returned data
    if (!gdpData?.[1] && !growthData?.[1] && !inflationData?.[1]) {
      return NextResponse.json(
        { error: "Country not found or no data available", code: countryCode },
        { status: 404 }
      );
    }

    // Extract country name
    const countryName =
      (gdpData?.[1] as WorldBankEntry[])?.[0]?.country?.value ??
      (growthData?.[1] as WorldBankEntry[])?.[0]?.country?.value ??
      countryCode;

    // Build year-indexed map for time series
    const yearMap = new Map<number, TimeSeriesEntry>();
    const processEntries = (
      entries: WorldBankEntry[] | null,
      field: keyof TimeSeriesEntry
    ) => {
      if (!entries) return;
      for (const entry of entries) {
        if (entry.value === null) continue;
        const year = parseInt(entry.date);
        if (isNaN(year)) continue;
        const existing = yearMap.get(year) ?? {
          year,
          gdp: null,
          gdpGrowth: null,
          inflation: null,
        };
        (existing[field] as number | null) = entry.value;
        yearMap.set(year, existing);
      }
    };

    processEntries(gdpData?.[1] as WorldBankEntry[] | null, "gdp");
    processEntries(growthData?.[1] as WorldBankEntry[] | null, "gdpGrowth");
    processEntries(inflationData?.[1] as WorldBankEntry[] | null, "inflation");

    const timeSeries = Array.from(yearMap.values()).sort(
      (a, b) => a.year - b.year
    );

    // Build latest metrics
    let latestGdp: TimeSeriesEntry | undefined = undefined;
    let latestGrowth: TimeSeriesEntry | undefined = undefined;
    let latestInflation: TimeSeriesEntry | undefined = undefined;

    for (let i = timeSeries.length - 1; i >= 0; i--) {
      const e = timeSeries[i];
      if (latestGdp === undefined && e.gdp !== null) latestGdp = e;
      if (latestGrowth === undefined && e.gdpGrowth !== null) latestGrowth = e;
      if (latestInflation === undefined && e.inflation !== null) latestInflation = e;

      if (latestGdp !== undefined && latestGrowth !== undefined && latestInflation !== undefined) {
        break;
      }
    }

    return NextResponse.json(
      {
        country: countryName,
        code: countryCode,
        metrics: {
          gdp: latestGdp?.gdp ?? null,
          gdpGrowth: latestGrowth?.gdpGrowth ?? null,
          inflation: latestInflation?.inflation ?? null,
        },
        timeSeries,
        fetchedAt: new Date().toISOString(),
      },
      {
        headers: {
          "X-Rate-Limit-Remaining": limit.remaining.toString(),
        },
      }
    );
  } catch (error) {
    console.error(`[API] worldbank/${countryCode} error:`, error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
