export default function ChartSkeleton() {
  return (
    <div className="w-full h-full p-6 bg-black/40 border border-emerald-500/10 backdrop-blur-xl rounded-xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-6 w-32 bg-emerald-500/5 animate-pulse rounded border border-emerald-500/10"></div>
        <div className="h-4 w-24 bg-zinc-800 animate-pulse rounded"></div>
      </div>
      
      <div className="flex items-end space-x-2 h-[200px]">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-emerald-500/10 animate-pulse rounded-t-sm border-x border-t border-emerald-500/5 shadow-[0_0_10px_rgba(16,185,129,0.05)]"
            style={{
              height: `${Math.floor(Math.random() * 60) + 20}%`,
              animationDelay: `${i * 100}ms`
            }}
          ></div>
        ))}
      </div>

      <div className="space-y-3">
        <div className="h-2 w-full bg-zinc-900 animate-pulse rounded"></div>
        <div className="h-2 w-3/4 bg-zinc-900 animate-pulse rounded"></div>
      </div>
    </div>
  );
}
