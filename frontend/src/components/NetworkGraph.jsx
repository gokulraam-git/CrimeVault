import React, { useState, useEffect } from "react";
import { GitCommit, Shield, Users, Eye, Info, Award, User } from "lucide-react";
import { API_BASE_URL } from "../api";

export default function NetworkGraph() {
  const [data, setData] = useState({ nodes: [], links: [], gangs: [] });
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [hoveredLink, setHoveredLink] = useState(null);
  const [selectedLink, setSelectedLink] = useState(null);
  const [simulationNodes, setSimulationNodes] = useState([]);
  
  // Static container dimensions
  const width = 700;
  const height = 450;

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/network`)
      .then((res) => res.json())
      .then((netData) => {
        setData(netData);
        initializeSimulation(netData.nodes, netData.links);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching network graph:", err);
        setLoading(false);
      });
  }, []);

  const initializeSimulation = (nodes, links) => {
    // Assign random starting coordinates centered in the container
    const simNodes = nodes.map((node) => ({
      ...node,
      x: width / 2 + (Math.random() - 0.5) * 150,
      y: height / 2 + (Math.random() - 0.5) * 150,
      vx: 0,
      vy: 0
    }));

    // Standard force layout parameters to fit the static viewport
    const iterations = 180;
    const k = 70; // link target distance
    const repulseStrength = 3200; // repulsion force
    const attractStrength = 0.095;
    const gravity = 0.045;
    const damping = 0.85;

    let tempNodes = [...simNodes];

    for (let iter = 0; iter < iterations; iter++) {
      // 1. Repulsive forces between all nodes
      for (let i = 0; i < tempNodes.length; i++) {
        let n1 = tempNodes[i];
        for (let j = i + 1; j < tempNodes.length; j++) {
          let n2 = tempNodes[j];
          let dx = n2.x - n1.x;
          let dy = n2.y - n1.y;
          let distSq = dx * dx + dy * dy + 1;
          let dist = Math.sqrt(distSq);
          
          if (dist < 140) {
            let force = repulseStrength / distSq;
            let fx = (dx / dist) * force;
            let fy = (dy / dist) * force;
            
            n1.vx -= fx;
            n1.vy -= fy;
            n2.vx += fx;
            n2.vy += fy;
          }
        }
      }

      // 2. Attractive forces along links
      links.forEach((link) => {
        let sourceNode = tempNodes.find((n) => n.id === link.source);
        let targetNode = tempNodes.find((n) => n.id === link.target);
        
        if (sourceNode && targetNode) {
          let dx = targetNode.x - sourceNode.x;
          let dy = targetNode.y - sourceNode.y;
          let dist = Math.sqrt(dx * dx + dy * dy) + 0.1;
          
          let force = attractStrength * (dist - k) * link.weight;
          let fx = (dx / dist) * force;
          let fy = (dy / dist) * force;
          
          sourceNode.vx += fx;
          sourceNode.vy += fy;
          targetNode.vx -= fx;
          targetNode.vy -= fy;
        }
      });

      // 3. Gravity and position update
      tempNodes.forEach((node) => {
        let dx = width / 2 - node.x;
        let dy = height / 2 - node.y;
        node.vx += dx * gravity;
        node.vy += dy * gravity;

        node.x += node.vx;
        node.y += node.vy;
        
        node.vx *= damping;
        node.vy *= damping;

        // Contain strictly within static margins
        node.x = Math.max(30, Math.min(width - 30, node.x));
        node.y = Math.max(30, Math.min(height - 30, node.y));
      });
    }

    setSimulationNodes(tempNodes);
    
    // Default select the top leader (highest pagerank)
    if (tempNodes.length > 0) {
      const leader = [...tempNodes].sort((a, b) => b.pagerank - a.pagerank)[0];
      setSelectedNode(leader);
    }
  };

  const getGangColor = (gangId) => {
    const colors = [
      "var(--gang-color-3)", 
      "var(--gang-color-1)", 
      "var(--gang-color-2)", 
      "#F59E0B",             
      "#10B981",             
      "#EC4899",             
      "#3B82F6",             
      "#84CC16",             
      "#06B6D4",             
      "#8B5CF6",             
      "#F43F5E"              
    ];
    return colors[gangId] || colors[0];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  // Active focus element: hovered or selected node
  const activeFocusNode = hoveredNode || selectedNode;

  // Check if a node is connected to active focus node
  const isNodeConnected = (nodeId) => {
    if (!activeFocusNode) return true;
    if (nodeId === activeFocusNode.id) return true;
    return data.links.some(
      (l) => 
        (l.source === activeFocusNode.id && l.target === nodeId) ||
        (l.target === activeFocusNode.id && l.source === nodeId)
    );
  };

  // Find connections for selected node
  const selectedNodeLinks = data.links.filter(
    (l) => l.source === selectedNode?.id || l.target === selectedNode?.id
  );

  const getLinkageDetails = (link) => {
    if (!link) return null;
    const sourceNode = simulationNodes.find((n) => n.id === link.source);
    const targetNode = simulationNodes.find((n) => n.id === link.target);
    if (!sourceNode || !targetNode) return null;

    const strengthPct = Math.round(link.weight * 100);

    const detailMap = {
      "co-offender": {
        title: "Co-Offending History",
        color: "text-red-400 border-red-500/20 bg-red-950/10",
        badge: "bg-red-500 text-slate-950",
        description: `Suspects ${sourceNode.name} and ${targetNode.name} have been registered as accomplices in multiple burglary and theft incidents in Bengaluru. Operations database indicates shared logistics and synchronized locations during events.`,
        action: "Deploy active tactical surveillance sweeps on joint gang meeting points."
      },
      "phone_link": {
        title: "Communication Logs Intercept",
        color: "text-cyan-400 border-cyan-500/20 bg-cyan-950/10",
        badge: "bg-cyan-500 text-slate-950",
        description: `Direct telecom connection established. Call detail records (CDR) log multiple voice calls and message exchanges between ${sourceNode.name} and ${targetNode.name}, primarily during late-night operational hours.`,
        action: "Initiate voice packet recording and communication intercept tracking."
      },
      "vehicle_share": {
        title: "Shared Vehicle Log",
        color: "text-amber-400 border-amber-500/20 bg-amber-950/10",
        badge: "bg-amber-500 text-slate-950",
        description: `Automatic License Plate Readers (ALPR) and surveillance logs confirm both ${sourceNode.name} and ${targetNode.name} sharing use of the same two-wheelers and transit cars for logistics.`,
        action: "Flag vehicle plates in the regional traffic checkpoint database."
      },
      "address_share": {
        title: "Address & Co-habitation Overlap",
        color: "text-purple-400 border-purple-500/20 bg-purple-950/10",
        badge: "bg-purple-500 text-slate-950",
        description: `Lease registers, field checks, and local intel confirm that ${sourceNode.name} and ${targetNode.name} share a physical flat address inside Bengaluru, indicating close daily contact.`,
        action: "Authorize physical precinct inspection and local search warrant."
      },
      "financial_link": {
        title: "Financial Ledger Transaction",
        color: "text-emerald-400 border-emerald-500/20 bg-emerald-950/10",
        badge: "bg-emerald-500 text-slate-950",
        description: `Digital banking audits and ledger tracing flagged multiple peer-to-peer wire cash transactions and joint account setups linking ${sourceNode.name} and ${targetNode.name}.`,
        action: "Request freeze on linked digital transaction profiles and bank assets."
      }
    };

    return {
      sourceName: sourceNode.name,
      targetName: targetNode.name,
      strength: strengthPct,
      ...detailMap[link.type]
    };
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="pb-4 border-b border-white/10">
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          <GitCommit className="h-8 w-8 text-cyan-400 rotate-45 animate-pulse" />
          Criminal Network Analysis (Gangs)
        </h1>
        <p className="text-gray-400 mt-1">
          Graph analytics mapping shared phone numbers, addresses, vehicles, co-offender logs, and financial links.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SVG Network Graph Box and Linkage Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glassmorphism rounded-xl border border-white/10 overflow-hidden relative bg-[#060913]/95 h-[480px]">
          {/* Tactical Overlay */}
          <div className="absolute top-4 left-4 z-10 text-[9px] px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-full font-bold uppercase tracking-wider select-none pointer-events-none">
            Relationship Graph
          </div>
          
          <svg className="w-full h-full select-none cursor-default">
            {/* Background Grid Pattern */}
            <defs>
              <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255, 255, 255, 0.02)" strokeWidth="1" />
              </pattern>
              {/* Neon Glow Filter */}
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Draw Links (Curved Bezier Paths with Dynamic Thickness = Strength) */}
            {data.links.map((link, idx) => {
              const source = simulationNodes.find((n) => n.id === link.source);
              const target = simulationNodes.find((n) => n.id === link.target);
              if (!source || !target) return null;

              const isHovered = hoveredLink && hoveredLink.source === link.source && hoveredLink.target === link.target;
              const isSelected = selectedLink && selectedLink.source === link.source && selectedLink.target === link.target;
              const isHighlighted = (selectedNode && (source.id === selectedNode.id || target.id === selectedNode.id)) || isHovered || isSelected;
              const isDimmed = activeFocusNode && !((source.id === activeFocusNode.id || target.id === activeFocusNode.id)) && !isSelected;

              // Curved links using control point offset
              const mx = (source.x + target.x) / 2 + (target.y - source.y) * 0.15;
              const my = (source.y + target.y) / 2 - (target.x - source.x) * 0.15;
              
              const typeColorMap = {
                "co-offender": "rgba(239, 68, 68, ", 
                "phone_link": "rgba(6, 182, 212, ", 
                "vehicle_share": "rgba(245, 158, 11, ", 
                "address_share": "rgba(139, 92, 246, ", 
                "financial_link": "rgba(16, 185, 129, " 
              };
              
              const baseColor = typeColorMap[link.type] || "rgba(255, 255, 255, ";
              const strokeColor = `${baseColor}${isHovered ? "1.0" : isHighlighted ? "0.85" : isDimmed ? "0.04" : "0.35"})`;

              // Dynamic Edge Thickness based strictly on relationship strength weight
              const dynamicStrokeWidth = Math.max(1.2, link.weight * (isHovered ? 8 : isHighlighted ? 5.5 : 3.8));

              const pathD = `M ${source.x} ${source.y} Q ${mx} ${my} ${target.x} ${target.y}`;

              return (
                <g key={idx}>
                  {/* Glow filter backdrop when highlighted or hovered */}
                  {isHighlighted && (
                    <path
                      d={pathD}
                      stroke={strokeColor.replace(/[\d\.]+\)$/, "0.4)")}
                      strokeWidth={dynamicStrokeWidth * 2.2}
                      fill="none"
                      filter="url(#glow)"
                    />
                  )}
                  {/* Visible Link Path */}
                  <path
                    d={pathD}
                    stroke={strokeColor}
                    strokeWidth={dynamicStrokeWidth}
                    fill="none"
                    className="transition-all duration-300"
                  />
                  {/* Invisible Wide Touch/Hover Zone */}
                  <path
                    d={pathD}
                    stroke="transparent"
                    strokeWidth={Math.max(14, dynamicStrokeWidth * 3)}
                    fill="none"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredLink(link)}
                    onMouseLeave={() => setHoveredLink(null)}
                    onClick={() => setSelectedLink(link)}
                  />
                </g>
              );
            })}

            {/* Draw Nodes */}
            {simulationNodes.map((node) => {
              const isSelected = selectedNode && node.id === selectedNode.id;
              const isDimmed = activeFocusNode && !isNodeConnected(node.id);
              
              const size = node.role === "Leader" ? 18 : node.role === "Key Associate" ? 14 : 10;
              const color = getGangColor(node.gang_id);

              return (
                <g 
                  key={node.id} 
                  transform={`translate(${node.x}, ${node.y})`}
                  className="cursor-pointer"
                  onClick={() => setSelectedNode(node)}
                  onMouseEnter={() => setHoveredNode(node)}
                  onMouseLeave={() => setHoveredNode(null)}
                  style={{ opacity: isDimmed ? 0.25 : 1 }}
                >
                  {/* Glowing outer ring for leaders */}
                  {node.role === "Leader" && (
                    <circle 
                      r={size + 8} 
                      fill="none" 
                      stroke={`${color}50`}
                      strokeWidth={1.5}
                      className="animate-ping"
                    />
                  )}

                  {/* Node Selection Highlight Ring */}
                  {isSelected && (
                    <circle 
                      r={size + 5} 
                      fill="none" 
                      stroke="#fff" 
                      strokeWidth={1.5}
                      filter="url(#glow)"
                    />
                  )}

                  {/* Node base circle */}
                  <circle
                    r={size}
                    fill={color}
                    stroke="rgba(255, 255, 255, 0.9)"
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    className="transition-all duration-300 hover:scale-110"
                    filter="url(#glow)"
                  />
                  
                  {/* White center center for Leaders */}
                  {node.role === "Leader" && (
                    <circle r={4} fill="#fff" />
                  )}

                  {/* Label Text */}
                  <text
                    y={size + 14}
                    textAnchor="middle"
                    fill="#e5e7eb"
                    fontSize={node.role === "Leader" ? 11 : 9}
                    fontWeight={node.role === "Leader" ? "bold" : "semibold"}
                    className="select-none pointer-events-none filter drop-shadow-[0_1.5px_2px_rgba(0,0,0,1)]"
                  >
                    {node.alias || node.name}
                  </text>
                </g>
              );
            })}

          </svg>

          {/* Dynamic Link Hover Information Card */}
          {hoveredLink && (() => {
            const source = simulationNodes.find((n) => n.id === hoveredLink.source);
            const target = simulationNodes.find((n) => n.id === hoveredLink.target);
            if (!source || !target) return null;
            const midX = (source.x + target.x) / 2;
            const midY = (source.y + target.y) / 2;
            const strengthPct = Math.round(hoveredLink.weight * 100);

            return (
              <div 
                className="absolute z-30 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-4 bg-slate-900/95 backdrop-blur-md border border-cyan-500/50 text-white p-3 rounded-xl shadow-2xl text-xs w-64 animate-fade-in"
                style={{ left: Math.max(120, Math.min(width - 120, midX)), top: Math.max(80, midY) }}
              >
                <div className="flex justify-between items-center border-b border-white/10 pb-1.5 mb-2">
                  <span className="font-bold text-cyan-400 capitalize flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                    {hoveredLink.type.replace("_", " ")}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-extrabold border border-cyan-500/30">
                    {strengthPct}% Strength
                  </span>
                </div>
                <div className="text-2xs text-gray-300 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Connected Suspects:</span>
                    <span className="font-semibold text-white">{source.name} ↔ {target.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Edge Thickness:</span>
                    <span className="font-mono text-cyan-300 font-bold">{(hoveredLink.weight * 5.5).toFixed(1)}px</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Edge Thickness Legend Overlay */}
          <div className="absolute bottom-3 left-4 z-10 text-[10px] bg-slate-900/80 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg text-gray-300 flex items-center gap-3">
            <span className="text-gray-400 font-bold uppercase tracking-wider text-[9px]">Edge Thickness = Strength:</span>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-[9px]">Weak (0.3)</span>
              <div className="w-6 h-[1.5px] bg-cyan-400/50 rounded"></div>
              <div className="w-6 h-[3px] bg-cyan-400/80 rounded"></div>
              <div className="w-6 h-[5.5px] bg-cyan-400 rounded"></div>
              <span className="text-cyan-400 font-bold text-[9px]">Strong (1.0)</span>
            </div>
          </div>
          </div>

          {/* Linkage Details Panel */}
          {(() => {
            const relDetails = getLinkageDetails(selectedLink);
            return (
              <div className="glassmorphism p-5 rounded-xl border border-white/10 relative overflow-hidden bg-[#060913]/80">
                {relDetails ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-white/10 pb-3">
                      <div>
                        <h4 className="font-bold text-white text-sm flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${relDetails.badge}`}>
                            {selectedLink.type.replace("_", " ")}
                          </span>
                          Linkage Intelligence Profile
                        </h4>
                        <p className="text-2xs text-gray-400 mt-1">Relationship between connected network nodes.</p>
                      </div>
                      <span className="text-sm font-black text-cyan-400 bg-cyan-950/20 border border-cyan-500/20 px-2.5 py-1 rounded">
                        {relDetails.strength}% Strength Weight
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-2">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Connected Nodes</span>
                        <div className="p-3 bg-white/5 border border-white/5 rounded-lg flex justify-between items-center text-xs">
                          <span className="font-bold text-white">{relDetails.sourceName}</span>
                          <span className="text-cyan-400 font-black">↔</span>
                          <span className="font-bold text-white">{relDetails.targetName}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Tactical Intervention Directive</span>
                        <div className="p-3 bg-red-950/10 border border-red-500/10 rounded-lg text-red-400 text-2xs leading-relaxed font-medium">
                          {relDetails.action}
                        </div>
                      </div>

                      <div className="md:col-span-2 space-y-1.5">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Terms of Association</span>
                        <p className="p-3 bg-slate-900/40 border border-white/5 rounded-lg text-gray-300 text-2xs leading-relaxed">
                          {relDetails.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-2xs text-gray-500 italic">
                    Click on any relationship line (linkage edge) inside the network graph to inspect linkage association terms and tactical details.
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Details Inspector Sidebar */}
        <div className="space-y-6 lg:col-span-1">
          {/* Node Inspector Card */}
          {selectedNode ? (() => {
            const streetNames = [
              "M.G. Road", "Brigade Road", "Commercial Street", "100 Feet Road", 
              "Residency Road", "Richmond Road", "Double Road", "Cunningham Road", 
              "Kanakapura Road", "Bannerghatta Road", "Outer Ring Road", "Sarjapur Road", 
              "Hosur Road", "Tumkur Road", "Mysore Road", "Old Airport Road", 
              "Vittal Mallya Road", "Lavelle Road", "St. Mark's Road", "Nrupathunga Road"
            ];
            const areas = [
              "Koramangala", "Indiranagar", "Jayanagar", "Whitefield", "Malleshwaram", 
              "Yelahanka", "Hebbal", "Rajajinagar", "Sadashivanagar", "HSR Layout", 
              "BTM Layout", "Banashankari", "Basavanagudi", "J.P. Nagar", "Kalyan Nagar", 
              "RT Nagar", "Ulsoor", "Marathahalli", "Electronic City", "Whitefield Area"
            ];

            const street = streetNames[(selectedNode.id * 13) % streetNames.length];
            const area = areas[(selectedNode.id * 17) % areas.length];
            const doorNo = (selectedNode.id * 23) % 450 + 1;

            const selectedNodeDob = `${String((selectedNode.id * 3) % 28 + 1).padStart(2, '0')}/${String((selectedNode.id * 7) % 12 + 1).padStart(2, '0')}/${2026 - selectedNode.age}`;
            const phoneSuffix = (103417 + selectedNode.id * 7823) % 900000 + 100000;
            const selectedNodePhone = `+91 9840${phoneSuffix}`;
            const selectedNodeAddress = `Door No. ${doorNo}, ${street}, ${area}, Bangalore`;

            return (
              <div className="glassmorphism p-5 rounded-xl border border-white/10 flex flex-col justify-between h-[420px]">
                <div>
                  <div className="flex justify-between items-start border-b border-white/10 pb-3">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full inline-block animate-pulse" style={{ backgroundColor: getGangColor(selectedNode.gang_id) }}></span>
                        {selectedNode.name}
                      </h3>
                      <p className="text-xs text-gray-400">Alias: "{selectedNode.alias || "None"}"</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      selectedNode.role === "Leader" 
                        ? "bg-red-500/20 border border-red-500/30 text-red-400" 
                        : selectedNode.role === "Key Associate" 
                        ? "bg-amber-500/20 border border-amber-500/30 text-amber-400" 
                        : "bg-cyan-500/10 border border-cyan-500/20 text-cyan-400"
                    }`}>
                      {selectedNode.role}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 mt-4 text-xs">
                    <div>
                      <span className="text-gray-400 block font-medium">Age / DOB:</span>
                      <p className="font-bold text-white text-xs mt-0.5">
                        {selectedNode.age} yrs • <span className="text-cyan-400">{selectedNodeDob}</span>
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400 block font-medium">Phone:</span>
                      <p className="font-bold text-white text-xs mt-0.5">{selectedNodePhone}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-400 block font-medium">Registered Address:</span>
                      <p className="font-bold text-white text-xs mt-0.5 leading-normal">{selectedNodeAddress}</p>
                    </div>
                    
                    <div className="border-t border-white/5 col-span-2 my-1"></div>

                    <div>
                      <span className="text-gray-400 block font-medium">PageRank Influence:</span>
                      <p className="font-bold text-white text-xs mt-0.5">{selectedNode.pagerank}%</p>
                    </div>
                    <div>
                      <span className="text-gray-400 block font-medium">Direct Connections:</span>
                      <p className="font-bold text-white text-xs mt-0.5">{selectedNode.degree} links</p>
                    </div>
                    <div>
                      <span className="text-gray-400 block font-medium">Status:</span>
                      <p className="font-bold text-white text-xs mt-0.5">{selectedNode.status}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 block font-medium">Syndicate Group:</span>
                      <p className="font-bold text-xs mt-0.5" style={{ color: getGangColor(selectedNode.gang_id) }}>
                        Syndicate {String.fromCharCode(64 + selectedNode.gang_id)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Connections list preview */}
                <div className="text-[11px] text-gray-300 bg-white/5 border border-white/5 p-2 rounded-lg leading-relaxed flex items-center gap-1.5 mt-2">
                  <Info className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span>
                    Connected to <strong>{selectedNodeLinks.length}</strong> co-offenders via {
                      selectedNodeLinks.map(l => l.type).filter((v, i, a) => a.indexOf(v) === i).join(", ")
                    }.
                  </span>
                </div>
              </div>
            );
          })() : (
            <div className="glassmorphism p-5 rounded-xl border border-white/10 h-[420px] flex items-center justify-center text-xs text-gray-500">
              Select any node in the relationship graph to inspect metrics.
            </div>
          )}

          {/* Gang Summaries */}
          <div className="glassmorphism p-4 rounded-xl border border-white/10 max-h-[190px] overflow-y-auto space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
              <Users className="h-4 w-4 text-cyan-400" /> Identified Syndicates
            </h4>
            {data.gangs.map((gang) => (
              <div key={gang.gang_id} className="p-2 bg-slate-900/50 border border-white/5 rounded-lg flex justify-between items-center text-xs">
                <div>
                  <h5 className="font-bold text-white flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: getGangColor(gang.gang_id) }}></span>
                    {gang.gang_name}
                  </h5>
                  <p className="text-2xs text-gray-400 mt-0.5">Leader: {gang.leader} • {gang.primary_activities}</p>
                </div>
                <span className="text-2xs px-2 py-0.5 rounded bg-white/5 font-semibold text-gray-300">
                  {gang.member_count} Members
                </span>
              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
}
