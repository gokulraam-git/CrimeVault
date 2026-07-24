import React, { useState, useEffect, useRef } from "react";
import { Video, VideoOff, Play, Pause, Camera, Wifi, Settings, AlertTriangle, RefreshCw, Zap, ShieldAlert, FileText, Trash2 } from "lucide-react";

export default function CCTVPanel() {
  const [streamUrl, setStreamUrl] = useState("");
  const [activeUrl, setActiveUrl] = useState("");
  const [status, setStatus] = useState("Simulated"); // Simulated, Connecting, Online, Error
  const [resolution, setResolution] = useState("SVGA"); // VGA, SVGA, UXGA
  const [flashLed, setFlashLed] = useState(false);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [fps, setFps] = useState(25);
  const [signalRssi, setSignalRssi] = useState(-62);
  const [motionDetection, setMotionDetection] = useState(true);
  const [motionSensitivity, setMotionSensitivity] = useState("Medium");
  const [logs, setLogs] = useState([
    { id: 1, time: "15:10:05", desc: "CCTV Core System initialized successfully." },
    { id: 2, time: "15:11:12", desc: "Security Protocol: Active surveillance loop started." },
    { id: 3, time: "15:12:45", desc: "Network: Connection established with Gateway IP." }
  ]);
  const [snapshots, setSnapshots] = useState([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);

  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const logsEndRef = useRef(null);

  // Dynamic FPS and RSSI fluctuation when active
  useEffect(() => {
    const timer = setInterval(() => {
      if (status === "Online" || status === "Simulated") {
        setFps((prev) => Math.max(22, Math.min(30, prev + (Math.random() > 0.5 ? 1 : -1))));
        setSignalRssi((prev) => Math.max(-80, Math.min(-50, prev + (Math.random() > 0.5 ? 2 : -2))));
      }
    }, 1500);
    return () => clearInterval(timer);
  }, [status]);

  // Scroll to bottom of logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Motion Detection Event Generator Simulation
  useEffect(() => {
    if (!motionDetection) return;

    const intervalVal = motionSensitivity === "High" ? 6000 : motionSensitivity === "Medium" ? 12000 : 20000;

    const timer = setInterval(() => {
      const sectors = ["Sector Alpha (Entrance)", "Sector Beta (Perimeter)", "Sector Gamma (Corridor)", "Sector Delta (Parking Lot)"];
      const sector = sectors[Math.floor(Math.random() * sectors.length)];
      
      const details = [
        "Unidentified movement detected near security boundary.",
        "Transient activity registered by optical difference scanner.",
        "Object group displacement flagged. Security classification pending.",
        "Thermal deviation threshold exceeded."
      ];
      const desc = details[Math.floor(Math.random() * details.length)];

      const now = new Date();
      const timeStr = now.toTimeString().split(" ")[0];

      setLogs((prev) => [
        ...prev,
        {
          id: Date.now(),
          time: timeStr,
          desc: `[ALERT] ${sector}: ${desc}`
        }
      ]);
    }, intervalVal);

    return () => clearInterval(timer);
  }, [motionDetection, motionSensitivity]);

  // Simulated Camera Stream Renderer on Canvas
  useEffect(() => {
    if (status !== "Simulated") {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    
    let frame = 0;
    
    // Simulating objects moving in the field of view
    const targets = [
      { x: 100, y: 150, radius: 25, vx: 1.2, vy: 0.8, label: "SUSPECT_A", score: 87.4 },
      { x: 450, y: 250, radius: 30, vx: -0.9, vy: 1.1, label: "VEHICLE", score: 92.1 }
    ];

    const render = () => {
      frame++;
      
      // Clear canvas with dark gray security screen background
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw grid lines
      ctx.strokeStyle = "rgba(6, 182, 212, 0.05)";
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw simulated moving targets
      targets.forEach((target) => {
        // Update positions
        target.x += target.vx;
        target.y += target.vy;

        // Bounce walls
        if (target.x - target.radius < 0 || target.x + target.radius > canvas.width) target.vx *= -1;
        if (target.y - target.radius < 0 || target.y + target.radius > canvas.height) target.vy *= -1;

        // Draw object visual representation
        ctx.fillStyle = "rgba(6, 182, 212, 0.15)";
        ctx.beginPath();
        ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw vector target frame
        ctx.strokeStyle = "#06b6d4";
        ctx.lineWidth = 1.5;
        const boxSize = target.radius * 2;
        ctx.strokeRect(target.x - target.radius, target.y - target.radius, boxSize, boxSize);

        // Draw corner brackets
        ctx.strokeStyle = "#22c55e";
        ctx.lineWidth = 2.5;
        const cornerLen = 8;
        const xL = target.x - target.radius;
        const yT = target.y - target.radius;
        
        // Top-Left corner
        ctx.beginPath();
        ctx.moveTo(xL, yT + cornerLen);
        ctx.lineTo(xL, yT);
        ctx.lineTo(xL + cornerLen, yT);
        ctx.stroke();

        // Top-Right corner
        ctx.beginPath();
        ctx.moveTo(xL + boxSize, yT + cornerLen);
        ctx.lineTo(xL + boxSize, yT);
        ctx.lineTo(xL + boxSize - cornerLen, yT);
        ctx.stroke();

        // Bottom-Left corner
        ctx.beginPath();
        ctx.moveTo(xL, yT + boxSize - cornerLen);
        ctx.lineTo(xL, yT + boxSize);
        ctx.lineTo(xL + cornerLen, yT + boxSize);
        ctx.stroke();

        // Bottom-Right corner
        ctx.beginPath();
        ctx.moveTo(xL + boxSize, yT + boxSize - cornerLen);
        ctx.lineTo(xL + boxSize, yT + boxSize);
        ctx.lineTo(xL + boxSize - cornerLen, yT + boxSize);
        ctx.stroke();

        // Target Text labels
        ctx.fillStyle = "#22c55e";
        ctx.font = "bold 9px monospace";
        ctx.fillText(`${target.label} [${target.score}%]`, target.x - target.radius, target.y - target.radius - 4);
      });

      // Draw camera crosshairs
      ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
      ctx.lineWidth = 1.5;
      const cSize = 20;
      const cX = canvas.width / 2;
      const cY = canvas.height / 2;
      
      ctx.beginPath();
      ctx.moveTo(cX - cSize, cY); ctx.lineTo(cX + cSize, cY);
      ctx.moveTo(cX, cY - cSize); ctx.lineTo(cX, cY + cSize);
      ctx.stroke();

      // Draw simulated camera static scanlines overlay
      ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
      for (let y = frame % 10; y < canvas.height; y += 10) {
        ctx.fillRect(0, y, canvas.width, 2);
      }

      // Draw HUD overlays: REC icon, time
      ctx.fillStyle = "#ef4444";
      if (Math.floor(frame / 20) % 2 === 0) {
        ctx.beginPath();
        ctx.arc(30, 30, 6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 11px monospace";
      ctx.fillText("REC LIVE", 45, 33);

      const now = new Date();
      const timeStr = now.toLocaleDateString() + " " + now.toTimeString().split(" ")[0];
      ctx.fillText(timeStr, canvas.width - 180, 33);
      ctx.fillText("CAM_ESP32_SURV_01", 30, canvas.height - 20);
      ctx.fillText(`RSSI: ${signalRssi} dBm | RES: ${resolution}`, canvas.width - 210, canvas.height - 20);

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [status, resolution, signalRssi]);

  const handleConnectStream = (e) => {
    e.preventDefault();
    if (!streamUrl) {
      setActiveUrl("");
      setStatus("Simulated");
      return;
    }

    setStatus("Connecting");
    
    let targetUrl = streamUrl.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = "http://" + targetUrl;
    }

    try {
      const parsed = new URL(targetUrl);
      if (!parsed.port && (parsed.pathname === "/" || parsed.pathname === "")) {
        targetUrl = `${parsed.protocol}//${parsed.hostname}:81/stream`;
      } else if (parsed.port === "80" && (parsed.pathname === "/" || parsed.pathname === "")) {
        targetUrl = `${parsed.protocol}//${parsed.hostname}:81/stream`;
      }
    } catch (err) {
      console.error("URL cleaning error:", err);
    }
    
    setTimeout(() => {
      setActiveUrl(targetUrl);
      setStatus("Online");
      
      const timeStr = new Date().toTimeString().split(" ")[0];
      setLogs((prev) => [
        ...prev,
        { id: Date.now(), time: timeStr, desc: `Network: Connecting stream target to: ${targetUrl}` }
      ]);
    }, 1500);
  };

  const handleTakeSnapshot = () => {
    const canvas = canvasRef.current;
    let imgData = "";

    if (status === "Simulated" && canvas) {
      imgData = canvas.toDataURL("image/jpeg");
    } else {
      // Mock snapshot placeholder for external video tag streams
      imgData = "https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=400&q=80";
    }

    const now = new Date();
    const timeStr = now.toTimeString().split(" ")[0];
    const newSnapshot = {
      id: Date.now(),
      time: timeStr,
      url: imgData,
      resolution: resolution,
      status: "Archived"
    };

    setSnapshots((prev) => [newSnapshot, ...prev]);
    setLogs((prev) => [
      ...prev,
      { id: Date.now(), time: timeStr, desc: `Camera: Snapshot saved to local archives.` }
    ]);
  };

  const handleDeleteSnapshot = (id, e) => {
    e.stopPropagation();
    setSnapshots((prev) => prev.filter((s) => s.id !== id));
    if (selectedSnapshot?.id === id) {
      setSelectedSnapshot(null);
    }
  };

  // Sync physical ESP32 flash LED trigger
  useEffect(() => {
    if ((status !== "Online" && status !== "Error") || !activeUrl) return;

    const timeStr = new Date().toTimeString().split(" ")[0];
    try {
      const parsed = new URL(activeUrl);
      const ledUrl = `${parsed.protocol}//${parsed.hostname}/led?state=${flashLed ? 1 : 0}`;
      
      setLogs((prev) => [
        ...prev,
        { id: Date.now(), time: timeStr, desc: `Camera Control: Sending LED state request to: ${ledUrl}` }
      ]);

      fetch(ledUrl, { mode: "no-cors" })
        .then(() => {
          setLogs((prev) => [
            ...prev,
            { id: Date.now(), time: timeStr, desc: `Camera Control: LED set to ${flashLed ? "ON" : "OFF"}` }
          ]);
        })
        .catch((err) => {
          setLogs((prev) => [
            ...prev,
            { id: Date.now(), time: timeStr, desc: `[ERROR] LED Control failed: ${err.message}` }
          ]);
        });
    } catch (e) {
      console.error("Error formatting LED control URL:", e);
    }
  }, [flashLed, activeUrl, status]);

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="pb-4 border-b border-white/10 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Video className="h-8 w-8 text-cyan-400 animate-pulse" />
            CCTV Surveillance
          </h1>
          <p className="text-gray-400 mt-1">
            Real-time feed streaming and target recognition HUD integrated with custom ESP32 camera gateways.
          </p>
        </div>
      </div>

      {/* Main Grid: Stream & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Stream Viewport Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glassmorphism rounded-xl border border-white/10 overflow-hidden bg-slate-950 flex flex-col">
            
            {/* Viewport Header */}
            <div className="p-3 bg-slate-900/80 border-b border-white/5 flex justify-between items-center text-xs">
              <span className="font-bold text-gray-300 flex items-center gap-2">
                <Wifi className={`h-4 w-4 ${status === "Online" ? "text-emerald-400" : status === "Connecting" ? "text-amber-400 animate-pulse" : "text-cyan-400"}`} />
                Stream Viewport: {status === "Online" ? "ESP32 CAM Stream" : "System Simulator"}
              </span>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  status === "Online" 
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                    : status === "Connecting" 
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                }`}>
                  {status}
                </span>
                {status === "Online" && (
                  <span className="text-[10px] text-gray-400 font-mono font-bold">
                    {fps} FPS | Latency: 48ms
                  </span>
                )}
              </div>
            </div>

            {/* Video Viewport Stream Container */}
            <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
              {status === "Simulated" ? (
                <canvas 
                  ref={canvasRef} 
                  width={640} 
                  height={360} 
                  className="w-full h-full object-cover transition-all duration-300"
                  style={{ transform: `rotate(${rotation}deg)` }}
                />
              ) : status === "Connecting" ? (
                <div className="flex flex-col items-center gap-3 text-gray-400">
                  <RefreshCw className="h-8 w-8 animate-spin text-cyan-400" />
                  <span className="text-xs font-bold font-mono tracking-widest uppercase">Connecting to ESP32 CAM stream...</span>
                </div>
              ) : (
                <div className="relative w-full h-full">
                  <img 
                    src={activeUrl} 
                    alt="ESP32 CAM Stream" 
                    className="w-full h-full object-contain animate-fade-in"
                    style={{ transform: `rotate(${rotation}deg)` }}
                    onLoad={() => {
                      if (status !== "Online") setStatus("Online");
                    }}
                    onError={() => {
                      if (status !== "Error") {
                        setStatus("Error");
                        const timeStr = new Date().toTimeString().split(" ")[0];
                        setLogs((prev) => [
                          ...prev,
                          { id: Date.now(), time: timeStr, desc: `[ERROR] Connection failed to stream endpoint: ${activeUrl}. Retrying...` }
                        ]);
                      }
                    }}
                  />
                  {status === "Error" && (
                    <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center gap-3 text-red-400 p-4 text-center">
                      <AlertTriangle className="h-10 w-10 text-red-500 animate-bounce" />
                      <div>
                        <p className="text-xs font-bold font-mono tracking-wider uppercase">Live Stream Connection Unstable</p>
                        <p className="text-3xs text-gray-400 mt-1 max-w-xs">
                          Could not connect to stream target. Ensure your ESP32-CAM is powered, on the same Wi-Fi subnet, and that CORS / mixed-content is permitted.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setStatus("Connecting");
                          try {
                            const urlObj = new URL(activeUrl);
                            urlObj.searchParams.set("_t", Date.now().toString());
                            setActiveUrl(urlObj.toString());
                          } catch (err) {
                            setActiveUrl(prev => prev.includes("?") ? `${prev}&_t=${Date.now()}` : `${prev}?_t=${Date.now()}`);
                          }
                          setTimeout(() => {
                            setStatus("Online");
                          }, 1000);
                        }}
                        className="px-3.5 py-1.5 bg-red-950/40 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-white rounded-lg text-2xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <RefreshCw className="h-3 w-3" /> Retry Stream Connection
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Overlay Stream control overlay buttons */}
              <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
                <button 
                  onClick={handleTakeSnapshot}
                  className="p-2 bg-slate-900/80 hover:bg-slate-900 border border-white/10 hover:border-white/20 text-white rounded-lg transition-all flex items-center gap-1.5 text-2xs font-bold cursor-pointer"
                  title="Capture snapshot frame"
                >
                  <Camera className="h-3.5 w-3.5" /> Snapshot
                </button>
              </div>
            </div>

            {/* Quick Controls Footer */}
            <div className="p-4 bg-slate-900/60 border-t border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">LED Light</span>
                <button 
                  onClick={() => setFlashLed(!flashLed)}
                  className={`w-full py-1.5 px-3 rounded-lg border text-2xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    flashLed 
                      ? "bg-amber-500/20 border-amber-500/30 text-amber-400" 
                      : "bg-slate-950 border-white/5 text-gray-400 hover:text-white"
                  }`}
                >
                  <Zap className="h-3.5 w-3.5" /> {flashLed ? "Flashlight ON" : "Flashlight OFF"}
                </button>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Resolution</span>
                <select 
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  className="w-full bg-slate-950 border border-white/5 text-gray-300 rounded-lg p-1.5 text-2xs focus:border-cyan-500 outline-none"
                >
                  <option value="VGA">VGA (640x480)</option>
                  <option value="SVGA">SVGA (800x600)</option>
                  <option value="UXGA">UXGA (1600x1200)</option>
                </select>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Stream Orientation</span>
                <button 
                  onClick={() => setRotation((prev) => (prev + 90) % 360)}
                  className="w-full py-1.5 px-3 bg-slate-950 border border-white/5 text-gray-400 hover:text-white hover:border-white/10 rounded-lg text-2xs font-bold transition-all flex items-center justify-center gap-1"
                >
                  Rotate {rotation}°
                </button>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Connection Channel</span>
                <button 
                  onClick={() => {
                    setStatus("Simulated");
                    setStreamUrl("");
                    setActiveUrl("");
                  }}
                  className="w-full py-1.5 px-3 bg-slate-950 border border-white/5 text-gray-400 hover:text-white hover:border-white/10 rounded-lg text-2xs font-bold transition-all flex items-center justify-center gap-1"
                >
                  Reset Simulator
                </button>
              </div>
            </div>

          </div>

          {/* Connection URL Input Box */}
          <div className="glassmorphism p-5 rounded-xl border border-white/10">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
              <Settings className="h-4 w-4 text-cyan-400" /> Gateway Stream Settings
            </h3>
            <form onSubmit={handleConnectStream} className="flex gap-3">
              <input 
                type="text" 
                placeholder="Enter ESP32-CAM stream URL (e.g., http://192.168.1.13:81/stream)"
                value={streamUrl}
                onChange={(e) => setStreamUrl(e.target.value)}
                className="flex-1 bg-slate-950/60 border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-gray-600 focus:border-cyan-500 outline-none"
              />
              <button 
                type="submit"
                className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-cyan-500/10"
              >
                <Play className="h-3.5 w-3.5" /> Connect Stream
              </button>
            </form>
            <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
              * Note: ESP32-CAM modules must be connected on the same network subnet gateway. For standard streams, type the endpoint IP followed by port 81 stream path.
            </p>
          </div>
        </div>

        {/* Sidebar Info Columns */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* Signal & Telemetry Stats Card */}
          <div className="glassmorphism p-5 rounded-xl border border-white/10 space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <Wifi className="h-4 w-4 text-cyan-400" /> Connection Telemetry
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-400 block font-medium">Gateway Node:</span>
                <p className="font-bold text-white text-sm mt-0.5">ESP32_SURV_01</p>
              </div>
              <div>
                <span className="text-gray-400 block font-medium">WiFi Signal RSSI:</span>
                <p className="font-bold text-emerald-400 text-sm mt-0.5">{status === "Online" || status === "Simulated" ? `${signalRssi} dBm` : "N/A"}</p>
              </div>
              <div>
                <span className="text-gray-400 block font-medium">Data Rate:</span>
                <p className="font-bold text-white text-sm mt-0.5">{status === "Online" ? "1.8 MB/s" : status === "Simulated" ? "Simulated" : "0.0 MB/s"}</p>
              </div>
              <div>
                <span className="text-gray-400 block font-medium">Stream Format:</span>
                <p className="font-bold text-white text-sm mt-0.5">MJPEG / HTTP</p>
              </div>
            </div>
          </div>

          {/* Smart Motion Detection Logs */}
          <div className="glassmorphism p-5 rounded-xl border border-white/10 flex flex-col justify-between h-[300px]">
            <div>
              <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 text-cyan-400 animate-pulse" /> Motion detection log
                </h3>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={motionDetection} 
                    onChange={(e) => setMotionDetection(e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-7 h-4 bg-slate-900 border border-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-gray-400 peer-checked:after:bg-cyan-400 after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-cyan-950/50 peer-checked:border-cyan-500/40"></div>
                </label>
              </div>

              {/* Sensitivity Settings */}
              {motionDetection && (
                <div className="mb-3 flex justify-between items-center text-3xs bg-slate-950/40 p-2 rounded-lg border border-white/5">
                  <span className="text-gray-400">Scan Sensitivity:</span>
                  <div className="flex items-center gap-1 text-white font-bold">
                    {["Low", "Medium", "High"].map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setMotionSensitivity(lvl)}
                        className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                          motionSensitivity === lvl ? "bg-cyan-500 text-slate-950 font-black" : "bg-white/5 hover:bg-white/10 text-gray-400"
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Event Logs feed container */}
              <div className="space-y-2 overflow-y-auto max-h-[160px] scrollbar-thin pr-1 text-3xs font-mono">
                {logs.map((log) => {
                  const isAlert = log.desc.includes("[ALERT]");
                  return (
                    <div 
                      key={log.id} 
                      className={`p-2 rounded border leading-relaxed ${
                        isAlert 
                          ? "bg-red-950/10 border-red-500/20 text-red-400" 
                          : "bg-slate-950/30 border-white/5 text-gray-400"
                      }`}
                    >
                      <span className="font-bold mr-1.5 text-white">[{log.time}]</span>
                      {log.desc.replace("[ALERT] ", "")}
                    </div>
                  );
                })}
                <div ref={logsEndRef} />
              </div>
            </div>

            <button 
              onClick={() => setLogs([])}
              className="mt-3 w-full py-1.5 bg-slate-900 border border-white/5 hover:border-white/10 text-gray-500 hover:text-white rounded-lg text-3xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
            >
              Clear Log Archives
            </button>
          </div>

          {/* Screenshot Archives Gallery */}
          <div className="glassmorphism p-5 rounded-xl border border-white/10 space-y-3.5 max-h-[220px] overflow-y-auto">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <Camera className="h-4 w-4 text-cyan-400" /> Captured snapshots
            </h4>
            
            {snapshots.length === 0 ? (
              <div className="p-4 bg-slate-950/40 rounded-lg border border-dashed border-white/5 text-center text-3xs text-gray-500">
                No snapshots captured in active session.
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {snapshots.map((snap) => (
                  <div 
                    key={snap.id} 
                    onClick={() => setSelectedSnapshot(snap)}
                    className="relative aspect-video rounded border border-white/10 overflow-hidden cursor-pointer group hover:border-cyan-500 transition-all bg-slate-950"
                  >
                    <img src={snap.url} alt="CCTV Snapshot" className="w-full h-full object-cover" />
                    <button 
                      onClick={(e) => handleDeleteSnapshot(snap.id, e)}
                      className="absolute top-1 right-1 p-0.5 bg-red-950/80 border border-red-500/30 text-red-400 rounded hover:bg-red-900 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none"
                    >
                      <Trash2 className="h-2 w-2" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Snapshot Preview Modal Dialog */}
      {selectedSnapshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="glassmorphism w-full max-w-2xl rounded-2xl border border-white/10 p-5 flex flex-col justify-between shadow-2xl relative animate-fade-in">
            <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-cyan-400" /> Captured Security Frame
                </h4>
                <p className="text-[10px] text-gray-400 mt-0.5">Timestamp: {selectedSnapshot.time} | Mode: {selectedSnapshot.resolution}</p>
              </div>
              <button 
                onClick={() => setSelectedSnapshot(null)}
                className="px-3 py-1.5 bg-slate-900 border border-white/10 text-gray-300 hover:text-white hover:border-white/20 rounded-lg text-3xs font-bold transition-all cursor-pointer"
              >
                Close View
              </button>
            </div>
            <div className="aspect-video bg-black rounded-lg overflow-hidden border border-white/5 relative">
              <img src={selectedSnapshot.url} alt="Expanded snapshot" className="w-full h-full object-contain" />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
