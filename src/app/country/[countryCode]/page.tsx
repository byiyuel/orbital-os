import { getLatestValue, formatFinancial } from "@/utils/adapters";
import CountryDashboard from "@/components/CountryDashboard";
import type { Metadata } from "next";

// On-demand revalidation via Server Action; fallback to 24h ISR
export const revalidate = 86400;

const COUNTRY_NAMES: Record<string, string> = {
  usa: "United States", chn: "China", deu: "Germany", jpn: "Japan",
  ind: "India", gbr: "United Kingdom", fra: "France", tur: "Turkey",
  bra: "Brazil", ita: "Italy", can: "Canada", kor: "South Korea",
  aus: "Australia", mex: "Mexico", esp: "Spain", idn: "Indonesia",
  rus: "Russia", nld: "Netherlands", sau: "Saudi Arabia", che: "Switzerland",
};

export async function generateMetadata({ params }: { params: Promise<{ countryCode: string }> }): Promise<Metadata> {
  const { countryCode } = await params;
  const code = countryCode.toUpperCase();
  const name = COUNTRY_NAMES[countryCode.toLowerCase()] || code;

  // Fetch latest values for OG card
  const fetchVal = async (indicator: string) => {
    try {
      const res = await fetch(`https://api.worldbank.org/v2/country/${code}/indicator/${indicator}?format=json&date=2020:2024&per_page=5`, { next: { revalidate: 86400 } });
      const data = await res.json();
      return getLatestValue(data)?.value ?? null;
    } catch { return null; }
  };

  const [gdpVal, growthVal, inflVal] = await Promise.all([
    fetchVal("NY.GDP.MKTP.CD"),
    fetchVal("NY.GDP.MKTP.KD.ZG"),
    fetchVal("FP.CPI.TOTL.ZG"),
  ]);

  const gdpStr = gdpVal ? formatFinancial(gdpVal) : "N/A";
  const growthStr = growthVal?.toFixed(1) ?? "N/A";
  const inflStr = inflVal?.toFixed(1) ?? "N/A";
  const ogUrl = `/og?country=${encodeURIComponent(name)}&gdp=${encodeURIComponent(gdpStr)}&growth=${growthStr}&inflation=${inflStr}`;

  return {
    title: `${name} — Orbital OS Economic Dashboard`,
    description: `Explore ${name}'s economic indicators: GDP ${gdpStr}, Growth ${growthStr}%, Inflation ${inflStr}%. Powered by World Bank data.`,
    openGraph: {
      title: `${name} — Economic Intelligence`,
      description: `GDP: ${gdpStr} | Growth: ${growthStr}% | Inflation: ${inflStr}%`,
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} — Orbital OS`,
      description: `GDP: ${gdpStr} | Growth: ${growthStr}% | Inflation: ${inflStr}%`,
      images: [ogUrl],
    },
  };
}

const INDICATORS = {
  GDP_NOMINAL: "NY.GDP.MKTP.CD",
  GDP_GROWTH: "NY.GDP.MKTP.KD.ZG",
  INFLATION: "FP.CPI.TOTL.ZG",
  UNEMPLOYMENT: "SL.UEM.TOTL.ZS",
  INTEREST_RATE: "FR.INR.LEND",
  GDP_PER_CAPITA: "NY.GDP.PCAP.CD"
};

async function fetchIndicatorData(countryCode: string, indicator: string) {
  const url = `https://api.worldbank.org/v2/country/${countryCode}/indicator/${indicator}?format=json&date=2010:2023`;
  try {
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return [null, []];
    const data = await res.json();
    return data || [null, []];
  } catch (e) {
    return [null, []];
  }
}

export async function generateStaticParams() {
  const topCountries = ["usa", "chn", "deu", "jpn", "ind", "gbr", "fra", "tur", "bra", "ita"];
  return topCountries.map((code) => ({
    countryCode: code,
  }));
}

export default async function CountryPage({ params }: { params: Promise<{ countryCode: string }> }) {
  const { countryCode } = await params;

  const results = await Promise.allSettled([
    fetchIndicatorData(countryCode, INDICATORS.GDP_NOMINAL),
    fetchIndicatorData(countryCode, INDICATORS.GDP_GROWTH),
    fetchIndicatorData(countryCode, INDICATORS.INFLATION),
    fetchIndicatorData(countryCode, INDICATORS.UNEMPLOYMENT),
    fetchIndicatorData(countryCode, INDICATORS.INTEREST_RATE),
    fetchIndicatorData(countryCode, INDICATORS.GDP_PER_CAPITA)
  ]);

  const [gdpRaw, growthRaw, cpiRaw, unemployRaw, interestRaw, pcapRaw] = results.map(r => 
    r.status === 'fulfilled' ? r.value : [null, []]
  );

  return (
    <div className="min-h-screen bg-[#02040a] text-[#00ff88] font-mono p-4 md:p-12 selection:bg-[#00ff88]/30">
      <div className="scanline-effect"></div>
      
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#00ff88 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

      <CountryDashboard 
        countryCode={countryCode} 
        initialData={{ gdpRaw, growthRaw, cpiRaw, unemployRaw, interestRaw, pcapRaw }} 
      />
    </div>
  );
}
