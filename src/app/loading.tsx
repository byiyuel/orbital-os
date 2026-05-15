"use client";

export default function Loading() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/10 backdrop-blur-sm z-50 pointer-events-none">
      <div className="relative w-64 h-1 bg-zinc-900 overflow-hidden border border-emerald-500/20">
        <div className="absolute inset-0 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-[shimmer_2s_infinite]"></div>
        <div className="h-full bg-emerald-500 shadow-[0_0_10px_#00ff88] animate-[progress_3s_ease-in-out_infinite]"></div>
      </div>
      
      <div className="mt-4 font-mono text-[10px] text-emerald-500/80 tracking-[0.3em] uppercase animate-pulse">
        ESTABLISHING CONNECTION...
      </div>
      
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-10">
        <div className="w-full h-[1px] bg-emerald-500 animate-[scan_4s_linear_infinite]"></div>
      </div>

      <style jsx>{`
        @keyframes progress {
          0% { width: 0%; transform: translateX(-100%); }
          50% { width: 70%; transform: translateX(0%); }
          100% { width: 0%; transform: translateX(100%); }
        }
        @keyframes scan {
          0% { transform: translateY(0vh); }
          100% { transform: translateY(100vh); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
