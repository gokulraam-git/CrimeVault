import React, { useState, useEffect } from "react";
import { UserCheck, ShieldAlert, FileText, Calendar, MapPin, Search, List, GitCommit } from "lucide-react";
import { API_BASE_URL } from "../api";

export default function OffenderTracker() {
  const [offenders, setOffenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffender, setSelectedOffender] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [subTab, setSubTab] = useState("list"); // list, timeline

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/offenders`)
      .then((res) => res.json())
      .then((data) => {
        setOffenders(data);
        if (data.length > 0) setSelectedOffender(data[0]);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching offender data:", err);
        setLoading(false);
      });
  }, []);

  const filteredOffenders = offenders.filter((o) =>
    o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (o.alias && o.alias.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="pb-4 border-b border-white/10">
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          <UserCheck className="h-8 w-8 text-cyan-400" />
          Repeat Offender Dossier Tracking
        </h1>
        <p className="text-gray-400 mt-1">Recidivism risk score matrices compiled from frequency of arrest, crime severity levels, and syndicate roles.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Search & Offender List */}
        <div className="glassmorphism p-4 rounded-xl border border-white/10 flex flex-col h-[520px]">
          {/* Search bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search suspect name/alias..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 text-white rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
          
          {/* List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredOffenders.map((o) => {
              const isSelected = selectedOffender && o.id === selectedOffender.id;
              return (
                <div 
                  key={o.id}
                  onClick={() => setSelectedOffender(o)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected 
                      ? "bg-cyan-600/20 border-cyan-500 text-cyan-400" 
                      : "bg-slate-900/40 border-white/5 text-gray-300 hover:bg-slate-900/60"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-white">{o.name}</h4>
                      <p className="text-2xs text-gray-400">Alias: "{o.alias || "N/A"}"</p>
                    </div>
                    <span className="text-2xs px-2 py-0.5 rounded bg-white/5 border border-white/10">
                      Recid. {o.recidivism_score}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-3 text-2xs text-gray-400">
                    <span>Age: {o.age} • Status: {o.status}</span>
                    <span className="font-semibold text-gray-300">{o.history_count} Incidents</span>
                  </div>
                </div>
              );
            })}
            {filteredOffenders.length === 0 && (
              <div className="text-xs text-gray-500 text-center py-12">No offenders match search query.</div>
            )}
          </div>
        </div>

        {/* Right Side: Offender dossier card */}
        <div className="lg:col-span-2 space-y-6">
          {selectedOffender ? (
            <div className="glassmorphism p-6 rounded-xl border border-white/10 min-h-[520px] flex flex-col justify-between">
              <div>
                {/* Dossier Header */}
                <div className="flex justify-between items-start border-b border-white/10 pb-4">
                  <div>
                    <span className="text-2xs px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded uppercase font-bold tracking-wider">
                      Intelligence Dossier
                    </span>
                    <h2 className="text-2xl font-bold text-white mt-1.5">{selectedOffender.name}</h2>
                    <p className="text-xs text-gray-400">Primary Alias: <strong className="text-gray-300">"{selectedOffender.alias || "None"}"</strong></p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xs text-gray-400 uppercase tracking-wider block">Recidivism Score</span>
                    <span className="text-3xl font-black text-red-400">{selectedOffender.recidivism_score}%</span>
                  </div>
                </div>

                {/* Profile Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 text-xs bg-white/3 border border-white/5 p-4 rounded-lg">
                  <div>
                    <span className="text-gray-400 block">System ID:</span>
                    <span className="font-semibold text-white mt-1 block">#CDN-{selectedOffender.id.toString().padStart(4, "0")}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Age:</span>
                    <span className="font-semibold text-white mt-1 block">{selectedOffender.age} years</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Monitor Status:</span>
                    <span className="font-semibold text-white mt-1 block">{selectedOffender.status}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Assigned Risk Level:</span>
                    <span className="font-semibold text-red-400 mt-1 block">
                      {selectedOffender.risk_score > 75 ? "Critical" : selectedOffender.risk_score > 50 ? "High" : "Moderate"}
                    </span>
                  </div>
                </div>

                {/* Criminal Offence Tab selector and view container */}
                <div className="mt-6 flex flex-col h-[280px]">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-3">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-cyan-400" /> Crime Records History ({selectedOffender.crime_history.length})
                    </h3>
                    
                    {/* View Options Toggle Buttons */}
                    <div className="flex items-center gap-1 text-[10px] font-bold">
                      <button
                        onClick={() => setSubTab("list")}
                        className={`px-3 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                          subTab === "list" 
                            ? "bg-cyan-600/25 border-cyan-500/40 text-cyan-400" 
                            : "bg-slate-950 border-white/5 text-gray-400 hover:text-white"
                        }`}
                      >
                        <List className="h-3 w-3" /> List View
                      </button>
                      <button
                        onClick={() => setSubTab("timeline")}
                        className={`px-3 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                          subTab === "timeline" 
                            ? "bg-cyan-600/25 border-cyan-500/40 text-cyan-400" 
                            : "bg-slate-950 border-white/5 text-gray-400 hover:text-white"
                        }`}
                      >
                        <GitCommit className="h-3 w-3" /> Timeline Flowchart
                      </button>
                    </div>
                  </div>

                  {subTab === "list" ? (
                    /* 1. List View */
                    <div className="flex-grow overflow-y-auto space-y-2 pr-1">
                      {selectedOffender.crime_history.map((c) => (
                        <div 
                          key={c.id} 
                          className="p-3 bg-slate-900/50 border border-white/5 rounded-lg flex justify-between items-center text-xs hover:bg-slate-900/80 transition-colors"
                        >
                          <div className="min-w-0 flex-1 pr-2">
                            <h5 className="font-bold text-white truncate">{c.category}</h5>
                            <p className="text-2xs text-gray-400 flex items-center gap-3 mt-0.5">
                              <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3 text-cyan-400" /> <strong className="text-gray-200 font-bold">{c.district}</strong></span>
                              <span className="flex items-center gap-0.5"><Calendar className="h-3 w-3 text-cyan-400" /> <strong className="text-gray-200 font-bold">{c.date}</strong></span>
                            </p>
                          </div>
                          <span className="text-2xs px-2.5 py-1 rounded bg-red-950/20 border border-red-500/20 font-bold text-red-400 shrink-0">
                            Impact Score {c.severity}/10
                          </span>
                        </div>
                      ))}
                      {selectedOffender.crime_history.length === 0 && (
                        <div className="text-xs text-gray-500 text-center py-8">No logged crime records for this individual.</div>
                      )}
                    </div>
                  ) : (
                    /* 2. Timeline Flowchart View */
                    <div className="flex-grow overflow-y-auto pr-1 py-1">
                      <div className="relative pl-10 border-l border-cyan-500/20 ml-4 space-y-6">
                        {selectedOffender.crime_history.map((c, index) => {
                          const isLast = index === selectedOffender.crime_history.length - 1;
                          return (
                            <div key={c.id} className="relative">
                              {/* Sequence circle node */}
                              <span className="absolute -left-[50px] top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-slate-950 border border-cyan-500 text-cyan-400 font-mono text-2xs font-extrabold shadow-[0_0_8px_rgba(6,182,212,0.4)]">
                                {index + 1}
                              </span>
                              
                              {/* Connector Arrow */}
                              {!isLast && (
                                <div className="absolute -left-[42px] top-9 text-cyan-500/50 font-black animate-pulse text-[11px]">
                                  ↓
                                </div>
                              )}

                              {/* Detail Card */}
                              <div className="p-3 bg-slate-900/40 border border-white/5 hover:border-cyan-500/20 rounded-lg flex justify-between items-center text-xs hover:bg-slate-900/70 transition-all">
                                <div className="min-w-0 flex-1 pr-2">
                                  <span className="text-[10px] text-gray-300 font-mono font-bold block">{c.date}</span>
                                  <h5 className="font-bold text-white mt-0.5">{c.category}</h5>
                                  <p className="text-2xs text-cyan-400 flex items-center gap-1 mt-0.5">
                                    <MapPin className="h-3 w-3 text-cyan-400" /> <strong className="text-cyan-300 font-bold">{c.district}</strong>
                                  </p>
                                </div>
                                <div className="flex flex-col items-end gap-1 shrink-0">
                                  <span className="text-[10px] font-bold text-red-400 bg-red-950/20 px-2 py-0.5 rounded border border-red-500/20">
                                    Impact Score {c.severity}/10
                                  </span>
                                  <div className="w-16 h-1 bg-slate-950 rounded-full overflow-hidden">
                                    <div className="h-full bg-cyan-400" style={{ width: `${c.severity * 10}%` }}></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {selectedOffender.crime_history.length === 0 && (
                          <div className="text-xs text-gray-500 text-center py-8">No logged crime records for this individual.</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-3 bg-red-950/10 border border-red-500/10 rounded-lg text-2xs text-red-400 leading-relaxed mt-4 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-red-400 shrink-0" />
                Dossier intelligence triggers surveillance alert when suspect coordinates enter district hotspots boundary.
              </div>
            </div>
          ) : (
            <div className="glassmorphism rounded-xl border border-white/10 h-[520px] flex items-center justify-center text-xs text-gray-500">
              Select an offender from the index directory.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
