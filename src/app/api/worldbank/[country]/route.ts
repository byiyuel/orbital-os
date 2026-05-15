import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import {
  fetchWithCache,
  isCacheFresh,
  WB_API_BASE,
  WB_INDICATORS,
} from "@/lib/cache";

interface WorldBankEntry {
  date: string;
  value: number | null;
  country: { value: string };
  countryiso3code: string;
}

interface MetricsPayload {
  gdp: number | null;
  gdpGrowth: number | null;
  inflation: number | null;
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
 * Caches responses in the database — skips external fetch if data < 24h old.
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
    // 1. Check database cache first
    const cachedSnapshots = await prisma.economicSnapshot.findMany({
      where: { countryCode },
      orderBy: { year: "desc" },
      take: 20,
    });

    const latestSnapshot = cachedSnapshots[0];
    if (latestSnapshot && isCacheFresh(latestSnapshot.createdAt)) {
      // Cache hit — return from DB
      const countryRecord = await prisma.country.findUnique({
        where: { code: countryCode },
      });

      return NextResponse.json(
        {
          country: countryRecord?.name ?? countryCode,
          code: countryCode,
          metrics: {
            gdp: latestSnapshot.gdp,
            gdpGrowth: latestSnapshot.gdpGrowth,
            inflation: latestSnapshot.inflation,
          },
          timeSeries: cachedSnapshots
            .map((s) => ({
              year: s.year,
              gdp: s.gdp,
              gdpGrowth: s.gdpGrowth,
              inflation: s.inflation,
            }))
            .reverse(),
          cachedAt: latestSnapshot.createdAt.toISOString(),
          source: "cache",
        },
        {
          headers: {
            "X-Data-Source": "database-cache",
            "X-Rate-Limit-Remaining": limit.remaining.toString(),
          },
        }
      );
    }

    // 2. Cache miss or stale — fetch fresh data from World Bank
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

    // Extract country name from any available response
    const countryName =
      (gdpData?.[1] as WorldBankEntry[])?.[0]?.country?.value ??
      (growthData?.[1] as WorldBankEntry[])?.[0]?.country?.value ??
      countryCode;

    // 3. Build year-indexed map for time series
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

    // 4. Persist to database for caching
    try {
      // Upsert country
      await prisma.country.upsert({
        where: { code: countryCode },
        update: { name: countryName },
        create: { code: countryCode, name: countryName },
      });

      // Upsert snapshots
      for (const entry of timeSeries) {
        const existing = await prisma.economicSnapshot.findFirst({
          where: { countryCode, year: entry.year },
        });

        if (existing) {
          await prisma.economicSnapshot.update({
            where: { id: existing.id },
            data: {
              gdp: entry.gdp,
              gdpGrowth: entry.gdpGrowth,
              inflation: entry.inflation,
              createdAt: new Date(),
            },
          });
        } else {
          await prisma.economicSnapshot.create({
            data: {
              countryCode,
              year: entry.year,
              gdp: entry.gdp,
              gdpGrowth: entry.gdpGrowth,
              inflation: entry.inflation,
            },
          });
        }
      }
    } catch (dbError) {
      // Database write failure is non-fatal — still return the data
      console.warn("DB cache write failed:", dbError);
    }

    // 5. Build latest metrics
    const latestGdp = timeSeries.findLast((e) => e.gdp !== null);
    const latestGrowth = timeSeries.findLast((e) => e.gdpGrowth !== null);
    const latestInflation = timeSeries.findLast((e) => e.inflation !== null);

    const metrics: MetricsPayload = {
      gdp: latestGdp?.gdp ?? null,
      gdpGrowth: latestGrowth?.gdpGrowth ?? null,
      inflation: latestInflation?.inflation ?? null,
    };

    return NextResponse.json(
      {
        country: countryName,
        code: countryCode,
        metrics,
        timeSeries,
        cachedAt: new Date().toISOString(),
        source: "fresh",
      },
      {
        headers: {
          "X-Data-Source": "world-bank-api",
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
