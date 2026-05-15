"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface Props {
  data: any[];
  title: string;
}

export default function EconomicChart({ data, title }: Props) {
  return (
    <div className="w-full h-80 glass-panel p-6 rounded-xl relative overflow-hidden group">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-[#00ff88] text-[10px] font-black tracking-[0.3em] uppercase opacity-70 group-hover:opacity-100 transition-opacity flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-[#00ff88] rounded-full animate-pulse"></span>
          {title}
        </h3>
        <div className="text-[8px] font-mono text-[#00ff88]/30">v2.4_QUANT_ENGINE</div>
      </div>
      
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00ff88" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#00ff88" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#00ff8811" vertical={false} />
          <XAxis 
            dataKey="year" 
            stroke="#00ff8844" 
            fontSize={9}
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          <YAxis 
            stroke="#00ff8844" 
            fontSize={9}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}k` : val}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(2, 4, 10, 0.9)', 
              border: '1px solid rgba(0, 255, 136, 0.3)',
              borderRadius: '8px',
              fontSize: '10px',
              color: '#00ff88',
              backdropFilter: 'blur(10px)'
            }}
            itemStyle={{ color: '#00ff88' }}
            cursor={{ stroke: '#00ff8844', strokeWidth: 1 }}
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke="#00ff88" 
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorValue)"
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Decorative tactical corners */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#00ff8844]"></div>
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#00ff8844]"></div>
    </div>
  );
}
