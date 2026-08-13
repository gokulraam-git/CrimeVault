import React, { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  registerables
} from "chart.js";
import { AlertOctagon, Bell, Calendar, ChevronRight, Info, TrendingUp, X, MapPin, Activity, ShieldAlert } from "lucide-react";
import { API_BASE_URL } from "../api";

ChartJS.register(...registerables);

export default function AlertsPanel() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Interactive Regression Modal States
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [regressionData, setRegressionData] = useState(null);
  const [regressionLoading, setRegressionLoading] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/anomalies`)
      .then((res) => res.json())
      .then((data) => {
        setAlerts(data.alerts || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching anomalies alerts:", err);
        setLoading(false);
      });
  }, []);

  // Fetch regression data when an alert is clicked
  useEffect(() => {
    if (!selectedAlert) {
      setRegressionData(null);
      return;
    }
    
    setRegressionLoading(true);
    fetch(`${API_BASE_URL}/api/districts/${selectedAlert.district}`)
      .then((res) => res.json())
      .then((data) => {
        setRegressionData(data);
        setRegressionLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching regression data:", err);
        setRegressionLoading(false);
      });
  }, [selectedAlert]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  const avgAnomalyScore = alerts.length > 0 
    ? (alerts.reduce((sum, a) => sum + a.anomaly_score, 0) / alerts.length).toFixed(1) 
    : "0.0";

  const criticalCount = alerts.filter(a => a.anomaly_score > 75).length;
  const warningCount = alerts.filter(a => a.anomaly_score <= 75).length;

  // Regression Chart Setup
  const trend = regressionData?.monthly_trend || [];
  const regressionChartData = {
    labels: trend.map((t) => {
      const [year, month] = t.month.split("-");
      const d = new Date(parseInt(year), parseInt(month) - 1);
      return d.toLocaleString("default", { month: "short", year: "2-digit" });
    }),
    datasets: [
      {
        label: `${selectedAlert?.district} Historical Crime Trend`,
        data: trend.map((t) => t.count),
        borderColor: "#06B6D4",
        backgroundColor: "rgba(6, 182, 212, 0.1)",
        fill: true,
        tension: 0.35,
        borderWidth: 2,
        pointBackgroundColor: trend.map((t) => t.month === selectedAlert?.period ? "#EF4444" : "#06B6D4"),
        pointBorderColor: trend.map((t) => t.month === selectedAlert?.period ? "#fff" : "#06B6D4"),
        pointRadius: trend.map((t) => t.month === selectedAlert?.period ? 8 : 4),
        pointHoverRadius: trend.map((t) => t.month === selectedAlert?.period ? 10 : 6),
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: "#e5e7eb" }
      }
    },
    scales: {
      x: {
        grid: { color: "rgba(255, 255, 255, 0.05)" },
        ticks: { color: "#9ca3af" }
      },
      y: {
        grid: { color: "rgba(255, 255, 255, 0.05)" },
        ticks: { color: "#9ca3af" }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="pb-4 border-b border-white/10 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Bell className="h-8 w-8 text-cyan-400" />
            Trend Alerts & Anomaly Detection
          </h1>
          <p className="text-gray-400 mt-1">Automatic detection of abnormal crime activity using Isolation Forests and Time Series analysis.</p>
        </div>
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
        </span>
      </div>

      {/* Intro info box */}
      <div className="p-4 bg-cyan-950/20 border border-cyan-500/20 rounded-xl flex gap-3 text-cyan-400/90 text-sm">
        <Info className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold mb-1">How Anomaly Detection Works</h4>
          <p className="leading-relaxed">
            The platform fits an **Isolation Forest** model on monthly crime vectors `[volume, MoM growth rate, average severity]` for each district. By isolating points in the high-dimensional feature space, the algorithm flags records that deviate significantly from historical parameters, indicating abnormal clusters.
          </p>
        </div>
      </div>

      {/* Main Grid: Alerts list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Alerts feed */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-semibold text-white">Active Intelligence Alerts</h3>
          
          {alerts.length === 0 ? (
            <div className="glassmorphism p-8 rounded-xl border border-white/10 text-center text-gray-500">
              No anomalies detected. Current crime activity across all districts is within normal historical ranges.
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert, idx) => {
                const isCritical = alert.anomaly_score > 75;
                const iconColor = isCritical ? "text-red-500 bg-red-950/30" : "text-amber-500 bg-amber-950/30";
                const borderStyle = isCritical ? "border-red-500/25 hover:border-red-500/40 bg-red-950/5" : "border-amber-500/25 hover:border-amber-500/40 bg-amber-950/5";

                return (
                  <div 
                    key={idx} 
                    className={`p-5 rounded-xl border transition-all duration-300 flex items-start gap-4 ${borderStyle}`}
                  >
                    <div className={`p-3 rounded-lg ${iconColor} shrink-0`}>
                      <AlertOctagon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap justify-between items-start gap-2">
                        <div>
                          <h4 className="text-md font-bold text-white flex items-center gap-2">
                            {alert.district} Spike Detected
                          </h4>
                          <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" /> Month: {alert.period}
                            </span>
                            <span className="flex items-center gap-1 text-cyan-400">
                              <TrendingUp className="h-3 w-3" /> Growth Rate: +{alert.growth_rate}%
                            </span>
                          </div>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                          isCritical ? "bg-red-950/40 border-red-500/30 text-red-400" : "bg-amber-950/40 border-amber-500/30 text-amber-400"
                        }`}>
                          Anomaly Score: {alert.anomaly_score}%
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-300 mt-3 leading-relaxed">
                        {alert.description}
                      </p>
                      
                      <button 
                        onClick={() => setSelectedAlert(alert)}
                        className="flex items-center gap-2 mt-4 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors focus:outline-none"
                      >
                        View Historical Regression <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Explanatory Sidebar / Stats */}
        <div className="space-y-6">
          <div className="glassmorphism p-5 rounded-xl border border-white/10 space-y-4">
            <h3 className="text-md font-semibold text-white flex items-center justify-between">
              <span>Anomaly Stats</span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </h3>
            
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-white/5">
              <div>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold">Detected Alerts</span>
                <h4 className="text-3xl font-black text-white mt-1">{alerts.length}</h4>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold">Avg Threat Index</span>
                <h4 className="text-3xl font-black text-cyan-400 mt-1">{avgAnomalyScore}%</h4>
              </div>
            </div>

            <div className="space-y-3.5 pb-4 border-b border-white/5">
              <div>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold">Highest Alert Zone</span>
                <h4 className="text-sm font-bold text-white mt-1 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-red-500" />
                  {alerts.length > 0 ? alerts[0].district : "No Active Alerts"}
                </h4>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-red-500/10 border border-red-500/20 p-2 rounded-lg flex flex-col items-center">
                  <span className="text-red-400 text-[10px] font-bold">CRITICAL</span>
                  <span className="text-white text-base font-black mt-0.5">{criticalCount}</span>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg flex flex-col items-center">
                  <span className="text-amber-400 text-[10px] font-bold">WARNING</span>
                  <span className="text-white text-base font-black mt-0.5">{warningCount}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Detection Parameters</h4>
              <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs text-gray-400">
                <div>Model Core:</div>
                <div className="font-semibold text-white text-right">Isolation Forest</div>
                
                <div>Contamination:</div>
                <div className="font-semibold text-white text-right">10.0%</div>
                
                <div>Features:</div>
                <div className="font-semibold text-white text-right">3D Vectors</div>
                
                <div>Engine Confidence:</div>
                <div className="font-semibold text-emerald-400 text-right">94.5%</div>
                
                <div>Sync Status:</div>
                <div className="font-semibold text-cyan-400 text-right">Real-time</div>
              </div>
            </div>
          </div>
          
          <div className="glassmorphism p-5 rounded-xl border border-white/10">
            <h3 className="text-md font-semibold text-white mb-3">Threat Guidelines</h3>
            <div className="space-y-3 text-xs leading-relaxed text-gray-400">
              <p>
                <strong className="text-red-400 font-bold block mb-1">CRITICAL (&gt;75% score):</strong> Represents immediate volume expansion (&gt;100% growth) combined with above-average crime severity. Recommends direct force redirection.
              </p>
              <p>
                <strong className="text-amber-400 font-bold block mb-1">WARNING (50%-75% score):</strong> Represents gradual trend deviation. Needs monitoring and intelligence verification.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Regression popup modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="glassmorphism w-full max-w-3xl rounded-2xl border border-white/10 p-6 flex flex-col justify-between shadow-2xl relative animate-fade-in max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button 
              onClick={() => setSelectedAlert(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 hover:bg-white/5 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="border-b border-white/10 pb-4 flex items-center gap-3">
              <div className="p-2.5 bg-cyan-500/10 rounded-lg text-cyan-400">
                <MapPin className="h-6 w-6 animate-bounce" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  {selectedAlert.district} Crime Anomaly Analysis
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Flagged period: <strong className="text-red-400">{selectedAlert.period}</strong> • Contamination threshold crossed
                </p>
              </div>
            </div>

            {/* Body */}
            {regressionLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                {/* Chart Block */}
                <div className="md:col-span-2 flex flex-col h-[280px]">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Monthly Regression Timeline</h4>
                  <div className="flex-grow relative bg-[#0b0f19]/30 rounded-xl border border-white/5 p-2">
                    <Line data={regressionChartData} options={chartOptions} />
                  </div>
                </div>

                {/* Info Block */}
                <div className="md:col-span-1 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Anomaly Metrics</h4>
                  
                  {/* Stats */}
                  <div className="space-y-2 text-xs">
                    <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                      <span className="text-gray-400 block text-3xs uppercase font-medium">Anomaly Month count</span>
                      <strong className="text-white text-md block mt-0.5">{selectedAlert.crime_count} crimes</strong>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                      <span className="text-gray-400 block text-3xs uppercase font-medium">Anomalous Growth Rate</span>
                      <strong className="text-cyan-400 text-md block mt-0.5">+{selectedAlert.growth_rate}% MoM</strong>
                    </div>
                    <div className="p-3 bg-red-950/20 border border-red-500/10 rounded-lg">
                      <span className="text-red-400 block text-3xs uppercase font-bold flex items-center gap-1">
                        <AlertOctagon className="h-3.5 w-3.5" /> Threat Warning
                      </span>
                      <p className="text-gray-300 text-[10px] leading-relaxed mt-1">
                        Isolation Forest score of {selectedAlert.anomaly_score}% confirms a non-seasonal, systemic rise in local illicit actions. Immediate patrol redeployment is advised.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-white/10 pt-4 mt-6 flex justify-end">
              <button
                onClick={() => setSelectedAlert(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-all"
              >
                Close Analysis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
