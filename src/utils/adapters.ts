// Adapter to convert complex JSON from World Bank API into a format readable by D3
export function adaptWorldBankDataForD3(rawData: any[]) {
  if (!rawData || !rawData[1] || !Array.isArray(rawData[1])) {
    return [];
  }

  // World Bank data is usually sorted from newest to oldest.
  // We reverse it to show from left to right (oldest to newest) on the chart.
  return rawData[1]
    .map((item: any) => ({
      year: item.date,
      value: item.value !== null ? Number(item.value.toFixed(2)) : null,
    }))
    .filter((item: any) => item.value !== null)
    .reverse();
}

// Simple helper function to extract the latest non-null value
export function getLatestValue(rawData: any[]) {
  if (!rawData || !rawData[1] || !Array.isArray(rawData[1])) return null;
  const latest = rawData[1].find((item: any) => item.value !== null);
  return latest ? { value: latest.value, year: latest.date } : null;
}

// Global Financial Formatter
export function formatFinancial(val: number | string | null, type: 'currency' | 'percent' | 'pcap' = 'currency') {
  if (val === null || val === undefined) return "N/A";
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return "N/A";

  if (type === 'percent') {
    return `${num.toFixed(2)}%`;
  }

  if (type === 'pcap') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(num);
  }

  // Large Currency (GDP)
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  return `$${num.toLocaleString()}`;
}
