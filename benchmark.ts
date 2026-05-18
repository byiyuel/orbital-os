import { performance } from "perf_hooks";

interface TimeSeriesEntry {
  year: number;
  gdp: number | null;
  gdpGrowth: number | null;
  inflation: number | null;
}

// Generate some sample data
const timeSeries: TimeSeriesEntry[] = [];
for (let i = 0; i < 10000; i++) {
  timeSeries.push({
    year: 1900 + i,
    gdp: i < 9900 ? i : null,
    gdpGrowth: i < 9800 ? i : null,
    inflation: i < 9700 ? i : null,
  });
}

function original() {
  const latestGdp = timeSeries.findLast((e) => e.gdp !== null);
  const latestGrowth = timeSeries.findLast((e) => e.gdpGrowth !== null);
  const latestInflation = timeSeries.findLast((e) => e.inflation !== null);
  return { latestGdp, latestGrowth, latestInflation };
}

function optimized() {
  let latestGdp: TimeSeriesEntry | undefined;
  let latestGrowth: TimeSeriesEntry | undefined;
  let latestInflation: TimeSeriesEntry | undefined;

  for (let i = timeSeries.length - 1; i >= 0; i--) {
    const e = timeSeries[i];
    if (!latestGdp && e.gdp !== null) latestGdp = e;
    if (!latestGrowth && e.gdpGrowth !== null) latestGrowth = e;
    if (!latestInflation && e.inflation !== null) latestInflation = e;
    if (latestGdp && latestGrowth && latestInflation) break;
  }

  return { latestGdp, latestGrowth, latestInflation };
}

// Warmup
for (let i = 0; i < 1000; i++) {
  original();
  optimized();
}

// Benchmark original
const ITERATIONS = 10000;
let start = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  original();
}
let end = performance.now();
const originalTime = end - start;
console.log(`Original: ${originalTime.toFixed(2)}ms`);

// Benchmark optimized
start = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  optimized();
}
end = performance.now();
const optimizedTime = end - start;
console.log(`Optimized: ${optimizedTime.toFixed(2)}ms`);
console.log(`Improvement: ${((originalTime - optimizedTime) / originalTime * 100).toFixed(2)}%`);
