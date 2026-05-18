import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

/**
 * Hardcoded list of supported countries (top 30 by GDP + key economies).
 * No database needed — this is static reference data.
 */
const COUNTRIES = [
  { code: "USA", name: "United States", region: "North America", incomeGroup: "High income" },
  { code: "CHN", name: "China", region: "East Asia & Pacific", incomeGroup: "Upper middle income" },
  { code: "JPN", name: "Japan", region: "East Asia & Pacific", incomeGroup: "High income" },
  { code: "DEU", name: "Germany", region: "Europe & Central Asia", incomeGroup: "High income" },
  { code: "IND", name: "India", region: "South Asia", incomeGroup: "Lower middle income" },
  { code: "GBR", name: "United Kingdom", region: "Europe & Central Asia", incomeGroup: "High income" },
  { code: "FRA", name: "France", region: "Europe & Central Asia", incomeGroup: "High income" },
  { code: "BRA", name: "Brazil", region: "Latin America & Caribbean", incomeGroup: "Upper middle income" },
  { code: "ITA", name: "Italy", region: "Europe & Central Asia", incomeGroup: "High income" },
  { code: "CAN", name: "Canada", region: "North America", incomeGroup: "High income" },
  { code: "KOR", name: "South Korea", region: "East Asia & Pacific", incomeGroup: "High income" },
  { code: "AUS", name: "Australia", region: "East Asia & Pacific", incomeGroup: "High income" },
  { code: "MEX", name: "Mexico", region: "Latin America & Caribbean", incomeGroup: "Upper middle income" },
  { code: "ESP", name: "Spain", region: "Europe & Central Asia", incomeGroup: "High income" },
  { code: "IDN", name: "Indonesia", region: "East Asia & Pacific", incomeGroup: "Upper middle income" },
  { code: "NLD", name: "Netherlands", region: "Europe & Central Asia", incomeGroup: "High income" },
  { code: "SAU", name: "Saudi Arabia", region: "Middle East & North Africa", incomeGroup: "High income" },
  { code: "TUR", name: "Turkey", region: "Europe & Central Asia", incomeGroup: "Upper middle income" },
  { code: "CHE", name: "Switzerland", region: "Europe & Central Asia", incomeGroup: "High income" },
  { code: "POL", name: "Poland", region: "Europe & Central Asia", incomeGroup: "High income" },
  { code: "SWE", name: "Sweden", region: "Europe & Central Asia", incomeGroup: "High income" },
  { code: "NOR", name: "Norway", region: "Europe & Central Asia", incomeGroup: "High income" },
  { code: "ARG", name: "Argentina", region: "Latin America & Caribbean", incomeGroup: "Upper middle income" },
  { code: "NGA", name: "Nigeria", region: "Sub-Saharan Africa", incomeGroup: "Lower middle income" },
  { code: "ZAF", name: "South Africa", region: "Sub-Saharan Africa", incomeGroup: "Upper middle income" },
  { code: "EGY", name: "Egypt", region: "Middle East & North Africa", incomeGroup: "Lower middle income" },
  { code: "RUS", name: "Russia", region: "Europe & Central Asia", incomeGroup: "Upper middle income" },
  { code: "THA", name: "Thailand", region: "East Asia & Pacific", incomeGroup: "Upper middle income" },
  { code: "MYS", name: "Malaysia", region: "East Asia & Pacific", incomeGroup: "Upper middle income" },
  { code: "PHL", name: "Philippines", region: "East Asia & Pacific", incomeGroup: "Lower middle income" },
];

/**
 * GET /api/countries
 * Return all supported countries.
 * Supports ?search= query parameter for filtering by name or code.
 */
export async function GET(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "127.0.0.1";
  const limit = checkRateLimit(ip);
  if (!limit.success) return rateLimitResponse(limit.resetIn);

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.slice(0, 100).trim().toLowerCase();

  const filtered = search
    ? COUNTRIES.filter(
        (c) =>
          c.name.toLowerCase().includes(search) ||
          c.code.toLowerCase().includes(search)
      )
    : COUNTRIES;

  return NextResponse.json(
    { count: filtered.length, countries: filtered },
    { headers: { "X-Rate-Limit-Remaining": limit.remaining.toString() } }
  );
}
