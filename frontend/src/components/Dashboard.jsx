import React, { useState, useEffect } from "react";
import { Line, Doughnut, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  registerables
} from "chart.js";
import { Shield, AlertTriangle, Users, CheckCircle, TrendingUp, MapPin } from "lucide-react";
import { API_BASE_URL } from "../api";

ChartJS.register(...registerables);

export default function Dashboard({ setActiveTab }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trendHorizon, setTrendHorizon] = useState("monthly"); // daily, monthly, yearly

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/dashboard/stats`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch dashboard statistics");
        return res.json();
      })
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
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

  if (error) {
    return (
      <div className="glassmorphism p-6 rounded-xl border border-red-500/20 text-center max-w-lg mx-auto mt-12">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Backend Connection Error</h3>
        <p className="text-gray-400 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors font-medium"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // Set up chart data
  const trendData = stats?.monthly_trend || [];
  let trendLabels = [];
  let trendValues = [];
  
  if (stats) {
    if (trendHorizon === "daily") {
      const dailyData = stats.daily_trend || [];
      trendLabels = dailyData.map((d) => {
        const dateObj = new Date(d.date);
        return dateObj.toLocaleDateString("default", { month: "short", day: "numeric" });
      });
      trendValues = dailyData.map((d) => d.count);
    } else if (trendHorizon === "yearly") {
      const yearlyData = stats.yearly_trend || [];
      trendLabels = yearlyData.map((d) => d.year);
      trendValues = yearlyData.map((d) => d.count);
    } else {
      const monthlyData = stats.monthly_trend || [];
      trendLabels = monthlyData.map((t) => {
        const [year, month] = t.month.split("-");
        const d = new Date(parseInt(year), parseInt(month) - 1);
        return d.toLocaleString("default", { month: "short", year: "2-digit" });
      });
      trendValues = monthlyData.map((t) => t.count);
    }
  }

  const lineChartData = {
    labels: trendLabels,
    datasets: [
      {
        label: `${trendHorizon.charAt(0).toUpperCase() + trendHorizon.slice(1)} Crimes Logged`,
        data: trendValues,
        borderColor: "#06B6D4",
        backgroundColor: "rgba(6, 182, 212, 0.15)",
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointBackgroundColor: "#06B6D4",
        pointBorderColor: "#fff",
        pointHoverRadius: 7,
      },
    ],
  };

  const categoryDistribution = stats?.category_distribution || [];
  const doughnutChartData = {
    labels: categoryDistribution.map((c) => c.category),
    datasets: [
      {
        data: categoryDistribution.map((c) => c.count),
        backgroundColor: [
          "#3B82F6", // Blue
          "#8B5CF6", // Purple
          "#EC4899", // Pink
          "#EF4444", // Red
          "#10B981", // Emerald
          "#F59E0B", // Amber
          "#06B6D4", // Cyan
          "#6366F1", // Indigo
        ],
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)", // Default fallback
      },
    ],
  };

  const districtDistribution = stats?.district_distribution || [];
  const barChartData = {
    labels: districtDistribution.map((d) => d.district),
    datasets: [
      {
        label: "Crimes Count",
        data: districtDistribution.map((d) => d.count),
        backgroundColor: "rgba(59, 130, 246, 0.6)",
        borderColor: "#3B82F6",
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const isLight = document.documentElement.classList.contains("light-theme");
  const chartTextColor = isLight ? "#292524" : "#e5e7eb";
  const chartTickColor = isLight ? "#44403c" : "#9ca3af";
  const chartGridColor = isLight ? "rgba(15, 23, 42, 0.08)" : "rgba(255, 255, 255, 0.05)";
  const chartBorderColor = isLight ? "rgba(15, 23, 42, 0.1)" : "rgba(255, 255, 255, 0.1)";

  // Apply dynamic border to doughnut chart
  if (doughnutChartData.datasets[0]) {
    doughnutChartData.datasets[0].borderColor = chartBorderColor;
  }

  const commonChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: chartTextColor,
          font: { family: "Outfit, Inter, sans-serif" },
        },
      },
    },
    scales: {
      x: {
        grid: { color: chartGridColor },
        ticks: { color: chartTickColor },
      },
      y: {
        grid: { color: chartGridColor },
        ticks: { color: chartTickColor },
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Overview stats header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-400 bg-clip-text text-transparent">
            Crime Intelligence Center
          </h1>
          <p className="text-gray-400 mt-1">Real-time crime statistics, proactive risk analytics, and criminal networks monitoring.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setActiveTab("hotspots")} 
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 font-bold ${
              isLight 
                ? "bg-[#F5F2EB] border-2 border-red-600 text-red-600 hover:bg-red-50 shadow-md shadow-red-500/10"
                : "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20"
            }`}
          >
            <MapPin className={`h-4 w-4 ${isLight ? "text-red-600" : "text-white"}`} /> View Hotspots Map
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="glassmorphism p-5 rounded-xl flex items-center gap-4 transition-transform duration-300 hover:scale-[1.02]">
          <div className="p-3 bg-cyan-500/10 rounded-lg text-cyan-400">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">Total Crimes Logged</p>
            <h3 className="text-2xl font-bold mt-1 text-white">{stats.total_crimes}</h3>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="glassmorphism p-5 rounded-xl flex items-center gap-4 transition-transform duration-300 hover:scale-[1.02]">
          <div className="p-3 bg-red-500/10 rounded-lg text-red-400">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">Active Repeat Offenders</p>
            <h3 className="text-2xl font-bold mt-1 text-white">{stats.active_offenders}</h3>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="glassmorphism p-5 rounded-xl flex items-center gap-4 transition-transform duration-300 hover:scale-[1.02]">
          <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">Case Resolution Rate</p>
            <h3 className="text-2xl font-bold mt-1 text-white">{stats.resolution_rate}%</h3>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="glassmorphism p-5 rounded-xl flex items-center gap-4 transition-transform duration-300 hover:scale-[1.02]">
          <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">Monthly Growth Rate</p>
            <h3 className="text-2xl font-bold mt-1 text-white">
              {trendData.length > 1 
                ? `${((trendData[trendData.length - 1].count - trendData[trendData.length - 2].count) / trendData[trendData.length - 2].count * 100).toFixed(1)}%`
                : "0.0%"}
            </h3>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart */}
        <div className="glassmorphism p-5 rounded-xl lg:col-span-2 flex flex-col h-[380px]">
          <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
            <h3 className="text-lg font-semibold text-white">Reported Crimes Trend</h3>
            <div className="flex bg-slate-900 border border-white/10 p-0.5 rounded-lg">
              <button 
                onClick={() => setTrendHorizon("daily")}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                  trendHorizon === "daily" ? "bg-cyan-600 text-white shadow" : "text-gray-400 hover:text-white"
                }`}
              >
                Daily (30d)
              </button>
              <button 
                onClick={() => setTrendHorizon("monthly")}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                  trendHorizon === "monthly" ? "bg-cyan-600 text-white shadow" : "text-gray-400 hover:text-white"
                }`}
              >
                Monthly
              </button>
              <button 
                onClick={() => setTrendHorizon("yearly")}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                  trendHorizon === "yearly" ? "bg-cyan-600 text-white shadow" : "text-gray-400 hover:text-white"
                }`}
              >
                Yearly
              </button>
            </div>
          </div>
          <div className="flex-1 relative">
            <Line key={isLight ? "light" : "dark"} data={lineChartData} options={commonChartOptions} />
          </div>
        </div>

        {/* Doughnut Chart */}
        <div className="glassmorphism p-5 rounded-xl flex flex-col h-[380px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">Crime Categories</h3>
            <span className="text-xs px-2 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full">Typology</span>
          </div>
          <div className="flex-1 relative">
            <Doughnut 
              key={isLight ? "light" : "dark"}
              data={doughnutChartData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "right",
                    labels: {
                      color: chartTextColor,
                      boxWidth: 12,
                      font: { family: "Outfit, Inter, sans-serif", size: 11 },
                    },
                  },
                },
              }} 
            />
          </div>
        </div>
      </div>

      {/* Bar Chart: District breakdown */}
      <div className="glassmorphism p-5 rounded-xl flex flex-col h-[320px]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">District-wise Crimes</h3>
          <span className="text-xs px-2 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full">Geospatial Counts</span>
        </div>
        <div className="flex-1 relative">
          <Bar key={isLight ? "light" : "dark"} data={barChartData} options={commonChartOptions} />
        </div>
      </div>
    </div>
  );
}
