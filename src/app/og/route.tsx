import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get("country") ?? "UNKNOWN";
  const gdp = searchParams.get("gdp") ?? "N/A";
  const growth = searchParams.get("growth") ?? "N/A";
  const inflation = searchParams.get("inflation") ?? "N/A";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px",
          fontFamily: "monospace",
          background: "#0a0a0f",
          color: "#00ff88",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Grid pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(0,255,136,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.03) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Top: Branding + Country */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", position: "relative" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              fontSize: "14px",
              letterSpacing: "0.3em",
              opacity: 0.4,
              fontWeight: 900,
              textTransform: "uppercase",
            }}
          >
            ◉ ORBITAL_OS v2.5
          </div>
          <div
            style={{
              fontSize: "72px",
              fontWeight: 900,
              letterSpacing: "-0.04em",
              color: "white",
              textTransform: "uppercase",
              lineHeight: 1,
              textShadow: "0 0 40px rgba(0,255,136,0.3)",
            }}
          >
            {country}
          </div>
          <div
            style={{
              fontSize: "13px",
              letterSpacing: "0.4em",
              opacity: 0.3,
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            QUANTITATIVE_MACRO_GRID // SECTOR_ANALYSIS
          </div>
        </div>

        {/* Bottom: Metric Cards */}
        <div style={{ display: "flex", gap: "24px", position: "relative" }}>
          {[
            { label: "GDP_NOMINAL", value: gdp, border: "#00ff88" },
            { label: "GDP_GROWTH", value: growth + "%", border: "#00aaff" },
            { label: "INFLATION_CPI", value: inflation + "%", border: "#ff6644" },
          ].map((metric) => (
            <div
              key={metric.label}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                padding: "28px",
                background: "rgba(6,10,20,0.8)",
                border: `1px solid rgba(0,255,136,0.15)`,
                borderLeft: `4px solid ${metric.border}`,
              }}
            >
              <div
                style={{
                  fontSize: "10px",
                  letterSpacing: "0.25em",
                  opacity: 0.4,
                  fontWeight: 900,
                  textTransform: "uppercase",
                }}
              >
                {"// "}
                {metric.label}
              </div>
              <div
                style={{
                  fontSize: "36px",
                  fontWeight: 900,
                  color: "white",
                  letterSpacing: "-0.03em",
                }}
              >
                {metric.value}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom-right: decorative corner */}
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            right: "20px",
            width: "60px",
            height: "60px",
            borderBottom: "2px solid rgba(0,255,136,0.15)",
            borderRight: "2px solid rgba(0,255,136,0.15)",
          }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
