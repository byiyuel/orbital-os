"use client";

import { Activity } from "lucide-react";

export default function CountryLoading() {
  return (
    <div className="min-h-screen bg-[#02040a] text-[#00ff88] font-mono p-4 md:p-12 flex items-center justify-center">
      <div className="max-w-sm w-full space-y-6">
        <div className="flex justify-center">
          <div className="relative">
            <Activity className="w-10 h-10 md:w-14 md:h-14 text-[#00ff88] animate-pulse" />
            <div className="absolute inset-0 blur-lg bg-[#00ff88]/20 animate-pulse" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between text-[9px] md:text-[10px] font-black tracking-[0.2em] opacity-40">
            <span>SECTOR_ANALYSIS</span>
            <span>DECRYPTING</span>
          </div>
          <div className="h-1 w-full bg-[#00ff88]/10 rounded-full overflow-hidden">
            <div className="h-full bg-[#00ff88] w-full animate-tactical-progress" />
          </div>
          <div className="text-[8px] md:text-[9px] tracking-widest text-[#00ff88] flex items-center gap-3 uppercase">
            <span className="w-1 h-1 bg-[#00ff88] rounded-full animate-ping shrink-0" />
            Fetching_Economic_Data...
          </div>
          <div className="text-[7px] md:text-[8px] tracking-widest opacity-30 uppercase font-bold">
            &gt; QUERYING_WORLD_BANK_API
          </div>
        </div>
      </div>
    </div>
  );
}
