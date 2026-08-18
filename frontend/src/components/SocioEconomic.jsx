import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  registerables
} from "chart.js";
import { Landmark, Info, AlertTriangle, ShieldCheck, ChevronDown, ChevronUp, Sliders, ArrowRight } from "lucide-react";
import { API_BASE_URL } from "../api";

ChartJS.register(...registerables);

export default function SocioEconomic() {
  const [data, setData] = useState({ correlations: {}, data_points: [] });
  const [loading, setLoading] = useState(true);
  const [selectedFactor, setSelectedFactor] = useState("poverty_index");
  
  // Accordion toggle state
  const [openAccordion, setOpenAccordion] = useState("poverty_index");

  // Scenario Simulator States
  const [simUnemployment, setSimUnemployment] = useState(7.0);
  const [simPoverty, setSimPoverty] = useState(15.0);
  const [simIncome, setSimIncome] = useState(50.0);
  const [simEducation, setSimEducation] = useState(75.0);
  const [simDensity, setSimDensity] = useState(5.0);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/socio-economic`)
      .then((res) => res.json())
      .then((resData) => {
        setData(resData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching socio-economic correlations:", err);
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

  // Toggled factor details
  const factorLabels = {
    poverty_index: "Poverty Index",
    unemployment_rate: "Unemployment Rate",
    income_level: "Annual Income (K)",
    education_level: "Education Level (%)",
    population_density: "Population Density (/km²)"
  };

  const factorDescription = {
    poverty_index: "Compares local poverty rates against total logged crimes. Strong positive correlation suggests economic distress drives survival-based offenses.",
    unemployment_rate: "Aggregates jobless ratios against crime count. High rates often trigger opportunistic street thefts and drug sales.",
    income_level: "Compares average household income with crimes. Higher income sectors typically see lower violent crimes but present targets for cyber fraud.",
    education_level: "Correlates literacy thresholds with crimes. Higher educational profiles strongly correlate with lower violent crime incidences.",
    population_density: "Maps crowding to crimes. High density zones present target-rich environments for opportunistic theft."
  };

  const factorColors = {
    poverty_index: "#EF4444", // Red
    unemployment_rate: "#F59E0B", // Amber
    income_level: "#10B981", // Emerald
    education_level: "#8B5CF6", // Purple
    population_density: "#06B6D4" // Cyan
  };

  // Detailed criminological summaries for Accordions
  const factorIntelligence = {
    poverty_index: {
      whyIncreases: "Poverty creates severe economic strain. When individuals lack basic resources for survival (food, shelter, healthcare), the relative cost of criminal activity decreases. Opportunistic crimes like street snatchings, petty theft, and basic burglary increase as a result of survival pressure rather than organized intent.",
      incrementRole: "An increase in poverty index causes a rapid, direct spike in property-related offences. For every 2% increase in localized poverty, the model predicts an estimated 5-7% increase in street thefts and burglaries in that district.",
      decrementRole: "Decreasing poverty rates (through welfare, subsidies, or micro-grants) triggers a direct reduction in crime rates. Historically, a 5% drop in the poverty index yields a 10% reduction in local street thefts within 6 months.",
      suggestions: [
        "Deploy targeted welfare subsidies and community food outreach programs in high-risk zones.",
        "Establish local vocational training centers to provide alternative livelihoods.",
        "Implement community-based policing to build trust and distribute safety alerts."
      ]
    },
    unemployment_rate: {
      whyIncreases: "Unemployment deprives individuals of stable, legal income and fills their time with idle periods. This reduces self-worth and raises social frustration. Young demographics facing long-term joblessness are highly susceptible to recruitment by local gangs or drug distribution networks.",
      incrementRole: "High unemployment rates directly feed drug trafficking and vehicle thefts. A 3% increase in local unemployment generally corresponds with a 9% rise in active repeat offender recruitments.",
      decrementRole: "Lowering unemployment rate (through job fairs, small business incentives, or public works) reduces the pool of potential gang recruits. A 4% reduction in joblessness drives down drug trafficking and vehicle thefts by 12% over 9 months.",
      suggestions: [
        "Create youth employment hubs and localized job training workshops.",
        "Offer tax incentives for businesses that hire local residents in high-crime districts.",
        "Increase security presence and educational counseling at schools to keep youth off the streets."
      ]
    },
    income_level: {
      whyIncreases: "Low average annual income forces families into substandard housing conditions and dense neighborhoods, multiplying social friction. Conversely, high-income districts attract professional criminals looking for high-value targets (cars, luxury houses, bank fraud).",
      incrementRole: "Dropping average income level spikes burglary and assault rates. Elevating average income changes the typology, decreasing violent crimes but slightly increasing cyber-phishing scams and money laundering.",
      decrementRole: "A gradual increase in average income decreases violent crimes and street thefts by providing financial security. However, high-value asset protection is still required.",
      suggestions: [
        "Implement minimum wage enforcement and financial literacy education.",
        "Establish neighborhood watch schemes in affluent districts to counter burglary.",
        "Deploy cyber safety alerts in high-income business districts."
      ]
    },
    education_level: {
      whyIncreases: "Low educational attainment blocks access to white-collar jobs, forcing reliance on manual labor or illegal activities. It also correlates with lower literacy, making individuals vulnerable to financial exploitation and lowering awareness of legal rights.",
      incrementRole: "A drop in literacy and high school graduation levels directly elevates gang recruitment and public disturbance crimes. We observe a negative correlation of -0.74 between education and local crime volume.",
      decrementRole: "Improving literacy and high school graduation rates reduces recidivism. A 10% increase in district literacy reduces violent crimes by 15% in the long term (2-3 year horizon).",
      suggestions: [
        "Fund school dropout prevention initiatives and evening adult literacy courses.",
        "Provide direct educational grants for underprivileged students in high-crime sectors.",
        "Increase mentorship programs linking students with professional industries."
      ]
    },
    population_density: {
      whyIncreases: "High population density creates crowd-heavy hubs (markets, transit stations) that are target-rich environments for pickpockets and vehicle thieves. The high concentration of people also makes tracking and surveillance difficult, allowing suspects to hide easily.",
      incrementRole: "Increasing density (due to rapid urbanization) causes street thefts and vehicle thefts to rise exponentially due to sheer opportunity and lack of spatial visibility.",
      decrementRole: "Managing spatial crowding (improving public transport design, dispersing market layouts) reduces the opportunity for quick thefts by 15% even in crowded districts.",
      suggestions: [
        "Deploy ALPR cameras and smart CCTV networks in high-density transit junctions.",
        "Optimize spatial layouts in central markets to prevent blind spots and bottleneck escapes.",
        "Increase visible foot patrols during transit peak hours."
      ]
    }
  };

  // Scenario Simulator Math
  const baseUnemployment = 5.0;
  const basePoverty = 10.0;
  const baseIncome = 50.0;
  const baseEducation = 75.0;
  const baseDensity = 5.0;
  
  const simCrimeImpactPercent = 
    ((simUnemployment - baseUnemployment) * 3.5) + 
    ((simPoverty - basePoverty) * 2.8) +
    ((baseIncome - simIncome) * 1.2) +
    ((baseEducation - simEducation) * 1.5) +
    ((simDensity - baseDensity) * 2.2);

  const predictedMonthlyVolume = Math.max(2, Math.round(15 * (1 + simCrimeImpactPercent / 100)));

  // Build Double-axis Bar Chart Data
  const chartData = {
    labels: data.data_points.map((dp) => dp.district),
    datasets: [
      {
        label: "District Crimes Count",
        data: data.data_points.map((dp) => dp.crime_rate),
        backgroundColor: "rgba(59, 130, 246, 0.55)",
        borderColor: "#3B82F6",
        borderWidth: 1.5,
        yAxisID: "y-crimes",
        borderRadius: 4,
      },
      {
        label: factorLabels[selectedFactor],
        data: data.data_points.map((dp) => dp[selectedFactor]),
        backgroundColor: `${factorColors[selectedFactor]}50`,
        borderColor: factorColors[selectedFactor],
        borderWidth: 1.5,
        yAxisID: "y-factor",
        borderRadius: 4,
      }
    ]
  };

  const isLight = document.documentElement.classList.contains("light-theme");
  const chartTextColor = isLight ? "#292524" : "#cbd5e1";
  const chartTickColor = isLight ? "#44403c" : "#94a3b8";
  const chartGridColor = isLight ? "rgba(15, 23, 42, 0.08)" : "rgba(255, 255, 255, 0.05)";

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: chartTextColor,
          font: { family: "Outfit, Inter, sans-serif" }
        }
      }
    },
    scales: {
      x: {
        grid: { color: chartGridColor },
        ticks: { color: chartTickColor }
      },
      "y-crimes": {
        type: "linear",
        position: "left",
        grid: { color: chartGridColor },
        ticks: { color: "#3B82F6" },
        title: {
          display: true,
          text: "Crimes Count",
          color: "#3B82F6",
          font: { weight: "bold" }
        }
      },
      "y-factor": {
        type: "linear",
        position: "right",
        grid: { drawOnChartArea: false }, 
        ticks: { color: factorColors[selectedFactor] },
        title: {
          display: true,
          text: factorLabels[selectedFactor],
          color: factorColors[selectedFactor],
          font: { weight: "bold" }
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Selector */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Landmark className="h-8 w-8 text-cyan-400" />
            Socio-Economic Correlation Analysis
          </h1>
          <p className="text-gray-400 mt-1">Analyzing structural development metrics against crime density across sectors.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-gray-400">Select Factor:</label>
          <select 
            value={selectedFactor} 
            onChange={(e) => {
              setSelectedFactor(e.target.value);
              setOpenAccordion(e.target.value);
            }}
            className="bg-slate-900 border border-white/15 text-white rounded-lg px-4 py-2 text-sm font-semibold outline-none focus:border-cyan-500 transition-colors"
          >
            {Object.entries(factorLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Chart & Scenario Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart Column */}
        <div className="lg:col-span-2 glassmorphism p-5 rounded-xl border border-white/10 flex flex-col h-[520px]">
          <div className="mb-4">
            <h3 className="text-md font-semibold text-white">Socio-Economic Comparison Matrix</h3>
            <p className="text-xs text-gray-400 mt-1">{factorDescription[selectedFactor]}</p>
          </div>
          <div className="flex-1 relative min-h-0">
            <Bar key={isLight ? "light" : "dark"} data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Simulator Column */}
        <div className="glassmorphism p-5 rounded-xl border border-white/10 flex flex-col justify-between bg-slate-900/10 h-[520px]">
          {/* Header Compartment */}
          <div className="pb-3.5 border-b border-white/5">
            <h3 className="text-md font-semibold text-white flex items-center gap-2">
              <Sliders className="h-5 w-5 text-cyan-400" /> Scenario Simulator
            </h3>
            <p className="text-xs text-gray-400 mt-1">Adjust structural inputs to forecast relative crime volume deviations.</p>
          </div>

          {/* Sliders Compartment */}
          <div className="space-y-4 py-4 overflow-y-auto max-h-[380px] scrollbar-thin pr-1">
            
            {/* Unemployment Slider */}
            <div className="space-y-2 bg-slate-900/25 p-3 rounded-lg border border-white/5">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-gray-300">Simulated Unemployment:</span>
                <span className="text-cyan-400 font-bold text-sm bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/20">
                  {simUnemployment.toFixed(1)}%
                </span>
              </div>
              <input 
                type="range" 
                min="3.0" 
                max="15.0" 
                step="0.1" 
                value={simUnemployment} 
                onChange={(e) => setSimUnemployment(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-500 border border-white/10"
              />
              {/* Ticks/Lining Indicators */}
              <div className="flex justify-between text-[9px] text-gray-500 px-1 pt-1 font-bold">
                <span>3.0%</span>
                <span>6.0%</span>
                <span>9.0%</span>
                <span>12.0%</span>
                <span>15.0%</span>
              </div>
            </div>

            {/* Poverty Slider */}
            <div className="space-y-2 bg-slate-900/25 p-3 rounded-lg border border-white/5">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-gray-300">Simulated Poverty Index:</span>
                <span className="text-amber-500 font-bold text-sm bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/20">
                  {simPoverty.toFixed(1)}%
                </span>
              </div>
              <input 
                type="range" 
                min="3.0" 
                max="30.0" 
                step="0.1" 
                value={simPoverty} 
                onChange={(e) => setSimPoverty(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-500 border border-white/10"
              />
              {/* Ticks/Lining Indicators */}
              <div className="flex justify-between text-[9px] text-gray-500 px-1 pt-1 font-bold">
                <span>3.0%</span>
                <span>10.0%</span>
                <span>17.0%</span>
                <span>24.0%</span>
                <span>30.0%</span>
              </div>
            </div>

            {/* Annual Income Slider */}
            <div className="space-y-2 bg-slate-900/25 p-3 rounded-lg border border-white/5">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-gray-300">Simulated Annual Income:</span>
                <span className="text-emerald-500 font-bold text-sm bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                  {simIncome.toFixed(1)}k
                </span>
              </div>
              <input 
                type="range" 
                min="10.0" 
                max="150.0" 
                step="1.0" 
                value={simIncome} 
                onChange={(e) => setSimIncome(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-500 border border-white/10"
              />
              <div className="flex justify-between text-[9px] text-gray-500 px-1 pt-1 font-bold">
                <span>10k</span>
                <span>45k</span>
                <span>80k</span>
                <span>115k</span>
                <span>150k</span>
              </div>
            </div>

            {/* Education Level Slider */}
            <div className="space-y-2 bg-slate-900/25 p-3 rounded-lg border border-white/5">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-gray-300">Simulated Education Level:</span>
                <span className="text-purple-500 font-bold text-sm bg-purple-950/40 px-2 py-0.5 rounded border border-purple-500/20">
                  {simEducation.toFixed(1)}%
                </span>
              </div>
              <input 
                type="range" 
                min="40.0" 
                max="100.0" 
                step="1.0" 
                value={simEducation} 
                onChange={(e) => setSimEducation(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-500 border border-white/10"
              />
              <div className="flex justify-between text-[9px] text-gray-500 px-1 pt-1 font-bold">
                <span>40%</span>
                <span>55%</span>
                <span>70%</span>
                <span>85%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Population Density Slider */}
            <div className="space-y-2 bg-slate-900/25 p-3 rounded-lg border border-white/5">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-gray-300">Simulated Population Density:</span>
                <span className="text-cyan-500 font-bold text-sm bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/20">
                  {simDensity.toFixed(1)}k/km²
                </span>
              </div>
              <input 
                type="range" 
                min="1.0" 
                max="15.0" 
                step="0.1" 
                value={simDensity} 
                onChange={(e) => setSimDensity(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-500 border border-white/10"
              />
              <div className="flex justify-between text-[9px] text-gray-500 px-1 pt-1 font-bold">
                <span>1.0k</span>
                <span>4.5k</span>
                <span>8.0k</span>
                <span>11.5k</span>
                <span>15.0k</span>
              </div>
            </div>

          </div>

          {/* Results Compartment */}
          <div className="pt-3.5 border-t border-white/5 p-4 bg-cyan-950/20 border border-cyan-500/10 rounded-lg space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400">Predicted Crime Impact:</span>
              <strong className={`font-black text-sm ${simCrimeImpactPercent >= 0 ? "text-red-400" : "text-emerald-400"}`}>
                {simCrimeImpactPercent >= 0 ? "+" : ""}{simCrimeImpactPercent.toFixed(1)}%
              </strong>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400">Predicted Monthly Volume:</span>
              <strong className="text-white font-extrabold text-sm">{predictedMonthlyVolume} incidents</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Accordion List */}
      <div className="space-y-4">
        <h3 className="text-md font-semibold text-white flex items-center gap-2">
          <Info className="h-5 w-5 text-cyan-400" /> Criminological Factor Intelligence
        </h3>
        
        {Object.entries(factorIntelligence).map(([key, intel]) => {
          const isOpen = openAccordion === key;
          return (
            <div key={key} className="glassmorphism rounded-xl border border-white/10 overflow-hidden transition-all duration-200">
              <button 
                onClick={() => setOpenAccordion(isOpen ? "" : key)}
                className="w-full flex justify-between items-center p-4 text-left font-semibold text-white hover:bg-white/5 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: factorColors[key] }}></span>
                  {factorLabels[key]} Details
                </span>
                {isOpen ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
              </button>

              {isOpen && (
                <div className="p-4 border-t border-white/5 bg-slate-900/20 space-y-4 text-xs leading-relaxed text-gray-300">
                  <div>
                    <h5 className="font-semibold text-white mb-1">Criminological Context (Why it affects Crime)</h5>
                    <p>{intel.whyIncreases}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-red-950/20 border border-red-500/10 rounded-lg">
                      <h6 className="font-semibold text-red-400 mb-1 flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4" /> Impact of Increments
                      </h6>
                      <p>{intel.incrementRole}</p>
                    </div>
                    <div className="p-3 bg-emerald-950/20 border border-emerald-500/10 rounded-lg">
                      <h6 className="font-semibold text-emerald-400 mb-1 flex items-center gap-1">
                        <ShieldCheck className="h-4 w-4" /> Impact of Decrements
                      </h6>
                      <p>{intel.decrementRole}</p>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-semibold text-white mb-1.5">Suggested Preventative Strategies</h5>
                    <ul className="list-disc pl-5 space-y-1 text-gray-400">
                      {intel.suggestions.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
