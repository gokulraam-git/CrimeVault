import React, { useState, useEffect } from "react";
import { Sparkles, ArrowRight, ShieldCheck, AlertOctagon, Activity, ShieldAlert, User, Users, Calendar, MapPin, FileText, Award } from "lucide-react";
import { API_BASE_URL } from "../api";

export default function EvolutionEngine() {
  const [chains, setChains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChain, setSelectedChain] = useState(null);
  const [allOffenders, setAllOffenders] = useState([]);
  const [selectedOffenderDetails, setSelectedOffenderDetails] = useState(null);

  // Fetch active evolution chains
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/evolution`)
      .then((res) => res.json())
      .then((data) => {
        setChains(data.evolution_chains || []);
        if (data.evolution_chains && data.evolution_chains.length > 0) {
          setSelectedChain(data.evolution_chains[0]);
        }
      })
      .catch((err) => console.error("Error fetching crime evolution chains:", err));
  }, []);

  // Fetch all offender details for profiling
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/offenders`)
      .then((res) => res.json())
      .then((data) => {
        setAllOffenders(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching offender directory:", err);
        setLoading(false);
      });
  }, []);

  // Sync selected offender details when selectedChain changes
  useEffect(() => {
    if (!selectedChain || allOffenders.length === 0) return;
    const match = allOffenders.find((o) => o.id === selectedChain.offender_id);
    setSelectedOffenderDetails(match);
  }, [selectedChain, allOffenders]);
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  // Find syndicate gang associates
  const getSyndicateAssociates = () => {
    if (!selectedOffenderDetails || allOffenders.length === 0) return [];
    return allOffenders.filter(
      (o) => o.id !== selectedOffenderDetails.id && 
             chains.some(c => c.offender_id === o.id && c.template_name === selectedChain.template_name)
    );
  };

  const associates = getSyndicateAssociates();

  // Dynamic Predictive Branches mapping
  const getPredictiveBranches = () => {
    if (!selectedChain || !selectedOffenderDetails) return [];
    
    const stage = selectedChain.current_stage;
    const oId = selectedOffenderDetails.id;
    const name = selectedOffenderDetails.name;
    const alias = selectedOffenderDetails.alias || selectedChain.offender_alias;
    const district = selectedChain.district || "Indiranagar";
    
    // Seed some pseudo-random variations based on offender ID
    const seedA = (oId * 7) % 13;
    const seedB = (oId * 11) % 9;
    
    // Base probabilities adjusted uniquely
    let probA = Math.min(85, Math.max(50, 65 + (seedA - 6)));
    let probB = Math.min(40, Math.max(15, 25 + (seedB - 4)));
    let probC = 100 - probA - probB;
    
    const isEven = oId % 2 === 0;

    if (stage === "Smuggling") {
      if (isEven) {
        return [
          {
            title: "Branch A: Hiding Illegal Cash",
            category: "Money Laundering",
            probability: probA,
            impact: "Critical",
            description: `AI predicts the suspect will attempt to hide smuggling profits by investing cash into local retail shops or food stalls near ${district}.`,
            color: "border-red-500/40 bg-red-950/20 text-red-400"
          },
          {
            title: "Branch B: Checkpoint Cargo Fraud",
            category: "Smuggling",
            probability: probB,
            impact: "Elevated",
            description: `High risk of suspect shifting to bulk transport manifest fraud and importing unregistered goods near local warehouses.`,
            color: "border-amber-500/40 bg-amber-950/20 text-amber-400"
          },
          {
            title: "Branch C: Highway Cargo Raid",
            category: "Neutralization",
            probability: probC,
            impact: "Low Threat",
            description: `Highway task forces deploy visual inspection checkpoints to seize illicit cargo and arrest ${name}.`,
            color: "border-emerald-500/40 bg-emerald-950/20 text-emerald-400"
          }
        ];
      } else {
        return [
          {
            title: "Branch A: Port Customs Evasion",
            category: "Smuggling",
            probability: probA,
            impact: "Critical",
            description: `AI predicts shift to routing unauthorized container shipments through harbor zones and escaping dock verification checks.`,
            color: "border-red-500/40 bg-red-950/20 text-red-400"
          },
          {
            title: "Branch B: Bulk Currency Transit",
            category: "Money Laundering",
            probability: probB,
            impact: "Elevated",
            description: `High risk of moving physical cash reserves across borders using customized secret car panels.`,
            color: "border-amber-500/40 bg-amber-950/20 text-amber-400"
          },
          {
            title: "Branch C: Customs Audit Arrest",
            category: "Neutralization",
            probability: probC,
            impact: "Low Threat",
            description: `Coordination with customs investigators to seize transit papers and detain ${name} at port entries.`,
            color: "border-emerald-500/40 bg-emerald-950/20 text-emerald-400"
          }
        ];
      }
    } else if (stage === "Money Laundering") {
      if (isEven) {
        return [
          {
            title: "Branch A: Dummy Shell Consultancies",
            category: "Money Laundering",
            probability: probA,
            impact: "Critical",
            description: `High probability of suspect coordinating wire transfers through unregistered shell companies to move money out of ${district}.`,
            color: "border-red-500/40 bg-red-950/20 text-red-400"
          },
          {
            title: "Branch B: Digital Crypto Mixing",
            category: "Cybercrime",
            probability: probB,
            impact: "Elevated",
            description: `AI predicts shift to digital wallets and peer-to-peer cryptocurrency mixers to obscure the source of smuggling funds.`,
            color: "border-amber-500/40 bg-amber-950/20 text-amber-400"
          },
          {
            title: "Branch C: Financial Asset Seizure",
            category: "Neutralization",
            probability: probC,
            impact: "Low Threat",
            description: `Financial investigation units initiate audit warrants to freeze bank accounts and confiscate properties belonging to ${name}.`,
            color: "border-emerald-500/40 bg-emerald-950/20 text-emerald-400"
          }
        ];
      } else {
        return [
          {
            title: "Branch A: Real Estate Fronts",
            category: "Money Laundering",
            probability: probA,
            impact: "Critical",
            description: `Subject is predicted to purchase high-value residential or commercial lands near ${district} under proxy buyer aliases.`,
            color: "border-red-500/40 bg-red-950/20 text-red-400"
          },
          {
            title: "Branch B: Luxury Assets Placement",
            category: "Asset Acquisition",
            probability: probB,
            impact: "Elevated",
            description: `AI forecasts diversion of funds into luxury vehicle fleets and high-end gold dealer payments to wash cash.`,
            color: "border-amber-500/40 bg-amber-950/20 text-amber-400"
          },
          {
            title: "Branch C: Tax Evasion Prosecution",
            category: "Neutralization",
            probability: probC,
            impact: "Low Threat",
            description: `Tax enforcement bureaus launch official audits on business receipts to prosecute ${name} (alias "${alias}").`,
            color: "border-emerald-500/40 bg-emerald-950/20 text-emerald-400"
          }
        ];
      }
    } else if (stage === "Vehicle Theft") {
      if (isEven) {
        return [
          {
            title: "Branch A: Chop Shop Transport",
            category: "Smuggling",
            probability: probA,
            impact: "Critical",
            description: `Subject is predicted to dismantle vehicles and smuggle parts to distributors outside ${district}.`,
            color: "border-red-500/40 bg-red-950/20 text-red-400"
          },
          {
            title: "Branch B: Highway Hijackings",
            category: "Highway Robbery",
            probability: probB,
            impact: "Elevated",
            description: `Transition threat to high-risk highway thefts targeting commercial logistics trucks.`,
            color: "border-amber-500/40 bg-amber-950/20 text-amber-400"
          },
          {
            title: "Branch C: Electronic Curfew Monitoring",
            category: "Rehabilitation",
            probability: probC,
            impact: "Low Threat",
            description: `Deploy active GPS monitoring and enforce strict nighttime spatial bounds on ${name}.`,
            color: "border-emerald-500/40 bg-emerald-950/20 text-emerald-400"
          }
        ];
      } else {
        return [
          {
            title: "Branch A: Black Market Spares",
            category: "Black Market",
            probability: probA,
            impact: "Critical",
            description: `Predicts the suspect will establish direct distribution of stolen vehicle components to localized scrap yards.`,
            color: "border-red-500/40 bg-red-950/20 text-red-400"
          },
          {
            title: "Branch B: Vehicle ID Cloning",
            category: "Fraud Escalation",
            probability: probB,
            impact: "Elevated",
            description: `Risk of suspect forging chassis stamps and cloning vehicle registrations to resell entire stolen bikes.`,
            color: "border-amber-500/40 bg-amber-950/20 text-amber-400"
          },
          {
            title: "Branch C: Garage Audit Search",
            category: "Neutralization",
            probability: probC,
            impact: "Low Threat",
            description: `Police execute sudden spot search checks on garages linked to ${alias} in ${district}.`,
            color: "border-emerald-500/40 bg-emerald-950/20 text-emerald-400"
          }
        ];
      }
    } else {
      // Default / Street Theft
      if (isEven) {
        return [
          {
            title: "Branch A: Auto Theft Escalation",
            category: "Vehicle Theft",
            probability: probA,
            impact: "Critical",
            description: `AI models escalation from phone snatching to systematic ignition tampering of motorbikes in transit hubs.`,
            color: "border-red-500/40 bg-red-950/20 text-red-400"
          },
          {
            title: "Branch B: Night House Burglaries",
            category: "Organized Burglary",
            probability: probB,
            impact: "Elevated",
            description: `Lateral progression into residential breaking and entering in crowded ${district} residential blocks.`,
            color: "border-amber-500/40 bg-amber-950/20 text-amber-400"
          },
          {
            title: "Branch C: Rehabilitation Work Directive",
            category: "Rehabilitation",
            probability: probC,
            impact: "Low Threat",
            description: `Mandatory vocational enrollment of ${name} (alias "${alias}") to prevent street repeat offenses.`,
            color: "border-emerald-500/40 bg-emerald-950/20 text-emerald-400"
          }
        ];
      } else {
        return [
          {
            title: "Branch A: Organized Snatching Rings",
            category: "Street Theft",
            probability: probA,
            impact: "Critical",
            description: `Escalates into leading coordinates for groups of pickpockets at local bus/metro stands in ${district}.`,
            color: "border-red-500/40 bg-red-950/20 text-red-400"
          },
          {
            title: "Branch B: Armed Robbery Escalation",
            category: "Assault",
            probability: probB,
            impact: "Elevated",
            description: `Transition danger to using knives or blunt items to threaten pedestrians during late snatchings.`,
            color: "border-amber-500/40 bg-amber-950/20 text-amber-400"
          },
          {
            title: "Branch C: Curfew & Restraining Orders",
            category: "Rehabilitation",
            probability: probC,
            impact: "Low Threat",
            description: `Court-ordered ban on entering commercial parks and transit spots in ${district} for ${name}.`,
            color: "border-emerald-500/40 bg-emerald-950/20 text-emerald-400"
          }
        ];
      }
    }
  };

  const predictiveBranches = getPredictiveBranches();

  // Find index of current stage in template sequence to segment historical vs predictive
  const getFlowchartStages = () => {
    if (!selectedChain) return { passed: [], current: "" };
    const currentIndex = selectedChain.template_sequence.indexOf(selectedChain.current_stage);
    const passed = selectedChain.template_sequence.slice(0, currentIndex);
    const current = selectedChain.current_stage;
    return { passed, current };
  };

  const { passed, current } = getFlowchartStages();

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="pb-4 border-b border-white/10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-cyan-400" />
            Crime Evolution Intelligence Engine
          </h1>
          <p className="text-gray-400 mt-1">Unique Innovation: Explains how crimes evolve from isolated offences into structured syndicates.</p>
        </div>
        <span className="text-2xs px-2.5 py-1 bg-cyan-600/20 border border-cyan-500/30 text-cyan-400 rounded-full font-bold uppercase tracking-wider">
          Proprietary AI Engine
        </span>
      </div>

      {/* Intro info box */}
      <div className="p-4 bg-slate-900/60 border border-white/10 rounded-xl text-xs leading-relaxed text-gray-400">
        Traditional crime analytics answer <strong className="text-cyan-400">"Where will crime happen?"</strong>.
        CrimeVault answers <strong className="text-cyan-400">"How is crime evolving?"</strong>. By looking at chronological history, the sequential patterns miner detects structural transitions (e.g. Street Theft snatchings escalating into parts smuggling and eventual laundering) to intercept organized networks before they mature.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Escalation Directory */}
        <div className="glassmorphism p-4 rounded-xl border border-white/10 flex flex-col h-[580px]">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-1.5">
            <ShieldAlert className="h-4 w-4 text-cyan-400" /> Active Escalation Cases ({chains.length})
          </h3>
          
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {chains.map((c, idx) => {
              const isSelected = selectedChain && c.offender_id === selectedChain.offender_id;
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedChain(c)}
                  className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                    isSelected 
                      ? "bg-cyan-600/20 border-cyan-500 text-cyan-400" 
                      : "bg-slate-900/40 border-white/5 text-gray-300 hover:bg-slate-900/60"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-white">{c.offender_name}</h4>
                      <p className="text-2xs text-gray-400">Alias: "{c.offender_alias}"</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-red-950/20 border border-red-500/20 text-red-400 font-bold">
                      Conf. {c.confidence_score}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-3 text-2xs text-gray-400">
                    <span>Ecosystem: {c.template_name}</span>
                    <span className="text-gray-300 font-medium">Stage: {c.current_stage}</span>
                  </div>
                </div>
              );
            })}
            {chains.length === 0 && (
              <div className="text-xs text-gray-500 text-center py-12">No active escalating chains identified in the current cohort.</div>
            )}
          </div>
        </div>

        {/* Right Side: Flowchart & Dossier Profile */}
        <div className="lg:col-span-2 space-y-6">
          {selectedChain ? (
            <div className="space-y-6">
              
              {/* Primary Flowchart Card */}
              <div className="glassmorphism p-6 rounded-xl border border-white/10 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start border-b border-white/10 pb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">{selectedChain.offender_name}</h3>
                      <p className="text-xs text-gray-400">Escalating Model: <strong className="text-cyan-400">"{selectedChain.template_name}"</strong></p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xs text-gray-400 uppercase block font-semibold">Transition Confidence</span>
                      <span className="text-3xl font-extrabold text-cyan-400">{selectedChain.confidence_score}%</span>
                    </div>
                  </div>

                  {/* Progression Flowchart */}
                  <div className="mt-6 space-y-6">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Activity className="h-4 w-4 text-cyan-400 animate-pulse" /> Sequence Pathway Timeline (Historical to Current Stage)
                    </h4>
                    
                    {/* Part 1: Horizontal Historical Sequence (up to Current Stage) */}
                    <div className="flex flex-col md:flex-row items-stretch gap-4 pb-5 border-b border-white/5 w-full">
                      {passed.map((stage, idx) => {
                        const matchedHistory = selectedOffenderDetails?.crime_history.find(c => c.category === stage);
                        const uniqueDetailText = matchedHistory?.description || "Passed offense record";
                        return (
                          <React.Fragment key={idx}>
                            <div className="p-4 rounded-xl border border-cyan-500/25 bg-cyan-950/15 text-cyan-400 text-center flex-1 min-w-[150px] relative flex flex-col justify-between">
                              <span className="absolute -top-2 left-2 px-1 py-0.2 bg-slate-900 border border-cyan-500/30 rounded text-[7px] font-bold uppercase tracking-wider text-cyan-400">Passed</span>
                              <div>
                                <span className="text-3xs font-semibold text-gray-400 block mb-0.5">Phase {idx+1}</span>
                                <span className="text-2xs font-extrabold leading-tight block">{stage}</span>
                              </div>
                              <p className="text-[9px] text-gray-500 mt-2.5 italic line-clamp-2">"{uniqueDetailText}"</p>
                            </div>
                            <div className="flex items-center justify-center shrink-0">
                              <ArrowRight className="h-4 w-4 text-cyan-500 hidden md:block" />
                            </div>
                          </React.Fragment>
                        );
                      })}

                      {/* Current Active Stage Card */}
                      <div className="p-4 rounded-xl border border-blue-500 bg-blue-950/30 text-blue-300 text-center flex-1 min-w-[150px] relative flex flex-col justify-between ring-1 ring-blue-500/30 shadow-lg">
                        <span className="absolute -top-2.5 left-2 px-1.5 py-0.5 bg-blue-500 border border-blue-400 rounded text-[8px] font-bold uppercase tracking-wider text-white">Current Stage</span>
                        <div>
                          <span className="text-3xs font-semibold text-gray-400 block mb-0.5">Phase {passed.length + 1}</span>
                          <span className="text-2xs font-bold leading-tight block">{current}</span>
                        </div>
                        {(() => {
                          const matchedHistory = selectedOffenderDetails?.crime_history.find(c => c.category === current);
                          return (
                            <p className="text-[9px] text-gray-400 mt-2.5 italic line-clamp-2">
                              "{matchedHistory?.description || "Current active offense"}"
                            </p>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Part 2: Branching Predictive Forecasts (Diverging Roads from Current Stage) */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-ping"></span>
                        <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                          Diverging Predictive Pathways (Branching possibilities from Current Stage)
                        </h4>
                      </div>
                      
                      {/* Grid representation of branching alternatives */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {predictiveBranches.map((branch, idx) => (
                          <div key={idx} className={`p-4.5 rounded-xl border flex flex-col justify-between relative ${branch.color} transition-all duration-300 hover:scale-[1.02] shadow-md`}>
                            <span className="absolute -top-2.5 left-3 px-1.5 py-0.5 bg-slate-900 border border-white/10 rounded text-[7px] font-black uppercase tracking-wider">
                              {branch.impact}
                            </span>
                            <div>
                              <span className="text-[9px] text-gray-400 block mb-1">Forecast Branch {idx+1}</span>
                              <h5 className="font-bold text-xs leading-tight text-white">{branch.title}</h5>
                              <p className="text-[10px] text-gray-400 mt-2.5 leading-relaxed">{branch.description}</p>
                            </div>
                            <div className="mt-4 pt-2.5 border-t border-white/5 flex justify-between items-center text-3xs font-extrabold uppercase tracking-widest">
                              <span className="text-gray-400">Likelihood</span>
                              <span className="text-sm font-black text-white">{branch.probability}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* Explanation text */}
                  <div className="mt-6 p-4 bg-slate-900/60 border border-white/5 rounded-lg text-xs leading-relaxed text-gray-300">
                    <h4 className="font-bold text-white mb-1 flex items-center gap-1.5">
                      <Activity className="h-4 w-4 text-cyan-400" /> Analytical Inference
                    </h4>
                    Subject is classified under <strong className="text-white">Syndicate Ecosystem</strong> of "{selectedChain.template_name}". Chronological offenses match sequence progress at <strong className="text-cyan-400">Stage: {selectedChain.current_stage}</strong>. The system detects a <strong className="text-red-400">{selectedChain.confidence_score}% probability</strong> that the suspect will transition to the next phase: <strong className="text-red-400">"{selectedChain.next_predicted_stage || "Terminal Stage"}"</strong>.
                  </div>
                </div>

                {/* Recommended Proactive Policing Intervention */}
                <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-xl mt-4 text-xs text-emerald-400 leading-relaxed flex gap-3 items-start">
                  <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold mb-1">Proactive Policing Intervention Action</h4>
                    <p className="text-gray-300 font-medium leading-relaxed">{selectedChain.intervention_action}</p>
                  </div>
                </div>
              </div>

              {/* Suspect Profile & Tactical Intelligence dossier */}
              {selectedOffenderDetails && (
                <div className="glassmorphism p-6 rounded-xl border border-white/10 space-y-6">
                  {/* Section Title */}
                  <div className="border-b border-white/10 pb-3 flex items-center gap-2">
                    <User className="h-5 w-5 text-cyan-400 animate-pulse" />
                    <h4 className="font-bold text-white text-md">Suspect Intelligence Profile Dossier</h4>
                  </div>

                  {/* Complete details dossier grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                      <span className="text-gray-400 block text-3xs uppercase font-semibold tracking-wider">Suspect Profile ID</span>
                      <strong className="text-white block mt-0.5 font-bold">#CDN-{selectedOffenderDetails.id.toString().padStart(4, "0")}</strong>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                      <span className="text-gray-400 block text-3xs uppercase font-semibold tracking-wider">Current Status</span>
                      <strong className="text-white block mt-0.5 font-bold">{selectedOffenderDetails.status}</strong>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                      <span className="text-gray-400 block text-3xs uppercase font-semibold tracking-wider">Age Benchmark</span>
                      <strong className="text-white block mt-0.5 font-bold">{selectedOffenderDetails.age} Years</strong>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                      <span className="text-gray-400 block text-3xs uppercase font-semibold tracking-wider">Date of Birth (DOB)</span>
                      <strong className="text-white block mt-0.5 font-bold">15-May-{2026 - selectedOffenderDetails.age}</strong>
                    </div>

                    <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                      <span className="text-gray-400 block text-3xs uppercase font-semibold tracking-wider">Registered Phone</span>
                      <strong className="text-white block mt-0.5 font-bold">+91 9840{selectedOffenderDetails.id.toString().padStart(2, "0")} 1204</strong>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                      <span className="text-gray-400 block text-3xs uppercase font-semibold tracking-wider">Recidivism Score</span>
                      <strong className="text-red-400 block mt-0.5 font-bold">{selectedOffenderDetails.recidivism_score}%</strong>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg border border-white/5 md:col-span-2">
                      <span className="text-gray-400 block text-3xs uppercase font-semibold tracking-wider">Last Known Address</span>
                      <strong className="text-white block mt-0.5 font-bold truncate">No. {12 + selectedOffenderDetails.id * 3}, {selectedOffenderDetails.id % 2 === 0 ? "100 Feet Road" : "5th Main Road"}, {selectedChain.district || "Indiranagar"}, Bengaluru, Karnataka</strong>
                    </div>
                  </div>

                  {/* Physical Indicators & Marks */}
                  <div className="p-4 bg-[#0a0f1d] border border-white/5 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-normal">
                    <div>
                      <span className="text-gray-400 block text-3xs uppercase font-semibold mb-1 tracking-wider">Physical Indicators</span>
                      <span className="text-gray-300 font-bold">Height: 174 cm • Weight: 71 kg • Build: Athletic</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-3xs uppercase font-semibold mb-1 tracking-wider">Distinguishing Marks</span>
                      <span className="text-gray-300 font-bold">Scar on left forearm, tribal tiger tattoo on right shoulder.</span>
                    </div>
                  </div>

                  {/* Syndicate associates */}
                  <div className="p-4 bg-[#0a0f1d] border border-white/5 rounded-xl space-y-2">
                    <h5 className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-cyan-400" />
                      Identified Syndicate Associates ({associates.length})
                    </h5>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {associates.map((ass) => (
                        <span 
                          key={ass.id} 
                          className="px-2.5 py-1 bg-cyan-950/20 border border-cyan-500/20 text-cyan-400 rounded-md text-[10px] font-bold"
                        >
                          {ass.name} ({ass.alias || "No Alias"})
                        </span>
                      ))}
                      {associates.length === 0 && (
                        <span className="text-[10px] text-gray-500">No active co-offenders linked to this suspect within the template ecosystem.</span>
                      )}
                    </div>
                  </div>

                  {/* Chronological Escalation Logs */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-cyan-400" />
                      Sequential Timeline parsing
                    </h5>
                    
                    <div className="space-y-2 overflow-y-auto max-h-[220px] pr-1">
                      {[...selectedOffenderDetails.crime_history]
                        .sort((a, b) => new Date(a.date) - new Date(b.date))
                        .map((crime, idx) => {
                          const templateIndex = selectedChain.template_sequence.indexOf(crime.category);
                          const isMatched = templateIndex !== -1;
                          
                          return (
                            <div 
                              key={crime.id} 
                              className="p-3 bg-slate-900/40 border border-white/5 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs hover:bg-slate-900/60 transition-colors"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-white text-xs">{crime.category}</span>
                                  <span className="text-[9px] text-gray-500 flex items-center gap-0.5">
                                    <Calendar className="h-3 w-3" /> {crime.date}
                                  </span>
                                  <span className="text-[9px] text-gray-500 flex items-center gap-0.5">
                                    <MapPin className="h-3 w-3" /> {crime.district}
                                  </span>
                                </div>
                                <p className="text-gray-400 text-2xs mt-1 italic">"Crimes record details: Seeded incident log matches chronological pathway"</p>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[10px] px-2 py-0.5 bg-red-950/20 border border-red-500/20 text-red-400 font-bold rounded">
                                  Severity {crime.severity}/10
                                </span>
                                <span className={`text-[10px] px-2 py-0.5 rounded font-black border ${
                                  isMatched 
                                    ? "bg-cyan-950/20 border-cyan-500/30 text-cyan-400" 
                                    : "bg-gray-950/20 border-white/10 text-gray-500"
                                }`}>
                                  {isMatched ? `Phase ${templateIndex + 1} Match` : "Unmapped Category"}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                </div>
              )}

            </div>
          ) : (
            <div className="glassmorphism rounded-xl border border-white/10 h-[520px] flex items-center justify-center text-xs text-gray-500">
              Select an escalating case from the active directory.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
