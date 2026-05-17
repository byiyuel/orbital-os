"use client";

import { Cpu } from "lucide-react";

export default function Loading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-[100] bg-[#02040a] font-mono text-[#00ff88] animate-flicker">
      <div className="max-w-md w-full space-y-8 p-6">
        <div className="flex justify-center">
          <div className="relative">
            <Cpu className="w-12 h-9 md:w-16 md:h-12 text-[#00ff88] animate-pulse" />
            <div className="absolute inset-0 blur-lg bg-[#00ff88]/20 animate-pulse" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between text-[9px] md:text-[10px] font-black tracking-[0.2em] opacity-40">
            <span>ORBITAL_OS</span>
            <span>v2.5.0</span>
          </div>
          <div className="h-1 w-full bg-[#00ff88]/10 rounded-full overflow-hidden">
            <div className="h-full bg-[#00ff88] w-full animate-tactical-progress" />
          </div>
          <div className="grid grid-cols-1 gap-1">
            <div className="text-[8px] md:text-[9px] tracking-widest text-[#00ff88] flex items-center gap-3 uppercase">
              <span className="w-1 h-1 bg-[#00ff88] rounded-full animate-ping shrink-0" />
              Loading_Module...
            </div>
            <div className="text-[7px] md:text-[8px] tracking-widest opacity-30 uppercase font-bold">
              &gt; COMPILING_INTERFACE
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
