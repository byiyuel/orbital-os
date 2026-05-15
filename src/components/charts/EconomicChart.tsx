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
    
    const margin = { top: 20, right: 20, bottom: 40, left: 45 };
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

    const maxVal = d3.max([...chartData, ...secondaryChartData], d => d.value ?? 0) || 1;
    const y = d3.scaleLinear()
      .domain([0, maxVal])
      .range([height, 0])
      .nice();

    // Glow Filters
    const defs = svg.append("defs");
    
    const createGlowFilter = (id: string, color: string) => {
      const filter = defs.append("filter")
        .attr("id", id)
        .attr("x", "-20%")
        .attr("y", "-20%")
        .attr("width", "140%")
        .attr("height", "140%");

      filter.append("feGaussianBlur")
        .attr("stdDeviation", "2.5")
        .attr("result", "coloredBlur");
      
      const feMerge = filter.append("feMerge");
      feMerge.append("feMergeNode").attr("in", "coloredBlur");
      feMerge.append("feMergeNode").attr("in", "SourceGraphic");
    };

    const filterId1 = `glow-${Math.random().toString(36).substr(2, 9)}`;
    const filterId2 = `glow-${Math.random().toString(36).substr(2, 9)}`;
    createGlowFilter(filterId1, "#00ff88");
    createGlowFilter(filterId2, "#00aaff");

    // Gradients
    const createGradient = (id: string, color: string) => {
      const gradient = defs.append("linearGradient")
        .attr("id", id)
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "0%")
        .attr("y2", "100%");

      gradient.append("stop")
        .attr("offset", "5%")
        .attr("stop-color", color)
        .attr("stop-opacity", 0.2);

      gradient.append("stop")
        .attr("offset", "95%")
        .attr("stop-color", color)
        .attr("stop-opacity", 0);
    };

    const gradientId1 = `grad-${Math.random().toString(36).substr(2, 9)}`;
    const gradientId2 = `grad-${Math.random().toString(36).substr(2, 9)}`;
    createGradient(gradientId1, "#00ff88");
    createGradient(gradientId2, "#00aaff");

    // Grid lines
    svg.append("g")
      .attr("class", "grid")
      .attr("stroke", "#00ff8811")
      .attr("stroke-dasharray", "3,3")
      .call(d3.axisLeft(y)
        .tickSize(-width)
        .tickFormat(() => "")
      )
      .call(g => g.select(".domain").remove());

    // Areas
    const area = d3.area<DataPoint>()
      .x(d => x(String(d.year)) || 0)
      .y0(height)
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
      .attr("stroke-width", 2)
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
        .attr("stroke-width", 2)
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
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .attr("color", "#00ff8844")
      .style("font-size", "9px")
      .call(d3.axisBottom(x)
        .tickValues(allYears.filter((d, i) => i % Math.ceil(allYears.length / 8) === 0))
        .tickSize(0)
        .tickPadding(10)
      )
      .call(g => {
        g.select(".domain").remove();
        g.selectAll("text")
          .style("text-shadow", "0 0 5px rgba(0, 255, 136, 0.5)")
          .style("font-family", "monospace");
      });

    // Y Axis
    svg.append("g")
      .attr("color", "#00ff8844")
      .style("font-size", "9px")
      .call(d3.axisLeft(y)
        .ticks(5)
        .tickFormat(val => {
          const v = val.valueOf();
          if (v >= 1000000000000) return `${(v / 1000000000000).toFixed(1)}T`;
          if (v >= 1000000000) return `${(v / 1000000000).toFixed(1)}B`;
          if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
          if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
          return String(v);
        })
        .tickSize(0)
        .tickPadding(10)
      )
      .call(g => {
        g.select(".domain").remove();
        g.selectAll("text")
          .style("text-shadow", "0 0 5px rgba(0, 255, 136, 0.5)")
          .style("font-family", "monospace");
      });

    // Tooltip interaction
    const tooltipGroup = svg.append("g").style("display", "none");
    
    tooltipGroup.append("line")
      .attr("stroke", "#00ff8844")
      .attr("stroke-width", 1)
      .attr("y1", 0)
      .attr("y2", height);

    const dot1 = tooltipGroup.append("circle")
      .attr("fill", "#00ff88")
      .attr("r", 4)
      .attr("stroke", "#02040a")
      .attr("stroke-width", 2);

    const dot2 = tooltipGroup.append("circle")
      .attr("fill", "#00aaff")
      .attr("r", 4)
      .attr("stroke", "#02040a")
      .attr("stroke-width", 2);

    const tooltipRect = tooltipGroup.append("rect")
      .attr("fill", "rgba(2, 4, 10, 0.9)")
      .attr("stroke", "rgba(0, 255, 136, 0.3)")
      .attr("rx", 4)
      .attr("ry", 4)
      .attr("width", 140)
      .attr("height", 60);

    const tooltipText = tooltipGroup.append("text")
      .attr("fill", "#00ff88")
      .style("font-size", "10px")
      .style("font-family", "monospace");

    const overlay = svg.append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "transparent");

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
        tooltipGroup.style("display", null)
          .attr("transform", `translate(${posX}, 0)`);

        let tooltipLines = [`YEAR: ${year}`];
        
        if (d1) {
          const posY1 = y(d1.value ?? 0);
          dot1.style("display", null).attr("transform", `translate(0, ${posY1})`);
          tooltipLines.push(`${title}: ${(d1.value ?? 0).toLocaleString()}`);
        } else {
          dot1.style("display", "none");
        }

        if (d2) {
          const posY2 = y(d2.value ?? 0);
          dot2.style("display", null).attr("transform", `translate(0, ${posY2})`);
          tooltipLines.push(`${secondaryTitle || "COMPARE"}: ${(d2.value ?? 0).toLocaleString()}`);
        } else {
          dot2.style("display", "none");
        }

        tooltipText.selectAll("tspan").remove();
        tooltipLines.forEach((line, i) => {
          tooltipText.append("tspan")
            .attr("x", posX + 150 > width ? -130 : 10)
            .attr("dy", i === 0 ? 0 : "1.2em")
            .text(line)
            .attr("fill", i === 1 ? "#00ff88" : i === 2 ? "#00aaff" : "white");
        });

        const textNode = tooltipText.node() as SVGTextElement;
        const bbox = textNode.getBBox();
        tooltipRect
          .attr("x", bbox.x - 5)
          .attr("y", bbox.y - 5)
          .attr("width", bbox.width + 10)
          .attr("height", bbox.height + 10);
        
        tooltipText.attr("y", (d1 ? y(d1.value ?? 0) : height/2) - bbox.height/2);
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
      className="w-full h-80 glass-panel p-6 rounded-xl relative overflow-hidden group"
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-[#00ff88] text-[10px] font-black tracking-[0.3em] uppercase opacity-70 group-hover:opacity-100 transition-opacity flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-[#00ff88] rounded-full animate-pulse"></span>
          {title}
        </h3>
        <div className="text-[8px] font-mono text-[#00ff88]/30">v2.5_D3_ENGINE</div>
      </div>
      
      <div ref={containerRef} className="w-full h-[220px]">
        <svg ref={svgRef} className="overflow-visible"></svg>
      </div>

      {/* Decorative tactical corners */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#00ff8844]"></div>
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#00ff8844]"></div>
    </motion.div>
  );
}
