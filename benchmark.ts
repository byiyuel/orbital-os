import { performance } from 'perf_hooks';

interface TimeSeriesEntry {
  year: number;
  gdp: number | null;
  gdpGrowth: number | null;
  inflation: number | null;
}

// Generate some dummy data
const timeSeries: TimeSeriesEntry[] = [];
for (let i = 0; i < 10000; i++) {
  timeSeries.push({
    year: 1900 + i,
    gdp: i < 5000 ? Math.random() : null, // Not at the very end
    gdpGrowth: i < 3000 ? Math.random() : null,
    inflation: i < 8000 ? Math.random() : null,
  });
}

function original() {
  const latestGdp = timeSeries.findLast((e) => e.gdp !== null);
  const latestGrowth = timeSeries.findLast((e) => e.gdpGrowth !== null);
  const latestInflation = timeSeries.findLast((e) => e.inflation !== null);
  return [latestGdp, latestGrowth, latestInflation];
}

function optimized() {
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
  return [latestGdp, latestGrowth, latestInflation];
}

// Warmup
for (let i = 0; i < 1000; i++) {
  original();
  optimized();
}

const ITERATIONS = 10000;

const startOriginal = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  original();
}
const endOriginal = performance.now();

const startOptimized = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  optimized();
}
const endOptimized = performance.now();

console.log(`Original: ${(endOriginal - startOriginal).toFixed(2)}ms`);
console.log(`Optimized: ${(endOptimized - startOptimized).toFixed(2)}ms`);
