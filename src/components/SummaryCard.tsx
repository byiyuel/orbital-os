"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import Counter from "./Counter";
import { formatFinancial } from "@/utils/adapters";
import React, { useEffect, useState } from "react";

interface SummaryCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend: string;
  type: 'percent' | 'currency' | 'pcap';
}

export default function SummaryCard({ title, value, icon, trend, type }: SummaryCardProps) {
  const isUp = trend === "UP" || trend === "STABLE" || trend === "OPTIMAL";
  const isDown = trend === "DOWN" || trend === "HIGH" || trend === "CRITICAL";

  const [shouldAnimate, setShouldAnimate] = useState(true);
  useEffect(() => {
    setShouldAnimate(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  const formatter = (v: number) => formatFinancial(v, type);

  return (
    <motion.div 
      initial={shouldAnimate ? { opacity: 0, y: 20 } : {}}
      whileInView={shouldAnimate ? { opacity: 1, y: 0 } : {}}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="glass-panel p-8 rounded-2xl relative overflow-hidden group hover:border-[#00ff88]/50 transition-all duration-500 hover:translate-y-[-4px]"
    >
      <div className="flex justify-between items-start mb-6">
        <span className="text-[9px] font-black tracking-[0.2em] uppercase opacity-40 group-hover:opacity-100 transition-opacity">// {title}</span>
        <div className="text-[#00ff88]/30 group-hover:text-[#00ff88] transition-colors">{icon}</div>
      </div>
      
      <div className="flex items-baseline gap-3">
        <div className="text-4xl font-black tracking-tighter text-white group-hover:text-[#00ff88] transition-all">
          <Counter value={value} formatter={formatter} />
        </div>
        {trend !== "NEUTRAL" && (
          <div className={`flex items-center gap-1 text-[10px] font-bold ${isUp ? "text-emerald-400" : isDown ? "text-rose-400" : "text-sky-400"}`}>
            {isUp ? <ArrowUpRight size={12} /> : isDown ? <ArrowDownRight size={12} /> : null}
            {trend}
          </div>
        )}
      </div>
      
      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#00ff88]/0 group-hover:border-[#00ff88]/20 transition-all m-2"></div>
    </motion.div>
  );
}
