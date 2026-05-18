interface TimeSeriesEntry {
  year: number;
  gdp: number | null;
  gdpGrowth: number | null;
  inflation: number | null;
}

const timeSeries: TimeSeriesEntry[] = [];
for (let i = 0; i < 15; i++) {
  timeSeries.push({
    year: 2010 + i,
    gdp: i < 10 ? 1000 : null,
    gdpGrowth: i < 12 ? 2.5 : null,
    inflation: i < 8 ? 3.0 : null,
  });
}

function original() {
  const latestGdp = timeSeries.findLast((e) => e.gdp !== null);
  const latestGrowth = timeSeries.findLast((e) => e.gdpGrowth !== null);
  const latestInflation = timeSeries.findLast((e) => e.inflation !== null);
  return {
    gdp: latestGdp?.gdp ?? null,
    gdpGrowth: latestGrowth?.gdpGrowth ?? null,
    inflation: latestInflation?.inflation ?? null,
  };
}

function optimized() {
  let gdp: number | null = null;
  let gdpGrowth: number | null = null;
  let inflation: number | null = null;
  for (let i = timeSeries.length - 1; i >= 0; i--) {
    const e = timeSeries[i];
    if (gdp === null && e.gdp !== null) gdp = e.gdp;
    if (gdpGrowth === null && e.gdpGrowth !== null) gdpGrowth = e.gdpGrowth;
    if (inflation === null && e.inflation !== null) inflation = e.inflation;
    if (gdp !== null && gdpGrowth !== null && inflation !== null) break;
  }
  return {
    gdp,
    gdpGrowth,
    inflation,
  };
}

// Warmup
for (let i = 0; i < 10000; i++) {
  original();
  optimized();
}

const iter = 1_000_000;
const t1 = performance.now();
for (let i = 0; i < iter; i++) {
  original();
}
const t2 = performance.now();
for (let i = 0; i < iter; i++) {
  optimized();
}
const t3 = performance.now();

console.log(`Original: ${(t2 - t1).toFixed(2)} ms`);
console.log(`Optimized: ${(t3 - t2).toFixed(2)} ms`);
