import { adaptWorldBankDataForRecharts, getLatestValue, formatFinancial } from "@/utils/adapters";
import EconomicChart from "@/components/charts/EconomicChart";
import { ArrowLeft, ShieldCheck, TrendingUp, Activity, Users, Percent, BarChart3, Database, ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  const topCountries = ["usa", "chn", "deu", "jpn", "ind", "gbr", "fra", "tur", "bra", "ita"];
  return topCountries.map((code) => ({
    countryCode: code,
  }));
}

const INDICATORS = {
  GDP_NOMINAL: "NY.GDP.MKTP.CD",
  GDP_GROWTH: "NY.GDP.MKTP.KD.ZG",
  INFLATION: "FP.CPI.TOTL.ZG",
  UNEMPLOYMENT: "SL.UEM.TOTL.ZS",
  INTEREST_RATE: "FR.INR.LEND",
  GDP_PER_CAPITA: "NY.GDP.PCAP.CD"
};

async function getIndicatorData(countryCode: string, indicator: string) {
  const url = `https://api.worldbank.org/v2/country/${countryCode}/indicator/${indicator}?format=json&date=2010:2023`;
  try {
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    return res.json();
  } catch (e) {
    return null;
  }
}

export default async function CountryPage({ params }: { params: Promise<{ countryCode: string }> }) {
  const { countryCode } = await params;

  const [gdpRaw, growthRaw, cpiRaw, unemployRaw, interestRaw, pcapRaw] = await Promise.all([
    getIndicatorData(countryCode, INDICATORS.GDP_NOMINAL),
    getIndicatorData(countryCode, INDICATORS.GDP_GROWTH),
    getIndicatorData(countryCode, INDICATORS.INFLATION),
    getIndicatorData(countryCode, INDICATORS.UNEMPLOYMENT),
    getIndicatorData(countryCode, INDICATORS.INTEREST_RATE),
    getIndicatorData(countryCode, INDICATORS.GDP_PER_CAPITA)
  ]);

  if (!gdpRaw || !gdpRaw[1]) {
    notFound();
  }

  const countryName = gdpRaw[1][0]?.country.value;

  const summary = {
    gdp: getLatestValue(gdpRaw),
    growth: getLatestValue(growthRaw),
    inflation: getLatestValue(cpiRaw),
    unemployment: getLatestValue(unemployRaw),
    interest: getLatestValue(interestRaw),
    perCapita: getLatestValue(pcapRaw)
  };

  return (
    <div className="min-h-screen bg-[#02040a] text-[#00ff88] font-mono p-4 md:p-12 selection:bg-[#00ff88]/30">
      <div className="scanline-effect"></div>
      
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#00ff88 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-12 pb-20">
        <Link 
          href="/" 
          className="inline-flex items-center gap-3 text-[10px] font-black tracking-[0.3em] uppercase group"
        >
          <div className="w-8 h-8 rounded-full border border-[#00ff88]/30 flex items-center justify-center group-hover:bg-[#00ff88]/10 transition-all text-[#00ff88]">
            <ArrowLeft size={14} />
          </div>
          <span className="opacity-60 group-hover:opacity-100 transition-opacity">SYS_RECOVERY: BACK_TO_ORBIT</span>
        </Link>

        <header className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-end border-b border-[#00ff88]/10 pb-12">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-4 text-[10px] font-black tracking-[0.4em] opacity-40 uppercase">
              <BarChart3 size={16} /> DATA_STREAM_ANALYSIS
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white uppercase leading-none drop-shadow-[0_0_30px_rgba(0,255,136,0.2)]">
              {countryName}
            </h1>
            <div className="flex flex-wrap gap-4 pt-4 text-[9px] font-bold tracking-[0.2em] uppercase">
              <div className="px-3 py-1 rounded-full border border-[#00ff88]/20 bg-[#00ff88]/5">NODE_ID: {countryCode.toUpperCase()}</div>
              <div className="px-3 py-1 rounded-full border border-[#00ff88]/20 bg-[#00ff88]/5">GRID_LAYER: QUANTUM_MACRO</div>
              <div className="px-3 py-1 rounded-full border border-[#00ff88]/20 bg-[#00ff88]/5 flex items-center gap-2">
                <span className="w-1 h-1 bg-[#00ff88] rounded-full animate-ping"></span>
                UPLINK: ACTIVE
              </div>
            </div>
          </div>
          
          <div className="glass-panel p-6 rounded-2xl space-y-4 border-l-4 border-l-[#00ff88]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black tracking-widest opacity-40 uppercase">Economic_Scale</span>
              <Database size={16} className="text-[#00ff88]" />
            </div>
            <div className="text-2xl font-black text-white tracking-tighter text-glow">
              {formatFinancial(summary.gdp?.value)}
            </div>
            <div className="text-[9px] opacity-40 uppercase tracking-widest">Total Nominal GDP (Current USD)</div>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <SummaryCard 
            title="ANNUAL_GROWTH" 
            value={formatFinancial(summary.growth?.value, 'percent')} 
            icon={<TrendingUp size={18} />} 
            trend={Number(summary.growth?.value) > 0 ? "UP" : "DOWN"} 
          />
          <SummaryCard 
            title="CPI_INFLATION" 
            value={formatFinancial(summary.inflation?.value, 'percent')} 
            icon={<Activity size={18} />} 
            trend={Number(summary.inflation?.value) < 5 ? "STABLE" : "HIGH"} 
          />
          <SummaryCard 
            title="UNEMPLOYMENT" 
            value={formatFinancial(summary.unemployment?.value, 'percent')} 
            icon={<Users size={18} />} 
            trend={Number(summary.unemployment?.value) < 10 ? "OPTIMAL" : "CRITICAL"} 
          />
          <SummaryCard 
            title="WEALTH_INDEX" 
            value={formatFinancial(summary.perCapita?.value, 'pcap')} 
            icon={<Wallet size={18} />} 
            trend="NEUTRAL" 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-12">
          <section className="space-y-8">
            <SectionHeader title="PRODUCTION_&_GROWTH" icon={<Database size={14}/>} />
            <div className="space-y-6">
              <EconomicChart data={adaptWorldBankDataForRecharts(gdpRaw)} title="GDP PROGRESSION (NOMINAL USD)" />
              <EconomicChart data={adaptWorldBankDataForRecharts(growthRaw)} title="REAL GROWTH HISTORY (%)" />
              <EconomicChart data={adaptWorldBankDataForRecharts(pcapRaw)} title="GDP PER CAPITA (USD)" />
            </div>
          </section>

          <section className="space-y-8">
            <SectionHeader title="STABILITY_&_RESOURCES" icon={<Activity size={14}/>} />
            <div className="space-y-6">
              <EconomicChart data={adaptWorldBankDataForRecharts(cpiRaw)} title="CONSUMER PRICE INDEX (%)" />
              <EconomicChart data={adaptWorldBankDataForRecharts(unemployRaw)} title="UNEMPLOYMENT TREND (%)" />
              {interestRaw && interestRaw[1] && (
                <EconomicChart data={adaptWorldBankDataForRecharts(interestRaw)} title="CAPITAL_LENDING_COST (%)" />
              )}
            </div>
          </section>
        </div>

        <footer className="pt-20 pb-12 border-t border-[#00ff88]/10 flex flex-col md:flex-row justify-between items-center gap-6 opacity-30 text-[9px] font-bold tracking-[0.3em] uppercase text-center md:text-left">
          <div>TERMINAL_SYNC: OK_STABLE</div>
          <div>QUANT_ENGINE_LOAD: 0.12ms</div>
          <div>BUILD: NEXT_APP_ROUTER_15_STABLE</div>
        </footer>
      </div>
    </div>
  );
}

function SectionHeader({ title, icon }: { title: string, icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 mb-4 text-center md:text-left">
      <div className="p-2 border border-[#00ff88]/30 rounded-lg text-[#00ff88]">{icon}</div>
      <h2 className="text-xs font-black tracking-[0.4em] uppercase text-white/60">{title}</h2>
      <div className="flex-grow h-[1px] bg-gradient-to-r from-[#00ff88]/20 to-transparent"></div>
    </div>
  );
}

function SummaryCard({ title, value, icon, trend }: { title: string, value: string, icon: React.ReactNode, trend: string }) {
  const isUp = trend === "UP" || trend === "STABLE" || trend === "OPTIMAL";
  const isDown = trend === "DOWN" || trend === "HIGH" || trend === "CRITICAL";

  return (
    <div className="glass-panel p-8 rounded-2xl relative overflow-hidden group hover:border-[#00ff88]/50 transition-all duration-500 hover:translate-y-[-4px]">
      <div className="flex justify-between items-start mb-6">
        <span className="text-[9px] font-black tracking-[0.2em] uppercase opacity-40 group-hover:opacity-100 transition-opacity">// {title}</span>
        <div className="text-[#00ff88]/30 group-hover:text-[#00ff88] transition-colors">{icon}</div>
      </div>
      
      <div className="flex items-baseline gap-3">
        <div className="text-4xl font-black tracking-tighter text-white group-hover:text-[#00ff88] transition-all">
          {value}
        </div>
        {trend !== "NEUTRAL" && (
          <div className={`flex items-center gap-1 text-[10px] font-bold ${isUp ? "text-emerald-400" : isDown ? "text-rose-400" : "text-sky-400"}`}>
            {isUp ? <ArrowUpRight size={12} /> : isDown ? <ArrowDownRight size={12} /> : null}
            {trend}
          </div>
        )}
      </div>
      
      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#00ff88]/0 group-hover:border-[#00ff88]/20 transition-all m-2"></div>
    </div>
  );
}
