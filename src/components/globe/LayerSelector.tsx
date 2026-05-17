"use client";

import { type LayerType, LAYER_CONFIGS } from "@/lib/color-scales";
import { Layers } from "lucide-react";

interface LayerSelectorProps {
  activeLayer: LayerType;
  onLayerChange: (layer: LayerType) => void;
}

const LAYERS: LayerType[] = ["gdp", "inflation", "growth"];

export default function LayerSelector({ activeLayer, onLayerChange }: LayerSelectorProps) {
  return (
    <div className="glass-panel rounded-xl p-3 select-none">
      <div className="flex items-center gap-2 mb-2 text-[8px] font-black tracking-[0.3em] opacity-40 uppercase">
        <Layers size={10} /> LAYER_SELECT
      </div>
      <div className="flex gap-1">
        {LAYERS.map((layer) => {
          const config = LAYER_CONFIGS[layer];
          const isActive = activeLayer === layer;
          return (
            <button
              key={layer}
              onClick={() => onLayerChange(layer)}
              className={`px-3 py-1.5 text-[9px] font-black tracking-[0.15em] uppercase transition-all border ${
                isActive
                  ? "bg-[#00ff88]/20 border-[#00ff88] text-[#00ff88] shadow-[0_0_10px_rgba(0,255,136,0.2)]"
                  : "border-[#00ff88]/10 text-[#00ff88]/40 hover:border-[#00ff88]/30 hover:text-[#00ff88]/70"
              }`}
            >
              {config.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
