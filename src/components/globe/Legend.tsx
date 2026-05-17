"use client";

import { type LayerType, LAYER_CONFIGS, getColor } from "@/lib/color-scales";

interface LegendProps {
  activeLayer: LayerType;
}

export default function Legend({ activeLayer }: LegendProps) {
  const config = LAYER_CONFIGS[activeLayer];
  const steps = 20;
  const colors: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const val = config.domain[0] + t * (config.domain[1] - config.domain[0]);
    colors.push(getColor(activeLayer, val));
  }

  return (
    <div className="glass-panel rounded-xl p-3 select-none min-w-[140px]">
      <div className="text-[8px] font-black tracking-[0.3em] opacity-40 uppercase mb-2">
        {config.label} ({config.unit})
      </div>
      <div
        className="h-2 rounded-full mb-1.5"
        style={{
          background: `linear-gradient(to right, ${colors.join(", ")})`,
        }}
      />
      <div className="flex justify-between text-[8px] font-bold opacity-60">
        <span>{config.format(config.domain[0])}</span>
        <span>{config.format(config.domain[1])}</span>
      </div>
      <div className="flex items-center gap-1.5 mt-2 text-[7px] opacity-40">
        <span
          className="w-2 h-2 rounded-sm inline-block"
          style={{ background: config.noDataColor }}
        />
        NO_DATA
      </div>
    </div>
  );
}
