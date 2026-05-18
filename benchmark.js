async function fetchIndicator(indicator, dateRange) {
  try {
    const res = await fetch(
      `https://api.worldbank.org/v2/country/all/indicator/${indicator}?format=json&per_page=10000&date=${dateRange}`
    );
    const json = await res.json();
    return json?.[1] || [];
  } catch { return []; }
}

const indicators = [
  { key: "NY.GDP.PCAP.CD", label: "GDP per capita" },
  { key: "FP.CPI.TOTL.ZG", label: "Inflation" },
  { key: "NY.GDP.MKTP.KD.ZG", label: "Growth" },
];

async function runSequential() {
  const start = Date.now();
  for (const ind of indicators) {
    await fetchIndicator(ind.key, "2000:2020");
  }
  return Date.now() - start;
}

async function runConcurrent() {
  const start = Date.now();
  await Promise.all(indicators.map(ind => fetchIndicator(ind.key, "2000:2020")));
  return Date.now() - start;
}

async function run() {
  console.log("Warming up...");
  await runSequential();
  await runConcurrent();

  console.log("Running baseline (sequential)...");
  let seqTotal = 0;
  for(let i = 0; i < 3; i++) {
    seqTotal += await runSequential();
  }
  const seqAvg = seqTotal / 3;
  console.log(`Sequential Average: ${seqAvg}ms`);

  console.log("Running optimized (concurrent)...");
  let conTotal = 0;
  for(let i = 0; i < 3; i++) {
    conTotal += await runConcurrent();
  }
  const conAvg = conTotal / 3;
  console.log(`Concurrent Average: ${conAvg}ms`);

  console.log(`Improvement: ${((seqAvg - conAvg) / seqAvg * 100).toFixed(2)}%`);
}

run();
