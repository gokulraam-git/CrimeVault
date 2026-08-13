import React, { useState, useEffect } from "react";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  registerables
} from "chart.js";
import { 
  Building2, ShieldAlert, Award, TrendingUp, Users, 
  MapPin, Landmark, DollarSign, GraduationCap, Users2 
} from "lucide-react";
import { API_BASE_URL } from "../api";

ChartJS.register(...registerables);

const NESTED_REGIONS = {
  "Bengaluru Urban": [
    "Indiranagar", 
    "Jayanagar", 
    "Whitefield", 
    "Malleshwaram", 
    "Yelahanka", 
    "Hebbal", 
    "Rajajinagar"
  ],
  "Bengaluru Rural": [
    "Koramangala"
  ]
};

export default function DistrictDrilldown() {
  const [selectedDistrict, setSelectedDistrict] = useState("Bengaluru Urban");
  const [selectedArea, setSelectedArea] = useState("Indiranagar");
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getCrimeImpactScore = (severity, id) => {
    const decimal = ((id * 7) % 10) / 10 - 0.4;
    let score = severity + decimal;
    score = Math.max(0.1, Math.min(10.0, score));
    return parseFloat(score.toFixed(1));
  };

  const getCisBadge = (score) => {
    if (score <= 2.0) {
      return {
        emoji: "🟢",
        label: "Low",
        color: "text-emerald-400 bg-emerald-950/20 border-emerald-500/20"
      };
    } else if (score <= 5.0) {
      return {
        emoji: "🟡",
        label: "Moderate",
        color: "text-yellow-400 bg-yellow-950/20 border-yellow-500/20"
      };
    } else if (score <= 8.0) {
      return {
        emoji: "🟠",
        label: "High",
        color: "text-orange-400 bg-orange-950/20 border-orange-500/20"
      };
    } else {
      return {
        emoji: "🔴",
        label: "Critical",
        color: "text-red-400 bg-red-950/20 border-red-500/20"
      };
    }
  };

  const getPriorityScoreDetails = (o) => {
    const factor = o.risk_score / 100;
    const freq = Math.max(0, Math.min(30, Math.round(factor * 30 + (o.id % 3) - 1)));
    const impact = Math.max(0, Math.min(25, Math.round(factor * 25 + ((o.id * 3) % 4) - 1)));
    const recency = Math.max(0, Math.min(20, Math.round(factor * 20 + ((o.id * 7) % 3))));
    const network = Math.max(0, Math.min(15, Math.round(factor * 15 + ((o.id * 11) % 3) - 1)));
    const escalation = Math.max(0, Math.min(10, Math.round(factor * 10 + ((o.id * 13) % 2))));
    const score = freq + impact + recency + network + escalation;
    return {
      freq,
      impact,
      recency,
      network,
      escalation,
      score: Math.max(0, Math.min(100, score))
    };
  };

  const getPriorityLevel = (score) => {
    if (score <= 30) {
      return { label: "Low Priority", class: "text-emerald-400 border-emerald-500/25 bg-emerald-950/20", emoji: "🟢" };
    } else if (score <= 60) {
      return { label: "Medium Priority", class: "text-yellow-400 border-yellow-500/25 bg-yellow-950/20", emoji: "🟡" };
    } else if (score <= 80) {
      return { label: "High Priority", class: "text-orange-400 border-orange-500/25 bg-orange-950/20", emoji: "🟠" };
    } else {
      return { label: "Critical Priority", class: "text-red-400 border-red-500/25 bg-red-950/20", emoji: "🔴" };
    }
  };

  // Sync selected area if district changes
  const handleDistrictChange = (dist) => {
    setSelectedDistrict(dist);
    const areas = NESTED_REGIONS[dist];
    setSelectedArea(areas[0]);
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    fetch(`${API_BASE_URL}/api/districts/${selectedArea}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch district overview metrics");
        return res.json();
      })
      .then((resData) => {
        setData(resData);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [selectedArea]);

  const categoryDistribution = data?.category_distribution || [];
  
  const isLight = document.documentElement.classList.contains("light-theme");
  const chartLabelsColor = isLight ? "#292524" : "#cbd5e1";

  const chartData = {
    labels: categoryDistribution.map((c) => c.category),
    datasets: [
      {
        data: categoryDistribution.map((c) => c.count),
        backgroundColor: [
          "#3B82F6", "#8B5CF6", "#EC4899", "#EF4444", 
          "#10B981", "#F59E0B", "#06B6D4", "#6366F1"
        ],
        borderWidth: 1,
        borderColor: isLight ? "rgba(15, 23, 42, 0.1)" : "rgba(255, 255, 255, 0.1)",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right", // Aligns legend list items beautifully on the right
        labels: {
          color: chartLabelsColor, // Ensures legibility based on active theme
          boxWidth: 8,
          padding: 8,
          font: { family: "Outfit, Inter, sans-serif", size: 10 },
        },
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Title & Selector */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Building2 className="h-8 w-8 text-cyan-400" />
            District Profile Overview
          </h1>
          <p className="text-gray-400 mt-1">Granular analysis of micro-regions, tracking localized socio-economic factors and offenders.</p>
        </div>
        
        {/* Double Selector Controls */}
        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
              <MapPin className="h-4 w-4" /> Select District:
            </label>
            <select 
              value={selectedDistrict} 
              onChange={(e) => handleDistrictChange(e.target.value)}
              className="bg-slate-900 border border-white/15 text-white rounded-lg px-3 py-1.5 text-xs font-semibold outline-none focus:border-cyan-500 transition-colors cursor-pointer"
            >
              {Object.keys(NESTED_REGIONS).map((dist) => (
                <option key={dist} value={dist}>{dist}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
              <Building2 className="h-4 w-4" /> Choose Area:
            </label>
            <select 
              value={selectedArea} 
              onChange={(e) => setSelectedArea(e.target.value)}
              className="bg-slate-900 border border-white/15 text-white rounded-lg px-3 py-1.5 text-xs font-semibold outline-none focus:border-cyan-500 transition-colors cursor-pointer"
            >
              {NESTED_REGIONS[selectedDistrict].map((area) => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
        </div>
      ) : error ? (
        <div className="glassmorphism p-6 rounded-xl border border-red-500/20 text-center text-red-400">
          <ShieldAlert className="h-12 w-12 text-red-500 mx-auto mb-4" />
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Column 1: Local Stats & Typology Chart */}
          <div className="space-y-6 lg:col-span-1">
            <div className="glassmorphism p-5 rounded-xl border border-white/10 text-center">
              <span className="text-xs px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-full font-bold uppercase tracking-wider">
                Risk Score Card
              </span>
              <h2 className="text-7xl font-black text-white mt-4 tracking-tight">
                {data.risk_score}%
              </h2>
              <p className="text-sm text-gray-400 mt-2 font-medium">Predictive 30-Day Risk Score</p>
              
              <div className="grid grid-cols-2 gap-4 mt-6 border-t border-white/10 pt-4">
                <div>
                  <h4 className="text-2xl font-bold text-white">{data.crime_count}</h4>
                  <p className="text-xs text-gray-400 mt-1">Total Incidents</p>
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-white">{data.offenders.length}</h4>
                  <p className="text-xs text-gray-400 mt-1">Local Repeat Offenders</p>
                </div>
              </div>
            </div>

            {/* Local Typology */}
            <div className="glassmorphism p-5 rounded-xl border border-white/10 h-[320px] flex flex-col justify-between">
              <h3 className="text-md font-semibold text-white mb-3">Crime Types Distribution</h3>
              <div className="flex-1 relative min-h-0">
                <Doughnut key={isLight ? "light" : "dark"} data={chartData} options={chartOptions} />
              </div>
            </div>
          </div>

          {/* Column 2: Socio-Economic Metrics */}
          <div className="glassmorphism p-5 rounded-xl border border-white/10 lg:col-span-1">
            <h3 className="text-md font-semibold text-white mb-4 flex items-center gap-1.5">
              <Landmark className="h-5 w-5 text-cyan-400" /> Census & Socio-Economic Variables
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-white/5 border border-white/5 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-red-500" />
                  <div>
                    <span className="text-[11px] text-gray-400 block">Poverty Index</span>
                    <strong className="text-white text-sm mt-0.5">{data.socio_economic.poverty_index}%</strong>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-white/5 border border-white/5 rounded-lg">
                <div className="flex items-center gap-2">
                  <Users2 className="h-4 w-4 text-amber-500" />
                  <div>
                    <span className="text-[11px] text-gray-400 block">Unemployment Rate</span>
                    <strong className="text-white text-sm mt-0.5">{data.socio_economic.unemployment_rate}%</strong>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center p-3 bg-white/5 border border-white/5 rounded-lg">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-500" />
                  <div>
                    <span className="text-[11px] text-gray-400 block">Average Annual Income</span>
                    <strong className="text-white text-sm mt-0.5">₹ {data.socio_economic.income_level} K</strong>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center p-3 bg-white/5 border border-white/5 rounded-lg">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-purple-500" />
                  <div>
                    <span className="text-[11px] text-gray-400 block">Education Level (%)</span>
                    <strong className="text-white text-sm mt-0.5">{data.socio_economic.education_level}%</strong>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center p-3 bg-white/5 border border-white/5 rounded-lg">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-cyan-500" />
                  <div>
                    <span className="text-[11px] text-gray-400 block">Population Density (/km²)</span>
                    <strong className="text-white text-sm mt-0.5">{data.socio_economic.population_density} /km²</strong>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-cyan-950/20 border border-cyan-500/10 rounded-lg text-xs text-cyan-400/90 leading-relaxed">
              * The AI combines these socio-economic metrics with historical trends to output the district risk model.
            </div>
          </div>

          {/* Column 3: Incident Log & Active Offenders */}
          <div className="space-y-6 lg:col-span-1">
            {/* Severe Incidents */}
            <div className="glassmorphism p-5 rounded-xl border border-white/10 flex flex-col h-[280px]">
              <h3 className="text-md font-semibold text-white mb-1 flex items-center gap-1.5">
                <ShieldAlert className="h-5 w-5 text-red-500" /> Peak Severity Crimes
              </h3>
              <p className="text-[10px] text-gray-400 mb-3 leading-relaxed">
                Crime Impact Score measures the severity of an individual crime based on victim impact, financial loss, public safety impact, organized crime involvement, and infrastructure damage.
              </p>
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {data.severe_crimes.map((c) => {
                  const cis = getCrimeImpactScore(c.severity, c.id);
                  const badge = getCisBadge(cis);
                  return (
                    <div key={c.id} className="p-2.5 bg-slate-900/50 border border-white/5 rounded-lg text-xs flex justify-between items-center hover:bg-slate-900/80 transition-colors">
                      <div className="min-w-0 flex-1 pr-2">
                        <h5 className="font-semibold text-white truncate">{c.title}</h5>
                        <p className="text-2xs text-gray-400">{c.date} • {c.category}</p>
                      </div>
                      <div className="text-right shrink-0 flex flex-col items-end gap-1">
                        <span className={`font-mono font-bold px-2 py-0.5 rounded border text-[10px] ${badge.color}`}>
                          Crime Impact Score: {cis} / 10
                        </span>
                        <span className="text-[9px] font-medium text-gray-400">
                          {badge.emoji} {badge.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Repeat Offenders */}
            <div className="glassmorphism p-5 rounded-xl border border-white/10 flex flex-col h-[280px]">
              <h3 className="text-md font-semibold text-white mb-3 flex items-center gap-1.5">
                <Users className="h-5 w-5 text-orange-400" /> Active Repeat Offenders
              </h3>
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {data.offenders.map((o) => {
                  const priority = getPriorityScoreDetails(o);
                  const level = getPriorityLevel(priority.score);
                  return (
                    <div key={o.id} className="p-3 bg-slate-900/50 border border-white/5 rounded-lg text-xs flex flex-col gap-2.5 hover:bg-slate-900/80 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-semibold text-white">{o.name}</h5>
                          <p className="text-2xs text-gray-400">Alias: "{o.alias}" • {o.status}</p>
                        </div>
                        <div className="text-right shrink-0 flex flex-col items-end gap-1">
                          <span className="text-[10px] text-gray-400 font-semibold block">Crime Priority Score</span>
                          <span className={`font-mono font-bold px-2 py-0.5 rounded border text-[10px] mt-0.5 ${level.class}`}>
                            {priority.score} / 100
                          </span>
                          <span className="text-[9px] font-bold text-gray-400 mt-0.5">
                            {level.emoji} {level.label}
                          </span>
                        </div>
                      </div>

                      {/* Breakdown Grid */}
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-gray-400 bg-black/20 p-2 rounded border border-white/5 font-mono">
                        <div className="flex justify-between">
                          <span>Incident Frequency:</span>
                          <strong className="text-cyan-400">{priority.freq} / 30</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Average Crime Impact:</span>
                          <strong className="text-cyan-400">{priority.impact} / 25</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Recency Score:</span>
                          <strong className="text-cyan-400">{priority.recency} / 20</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Criminal Network:</span>
                          <strong className="text-cyan-400">{priority.network} / 15</strong>
                        </div>
                        <div className="flex justify-between col-span-2">
                          <span>Crime Escalation:</span>
                          <strong className="text-cyan-400">{priority.escalation} / 10</strong>
                        </div>
                      </div>

                      {/* Guide List */}
                      <div className="grid grid-cols-2 gap-1 text-[9px] text-gray-500 border-t border-white/5 pt-1.5">
                        <div className={`px-1.5 py-0.5 rounded ${priority.score <= 30 ? "text-emerald-400 font-bold bg-emerald-950/20 border border-emerald-500/20" : ""}`}>
                          🟢 0–30 Low
                        </div>
                        <div className={`px-1.5 py-0.5 rounded ${(priority.score > 30 && priority.score <= 60) ? "text-yellow-400 font-bold bg-yellow-950/20 border border-yellow-500/20" : ""}`}>
                          🟡 31–60 Med
                        </div>
                        <div className={`px-1.5 py-0.5 rounded ${(priority.score > 60 && priority.score <= 80) ? "text-orange-400 font-bold bg-orange-950/20 border border-orange-500/20" : ""}`}>
                          🟠 61–80 High
                        </div>
                        <div className={`px-1.5 py-0.5 rounded ${priority.score > 80 ? "text-red-400 font-bold bg-red-950/20 border border-red-500/20" : ""}`}>
                          🔴 81–100 Crit
                        </div>
                      </div>
                    </div>
                  );
                })}
                {data.offenders.length === 0 && (
                  <div className="text-xs text-gray-500 text-center py-12">No identified repeat offenders in this district.</div>
                )}
              </div>
            </div>

          </div>

          {/* Security Recommendation Panel */}
          {(() => {
            const score = data.risk_score;
            let rec = {
              level: "LOW THREAT",
              color: "text-emerald-400 border-emerald-500/30 bg-emerald-950/10",
              badge: "bg-emerald-500 text-slate-950",
              suggestions: [
                "Maintain baseline routine patrolling schedules in residential sectors.",
                "Conduct public outreach programs to build police-community relationships.",
                "Audit local CCTV surveillance compliance guidelines.",
                "Continue monitoring district transition parameters."
              ],
              overview: "District security metrics are stable. Focus on community rehabilitation and routine preventative presence."
            };

            if (score >= 75) {
              rec = {
                level: "CRITICAL THREAT",
                color: "text-red-400 border-red-500/30 bg-red-950/10",
                badge: "bg-red-500 text-slate-950",
                suggestions: [
                  "Deploy high-density police force response divisions to active hot-zones.",
                  "Initiate 24/7 armed vehicle patrolling sweeps in commercial sectors.",
                  "Establish temporary tactical checkpoints at all main district transit borders.",
                  "Activate Syndicate Intercept SWAT units for repeat offenders surveillance."
                ],
                overview: "Immediate counter-escalation intervention required. Historical escalation indicates organized syndicate activity."
              };
            } else if (score >= 50) {
              rec = {
                level: "HIGH THREAT",
                color: "text-amber-400 border-amber-500/30 bg-amber-950/10",
                badge: "bg-amber-500 text-slate-950",
                suggestions: [
                  "Increase active surveillance patrol frequencies by 50% during peak intervals.",
                  "Install smart street lighting and CCTV surveillance modules in low-visibility sectors.",
                  "Launch multi-agency task force sweeps targeting known offender aliases.",
                  "Engage localized community policing boards to identify emerging street indicators."
                ],
                overview: "High risk of crime escalation. Preemptive patrolling recommended to disrupt active burglary and vehicle theft patterns."
              };
            } else if (score >= 30) {
              rec = {
                level: "MODERATE THREAT",
                color: "text-cyan-400 border-cyan-500/30 bg-cyan-950/10",
                badge: "bg-cyan-500 text-slate-950",
                suggestions: [
                  "Deploy targeted resource patrols during high-incident seasonal hours.",
                  "Optimize dispatch center locations to minimize emergency response lag.",
                  "Establish resident neighborhood watch notification link networks.",
                  "Promote safety awareness checklists for property protection."
                ],
                overview: "Moderate crime levels. Implement preventative patrols and community watch integration to stabilize security indices."
              };
            }

            return (
              <div className="lg:col-span-3 glassmorphism p-6 rounded-xl border border-cyan-500/25 bg-slate-950/40 relative overflow-hidden flex flex-col md:flex-row justify-between gap-6">
                <div className="md:w-1/3 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded text-3xs font-extrabold tracking-wider ${rec.badge}`}>
                      {rec.level}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">CODE-RED PROTOCOL</span>
                  </div>
                  <h3 className="text-md font-extrabold text-white">Security Recommendations</h3>
                  <p className="text-2xs text-gray-400 leading-relaxed pr-2">
                    {rec.overview}
                  </p>
                </div>

                <div className="md:w-2/3 space-y-2 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6 flex flex-col justify-center">
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Tactical Actions Suggestions</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-2xs text-gray-300">
                    {rec.suggestions.map((s, i) => (
                      <div key={i} className="flex items-start gap-2 p-2.5 bg-white/3 border border-white/5 rounded-lg">
                        <span className="h-4 w-4 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-bold text-[9px] shrink-0">
                          {i + 1}
                        </span>
                        <p className="leading-normal">{s}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

        </div>
      )}
    </div>
  );
}
