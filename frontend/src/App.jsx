import React, { useState, useEffect } from "react";
import Dashboard from "./components/Dashboard";
import HotspotsMap from "./components/HotspotsMap";
import DistrictDrilldown from "./components/DistrictDrilldown";
import AlertsPanel from "./components/AlertsPanel";
import CCTVPanel from "./components/CCTVPanel";
import NetworkGraph from "./components/NetworkGraph";
import OffenderTracker from "./components/OffenderTracker";
import SocioEconomic from "./components/SocioEconomic";
import RiskScoring from "./components/RiskScoring";
import EvolutionEngine from "./components/EvolutionEngine";
import AIAssistant from "./components/AIAssistant";
import DatasetManager from "./components/DatasetManager";

import { 
  ShieldAlert, Sparkles, Map, Bell, GitCommit, 
  UserCheck, Landmark, Shield, LayoutDashboard, Calendar, Activity, Lock, Mail, User, LogOut, Key, Sun, Moon, Bot, Database, Video
} from "lucide-react";
import { API_BASE_URL } from "./api";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // login, register
  const [currentUser, setCurrentUser] = useState(null);
  
  // Theme and dynamic time states
  const [theme, setTheme] = useState("dark");
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Form input states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [activeTab, setActiveTab] = useState("dashboard");
  const [alertCount, setAlertCount] = useState(0);

  // Dynamic Time Clock Effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    if (nextTheme === "light") {
      document.documentElement.classList.add("light-theme");
    } else {
      document.documentElement.classList.remove("light-theme");
    }
  };

  // Check persistent session on startup
  useEffect(() => {
    const session = localStorage.getItem("crimedna_session");
    if (session) {
      const user = JSON.parse(session);
      setCurrentUser(user);
      setIsAuthenticated(true);
    }
  }, []);

  // Fetch alerts count when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    fetch("http://127.0.0.1:8000/api/anomalies")
      .then((res) => res.json())
      .then((data) => {
        if (data.alerts) setAlertCount(data.alerts.length);
      })
      .catch((err) => console.error("Error loading alerts count:", err));
  }, [isAuthenticated]);

  // Handle Login submission
  const handleLogin = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Please fill out all fields.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    // Simulate decrypting delay
    setTimeout(() => {
      // Fetch users from localStorage
      const localUsers = JSON.parse(localStorage.getItem("crimedna_users") || "[]");
      
      // Default fallback credentials
      const defaultAdmin = { email: "admin@crimedna.ai", password: "admin123", name: "Commander Sterling" };
      const usersList = [defaultAdmin, ...localUsers];

      const user = usersList.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
      
      if (user) {
        localStorage.setItem("crimedna_session", JSON.stringify(user));
        setCurrentUser(user);
        setIsAuthenticated(true);
        setErrorMsg("");
      } else {
        setErrorMsg("Access Denied: Invalid tactical credentials.");
      }
      setIsSubmitting(false);
    }, 1200);
  };

  // Handle Registration submission
  const handleRegister = (e) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      setErrorMsg("Please fill out all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Security Protocol: Passwords must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    setTimeout(() => {
      const localUsers = JSON.parse(localStorage.getItem("crimedna_users") || "[]");
      
      // Check if email already registered
      const emailExists = localUsers.some((u) => u.email.toLowerCase() === email.toLowerCase()) || email.toLowerCase() === "admin@crimedna.ai";
      if (emailExists) {
        setErrorMsg("Registration Error: Officer profile already exists.");
        setIsSubmitting(false);
        return;
      }

      const newUser = { email, password, name };
      localUsers.push(newUser);
      localStorage.setItem("crimedna_users", JSON.stringify(localUsers));
      
      // Log in directly
      localStorage.setItem("crimedna_session", JSON.stringify(newUser));
      setCurrentUser(newUser);
      setIsAuthenticated(true);
      setIsSubmitting(false);
      setErrorMsg("");
    }, 1200);
  };

  const handleSignOut = () => {
    localStorage.removeItem("crimedna_session");
    setIsAuthenticated(false);
    setCurrentUser(null);
    setEmail("");
    setPassword("");
    setName("");
    setConfirmPassword("");
    setErrorMsg("");
  };

  const navItems = [
    { id: "dashboard", name: "Overview Dashboard", icon: LayoutDashboard },
    { id: "hotspots", name: "Geospatial Hotspots", icon: Map },
    { id: "drilldown", name: "District Profile", icon: Landmark },
    { id: "anomalies", name: "Trend Alerts", icon: Bell, badge: alertCount },
    { id: "network", name: "Criminal Networks", icon: GitCommit },
    { id: "offenders", name: "Repeat Offenders", icon: UserCheck },
    { id: "socioeconomic", name: "Socio-Economic Link", icon: Shield },
    { id: "predictions", name: "Predictive Risks", icon: ShieldAlert },
    { id: "cctv", name: "CCTV Surveillance", icon: Video, highlight: true },
    { id: "evolution", name: "Evolution Engine", icon: Sparkles, highlight: true },
    { id: "ai_assistant", name: "AI Tactical Assistant", icon: Bot, highlight: true },
    { id: "dataset", name: "Import Dataset", icon: Database, highlight: true }
  ];

  // Render Login/Register Portal
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0F19] text-gray-100 p-4 relative antialiased select-none">
        {/* Futuristic Grid and Glow Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>

        {/* Auth Box */}
        <div className="glassmorphism w-full max-w-md p-8 rounded-2xl border border-white/10 relative z-10 shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col justify-between">
          
          {/* Logo and Header */}
          <div className="text-center space-y-2 mb-6">
            <img src="/logo.jpg" alt="CrimeVault Logo" className="h-16 w-16 mx-auto rounded-2xl border border-white/10 shadow-xl shadow-cyan-500/5 mb-2" />
            <h1 className="text-2xl font-black tracking-tight text-white mt-2">CrimeVault Portal</h1>
            <p className="text-2xs text-gray-400 font-semibold tracking-widest uppercase">
              Secure Operations Terminal
            </p>
            <p className="text-[11px] text-gray-500 max-w-xs mx-auto leading-relaxed pt-1.5 border-t border-white/5">
              Authorized law enforcement profiles only. Multi-factor encryption active.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={authMode === "login" ? handleLogin : handleRegister} className="space-y-4">
            
            {/* Display Errors */}
            {errorMsg && (
              <div className="p-3 bg-red-950/20 border border-red-500/25 text-red-400 text-3xs font-semibold rounded-lg flex items-center gap-2">
                <AlertOctagon className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Field: Full Name (Register Only) */}
            {authMode === "register" && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Officer Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4.5 w-4.5 text-gray-500" />
                  <input 
                    type="text" 
                    placeholder="Enter name / badge code"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950/60 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-600 focus:border-cyan-500 outline-none focus:ring-1 focus:ring-cyan-500/25 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Field: Email */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Authorized Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4.5 w-4.5 text-gray-500" />
                <input 
                  type="email" 
                  placeholder="e.g. badge@crimedna.ai"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-600 focus:border-cyan-500 outline-none focus:ring-1 focus:ring-cyan-500/25 transition-all"
                />
              </div>
            </div>

            {/* Field: Password */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Terminal Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4.5 w-4.5 text-gray-500" />
                <input 
                  type="password" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-600 focus:border-cyan-500 outline-none focus:ring-1 focus:ring-cyan-500/25 transition-all"
                />
              </div>
            </div>

            {/* Field: Confirm Password (Register Only) */}
            {authMode === "register" && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Confirm Password</label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-4.5 w-4.5 text-gray-500" />
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-950/60 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-600 focus:border-cyan-500 outline-none focus:ring-1 focus:ring-cyan-500/25 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full mt-2 py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all duration-300 shadow-lg shadow-cyan-500/10 cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Verifying clearance...</span>
                </>
              ) : (
                <span>{authMode === "login" ? "Verify Clearances & Enter" : "Establish Profile Dossier"}</span>
              )}
            </button>
          </form>

          {/* Selector Switch Footer */}
          <div className="mt-6 border-t border-white/5 pt-4 text-center">
            {authMode === "login" ? (
              <button 
                onClick={() => { setAuthMode("register"); setErrorMsg(""); }}
                className="text-[11px] text-cyan-400 font-bold hover:text-cyan-300 transition-colors focus:outline-none"
              >
                New agency officer profile? Register credentials
              </button>
            ) : (
              <button 
                onClick={() => { setAuthMode("login"); setErrorMsg(""); }}
                className="text-[11px] text-cyan-400 font-bold hover:text-cyan-300 transition-colors focus:outline-none"
              >
                Verified account exists? Enter operations terminal
              </button>
            )}
            
            {/* Show fallback credentials help box for login */}
            {authMode === "login" && (
              <div className="mt-3 p-2 bg-cyan-950/15 border border-cyan-500/5 rounded text-[10px] text-cyan-400/80 leading-normal text-left">
                <strong>Demo Credentials:</strong><br />
                Email: <span className="text-white">admin@crimedna.ai</span><br />
                Password: <span className="text-white">admin123</span>
              </div>
            )}
          </div>

        </div>
      </div>
    );
  }

  // Dashboard Operations Console View (Authenticated)
  return (
    <div className="flex min-h-screen bg-[#0B0F19] text-gray-100 font-sans">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-950/70 border-r border-white/5 flex flex-col justify-between shrink-0 h-screen sticky top-0 backdrop-blur-md">
        <div>
          {/* Logo Header */}
          <div className="p-6 border-b border-white/5 flex items-center gap-3">
            <img src="/logo.jpg" alt="CrimeVault Logo" className="h-10 w-10 rounded-lg object-cover border border-white/10" />
            <div>
              <h2 className="font-extrabold text-lg text-white leading-none tracking-tight">CrimeVault</h2>
              <span className="text-[10px] text-cyan-400 font-semibold tracking-wider uppercase mt-1 block">Analytics Platform</span>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              let btnClass = "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 ";
              
              if (isActive) {
                btnClass += item.highlight 
                  ? (theme === "light"
                      ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-500/25"
                      : "bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-lg shadow-cyan-500/10")
                  : (theme === "light"
                      ? "bg-stone-200 border border-stone-300 text-red-600 font-bold"
                      : "bg-slate-900 border border-white/10 text-cyan-400 font-bold");
              } else {
                btnClass += item.highlight
                  ? (theme === "light"
                      ? "text-red-600 hover:bg-red-50 hover:text-red-700 border border-red-500/20"
                      : "text-indigo-300 hover:bg-slate-950 hover:text-white border border-indigo-500/10")
                  : (theme === "light"
                      ? "text-stone-600 hover:bg-stone-200/50 hover:text-stone-900"
                      : "text-gray-400 hover:bg-slate-900/40 hover:text-white");
              }

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={btnClass}
                >
                  <Icon className={`h-4.5 w-4.5 shrink-0 ${
                    isActive 
                      ? (theme === "light" ? "text-white" : "text-cyan-400") 
                      : (item.highlight && theme === "light" ? "text-red-500" : "text-gray-400")
                  }`} />
                  <span className="flex-1 text-left">{item.name}</span>
                  {item.badge > 0 && (
                    <span className="px-2 py-0.5 bg-red-600 text-white font-black text-3xs rounded-full animate-bounce">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer info in sidebar */}
        <div className="p-4 border-t border-white/5 bg-slate-950/20 text-3xs text-gray-500 flex flex-col gap-2">
          {currentUser && (
            <div className="border-b border-white/5 pb-2 mb-1 flex items-center justify-between text-gray-400">
              <span className="truncate max-w-[120px] font-bold text-[10px] text-white flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                {currentUser.name}
              </span>
              <button 
                onClick={handleSignOut}
                className="text-red-400 hover:text-red-300 font-extrabold flex items-center gap-0.5 hover:underline focus:outline-none"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign Out
              </button>
            </div>
          )}
          <div className="flex justify-between">
            <span>System Status:</span>
            <span className="text-emerald-400 font-bold">Online</span>
          </div>
          <div className="flex justify-between">
            <span>Analytics Core:</span>
            <span className="text-white font-semibold">FastAPI v0.111</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* Top Header Bar */}
        <header className="h-16 border-b border-white/5 bg-slate-950/40 backdrop-blur-md px-8 flex justify-between items-center sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
            <Activity className="h-4 w-4 text-cyan-400" />
            Active Node Node ID: <strong className="text-white">#CDN-CH-01</strong>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-2 font-medium bg-slate-900/40 px-3 py-1.5 border border-white/5 rounded-xl">
              <Calendar className="h-4 w-4 text-cyan-400 shrink-0" />
              <span>{currentTime.toLocaleDateString("default", { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              <span className="text-gray-600 font-normal">|</span>
              <span className="text-cyan-400 font-mono font-bold uppercase">{currentTime.toLocaleTimeString("default", { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</span>
            </span>
            
            {/* Theme Toggle Switch */}
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-900/40 border border-white/5 text-gray-400 hover:text-white hover:bg-slate-900 transition-all duration-300 focus:outline-none flex items-center justify-center cursor-pointer shadow-inner"
              title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Theme`}
            >
              {theme === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-400" />}
            </button>

            <div className="flex items-center gap-2 border-l border-white/5 pl-4 py-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="font-bold text-white uppercase tracking-wider text-[10px]">Secured Portal</span>
            </div>
          </div>
        </header>

        {/* Dynamic Section Render */}
        <main className="flex-grow p-8 overflow-y-auto">
          {activeTab === "dashboard" && <Dashboard setActiveTab={setActiveTab} />}
          {activeTab === "hotspots" && <HotspotsMap />}
          {activeTab === "drilldown" && <DistrictDrilldown />}
          {activeTab === "anomalies" && <AlertsPanel />}
          {activeTab === "cctv" && <CCTVPanel />}
          {activeTab === "network" && <NetworkGraph />}
          {activeTab === "offenders" && <OffenderTracker />}
          {activeTab === "socioeconomic" && <SocioEconomic />}
          {activeTab === "predictions" && <RiskScoring />}
          {activeTab === "evolution" && <EvolutionEngine />}
          {activeTab === "ai_assistant" && <AIAssistant />}
          {activeTab === "dataset" && <DatasetManager />}
        </main>
      </div>

    </div>
  );
}
