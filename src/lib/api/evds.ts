// CBRT EVDS API Utility (Turkey Data)
const EVDS_API_BASE = "https://evds2.tcmb.gov.tr/service/evds";

export async function getTurkeyInflation() {
  const apiKey = process.env.EVDS_API_KEY;
  if (!apiKey) {
    console.warn("EVDS_API_KEY is missing. Returning fallback data.");
    return null;
  }

  // TP.FG.S01: CPI (2003=100) (Monthly)
  const series = "TP.FG.S01";
  const startDate = "01-01-2023";
  const endDate = new Date().toLocaleDateString("tr-TR").replace(/\./g, "-");

  const url = `${EVDS_API_BASE}/series=${series}&startDate=${startDate}&endDate=${endDate}&type=json&key=${apiKey}`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 86400 } // 24-hour ISR
    });
    
    if (!res.ok) throw new Error("EVDS API error");
    
    const data = await res.json();
    return data.items;
  } catch (error) {
    console.error("Inflation Fetch Error:", error);
    return null;
  }
}
