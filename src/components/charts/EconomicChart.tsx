"use client";

import React, { useEffect, useRef, useMemo, useState } from 'react';
import * as d3 from 'd3';
import { motion } from 'framer-motion';

interface DataPoint {
  year: string | number;
  value: number | null;
}

interface Props {
  data: DataPoint[];
  secondaryData?: DataPoint[];
  title: string;
  secondaryTitle?: string;
}

const formatValue = (v: number): string => {
  const abs = Math.abs(v);
  if (abs >= 1e12) return `${(v / 1e12).toFixed(1)}T`;
  if (abs >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${(v / 1e3).toFixed(1)}k`;
  if (abs < 1 && abs > 0) return v.toFixed(2);
  return v.toFixed(1);
};

export default function EconomicChart({ data, secondaryData, title, secondaryTitle }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check prefers-reduced-motion
  const [shouldAnimate, setShouldAnimate] = useState(true);
  useEffect(() => {
    setShouldAnimate(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  // Filter out null values and sort by year
  const chartData = useMemo(() => {
    return data
      .filter(d => d.value !== null && d.value !== undefined)
      .sort((a, b) => Number(a.year) - Number(b.year));
  }, [data]);

  const secondaryChartData = useMemo(() => {
    if (!secondaryData) return [];
    return secondaryData
      .filter(d => d.value !== null && d.value !== undefined)
      .sort((a, b) => Number(a.year) - Number(b.year));
  }, [secondaryData]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || chartData.length === 0) return;

    // Clear previous SVG content
    d3.select(svgRef.current).selectAll("*").remove();

    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    
    const margin = { top: 16, right: 24, bottom: 36, left: 60 };
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr("width", containerWidth)
      .attr("height", containerHeight)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Combine years for X scale
    const allYears = Array.from(new Set([
      ...chartData.map(d => String(d.year)),
      ...secondaryChartData.map(d => String(d.year))
    ])).sort((a, b) => Number(a) - Number(b));

    // Scales
    const x = d3.scalePoint()
      .domain(allYears)
      .range([0, width]);

    // Include negative values for proper domain (e.g. GDP growth can be negative)
    const allValues = [...chartData, ...secondaryChartData].map(d => d.value ?? 0);
    const minVal = Math.min(0, d3.min(allValues) || 0);
    const maxVal = d3.max(allValues) || 1;
    const y = d3.scaleLinear()
      .domain([minVal, maxVal])
      .range([height, 0])
      .nice();

    // Glow Filters
    const defs = svg.append("defs");
    
    const createGlowFilter = (id: string) => {
      const filter = defs.append("filter")
        .attr("id", id)
        .attr("x", "-20%")
        .attr("y", "-20%")
        .attr("width", "140%")
        .attr("height", "140%");

      filter.append("feGaussianBlur")
        .attr("stdDeviation", "2")
        .attr("result", "coloredBlur");
      
      const feMerge = filter.append("feMerge");
      feMerge.append("feMergeNode").attr("in", "coloredBlur");
      feMerge.append("feMergeNode").attr("in", "SourceGraphic");
    };

    const filterId1 = `glow-${Math.random().toString(36).substr(2, 9)}`;
    const filterId2 = `glow-${Math.random().toString(36).substr(2, 9)}`;
    createGlowFilter(filterId1);
    createGlowFilter(filterId2);

    // Gradients for area fills
    const createGradient = (id: string, color: string) => {
      const gradient = defs.append("linearGradient")
        .attr("id", id)
        .attr("x1", "0%").attr("y1", "0%")
        .attr("x2", "0%").attr("y2", "100%");

      gradient.append("stop").attr("offset", "0%")
        .attr("stop-color", color).attr("stop-opacity", 0.25);
      gradient.append("stop").attr("offset", "100%")
        .attr("stop-color", color).attr("stop-opacity", 0.02);
    };

    const gradientId1 = `grad-${Math.random().toString(36).substr(2, 9)}`;
    const gradientId2 = `grad-${Math.random().toString(36).substr(2, 9)}`;
    createGradient(gradientId1, "#00ff88");
    createGradient(gradientId2, "#00aaff");

    // Horizontal grid lines
    svg.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(y)
        .ticks(5)
        .tickSize(-width)
        .tickFormat(() => "")
      )
      .call(g => {
        g.select(".domain").remove();
        g.selectAll(".tick line")
          .attr("stroke", "rgba(0, 255, 136, 0.08)")
          .attr("stroke-dasharray", "4,4");
      });

    // Zero line for charts with negative values
    if (minVal < 0) {
      svg.append("line")
        .attr("x1", 0).attr("x2", width)
        .attr("y1", y(0)).attr("y2", y(0))
        .attr("stroke", "rgba(255, 255, 255, 0.15)")
        .attr("stroke-width", 1);
    }

    // Area fills
    const area = d3.area<DataPoint>()
      .x(d => x(String(d.year)) || 0)
      .y0(y(Math.max(0, minVal)))
      .y1(d => y(d.value ?? 0))
      .curve(d3.curveMonotoneX);

    svg.append("path")
      .datum(chartData)
      .attr("fill", `url(#${gradientId1})`)
      .attr("d", area);

    if (secondaryChartData.length > 0) {
      svg.append("path")
        .datum(secondaryChartData)
        .attr("fill", `url(#${gradientId2})`)
        .attr("d", area);
    }

    // Lines
    const line = d3.line<DataPoint>()
      .x(d => x(String(d.year)) || 0)
      .y(d => y(d.value ?? 0))
      .curve(d3.curveMonotoneX);

    const path1 = svg.append("path")
      .datum(chartData)
      .attr("fill", "none")
      .attr("stroke", "#00ff88")
      .attr("stroke-width", 2.5)
      .attr("filter", `url(#${filterId1})`)
      .attr("d", line);

    // Line 1 animation
    const length1 = path1.node()?.getTotalLength() || 0;
    path1.attr("stroke-dasharray", length1 + " " + length1)
      .attr("stroke-dashoffset", length1)
      .transition()
      .duration(1500)
      .ease(d3.easeLinear)
      .attr("stroke-dashoffset", 0);

    if (secondaryChartData.length > 0) {
      const path2 = svg.append("path")
        .datum(secondaryChartData)
        .attr("fill", "none")
        .attr("stroke", "#00aaff")
        .attr("stroke-width", 2.5)
        .attr("filter", `url(#${filterId2})`)
        .attr("d", line);

      const length2 = path2.node()?.getTotalLength() || 0;
      path2.attr("stroke-dasharray", length2 + " " + length2)
        .attr("stroke-dashoffset", length2)
        .transition()
        .duration(1500)
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0);
    }

    // X Axis
    const tickInterval = Math.max(1, Math.ceil(allYears.length / 8));
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x)
        .tickValues(allYears.filter((_, i) => i % tickInterval === 0))
        .tickSize(0)
        .tickPadding(12)
      )
      .call(g => {
        g.select(".domain").remove();
        g.selectAll("text")
          .attr("fill", "rgba(0, 255, 136, 0.7)")
          .style("font-size", "11px")
          .style("font-family", "'JetBrains Mono', 'Fira Code', monospace")
          .style("font-weight", "600");
      });

    // Y Axis
    svg.append("g")
      .call(d3.axisLeft(y)
        .ticks(5)
        .tickFormat(val => formatValue(val.valueOf()))
        .tickSize(0)
        .tickPadding(10)
      )
      .call(g => {
        g.select(".domain").remove();
        g.selectAll("text")
          .attr("fill", "rgba(0, 255, 136, 0.7)")
          .style("font-size", "11px")
          .style("font-family", "'JetBrains Mono', 'Fira Code', monospace")
          .style("font-weight", "600");
      });

    // Interactive tooltip
    const tooltipGroup = svg.append("g").style("display", "none");
    
    tooltipGroup.append("line")
      .attr("stroke", "rgba(0, 255, 136, 0.3)")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "4,3")
      .attr("y1", 0)
      .attr("y2", height);

    const dot1 = tooltipGroup.append("circle")
      .attr("fill", "#00ff88")
      .attr("r", 5)
      .attr("stroke", "#02040a")
      .attr("stroke-width", 2);

    const dot2 = tooltipGroup.append("circle")
      .attr("fill", "#00aaff")
      .attr("r", 5)
      .attr("stroke", "#02040a")
      .attr("stroke-width", 2)
      .style("display", "none");

    // Tooltip box
    const tooltipForeign = tooltipGroup.append("foreignObject")
      .attr("width", 180)
      .attr("height", 100);
    
    const tooltipDiv = tooltipForeign.append("xhtml:div")
      .style("background", "rgba(2, 4, 10, 0.95)")
      .style("border", "1px solid rgba(0, 255, 136, 0.3)")
      .style("border-radius", "8px")
      .style("padding", "10px 12px")
      .style("font-family", "'JetBrains Mono', monospace")
      .style("font-size", "11px")
      .style("color", "white")
      .style("pointer-events", "none")
      .style("white-space", "nowrap");

    const overlay = svg.append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "transparent")
      .style("cursor", "crosshair");

    overlay.on("mousemove touchmove", (event) => {
      const [mouseX] = d3.pointer(event);
      
      const domain = x.domain();
      const range = x.range();
      const step = (range[1] - range[0]) / (domain.length - 1);
      const index = Math.round(mouseX / step);
      const year = allYears[Math.max(0, Math.min(index, allYears.length - 1))];
      
      const d1 = chartData.find(d => String(d.year) === year);
      const d2 = secondaryChartData.find(d => String(d.year) === year);

      if (d1 || d2) {
        const posX = x(year) || 0;
        tooltipGroup.style("display", null);
        
        // Update vertical line position
        tooltipGroup.select("line").attr("x1", posX).attr("x2", posX);

        let html = `<div style="color:rgba(0,255,136,0.5);font-size:9px;letter-spacing:0.15em;margin-bottom:6px;font-weight:700">${year}</div>`;
        
        if (d1) {
          const posY1 = y(d1.value ?? 0);
          dot1.style("display", null).attr("cx", posX).attr("cy", posY1);
          html += `<div style="color:#00ff88;font-weight:700">${formatValue(d1.value ?? 0)}</div>`;
        } else {
          dot1.style("display", "none");
        }

        if (d2) {
          const posY2 = y(d2.value ?? 0);
          dot2.style("display", null).attr("cx", posX).attr("cy", posY2);
          html += `<div style="color:#00aaff;font-weight:700;margin-top:2px">${formatValue(d2.value ?? 0)}</div>`;
        } else {
          dot2.style("display", "none");
        }

        tooltipDiv.html(html);

        // Position tooltip to left or right of cursor
        const tooltipX = posX + 180 > width ? posX - 190 : posX + 12;
        tooltipForeign.attr("x", tooltipX).attr("y", 10);
      }
    });

    overlay.on("mouseleave touchend", () => {
      tooltipGroup.style("display", "none");
    });

  }, [chartData, secondaryChartData, title, secondaryTitle]);

  return (
    <motion.div 
      initial={shouldAnimate ? { opacity: 0, scale: 0.95 } : {}}
      whileInView={shouldAnimate ? { opacity: 1, scale: 1 } : {}}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full glass-panel p-5 md:p-6 rounded-xl relative overflow-hidden group"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[#00ff88] text-[10px] md:text-xs font-black tracking-[0.2em] uppercase opacity-80 group-hover:opacity-100 transition-opacity flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-[#00ff88] rounded-full animate-pulse" />
          {title}
        </h3>
        {secondaryTitle && (
          <div className="flex items-center gap-4 text-[9px] md:text-[10px] font-bold tracking-wider">
            <span className="flex items-center gap-1.5"><span className="w-3 h-[2px] bg-[#00ff88] inline-block" />{title}</span>
            <span className="flex items-center gap-1.5 text-[#00aaff]"><span className="w-3 h-[2px] bg-[#00aaff] inline-block" />{secondaryTitle}</span>
          </div>
        )}
      </div>
      
      <div ref={containerRef} className="w-full h-[260px] md:h-[300px]">
        <svg ref={svgRef} className="overflow-visible" />
      </div>

      {/* Decorative tactical corners */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#00ff8833]" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[#00ff8833]" />
    </motion.div>
  );
}
