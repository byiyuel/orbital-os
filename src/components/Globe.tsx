"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import { useRouter } from "next/navigation";
import { Activity, Globe as GlobeIcon, Zap, Shield, Cpu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { type LayerType, getColor, LAYER_CONFIGS, YEAR_MIN, YEAR_MAX } from "@/lib/color-scales";
import LayerSelector from "@/components/globe/LayerSelector";
import Legend from "@/components/globe/Legend";
import TimelineSlider from "@/components/globe/TimelineSlider";

// --- Comprehensive ISO Mapping ---
const ISO_MAP: Record<string, string> = {
  "004": "AFG", "008": "ALB", "012": "DZA", "016": "ASM", "020": "AND", "024": "AGO", "028": "ATG", "031": "AZE", "032": "ARG", "036": "AUS",
  "040": "AUT", "044": "BHS", "048": "BHR", "050": "BGD", "052": "BRB", "056": "BEL", "060": "BMU", "064": "BTN", "068": "BOL", "070": "BIH",
  "072": "BWA", "076": "BRA", "084": "BLZ", "090": "SLB", "096": "BRN", "100": "BGR", "104": "MMR", "108": "BDI", "112": "BLR", "116": "KHM",
  "120": "CMR", "124": "CAN", "132": "CPV", "136": "CYM", "140": "CAF", "144": "LKA", "148": "TCD", "152": "CHL", "156": "CHN", "158": "TWN",
  "170": "COL", "174": "COM", "178": "COG", "180": "COD", "184": "COK", "188": "CRI", "191": "HRV", "192": "CUB", "196": "CYP", "203": "CZE",
  "204": "BEN", "208": "DNK", "212": "DMA", "214": "DOM", "218": "ECU", "222": "SLV", "226": "GNQ", "231": "ETH", "232": "ERI", "233": "EST",
  "242": "FJI", "246": "FIN", "250": "FRA", "254": "GUF", "258": "PYF", "262": "DJI", "266": "GAB", "268": "GMB", "270": "GMB", "276": "DEU",
  "288": "GHA", "292": "GIB", "296": "KIR", "300": "GRC", "304": "GRL", "308": "GRD", "312": "GLP", "316": "GUM", "320": "GTM", "324": "GIN",
  "328": "GNB", "332": "HTI", "336": "VAT", "340": "HND", "344": "HKG", "348": "HUN", "352": "ISL", "356": "IND", "360": "IDN", "364": "IRN",
  "368": "IRQ", "372": "IRL", "376": "ISR", "380": "ITA", "384": "CIV", "388": "JAM", "392": "JPN", "398": "KAZ", "400": "JOR", "404": "KEN",
  "408": "PRK", "410": "KOR", "414": "KWT", "417": "KGZ", "418": "LAO", "422": "LBN", "426": "LSO", "428": "LVA", "430": "LBR", "434": "LBY",
  "438": "LIE", "440": "LTU", "442": "LUX", "446": "MAC", "450": "MDG", "454": "MWI", "458": "MYS", "462": "MDV", "466": "MLI", "470": "MLT",
  "474": "MTQ", "478": "MRT", "480": "MUS", "484": "MEX", "492": "MCO", "496": "MNG", "498": "MDA", "499": "MNE", "504": "MAR", "508": "MOZ",
  "512": "OMN", "516": "NAM", "520": "NRU", "524": "NPL", "528": "NLD", "531": "CUW", "533": "ABW", "534": "SXM", "535": "BES", "540": "NCL",
  "548": "NZL", "554": "NZL", "558": "NIC", "562": "NER", "566": "NGA", "570": "NIU", "574": "NFK", "578": "NOR", "580": "MNP", "583": "FSM",
  "584": "MHL", "585": "PLW", "586": "PAK", "591": "PAN", "598": "PNG", "600": "PRY", "604": "PER", "608": "PHL", "612": "PCN", "616": "POL",
  "620": "PRT", "624": "GNB", "626": "TLS", "630": "PRI", "634": "QAT", "638": "REU", "642": "ROU", "643": "RUS", "646": "RWA", "652": "BLM",
  "654": "SHN", "659": "KNA", "660": "AIA", "662": "LCA", "663": "MAF", "666": "SPM", "670": "VCT", "674": "SMR", "678": "STP", "682": "SAU",
  "686": "SEN", "688": "SRB", "690": "SYC", "694": "SLE", "702": "SGP", "703": "SVK", "704": "VNM", "705": "SVN", "706": "SOM", "710": "ZAF",
  "716": "ZWE", "724": "ESP", "728": "SSD", "729": "SDN", "740": "SUR", "744": "SJM", "748": "SWZ", "752": "SWE", "756": "CHE", "760": "SYR",
  "762": "TJK", "764": "THA", "768": "TGO", "772": "TKL", "776": "TON", "780": "TTO", "784": "ARE", "788": "TUN", "792": "TUR", "795": "TKM",
  "796": "TCA", "798": "TUV", "800": "UGA", "804": "UKR", "807": "MKD", "818": "EGY", "826": "GBR", "834": "TZA", "840": "USA", "850": "VIR",
  "854": "BFA", "858": "URY", "860": "UZB", "862": "VEN", "876": "WLF", "882": "WSM", "887": "YEM", "894": "ZMB"
};

const FALLBACK_GDP: Record<string, any> = {
  "USA": { gdp: 27360, name: "United States" },
  "CHN": { gdp: 17700, name: "China" },
  "DEU": { gdp: 4450, name: "Germany" },
  "JPN": { gdp: 4210, name: "Japan" },
  "IND": { gdp: 3570, name: "India" },
  "GBR": { gdp: 3340, name: "United Kingdom" },
  "FRA": { gdp: 3030, name: "France" },
  "TUR": { gdp: 1108, name: "Turkey" },
  "BRA": { gdp: 2170, name: "Brazil" },
  "ITA": { gdp: 2250, name: "Italy" }
};

export default function Globe() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState("INITIALIZING");
  const [hoveredCountry, setHoveredCountry] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Choropleth layer state
  const [activeLayer, setActiveLayer] = useState<LayerType>("gdp");
  // Time machine state
  const [activeYear, setActiveYear] = useState(2023);
  const [isPlaying, setIsPlaying] = useState(false);
  // All indicator data: { [indicator]: { [iso3]: { [year]: value } } }
  const indicatorDataRef = useRef<Record<string, Record<string, Record<number, number>>>>({});
  // Ref to trigger canvas redraws from React state changes
  const redrawRef = useRef<((layer?: LayerType, year?: number) => void) | null>(null);

  // Check prefers-reduced-motion
  const [shouldAnimate, setShouldAnimate] = useState(true);
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setShouldAnimate(!mediaQuery.matches);
  }, []);

  // Auto-play timer
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveYear((prev) => {
        if (prev >= YEAR_MAX) { setIsPlaying(false); return prev; }
        return prev + 1;
      });
    }, 800);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Trigger canvas redraw when layer or year changes
  useEffect(() => {
    redrawRef.current?.(activeLayer, activeYear);
  }, [activeLayer, activeYear]);

  const handlePlayToggle = useCallback(() => setIsPlaying((p) => !p), []);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    let mounted = true;
    let frameId: number;
    
    // Detect mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 3000);
    camera.position.z = 550;

    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current,
      antialias: true, 
      alpha: true 
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const mainLight = new THREE.PointLight(0x00ff88, 0.5);
    mainLight.position.set(500, 300, 500); 
    scene.add(mainLight);

    const texWidth = 4096;
    const texHeight = 2048;
    const texCanvas = document.createElement("canvas");
    texCanvas.width = texWidth;
    texCanvas.height = texHeight;
    const texContext = texCanvas.getContext("2d")!;

    const projection = d3.geoEquirectangular().scale(texWidth / (2 * Math.PI)).translate([texWidth / 2, texHeight / 2]);
    const path = d3.geoPath(projection, texContext);
    
    // Performance adjustment for mobile: lower geometry segments
    const segments = window.innerWidth < 768 ? 64 : 128;
    
    const globeTex = new THREE.CanvasTexture(texCanvas);
    const globeGeo = new THREE.SphereGeometry(150, segments, segments);
    const globeMat = new THREE.MeshLambertMaterial({ 
      map: globeTex,
      transparent: true,
      opacity: 1
    });
    const globe = new THREE.Mesh(globeGeo, globeMat);
    const globeGroup = new THREE.Group();
    globeGroup.add(globe);
    scene.add(globeGroup);

    const rimGeo = new THREE.SphereGeometry(152, segments, segments);
    const rimMat = new THREE.MeshBasicMaterial({ 
      color: 0x00ff88, 
      transparent: true, 
      opacity: 0.1, 
      side: THREE.BackSide 
    });
    globeGroup.add(new THREE.Mesh(rimGeo, rimMat));

    let countries: any[] = [];
    const gdpData: Record<string, any> = { ...FALLBACK_GDP };
    // Closure-local refs for current layer/year (updated via redrawRef)
    let currentLayer: LayerType = "gdp";
    let currentYear: number = 2023;

    const drawMap = () => {
      if (!texContext || !mounted) return;
      texContext.fillStyle = "#02040a";
      texContext.fillRect(0, 0, texWidth, texHeight);
      
      texContext.strokeStyle = "rgba(0, 255, 136, 0.05)";
      texContext.lineWidth = 0.5;
      for (let i = 0; i <= 144; i++) {
        const x = (texWidth / 144) * i;
        texContext.beginPath(); texContext.moveTo(x, 0); texContext.lineTo(x, texHeight); texContext.stroke();
      }
      for (let i = 0; i <= 72; i++) {
        const y = (texHeight / 72) * i;
        texContext.beginPath(); texContext.moveTo(0, y); texContext.lineTo(texWidth, y); texContext.stroke();
      }

      const layerConfig = LAYER_CONFIGS[currentLayer];
      const indicatorKey = layerConfig.indicator;
      const yearData = indicatorDataRef.current[indicatorKey];

      countries.forEach(feature => {
        const id = feature.id ? feature.id.toString().padStart(3, "0") : "";
        const iso3 = feature.properties?.iso_a3 || ISO_MAP[id] || id;
        
        // Try to get value from the indicator dataset for the current year
        let fillColor: string;
        const countryYearData = yearData?.[iso3];
        if (countryYearData) {
          // Find the exact year or closest available
          const value = countryYearData[currentYear] ?? null;
          fillColor = getColor(currentLayer, value);
        } else {
          // Fallback to GDP absolute data for default view
          const data = gdpData[iso3];
          fillColor = data && data.gdp > 0 ? getColor(currentLayer, null) : "rgba(0, 255, 136, 0.03)";
        }
        
        texContext.beginPath();
        path(feature);
        texContext.fillStyle = fillColor;
        texContext.fill();
        const hasData = yearData?.[iso3]?.[currentYear] != null;
        texContext.strokeStyle = hasData ? "rgba(0, 255, 136, 0.3)" : "rgba(0, 255, 136, 0.08)";
        texContext.lineWidth = 1;
        texContext.stroke();
      });
      globeTex.needsUpdate = true;
    };

    // Expose redraw to React state changes — pass layer/year directly
    redrawRef.current = (layer?: LayerType, year?: number) => {
      if (layer !== undefined) currentLayer = layer;
      if (year !== undefined) currentYear = year;
      drawMap();
    };

    const fetchIndicator = async (indicator: string, dateRange: string) => {
      try {
        const res = await fetch(
          `https://api.worldbank.org/v2/country/all/indicator/${indicator}?format=json&per_page=10000&date=${dateRange}`
        );
        const json = await res.json();
        return json?.[1] || [];
      } catch { return []; }
    };

    const loadEverything = async () => {
      try {
        setSyncStatus("FETCHING_GEO");
        const atlasData = await d3.json("https://unpkg.com/world-atlas@2.0.2/countries-110m.json");
        if (!mounted) return;
        countries = (topojson.feature(atlasData as any, (atlasData as any).objects.countries) as any).features;
        drawMap();
        setLoading(false);

        setSyncStatus("LOADING_DATA");
        // Fetch all three indicators for full historical range concurrently
        const indicators = [
          { key: "NY.GDP.PCAP.CD", label: "GDP per capita" },
          { key: "FP.CPI.TOTL.ZG", label: "Inflation" },
          { key: "NY.GDP.MKTP.KD.ZG", label: "Growth" },
        ];
        
        const fetchPromises = indicators.map(ind =>
          fetchIndicator(ind.key, `${YEAR_MIN}:${YEAR_MAX}`)
            .then(entries => ({ key: ind.key, entries }))
        );

        const results = await Promise.all(fetchPromises);
        if (!mounted) return;

        for (let i = 0; i < results.length; i++) {
          const result = results[i];
          const indKey = result.key;
          const entries = result.entries;
          
          if (!indicatorDataRef.current[indKey]) {
            indicatorDataRef.current[indKey] = {};
          }
          
          const currentIndicatorData = indicatorDataRef.current[indKey];
          const isGDP = indKey === "NY.GDP.PCAP.CD";

          for (let j = 0; j < entries.length; j++) {
            const v = entries[j];
            if (v.value == null || !v.countryiso3code) continue;
            const iso3 = v.countryiso3code;
            const year = parseInt(v.date);
            if (isNaN(year)) continue;

            if (!currentIndicatorData[iso3]) {
              currentIndicatorData[iso3] = {};
            }
            currentIndicatorData[iso3][year] = v.value;

            // Also populate gdpData for tooltip/name fallback
            if (isGDP && (!gdpData[iso3] || year > (gdpData[iso3].date || 0))) {
              gdpData[iso3] = { gdp: v.value, name: v.country?.value || iso3, date: year };
            }
          }
        }
        
        setSyncStatus("READY");
        drawMap();
      } catch (err) {
        if (mounted) setSyncStatus("OFFLINE");
      }
    };

    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };
    let startMouse = { x: 0, y: 0 };
    let rotationSpeed = { x: 0.001, y: 0 };
    const CLICK_THRESHOLD = 5; // pixels — anything above this is a drag, not a click
    let dragCooldownUntil = 0; // timestamp — auto-rotation pauses until this time

    const onStart = (clientX: number, clientY: number) => {
      isDragging = true;
      prevMouse = { x: clientX, y: clientY };
      startMouse = { x: clientX, y: clientY };
    };

    const onMove = (clientX: number, clientY: number) => {
      if (isDragging) {
        const dx = clientX - prevMouse.x;
        const dy = clientY - prevMouse.y;
        globeGroup.rotation.y += dx * 0.002;
        globeGroup.rotation.x += dy * 0.002;
        rotationSpeed = { x: dx * 0.001, y: dy * 0.001 };
        prevMouse = { x: clientX, y: clientY };
      }
      handleRaycast(clientX, clientY);
    };

    const onEnd = (clientX: number, clientY: number) => {
      if (!isDragging) return;
      isDragging = false;
      dragCooldownUntil = Date.now() + 3000; // 3s pause before auto-rotation resumes

      // Only navigate if this was a click (not a drag)
      const dragDist = Math.hypot(clientX - startMouse.x, clientY - startMouse.y);
      if (dragDist > CLICK_THRESHOLD) return;
      
      const rect = containerRef.current!.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((clientY - rect.top) / rect.height) * 2 + 1;
      
      const mouseVec = new THREE.Vector2(x, y);
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouseVec, camera);
      const intersects = raycaster.intersectObject(globe);
      
      if (intersects.length > 0) {
        const uv = intersects[0].uv!;
        const country = countries.find(f => d3.geoContains(f, [uv.x * 360 - 180, uv.y * 180 - 90]));
        if (country) {
          const id = country.id ? country.id.toString().padStart(3, "0") : "";
          const iso3 = country.properties?.iso_a3 || ISO_MAP[id] || id;
          if (iso3) {
            router.push(`/country/${iso3.toLowerCase()}`);
          }
        }
      }
    };

    const handleRaycast = (clientX: number, clientY: number) => {
      if (!tooltipRef.current || !containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((clientY - rect.top) / rect.height) * 2 + 1;

      const mouseVec = new THREE.Vector2(x, y);
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouseVec, camera);
      const intersects = raycaster.intersectObject(globe);

      if (intersects.length > 0) {
        const uv = intersects[0].uv!;
        const country = countries.find(f => d3.geoContains(f, [uv.x * 360 - 180, uv.y * 180 - 90]));
        if (country) {
          const id = country.id ? country.id.toString().padStart(3, "0") : "";
          const iso3 = country.properties?.iso_a3 || ISO_MAP[id] || id;
          const data = gdpData[iso3];
          
          setHoveredCountry({
            name: country.properties.name,
            iso: iso3,
            gdp: data?.gdp,
            status: data ? "LINK_ACTIVE" : "NO_DATA"
          });

          // Disable tooltip on mobile
          if (window.innerWidth >= 768) {
            tooltipRef.current.style.display = "block";
            tooltipRef.current.style.left = `${clientX + 15}px`;
            tooltipRef.current.style.top = `${clientY + 15}px`;
            tooltipRef.current.innerHTML = `
              <div class="flex items-center gap-2 mb-1">
                <span class="w-1.5 h-1.5 bg-[#00ff88] rounded-full shadow-[0_0_5px_#00ff88]"></span>
                <span class="font-bold tracking-tight">${country.properties.name.toUpperCase()}</span>
              </div>
              <div class="text-[9px] text-[#00ff88]/60 font-mono tracking-widest">
                NODE: ${iso3} | GDP: ${data?.gdp ? "$" + (data.gdp/1e9).toFixed(1) + "B" : "SYNCING"}
              </div>
            `;
          }
          return;
        }
      }
      tooltipRef.current.style.display = "none";
      // Don't clear hoveredCountry immediately on mobile to allow viewing the bottom sheet
      if (window.innerWidth >= 768) {
        setHoveredCountry(null);
      }
    };

    // Event Handlers
    const handleMouseDown = (e: MouseEvent) => onStart(e.clientX, e.clientY);
    const handleMouseMove = (e: MouseEvent) => onMove(e.clientX, e.clientY);
    const handleMouseUp = (e: MouseEvent) => onEnd(e.clientX, e.clientY);

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      onStart(touch.clientX, touch.clientY);
    };
    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      onMove(touch.clientX, touch.clientY);
    };
    const handleTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      onEnd(touch.clientX, touch.clientY);
    };

    // ResizeObserver for dynamic scaling
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        checkMobile();
      }
    });
    resizeObserver.observe(containerRef.current);

    const animate = () => {
      if (!mounted) return;
      frameId = requestAnimationFrame(animate);
      if (!isDragging && Date.now() > dragCooldownUntil) {
        globeGroup.rotation.y += rotationSpeed.x;
        globeGroup.rotation.x += rotationSpeed.y;
        rotationSpeed.x *= 0.98; rotationSpeed.y *= 0.98;
        if (Math.abs(rotationSpeed.x) < 0.0006) rotationSpeed.x = 0.0006;
      }
      renderer.render(scene, camera);
    };

    loadEverything();
    animate();

    const container = containerRef.current;
    container.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    
    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: true });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      mounted = false;
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      
      container.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      
      globeGeo.dispose();
      globeMat.dispose();
      globeTex.dispose();
      rimGeo.dispose();
      rimMat.dispose();
      renderer.dispose();
    };
  }, [router]);

  return (
    <div ref={containerRef} className="w-full h-screen relative bg-[#02040a] overflow-hidden font-mono text-[#00ff88] cursor-crosshair flex flex-col md:block">
      <canvas ref={canvasRef} className="w-full h-[60vh] md:h-full block shrink-0" />
      <div className="scanline-effect"></div>

      {/* Decorative tactical corners (Hidden on mobile) */}
      <div className="hidden md:block absolute top-0 left-0 w-32 h-32 border-t-2 border-l-2 border-[#00ff88]/20 m-6 pointer-events-none"></div>
      <div className="hidden md:block absolute bottom-0 right-0 w-32 h-32 border-b-2 border-r-2 border-[#00ff88]/20 m-6 pointer-events-none"></div>

      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={false}
            exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
            className="absolute inset-0 flex items-center justify-center z-[100] bg-[#02040a] animate-flicker p-6"
          >
            <div className="max-w-md w-full space-y-8">
              <div className="flex justify-center">
                <div className="relative">
                  <Cpu className="w-12 h-9 md:w-16 md:h-12 text-[#00ff88] animate-pulse" />
                  <div className="absolute inset-0 blur-lg bg-[#00ff88]/20 animate-pulse"></div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between text-[9px] md:text-[10px] font-black tracking-[0.2em] opacity-40">
                  <span>SYSTEM_BOOT</span>
                  <span>v2.5.0_REFRESH</span>
                </div>
                <div className="h-1 w-full bg-[#00ff88]/10 rounded-full overflow-hidden">
                  <div className="h-full bg-[#00ff88] w-full animate-[loading_2s_ease-in-out_infinite]"></div>
                </div>
                <div className="grid grid-cols-1 gap-1">
                  <div className="text-[8px] md:text-[9px] tracking-widest text-[#00ff88] flex items-center gap-3 uppercase">
                    <span className="w-1 h-1 bg-[#00ff88] rounded-full animate-ping shrink-0"></span>
                    Initializing_Neural_Grid...
                  </div>
                  <div className="text-[7px] md:text-[8px] tracking-widest opacity-30 uppercase font-bold truncate">
                    &gt; {syncStatus === "READY" ? "DATA_CACHED_24H" : "FETCHING_WORLD_BANK_DATA"}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>

      {/* Main HUD Panel */}
      <div className="absolute top-6 left-6 md:top-12 md:left-12 p-4 md:p-8 glass-panel rounded-xl md:rounded-2xl z-10 select-none border-l-4 border-l-[#00ff88] max-w-[calc(100%-3rem)] md:max-w-xs">
        <div className="flex items-center gap-3 md:gap-4 mb-1 md:mb-2">
          <GlobeIcon className="text-[#00ff88] w-5 h-5 md:w-6 md:h-6" />
          <h1 className="text-xl md:text-3xl font-black tracking-tighter text-white">ORBITAL_OS <span className="text-[#00ff88]">v2.5</span></h1>
        </div>
        <div className="text-[8px] md:text-[10px] text-[#00ff88]/40 uppercase tracking-[0.3em] md:tracking-[0.4em] font-bold">QUANTITATIVE_MACRO_GRID</div>
        
        <div className="mt-4 md:mt-8 grid grid-cols-2 gap-4 md:gap-6 opacity-80">
          <div className="space-y-1">
            <div className="text-[7px] md:text-[8px] uppercase tracking-widest font-bold text-[#00ff88]/50 flex items-center gap-2">
              <Zap size={10} /> Stability
            </div>
            <div className="text-[10px] md:text-xs font-bold text-white truncate">99.9% / SECURE</div>
          </div>
          <div className="space-y-1">
            <div className="text-[7px] md:text-[8px] uppercase tracking-widest font-bold text-[#00ff88]/50 flex items-center gap-2">
              <Shield size={10} /> Status
            </div>
            <div className="text-[10px] md:text-xs font-bold text-[#00ff88] animate-pulse uppercase truncate">{syncStatus}</div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Sheet / Desktop Sidebar Panel */}
      <AnimatePresence>
        {hoveredCountry && (
          <motion.div 
            key={hoveredCountry.iso}
            initial={shouldAnimate ? (isMobile ? { y: "100%" } : { x: 100, opacity: 0 }) : {}}
            animate={shouldAnimate ? (isMobile ? { y: 0 } : { x: 0, opacity: 1 }) : {}}
            exit={shouldAnimate ? (isMobile ? { y: "100%" } : { x: 100, opacity: 0 }) : {}}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`
              absolute z-20 select-none
              ${isMobile 
                ? 'bottom-0 left-0 right-0 p-6 glass-panel rounded-t-3xl border-t-4 border-t-[#00ff88]' 
                : 'top-12 right-12 w-64 glass-panel rounded-2xl p-6 border-r-4 border-r-[#00ff88]'
              }
            `}
          >
            {isMobile && (
              <div className="w-12 h-1 bg-[#00ff88]/20 rounded-full mx-auto mb-6" onClick={() => setHoveredCountry(null)}></div>
            )}
            
            <div className="text-[8px] font-black tracking-[0.3em] opacity-40 mb-4 flex items-center gap-2 uppercase">
              <Activity size={10} className="text-[#00ff88]" /> Tactical_Intelligence
            </div>
            
            <div className="flex justify-between items-start gap-4">
              <h2 className="text-xl md:text-2xl font-black tracking-tight text-white uppercase leading-tight">
                {hoveredCountry.name}
              </h2>
              {isMobile && (
                <button 
                  onClick={() => router.push(`/country/${hoveredCountry.iso.toLowerCase()}`)}
                  className="px-4 py-2 bg-[#00ff88] text-black text-[10px] font-black uppercase tracking-widest rounded-lg shadow-[0_0_15px_#00ff8844]"
                >
                  Enter
                </button>
              )}
            </div>

            <div className={`grid ${isMobile ? 'grid-cols-2 mt-6' : 'grid-cols-1 mt-6'} gap-4 md:gap-4`}>
              <div className="pb-3 md:border-b border-[#00ff88]/10">
                <div className="text-[8px] opacity-40 uppercase tracking-widest mb-1 font-bold">Node_Identity</div>
                <div className="text-xs font-mono text-[#00ff88]">ISO_{hoveredCountry.iso}</div>
              </div>

              <div className="pb-3 md:border-b border-[#00ff88]/10">
                <div className="text-[8px] opacity-40 uppercase tracking-widest mb-1 font-bold">Gdp_Quant</div>
                <div className="text-sm font-bold text-white tracking-tighter">
                  {hoveredCountry.gdp ? `$${(hoveredCountry.gdp/1e9).toFixed(2)}B` : "SYNCING..."}
                </div>
              </div>

              <div className={isMobile ? 'col-span-2' : ''}>
                <div className="text-[8px] opacity-40 uppercase tracking-widest mb-1 font-bold">Signal_Status</div>
                <div className={`text-[10px] font-black tracking-widest uppercase flex items-center gap-2 ${hoveredCountry.status === 'LINK_ACTIVE' ? 'text-[#00ff88]' : 'text-yellow-500'}`}>
                  <span className={`w-1 h-1 rounded-full ${hoveredCountry.status === 'LINK_ACTIVE' ? 'bg-[#00ff88] animate-ping' : 'bg-yellow-500'}`}></span>
                  {hoveredCountry.status}
                </div>
              </div>
            </div>
            
            <div className="mt-8 text-[7px] opacity-20 uppercase font-black tracking-[0.2em] italic">
              {"// "}
              {isMobile ? 'Use ENTER button for sector analysis' : 'Click to decrypt sector analysis'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={tooltipRef} className="absolute hidden glass-panel border border-[#00ff88]/40 p-5 pointer-events-none z-50 rounded-xl shadow-2xl animate-in fade-in zoom-in duration-200" />



      {/* Layer Selector + Legend — right side below country panel */}
      <div className="hidden md:flex absolute bottom-28 right-12 z-10 flex-col gap-3">
        <LayerSelector activeLayer={activeLayer} onLayerChange={(layer) => { setActiveLayer(layer); setTimeout(() => redrawRef.current?.(layer, activeYear), 0); }} />
        <Legend activeLayer={activeLayer} />
      </div>

      {/* Timeline Slider — bottom center */}
      <div className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-1/2 md:-translate-x-1/2 md:w-[600px] lg:w-[700px] z-10">
        <TimelineSlider
          year={activeYear}
          onYearChange={(y) => { setActiveYear(y); setTimeout(() => redrawRef.current?.(activeLayer, y), 0); }}
          isPlaying={isPlaying}
          onPlayToggle={handlePlayToggle}
        />
      </div>

      {/* Mobile Layer Selector (compact) */}
      <div className="md:hidden absolute top-20 right-4 z-10">
        <LayerSelector activeLayer={activeLayer} onLayerChange={(layer) => { setActiveLayer(layer); setTimeout(() => redrawRef.current?.(layer, activeYear), 0); }} />
      </div>
    </div>
  );
}
