// FRED API Utility (Federal Reserve Economic Data)
const FRED_API_BASE = "https://api.stlouisfed.org/fred";

export async function getGlobalInterestRates() {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    console.warn("FRED_API_KEY is missing.");
    return null;
  }

  // Örn: FEDFUNDS (Effective Federal Funds Rate)
  const seriesId = "FEDFUNDS";
  const url = `${FRED_API_BASE}/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 86400 }
    });
    
    if (!res.ok) throw new Error("FRED API error");
    
    const data = await res.json();
    return data.observations;
  } catch (error) {
    console.error("FRED Fetch Error:", error);
    return null;
  }
}
