import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { AlertCircle, Eye, EyeOff, Navigation, Layers } from "lucide-react";

export default function HotspotsMap() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const layerGroupsRef = useRef({ hotspots: null, pins: null });
  
  const [data, setData] = useState({ hotspots: [], crime_pins: [] });
  const [loading, setLoading] = useState(true);
  const [filterRisk, setFilterRisk] = useState("all"); // all, High, Medium, Low
  const [showPins, setShowPins] = useState(true);
  const [showPulse, setShowPulse] = useState(true);

  const tileLayerRef = useRef(null);

  // Load hotspots and pins data
  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/hotspots")
      .then((res) => res.json())
      .then((resData) => {
        setData(resData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching hotspot map data:", err);
        setData({ hotspots: [], crime_pins: [] });
        setLoading(false);
      });
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || loading) return;
    
    // Bengaluru Center coordinates
    const center = [12.9716, 77.5946]; 
    
    // Initialize map
    const map = L.map(mapContainerRef.current, {
      center: center,
      zoom: 11,
      zoomControl: true,
      attributionControl: false
    });
    
    // Check initial theme state
    const isLight = document.documentElement.classList.contains("light-theme");
    const initialUrl = isLight 
      ? "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" // Light Grey theme
      : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

    // Add carto basemap
    const tileLayer = L.tileLayer(initialUrl, {
      maxZoom: 19
    }).addTo(map);
    
    tileLayerRef.current = tileLayer;
    
    // Create layer groups
    layerGroupsRef.current.hotspots = L.layerGroup().addTo(map);
    layerGroupsRef.current.pins = L.layerGroup().addTo(map);
    
    mapRef.current = map;
    
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [loading]);

  // Observer to update basemap tiles dynamically when light/dark theme toggles
  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return;

    const updateTiles = () => {
      const isLight = document.documentElement.classList.contains("light-theme");
      const url = isLight
        ? "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
      
      if (tileLayerRef.current) {
        tileLayerRef.current.setUrl(url);
      }
    };

    const observer = new MutationObserver(updateTiles);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, [loading]);

  // Update map contents when data, risk filter, or showPins state changes
  useEffect(() => {
    if (!mapRef.current || loading) return;

    const map = mapRef.current;
    const hotspotsGroup = layerGroupsRef.current.hotspots;
    const pinsGroup = layerGroupsRef.current.pins;

    // Clear existing layers
    hotspotsGroup.clearLayers();
    pinsGroup.clearLayers();

    // 1. Render Hotspot circles
    data.hotspots.forEach((h) => {
      // Filter check
      if (filterRisk !== "all" && h.risk_level !== filterRisk) return;

      const colorMap = {
        High: "#EF4444",   // Red
        Medium: "#F59E0B", // Orange
        Low: "#10B981"     // Emerald Green
      };
      
      const fillColor = colorMap[h.risk_level] || "#8B5CF6";
      
      // Scale pulse/marker size strictly based on risk level
      let dotSize = 10;
      let pulseRingSize = 32;
      if (h.risk_level === "High") {
        dotSize = 14;
        pulseRingSize = 76;
      } else if (h.risk_level === "Medium") {
        dotSize = 12;
        pulseRingSize = 52;
      }

      const popupContent = `
        <div style="font-family: sans-serif; font-size: 13px;">
          <h4 style="margin: 0 0 5px 0; font-weight: bold; color: ${fillColor}; font-size: 14px;">
            ${h.risk_level} Risk Hotspot
          </h4>
          <p style="margin: 3px 0;"><b>Centroid:</b> ${h.latitude.toFixed(4)}, ${h.longitude.toFixed(4)}</p>
          <p style="margin: 3px 0;"><b>Primary District:</b> ${h.primary_district}</p>
          <p style="margin: 3px 0;"><b>Crime Density:</b> ${h.crime_count} incidents</p>
          <p style="margin: 3px 0;"><b>Avg Severity:</b> ${h.avg_severity}/10</p>
          <p style="margin: 3px 0;"><b>Risk Score:</b> ${h.risk_score}%</p>
        </div>
      `;

      // Render pulsing marker if showPulse is enabled, else render static dot marker
      const pulseIcon = L.divIcon({
        className: "custom-pulse-icon",
        html: showPulse ? `
          <div style="position: relative; width: ${pulseRingSize}px; height: ${pulseRingSize}px; display: flex; align-items: center; justify-content: center;">
            <div style="background-color: ${fillColor}; width: ${dotSize}px; height: ${dotSize}px; border-radius: 50%; border: 1.5px solid #fff; box-shadow: 0 0 8px ${fillColor}; z-index: 10;"></div>
            <div style="position: absolute; width: ${pulseRingSize}px; height: ${pulseRingSize}px; border-radius: 50%; border: 2px solid ${fillColor}; animation: pulse-sonar 2s ease-out infinite; transform-origin: center; pointer-events: none; opacity: 0;"></div>
          </div>
        ` : `
          <div style="position: relative; width: ${dotSize}px; height: ${dotSize}px; display: flex; align-items: center; justify-content: center;">
            <div style="background-color: ${fillColor}; width: ${dotSize}px; height: ${dotSize}px; border-radius: 50%; border: 1.5px solid #fff; box-shadow: 0 0 8px ${fillColor};"></div>
          </div>
        `,
        iconSize: showPulse ? [pulseRingSize, pulseRingSize] : [dotSize, dotSize],
        iconAnchor: showPulse ? [pulseRingSize / 2, pulseRingSize / 2] : [dotSize / 2, dotSize / 2]
      });

      const pulseMarker = L.marker([h.latitude, h.longitude], { icon: pulseIcon });
      pulseMarker.bindPopup(popupContent);
      hotspotsGroup.addLayer(pulseMarker);
    });

    // 2. Render Individual Crime Pins if checked
    if (showPins) {
      data.crime_pins.forEach((pin) => {
        // Find if this pin falls within filtered risk?
        // We will just show all pins or filter based on district if wanted,
        // let's show pins for the hotspots displayed.
        const pinColorMap = {
          "Street Theft": "#3B82F6",
          "Vehicle Theft": "#8B5CF6",
          "Assault": "#EF4444",
          "Drug Trafficking": "#10B981",
          "Cybercrime": "#F59E0B",
          "Smuggling": "#EC4899",
          "Money Laundering": "#06B6D4",
          "Organized Burglary": "#F59E0B"
        };
        const color = pinColorMap[pin.category] || "#9CA3AF";

        // Create glowing HTML dot icon
        // Add a clean dark stroke in light theme so pins pop clearly on light grey basemaps
        const isLight = document.documentElement.classList.contains("light-theme");
        const pinBorder = isLight ? "border: 1px solid rgba(0, 0, 0, 0.45);" : "";
        const iconSizeVal = isLight ? 9.5 : 8;
        const offsetVal = iconSizeVal / 2;

        const icon = L.divIcon({
          className: "custom-div-icon",
          html: `<div style="background-color: ${color}; width: ${iconSizeVal}px; height: ${iconSizeVal}px; border-radius: 50%; box-shadow: 0 0 8px ${color}; ${pinBorder}"></div>`,
          iconSize: [iconSizeVal, iconSizeVal],
          iconAnchor: [offsetVal, offsetVal]
        });

        const marker = L.marker([pin.latitude, pin.longitude], { icon: icon });
        const popupContent = `
          <div style="font-family: sans-serif; font-size: 12px; min-width: 140px;">
            <h4 style="margin: 0 0 4px 0; font-weight: bold; color: #fff;">${pin.category}</h4>
            <p style="margin: 2px 0; color: #cbd5e1;">${pin.title}</p>
            <p style="margin: 2px 0;"><b>District:</b> ${pin.district}</p>
            <p style="margin: 2px 0;"><b>Severity:</b> <span style="color: #f87171;">${pin.severity}/10</span></p>
            <p style="margin: 2px 0; color: #94a3b8;">${pin.date}</p>
          </div>
        `;
        marker.bindPopup(popupContent);
        pinsGroup.addLayer(marker);
      });
    }

  }, [data, filterRisk, showPins, showPulse, loading]);

  const handleCenterHotspot = (lat, lon) => {
    if (mapRef.current) {
      mapRef.current.setView([lat, lon], 14, { animate: true, duration: 1 });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="pb-4 border-b border-white/10">
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          Geospatial Crime Hotspots
        </h1>
        <p className="text-gray-400 mt-1">Spatial Density & K-Means Clustering on location arrays, highlighting high concentration risk sectors.</p>
      </div>

      {/* Control Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 glassmorphism rounded-xl border border-white/10">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-400 mr-2 flex items-center gap-1">
            <Layers className="h-4 w-4" /> Filter Clusters:
          </span>
          <button 
            onClick={() => setFilterRisk("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              filterRisk === "all" 
                ? "bg-cyan-600/30 border-cyan-500 text-cyan-400" 
                : "border-white/10 text-gray-400 hover:bg-white/5"
            }`}
          >
            All Clusters
          </button>
          <button 
            onClick={() => setFilterRisk("High")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              filterRisk === "High" 
                ? "bg-red-600/30 border-red-500 text-red-400" 
                : "border-white/10 text-gray-400 hover:bg-white/5"
            }`}
          >
            High Risk
          </button>
          <button 
            onClick={() => setFilterRisk("Medium")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              filterRisk === "Medium" 
                ? "bg-amber-600/30 border-amber-500 text-amber-400" 
                : "border-white/10 text-gray-400 hover:bg-white/5"
            }`}
          >
            Medium Risk
          </button>
          <button 
            onClick={() => setFilterRisk("Low")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              filterRisk === "Low" 
                ? "bg-emerald-600/30 border-emerald-500 text-emerald-400" 
                : "border-white/10 text-gray-400 hover:bg-white/5"
            }`}
          >
            Low Risk
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowPulse(!showPulse)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              showPulse 
                ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400" 
                : "border-white/10 text-gray-400"
            }`}
          >
            {showPulse ? <Eye className="h-4.5 w-4.5" /> : <EyeOff className="h-4.5 w-4.5" />}
            {showPulse ? "Crime Pulse Enabled" : "Crime Pulse Disabled"}
          </button>

          <button 
            onClick={() => setShowPins(!showPins)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              showPins 
                ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400" 
                : "border-white/10 text-gray-400"
            }`}
          >
            {showPins ? <Eye className="h-4.5 w-4.5" /> : <EyeOff className="h-4.5 w-4.5" />}
            {showPins ? "Showing Crime Markers" : "Hiding Crime Markers"}
          </button>
        </div>
      </div>

      {/* Main Grid: Map & Hotspot List */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Leaflet Map Div */}
        <div className="lg:col-span-3 h-[500px] rounded-xl overflow-hidden border border-white/10 shadow-inner relative">
          <div ref={mapContainerRef} className="w-full h-full"></div>
          
          {/* Floating Map Legend Overlay */}
          <div className="absolute bottom-5 left-5 z-[1000] glassmorphism p-5 rounded-2xl border border-white/10 text-xs space-y-4 max-w-[280px] pointer-events-auto shadow-2xl">
            <h4 className="font-extrabold text-white uppercase tracking-wider text-[11px] border-b border-white/5 pb-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0"></span> Map Legend
            </h4>
            
            {/* Hotspots Section */}
            <div className="space-y-2">
              <span className="font-bold text-gray-400 uppercase tracking-wider text-[9px] block">K-Means Risk Zones</span>
              <div className="flex items-center gap-2.5">
                <span className="w-3.5 h-3.5 rounded-full border border-red-500/50 bg-red-500/20 block shrink-0"></span>
                <span className="text-gray-300 font-medium">High Risk Area (Score &gt; 70%)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-3.5 h-3.5 rounded-full border border-amber-500/50 bg-amber-500/20 block shrink-0"></span>
                <span className="text-gray-300 font-medium">Medium Risk Area (Score 40-70%)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-3.5 h-3.5 rounded-full border border-emerald-500/50 bg-emerald-500/20 block shrink-0"></span>
                <span className="text-gray-300 font-medium">Low Risk Area (Score &lt; 40%)</span>
              </div>
            </div>

            {/* Individual incidents lights */}
            <div className="space-y-2">
              <span className="font-bold text-gray-400 uppercase tracking-wider text-[9px] block">Crime Markers (Incidents)</span>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6] block shadow-[0_0_3px_#3B82F6]"></span>
                  <span className="text-gray-300">Street Theft</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6] block shadow-[0_0_3px_#8B5CF6]"></span>
                  <span className="text-gray-300">Vehicle Theft</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] block shadow-[0_0_3px_#EF4444]"></span>
                  <span className="text-gray-300">Assault</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] block shadow-[0_0_3px_#10B981]"></span>
                  <span className="text-gray-300">Narcotics</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] block shadow-[0_0_3px_#F59E0B]"></span>
                  <span className="text-gray-300">Burglary/Cyber</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EC4899] block shadow-[0_0_3px_#EC4899]"></span>
                  <span className="text-gray-300">Smuggling</span>
                </div>
                <div className="flex items-center gap-1.5 col-span-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#06B6D4] block shadow-[0_0_3px_#06B6D4]"></span>
                  <span className="text-gray-300">Money Laundering</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hotspots details sidebar */}
        <div className="glassmorphism p-4 rounded-xl border border-white/10 flex flex-col h-[500px]">
          <h3 className="text-md font-bold text-white mb-3 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-cyan-400" />
            Detected Hotspots ({data.hotspots.filter(h => filterRisk === "all" || h.risk_level === filterRisk).length})
          </h3>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {data.hotspots
              .filter(h => filterRisk === "all" || h.risk_level === filterRisk)
              .map((h) => {
                const colorMap = {
                  High: "border-red-500/30 bg-red-950/10 hover:bg-red-950/20 text-red-400",
                  Medium: "border-amber-500/30 bg-amber-950/10 hover:bg-amber-950/20 text-amber-400",
                  Low: "border-emerald-500/30 bg-emerald-950/10 hover:bg-emerald-950/20 text-emerald-400"
                };
                const riskStyle = colorMap[h.risk_level] || "border-white/15 bg-white/5 text-white";
                
                return (
                  <div 
                    key={h.id} 
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${riskStyle}`}
                    onClick={() => handleCenterHotspot(h.latitude, h.longitude)}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-semibold text-sm">{h.primary_district}</span>
                      <span className="text-2xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                        Score {h.risk_score}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1"><b>Radius:</b> {h.radius_km} km</p>
                    <p className="text-xs text-gray-400"><b>Incidents:</b> {h.crime_count} cases</p>
                    <p className="text-xs text-gray-400"><b>Avg Severity:</b> {h.avg_severity}/10</p>
                    <div className="flex items-center gap-1 text-[11px] font-semibold mt-2 text-cyan-400">
                      <Navigation className="h-3 w-3" /> Focus on map
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes pulse-sonar {
          0% {
            transform: scale(0.3);
            opacity: 0.9;
          }
          100% {
            transform: scale(2.8);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
