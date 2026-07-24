import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, registerables } from "chart.js";
import { 
  ShieldAlert, TrendingUp, TrendingDown, Activity, 
  Calendar, Building2, AlertTriangle, ArrowUpRight, Clock 
} from "lucide-react";

ChartJS.register(...registerables);

export default function RiskScoring() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedHorizon, setSelectedHorizon] = useState("30"); // 7, 30, 90

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/predictions/risk")
      .then((res) => res.json())
      .then((data) => {
        setPredictions(data.predictions || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching risk predictions:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  const getRiskKey = () => {
    if (selectedHorizon === "7") return "risk_7_day";
    if (selectedHorizon === "90") return "risk_90_day";
    return "risk_30_day";
  };

  const getHorizonLabel = () => {
    if (selectedHorizon === "7") return "Weekly (7-Day)";
    if (selectedHorizon === "90") return "Long Term (90-Day)";
    return "Monthly (30-Day)";
  };

  const getHorizonDescription = () => {
    if (selectedHorizon === "7") {
      return "Forecasts short-term localized incidents based on micro-temporal averages, recent incident spikes, and fast-moving crime velocity.";
    }
    if (selectedHorizon === "90") {
      return "Projects long-term structural risks by regressing towards demographic indicators, census poverty indexes, and historical baseline frequencies.";
    }
    return "Assesses mid-term threat rates by combining recent monthly anomaly counts, active repeat offender counts, and socio-economic variables.";
  };

  const getRiskColor = (score) => {
    if (score > 75) return "text-red-400 bg-red-950/20 border-red-500/30";
    if (score > 45) return "text-amber-400 bg-amber-950/20 border-amber-500/30";
    return "text-emerald-400 bg-emerald-950/20 border-emerald-500/30";
  };

  const getRiskLabel = (score) => {
    if (score > 75) return "Critical";
    if (score > 45) return "Elevated";
    return "Low Risk";
  };

  // Compute stats based on selected horizon
  const horizonKey = getRiskKey();
  const sortedPredictions = [...predictions].sort((a, b) => b[horizonKey] - a[horizonKey]);
  const averageRisk = sortedPredictions.reduce((acc, curr) => acc + curr[horizonKey], 0) / sortedPredictions.length;
  const highestRiskDistrict = sortedPredictions[0];
  const escalatingCount = predictions.filter(p => p.trend === "Upward").length;

  // Chart configuration
  const isLight = document.documentElement.classList.contains("light-theme");
  const chartTextColor = isLight ? "#292524" : "#e5e7eb";
  const chartTickColor = isLight ? "#44403c" : "#9ca3af";
  const chartGridColor = isLight ? "rgba(15, 23, 42, 0.08)" : "rgba(255, 255, 255, 0.05)";

  const barChartData = {
    labels: sortedPredictions.map((p) => p.district),
    datasets: [
      {
        label: `${getHorizonLabel()} Risk Score (%)`,
        data: sortedPredictions.map((p) => p[horizonKey]),
        backgroundColor: sortedPredictions.map((p) => {
          const val = p[horizonKey];
          return val > 75 ? "rgba(239, 68, 68, 0.7)" : val > 45 ? "rgba(245, 158, 11, 0.7)" : "rgba(16, 185, 129, 0.7)";
        }),
        borderColor: sortedPredictions.map((p) => {
          const val = p[horizonKey];
          return val > 75 ? "#EF4444" : val > 45 ? "#F59E0B" : "#10B981";
        }),
        borderWidth: 1.5,
        borderRadius: 4,
      },
    ],
  };

  const barChartOptions = {
    indexAxis: "y", // Horizontal Bar chart
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: chartTextColor,
          font: { family: "Outfit, Inter, sans-serif", size: 10 },
        },
      },
    },
    scales: {
      x: {
        min: 0,
        max: 100,
        grid: { color: chartGridColor },
        ticks: { color: chartTickColor, font: { size: 10 } },
      },
      y: {
        grid: { display: false },
        ticks: { color: chartTickColor, font: { family: "Outfit, sans-serif", size: 11, weight: "bold" } },
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Title & Selector Controls */}
      <div className="pb-4 border-b border-white/10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShieldAlert className="h-8 w-8 text-cyan-400 animate-pulse" />
            Predictive Risk Scoring
          </h1>
          <p className="text-gray-400 mt-1">Random Forest predictions assessing future crime likelihood across locations and temporal cycles.</p>
        </div>

        {/* Dynamic Filter Toggles */}
        <div className="flex bg-slate-900 border border-white/10 p-0.5 rounded-lg shrink-0">
          <button 
            onClick={() => setSelectedHorizon("7")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
              selectedHorizon === "7" ? "bg-cyan-600 text-white shadow" : "text-gray-400 hover:text-white"
            }`}
          >
            <Clock className="h-3.5 w-3.5" /> Weekly (7D)
          </button>
          <button 
            onClick={() => setSelectedHorizon("30")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
              selectedHorizon === "30" ? "bg-cyan-600 text-white shadow" : "text-gray-400 hover:text-white"
            }`}
          >
            <Calendar className="h-3.5 w-3.5" /> 30-Day
          </button>
          <button 
            onClick={() => setSelectedHorizon("90")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
              selectedHorizon === "90" ? "bg-cyan-600 text-white shadow" : "text-gray-400 hover:text-white"
            }`}
          >
            <Activity className="h-3.5 w-3.5" /> 90-Day
          </button>
        </div>
      </div>

      {/* Model Horizon Explanation Panel */}
      <div className="glassmorphism p-4.5 rounded-xl border border-white/10 bg-slate-900/40">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-cyan-400 mb-1 flex items-center gap-1.5">
          <Activity className="h-4 w-4" /> Active Model Focus: {getHorizonLabel()}
        </h3>
        <p className="text-gray-300 text-xs leading-relaxed font-medium">
          {getHorizonDescription()}
        </p>
      </div>

      {/* Metric Cards Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glassmorphism p-4 rounded-xl border border-white/10 flex flex-col justify-between">
          <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Overall threat index</span>
          <h4 className="text-3xl font-black text-white mt-1.5">{averageRisk.toFixed(1)}%</h4>
          <span className="text-[9px] text-gray-500 mt-1">Average forecast score</span>
        </div>

        <div className="glassmorphism p-4 rounded-xl border border-white/10 flex flex-col justify-between">
          <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider flex items-center gap-1">
            Highest Risk Zone <ArrowUpRight className="h-3.5 w-3.5 text-red-400" />
          </span>
          <h4 className="text-xl font-bold text-white truncate mt-1.5">
            {highestRiskDistrict ? highestRiskDistrict.district : "None"}
          </h4>
          <span className="text-[10px] font-extrabold text-red-400 mt-1">
            Score: {highestRiskDistrict ? highestRiskDistrict[horizonKey].toFixed(0) : 0}%
          </span>
        </div>

        <div className="glassmorphism p-4 rounded-xl border border-white/10 flex flex-col justify-between">
          <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Escalating Zones</span>
          <h4 className="text-3xl font-black text-red-400 mt-1.5">{escalatingCount} Sectors</h4>
          <span className="text-[9px] text-gray-500 mt-1">Districts showing upward trends</span>
        </div>

        <div className="glassmorphism p-4 rounded-xl border border-white/10 flex flex-col justify-between">
          <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Regressor Calibration</span>
          <h4 className="text-sm font-bold text-cyan-400 mt-1.5">Random Forest</h4>
          <span className="text-[9px] text-gray-500 mt-1">N_estimators = 50</span>
        </div>
      </div>

      {/* Main Grid: Comparison Chart & Table */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        
        {/* Horizontal Bar Chart Comparison */}
        <div className="xl:col-span-2 glassmorphism p-4.5 rounded-xl border border-white/10 flex flex-col h-[380px]">
          <h3 className="text-md font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" /> District Risk Comparisons
          </h3>
          <div className="flex-1 relative min-h-0">
            <Bar key={isLight ? "light" : "dark"} data={barChartData} options={barChartOptions} />
          </div>
        </div>

        {/* Detailed Records List */}
        <div className="xl:col-span-3 glassmorphism rounded-xl border border-white/10 overflow-hidden flex flex-col h-[380px]">
          <div className="p-4 border-b border-white/5 flex justify-between items-center">
            <h3 className="text-md font-semibold text-white flex items-center gap-1.5">
              <Building2 className="h-5 w-5 text-cyan-400" /> Granular Predictions Table
            </h3>
            <span className="text-2xs px-2.5 py-1 bg-white/5 border border-white/10 text-gray-400 rounded-full font-bold">
              N = {sortedPredictions.length} Zones
            </span>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-slate-900/60 text-gray-400 font-bold uppercase tracking-wider sticky top-0 z-10 backdrop-blur-md">
                  <th className="p-3.5">District Sector</th>
                  <th className="p-3.5">Historical Volume</th>
                  <th className="p-3.5">Trend Vector</th>
                  <th className="p-3.5">Predictive Threat</th>
                  <th className="p-3.5 text-right">Risk Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sortedPredictions.map((p, idx) => {
                  const score = p[horizonKey];
                  const badgeStyle = getRiskColor(score);
                  const label = getRiskLabel(score);

                  return (
                    <tr key={idx} className="hover:bg-white/3 transition-colors">
                      {/* District */}
                      <td className="p-3.5 font-bold text-white text-sm flex items-center gap-2">
                        <Building2 className="h-4.5 w-4.5 text-gray-500 shrink-0" />
                        {p.district}
                      </td>
                      
                      {/* Volume */}
                      <td className="p-3.5 text-gray-300 font-semibold">{p.recent_incidents} incidents</td>
                      
                      {/* Trend */}
                      <td className="p-3.5">
                        {p.trend === "Upward" ? (
                          <span className="text-red-400 font-extrabold flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" /> Escalating
                          </span>
                        ) : p.trend === "Downward" ? (
                          <span className="text-emerald-400 font-extrabold flex items-center gap-1">
                            <TrendingDown className="h-4 w-4" /> Declining
                          </span>
                        ) : (
                          <span className="text-gray-400 font-medium">No change</span>
                        )}
                      </td>

                      {/* Risk Tag */}
                      <td className="p-3.5">
                        <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider border ${badgeStyle}`}>
                          {label}
                        </span>
                      </td>

                      {/* Score Bar & Percentage */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          <div className="w-16 bg-white/5 h-1.5 rounded-full overflow-hidden hidden sm:block border border-white/5">
                            <div 
                              className={`h-full rounded-full transition-all duration-500`}
                              style={{ 
                                width: `${score}%`,
                                backgroundColor: score > 75 ? "#EF4444" : score > 45 ? "#F59E0B" : "#10B981"
                              }}
                            ></div>
                          </div>
                          <span className="font-extrabold text-sm text-white w-9">{score.toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
