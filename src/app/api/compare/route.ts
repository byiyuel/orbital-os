import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { fetchWithCache, WB_API_BASE, WB_INDICATORS } from "@/lib/cache";

interface WBEntry { date: string; value: number | null; country: { value: string }; }

async function fetchCountryData(code: string) {
  const c = code.toUpperCase();
  const [gdp, growth, infl] = await Promise.all([
    fetchWithCache(`${WB_API_BASE}/country/${c}/indicator/${WB_INDICATORS.GDP_NOMINAL}?format=json&date=2010:2024&per_page=50`).catch(() => null),
    fetchWithCache(`${WB_API_BASE}/country/${c}/indicator/${WB_INDICATORS.GDP_GROWTH}?format=json&date=2010:2024&per_page=50`).catch(() => null),
    fetchWithCache(`${WB_API_BASE}/country/${c}/indicator/${WB_INDICATORS.INFLATION}?format=json&date=2010:2024&per_page=50`).catch(() => null),
  ]);

  const name = (gdp?.[1] as WBEntry[])?.[0]?.country?.value ?? c;
  const yearMap = new Map<number, { year: number; gdp: number | null; gdpGrowth: number | null; inflation: number | null }>();

  const process = (entries: WBEntry[] | null, field: "gdp" | "gdpGrowth" | "inflation") => {
    if (!entries) return;
    for (const e of entries) {
      if (e.value === null) continue;
      const y = parseInt(e.date);
      if (isNaN(y)) continue;
      const ex = yearMap.get(y) ?? { year: y, gdp: null, gdpGrowth: null, inflation: null };
      ex[field] = e.value;
      yearMap.set(y, ex);
    }
  };

  process(gdp?.[1] as WBEntry[] | null, "gdp");
  process(growth?.[1] as WBEntry[] | null, "gdpGrowth");
  process(infl?.[1] as WBEntry[] | null, "inflation");

  const ts = Array.from(yearMap.values()).sort((a, b) => a.year - b.year);

  let gdp = null, gdpGrowth = null, inflation = null;
  for (let i = ts.length - 1; i >= 0; i--) {
    const e = ts[i];
    if (gdp === null && e.gdp !== null) gdp = e.gdp;
    if (gdpGrowth === null && e.gdpGrowth !== null) gdpGrowth = e.gdpGrowth;
    if (inflation === null && e.inflation !== null) inflation = e.inflation;
    if (gdp !== null && gdpGrowth !== null && inflation !== null) break;
  }

  return {
    country: name, code: c,
    metrics: {
      gdp,
      gdpGrowth,
      inflation,
    },
    timeSeries: ts,
  };
}

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "127.0.0.1";
  const limit = checkRateLimit(ip);
  if (!limit.success) return rateLimitResponse(limit.resetIn);

  try {
    const { searchParams } = new URL(request.url);
    const a = searchParams.get("a");
    const b = searchParams.get("b");

    if (!a || !b) {
      return NextResponse.json({ error: "Missing required query parameters", usage: "/api/compare?a=TUR&b=USA" }, { status: 400 });
    }
    if (a.toUpperCase() === b.toUpperCase()) {
      return NextResponse.json({ error: "Cannot compare a country with itself" }, { status: 400 });
    }

    const [dataA, dataB] = await Promise.all([fetchCountryData(a), fetchCountryData(b)]);

    return NextResponse.json({ comparison: { a: dataA, b: dataB }, fetchedAt: new Date().toISOString() }, {
      headers: { "X-Rate-Limit-Remaining": limit.remaining.toString() },
    });
  } catch (error) {
    console.error("[API] compare error:", error);
    return NextResponse.json({ error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
