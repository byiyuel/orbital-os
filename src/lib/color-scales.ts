import * as d3 from "d3";

export type LayerType = "gdp" | "inflation" | "growth";

export interface LayerConfig {
  key: LayerType;
  label: string;
  indicator: string;
  unit: string;
  format: (v: number) => string;
  domain: [number, number];
  interpolator: (t: number) => string;
  noDataColor: string;
}

// 5-stop gradient interpolators for rich color differentiation
const gdpInterpolator = d3.interpolateRgbBasis(["#00ff88", "#44cc66", "#ddaa22", "#ff6633", "#ff3344"]);
const inflationInterpolator = d3.interpolateRgbBasis(["#00ff88", "#55cc55", "#aaaa33", "#dd7722", "#ff4433", "#cc1133"]);
const growthInterpolator = d3.interpolateRgbBasis(["#ff3344", "#cc5544", "#886655", "#666666", "#558866", "#33bb55", "#00ff88"]);

export const LAYER_CONFIGS: Record<LayerType, LayerConfig> = {
  gdp: {
    key: "gdp",
    label: "GDP",
    indicator: "NY.GDP.PCAP.CD",
    unit: "$/capita",
    format: (v) => v >= 1000 ? `$${(v / 1000).toFixed(1)}K` : `$${v.toFixed(0)}`,
    domain: [500, 80000],
    interpolator: gdpInterpolator,
    noDataColor: "#333333",
  },
  inflation: {
    key: "inflation",
    label: "INFLATION",
    indicator: "FP.CPI.TOTL.ZG",
    unit: "%",
    format: (v) => `${v.toFixed(1)}%`,
    domain: [0, 15],
    interpolator: inflationInterpolator,
    noDataColor: "#333333",
  },
  growth: {
    key: "growth",
    label: "GROWTH",
    indicator: "NY.GDP.MKTP.KD.ZG",
    unit: "%",
    format: (v) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`,
    domain: [-5, 8],
    interpolator: growthInterpolator,
    noDataColor: "#333333",
  },
};

/**
 * Get a CSS color string for a given value and layer type.
 * GDP uses sqrt normalization to spread low-to-mid values.
 * Returns noDataColor for null/undefined values.
 */
export function getColor(layer: LayerType, value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return LAYER_CONFIGS[layer].noDataColor;
  }
  const config = LAYER_CONFIGS[layer];
  const [min, max] = config.domain;
  const clamped = Math.max(min, Math.min(max, value));

  let t: number;
  if (layer === "gdp") {
    // Sqrt normalization: spreads low-to-mid range for better differentiation
    t = Math.sqrt((clamped - min) / (max - min));
  } else {
    t = (clamped - min) / (max - min);
  }

  return config.interpolator(t);
}

/**
 * Economic events for the timeline
 */
export const ECONOMIC_EVENTS = [
  { year: 1997, label: "Asian Financial Crisis", color: "#ffaa00" },
  { year: 2001, label: "Dot-com Crash", color: "#ff6644" },
  { year: 2008, label: "Global Financial Crisis", color: "#ff3344" },
  { year: 2020, label: "COVID-19 Pandemic", color: "#ff3344" },
] as const;

export const YEAR_MIN = 1990;
export const YEAR_MAX = 2024;
