"use client";

import { useState, useEffect, useTransition } from "react";
import { adaptWorldBankDataForD3, getLatestValue, formatFinancial } from "@/utils/adapters";
import EconomicChart from "@/components/charts/EconomicChart";
import SummaryCard from "@/components/SummaryCard";
import { ArrowLeft, Activity, Users, TrendingUp, BarChart3, Database, Wallet, Search, X, Loader2, RefreshCw, Clock, Share2, Check } from "lucide-react";
import Link from "next/link";
import { revalidateCountryData } from "@/app/actions";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";

interface DashboardProps {
  countryCode: string;
  initialData: {
    gdpRaw: any;
    growthRaw: any;
    cpiRaw: any;
    unemployRaw: any;
    interestRaw: any;
    pcapRaw: any;
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

const TOP_COUNTRIES = [
  { code: "usa", name: "United States" }, { code: "chn", name: "China" }, 
  { code: "deu", name: "Germany" }, { code: "jpn", name: "Japan" },
  { code: "ind", name: "India" }, { code: "gbr", name: "United Kingdom" },
  { code: "fra", name: "France" }, { code: "tur", name: "Turkey" },
  { code: "bra", name: "Brazil" }, { code: "ita", name: "Italy" },
  { code: "rus", name: "Russia" }, { code: "can", name: "Canada" },
  { code: "kor", name: "South Korea" }, { code: "aus", name: "Australia" }
];

async function fetchIndicatorData(countryCode: string, indicator: string) {
  const url = `https://api.worldbank.org/v2/country/${countryCode}/indicator/${indicator}?format=json&date=2010:2023`;
  const res = await fetch(url);
  if (!res.ok) return [null, []];
  return await res.json();
}

export default function CountryDashboard({ countryCode, initialData }: DashboardProps) {
  const [isComparing, setIsComparing] = useState(false);
  const [compareCountry, setCompareCountry] = useState<any>(null);
  const [isLoadingCompare, setIsLoadingCompare] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [lastRefreshed, setLastRefreshed] = useState<string>(new Date().toISOString());
  const [shareToast, setShareToast] = useState(false);
  const searchParams = useSearchParams();

  const handleRefresh = () => {
    startTransition(async () => {
      await revalidateCountryData(countryCode);
      setLastRefreshed(new Date().toISOString());
      window.location.reload();
    });
  };

  useEffect(() => {
    const compareCode = searchParams.get("compare");
    if (compareCode && compareCode !== countryCode && !compareCountry) {
      handleCompareSelect(compareCode);
      setIsComparing(true);
    }
  }, [searchParams, countryCode]);

  const countryName = initialData.gdpRaw?.[1]?.[0]?.country?.value || countryCode.toUpperCase();

  const handleCompareSelect = async (code: string) => {
    setIsLoadingCompare(true);
    setSearchQuery("");
    try {
      const results = await Promise.all([
        fetchIndicatorData(code, INDICATORS.GDP_NOMINAL),
        fetchIndicatorData(code, INDICATORS.GDP_GROWTH),
        fetchIndicatorData(code, INDICATORS.INFLATION),
        fetchIndicatorData(code, INDICATORS.UNEMPLOYMENT),
        fetchIndicatorData(code, INDICATORS.INTEREST_RATE),
        fetchIndicatorData(code, INDICATORS.GDP_PER_CAPITA)
      ]);

      const [gdp, growth, cpi, unemploy, interest, pcap] = results;
      setCompareCountry({
        code,
        name: gdp?.[1]?.[0]?.country?.value || code.toUpperCase(),
        summary: {
          gdp: getLatestValue(gdp),
          growth: getLatestValue(growth),
          inflation: getLatestValue(cpi),
          unemployment: getLatestValue(unemploy),
          interest: getLatestValue(interest),
          perCapita: getLatestValue(pcap)
        },
        raw: { gdp, growth, cpi, unemploy, interest, pcap }
      });
    } catch (e) {
      console.error("COMPARE_FAILURE", e);
    }
    setIsLoadingCompare(false);
  };

  const filteredCountries = TOP_COUNTRIES.filter(c => 
    c.code !== countryCode && 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative z-10 max-w-7xl mx-auto space-y-12 pb-20">
      <div className="flex justify-between items-center">
        <Link href="/" className="inline-flex items-center gap-3 text-[10px] font-black tracking-[0.3em] uppercase group">
          <div className="w-8 h-8 rounded-full border border-[#00ff88]/30 flex items-center justify-center group-hover:bg-[#00ff88]/10 transition-all text-[#00ff88]">
            <ArrowLeft size={14} />
          </div>
          <span className="opacity-60 group-hover:opacity-100 transition-opacity">SYS_RECOVERY: BACK_TO_ORBIT</span>
        </Link>

        <button 
          onClick={() => {
            if (isComparing) {
              setCompareCountry(null);
              setIsComparing(false);
            } else {
              setIsComparing(true);
            }
          }}
          className={`px-6 py-2 border font-black text-[10px] tracking-[0.2em] uppercase transition-all ${
            isComparing 
              ? 'bg-[#00ff88] text-black border-[#00ff88]' 
              : 'border-[#00ff88]/40 text-[#00ff88] hover:bg-[#00ff88]/10'
          }`}
        >
          {isComparing ? '[ CLOSE_COMPARISON ]' : '[ ACTIVATE_COMPARE_MODE ]'}
        </button>

        <button
          onClick={async () => {
            await navigator.clipboard.writeText(window.location.href);
            setShareToast(true);
            setTimeout(() => setShareToast(false), 2500);
          }}
          className="px-4 py-2 border border-[#00ff88]/40 text-[#00ff88] hover:bg-[#00ff88]/10 font-black text-[10px] tracking-[0.2em] uppercase transition-all flex items-center gap-2"
        >
          {shareToast ? <Check size={12} /> : <Share2 size={12} />}
          {shareToast ? 'LINK_COPIED!' : 'SHARE'}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {isComparing && !compareCountry && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-panel p-8 rounded-2xl border-t-4 border-t-[#00aaff] relative overflow-visible"
          >
            <div className="flex items-center gap-4 mb-6">
              <Search size={18} className="text-[#00aaff]" />
              <input 
                type="text"
                placeholder="SEARCH_TARGET_FOR_BENCHMARK..."
                className="bg-transparent border-b border-[#00aaff]/20 w-full outline-none py-2 text-white placeholder:opacity-30 uppercase tracking-widest text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {filteredCountries.map(c => (
                <button
                  key={c.code}
                  onClick={() => handleCompareSelect(c.code)}
                  className="px-3 py-2 border border-[#00aaff]/20 hover:border-[#00aaff] hover:bg-[#00aaff]/10 text-[9px] font-bold text-white transition-all uppercase tracking-tighter truncate"
                >
                  {c.name}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-end border-b border-[#00ff88]/10 pb-12">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-4 text-[10px] font-black tracking-[0.4em] opacity-40 uppercase text-[#00ff88]">
            <BarChart3 size={16} /> DATA_STREAM_ANALYSIS
          </div>
          <div className="flex items-baseline gap-4 flex-wrap">
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white uppercase leading-none drop-shadow-[0_0_30px_rgba(0,255,136,0.2)]">
              {countryName}
            </h1>
            {compareCountry && (
              <>
                <span className="text-4xl font-light opacity-20 text-[#00aaff]">VS</span>
                <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-[#00aaff] uppercase leading-none drop-shadow-[0_0_30px_rgba(0,170,255,0.2)]">
                  {compareCountry.name}
                </h1>
              </>
            )}
          </div>
          <div className="flex flex-wrap gap-4 pt-4 text-[9px] font-bold tracking-[0.2em] uppercase">
            <div className="px-3 py-1 rounded-full border border-[#00ff88]/20 bg-[#00ff88]/5">PRIMARY_NODE: {countryCode.toUpperCase()}</div>
            {compareCountry && (
              <div className="px-3 py-1 rounded-full border border-[#00aaff]/20 bg-[#00aaff]/5 text-[#00aaff]">TARGET_NODE: {compareCountry.code.toUpperCase()}</div>
            )}
            <div className="px-3 py-1 rounded-full border border-[#00ff88]/20 bg-[#00ff88]/5 flex items-center gap-2">
              <Clock size={10} />
              DATA: UPDATED DAILY
            </div>
            <div className="px-3 py-1 rounded-full border border-[#00ff88]/20 bg-[#00ff88]/5 flex items-center gap-2">
              <span className="opacity-60">LAST_SYNC:</span> {new Date(lastRefreshed).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </div>
            <button
              onClick={handleRefresh}
              disabled={isPending}
              className="px-3 py-1 rounded-full border border-[#00ff88]/40 bg-[#00ff88]/5 flex items-center gap-2 hover:bg-[#00ff88]/20 transition-all cursor-pointer disabled:opacity-30"
            >
              <RefreshCw size={10} className={isPending ? 'animate-spin' : ''} />
              {isPending ? 'SYNCING...' : 'REFRESH'}
            </button>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-[#00ff88]">
             <div className="flex items-center justify-between">
                <span className="text-[10px] font-black tracking-widest opacity-40 uppercase">Scale_Primary</span>
                <Database size={16} className="text-[#00ff88]" />
              </div>
              <div className="text-2xl font-black text-white tracking-tighter text-glow">
                {formatFinancial(getLatestValue(initialData.gdpRaw)?.value)}
              </div>
          </div>
          {compareCountry && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-panel p-6 rounded-2xl border-l-4 border-l-[#00aaff]">
              <div className="flex items-center justify-between text-[#00aaff]">
                <span className="text-[10px] font-black tracking-widest opacity-40 uppercase">Scale_Target</span>
                <Database size={16} />
              </div>
              <div className="text-2xl font-black text-white tracking-tighter">
                {formatFinancial(compareCountry.summary.gdp?.value)}
              </div>
            </motion.div>
          )}
        </div>
      </header>

      <div className={`grid grid-cols-1 ${compareCountry ? 'lg:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-4'} gap-6`}>
        <div className={compareCountry ? 'space-y-4' : ''}>
          <SummaryCard 
            title="PRIMARY_GROWTH" 
            value={getLatestValue(initialData.growthRaw)?.value ?? 0} 
            icon={<TrendingUp size={18} />} 
            trend={Number(getLatestValue(initialData.growthRaw)?.value) > 0 ? "UP" : "DOWN"}
            type="percent"
          />
          {compareCountry && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <SummaryCard 
                title="TARGET_GROWTH" 
                value={compareCountry.summary.growth?.value ?? 0} 
                icon={<TrendingUp size={18} className="text-[#00aaff]" />} 
                trend={Number(compareCountry.summary.growth?.value) > 0 ? "UP" : "DOWN"}
                type="percent"
              />
            </motion.div>
          )}
        </div>

        <div className={compareCountry ? 'space-y-4' : ''}>
          <SummaryCard 
            title="PRIMARY_INFLATION" 
            value={getLatestValue(initialData.cpiRaw)?.value ?? 0} 
            icon={<Activity size={18} />} 
            trend={Number(getLatestValue(initialData.cpiRaw)?.value) < 5 ? "STABLE" : "HIGH"}
            type="percent"
          />
          {compareCountry && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <SummaryCard 
                title="TARGET_INFLATION" 
                value={compareCountry.summary.inflation?.value ?? 0} 
                icon={<Activity size={18} className="text-[#00aaff]" />} 
                trend={Number(compareCountry.summary.inflation?.value) < 5 ? "STABLE" : "HIGH"}
                type="percent"
              />
            </motion.div>
          )}
        </div>

        {!compareCountry && (
          <>
            <SummaryCard 
              title="UNEMPLOYMENT" 
              value={getLatestValue(initialData.unemployRaw)?.value ?? 0} 
              icon={<Users size={18} />} 
              trend={Number(getLatestValue(initialData.unemployRaw)?.value) < 10 ? "OPTIMAL" : "CRITICAL"}
              type="percent"
            />
            <SummaryCard 
              title="WEALTH_INDEX" 
              value={getLatestValue(initialData.pcapRaw)?.value ?? 0} 
              icon={<Wallet size={18} />} 
              trend="NEUTRAL"
              type="pcap"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-12 pt-12">
        <EconomicChart 
          data={adaptWorldBankDataForD3(initialData.growthRaw)} 
          secondaryData={compareCountry ? adaptWorldBankDataForD3(compareCountry.raw.growth) : undefined}
          title="REAL GDP GROWTH HISTORY (%)" 
          secondaryTitle={compareCountry?.name}
        />
        <EconomicChart 
          data={adaptWorldBankDataForD3(initialData.gdpRaw)} 
          secondaryData={compareCountry ? adaptWorldBankDataForD3(compareCountry.raw.gdp) : undefined}
          title="GDP PROGRESSION (NOMINAL USD)" 
          secondaryTitle={compareCountry?.name}
        />
      </div>

      {isLoadingCompare && (
        <div className="fixed bottom-12 right-12 glass-panel px-6 py-4 rounded-full flex items-center gap-4 text-[#00aaff] font-black text-[10px] tracking-widest border border-[#00aaff]/40 shadow-[0_0_30px_rgba(0,170,255,0.2)]">
          <Loader2 className="animate-spin" size={16} />
          UPLINKING_BENCHMARK_DATA...
        </div>
      )}
    </div>
  );
}
