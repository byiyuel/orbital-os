import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

/**
 * GET /api/countries
 * Return all supported countries from the database.
 * Supports ?search= query parameter for filtering by name or code.
 */
export async function GET(request: NextRequest) {
  // Rate limiting
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "127.0.0.1";
  const limit = checkRateLimit(ip);
  if (!limit.success) return rateLimitResponse(limit.resetIn);

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();

    const countries = await prisma.country.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { code: { contains: search.toUpperCase(), mode: "insensitive" } },
            ],
          }
        : undefined,
      include: {
        snapshots: {
          orderBy: { year: "desc" },
          take: 1,
          select: {
            year: true,
            gdp: true,
            gdpGrowth: true,
            inflation: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const result = countries.map((c) => ({
      code: c.code,
      name: c.name,
      region: c.region,
      incomeGroup: c.incomeGroup,
      latestSnapshot: c.snapshots[0] ?? null,
    }));

    return NextResponse.json(
      {
        count: result.length,
        countries: result,
      },
      {
        headers: {
          "X-Rate-Limit-Remaining": limit.remaining.toString(),
        },
      }
    );
  } catch (error) {
    console.error("[API] countries error:", error);
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
