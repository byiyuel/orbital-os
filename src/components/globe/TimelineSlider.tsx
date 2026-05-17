"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ECONOMIC_EVENTS, YEAR_MIN, YEAR_MAX } from "@/lib/color-scales";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";

interface TimelineSliderProps {
  year: number;
  onYearChange: (year: number) => void;
  isPlaying: boolean;
  onPlayToggle: () => void;
}

export default function TimelineSlider({
  year,
  onYearChange,
  isPlaying,
  onPlayToggle,
}: TimelineSliderProps) {
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "ArrowLeft") {
        e.preventDefault();
        onYearChange(Math.max(YEAR_MIN, year - 1));
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        onYearChange(Math.min(YEAR_MAX, year + 1));
      } else if (e.code === "Space") {
        e.preventDefault();
        onPlayToggle();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [year, onYearChange, onPlayToggle]);

  const totalYears = YEAR_MAX - YEAR_MIN;
  const progress = ((year - YEAR_MIN) / totalYears) * 100;

  const getYearFromEvent = useCallback((clientX: number) => {
    if (!sliderRef.current) return year;
    const rect = sliderRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.round(YEAR_MIN + ratio * totalYears);
  }, [year, totalYears]);

  return (
    <div className="glass-panel rounded-xl p-4 select-none w-full" onClick={(e) => e.stopPropagation()}>
      {/* Year display */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onYearChange(Math.max(YEAR_MIN, year - 1))}
            className="w-7 h-7 flex items-center justify-center border border-[#00ff88]/20 hover:border-[#00ff88]/60 hover:bg-[#00ff88]/10 transition-all text-[#00ff88]/60 hover:text-[#00ff88]"
          >
            <SkipBack size={10} />
          </button>
          <button
            onClick={onPlayToggle}
            className={`w-7 h-7 flex items-center justify-center border transition-all ${
              isPlaying
                ? "bg-[#00ff88]/20 border-[#00ff88] text-[#00ff88] shadow-[0_0_10px_rgba(0,255,136,0.3)]"
                : "border-[#00ff88]/20 hover:border-[#00ff88]/60 text-[#00ff88]/60 hover:text-[#00ff88]"
            }`}
          >
            {isPlaying ? <Pause size={10} /> : <Play size={10} />}
          </button>
          <button
            onClick={() => onYearChange(Math.min(YEAR_MAX, year + 1))}
            className="w-7 h-7 flex items-center justify-center border border-[#00ff88]/20 hover:border-[#00ff88]/60 hover:bg-[#00ff88]/10 transition-all text-[#00ff88]/60 hover:text-[#00ff88]"
          >
            <SkipForward size={10} />
          </button>
        </div>

        <div className="text-right">
          <div className="text-2xl md:text-3xl font-black tracking-tighter text-white text-glow tabular-nums">
            {year}
          </div>
          <div className="text-[7px] font-bold tracking-[0.2em] opacity-30 uppercase">
            TEMPORAL_INDEX
          </div>
        </div>
      </div>

      {/* Event markers + Slider track */}
      <div className="relative" ref={sliderRef}>
        {/* Economic event markers */}
        <div className="relative h-5 mb-0.5">
          {ECONOMIC_EVENTS.map((event) => {
            const left = ((event.year - YEAR_MIN) / totalYears) * 100;
            return (
              <div
                key={event.year}
                className="absolute -translate-x-1/2 flex flex-col items-center group cursor-help"
                style={{ left: `${left}%` }}
                onMouseEnter={() => setHoveredEvent(event.label)}
                onMouseLeave={() => setHoveredEvent(null)}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full shadow-[0_0_6px] transition-transform group-hover:scale-150"
                  style={{ backgroundColor: event.color, boxShadow: `0 0 6px ${event.color}` }}
                />
                <div className="w-px h-2 opacity-30" style={{ backgroundColor: event.color }} />
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  <div
                    className="glass-panel px-2 py-1 rounded text-[8px] font-bold tracking-wider"
                    style={{ color: event.color, borderColor: event.color }}
                  >
                    {event.year}: {event.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Slider input */}
        <input
          type="range"
          min={YEAR_MIN}
          max={YEAR_MAX}
          value={year}
          onChange={(e) => onYearChange(parseInt(e.target.value))}
          className="timeline-slider w-full"
          style={{
            background: `linear-gradient(to right, #00ff88 ${progress}%, rgba(0,255,136,0.1) ${progress}%)`,
          }}
        />

        {/* Year labels */}
        <div className="flex justify-between text-[7px] font-bold opacity-30 mt-1">
          <span>{YEAR_MIN}</span>
          <span>2000</span>
          <span>2010</span>
          <span>{YEAR_MAX}</span>
        </div>
      </div>

      {/* Keyboard hints */}
      <div className="hidden md:flex gap-3 mt-2 text-[7px] opacity-20 font-bold tracking-wider uppercase">
        <span>← → YEAR</span>
        <span>SPACE PLAY/PAUSE</span>
      </div>
    </div>
  );
}
