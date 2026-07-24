import React, { useState, useEffect, useRef } from "react";
import { 
  Bot, Send, Mic, MicOff, Volume2, VolumeX, FileDown, Languages, 
  UserCheck, ShieldAlert, Sparkles, Brain, Wand2, Calendar, MapPin 
} from "lucide-react";
import { jsPDF } from "jspdf";

export default function AIAssistant() {
  const [lang, setLang] = useState("en");
  const [chatInput, setChatInput] = useState("");
  const [offenders, setOffenders] = useState([]);
  const [selectedOffenderId, setSelectedOffenderId] = useState("");
  const [loadingOffenders, setLoadingOffenders] = useState(true);
  const [isTtsEnabled, setIsTtsEnabled] = useState(false);
  
  const [messages, setMessages] = useState([
    { sender: "ai", text: "Clearance confirmed. CrimeVault Tactical Assistant is online. Ask me about suspect risk evolution paths, gang networks, or hotspot anomalies." }
  ]);
  
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isVisualizing, setIsVisualizing] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  
  const chatEndRef = useRef(null);

  const assistantLangs = {
    en: {
      title: "CrimeVault Tactical Assistant",
      subtitle: "Tactical NLP engine, automated profile reports, multilanguage support, and speech control.",
      welcome: "Clearance confirmed. CrimeVault Tactical Assistant is online. Ask me about suspect risk evolution paths, gang networks, or hotspot anomalies.",
      placeholder: "Ask me: 'Explain Karthik's risk evolution'...",
      selectSuspect: "Select Suspect Dossier",
      dashboardWalkthrough: "Dashboard explanation",
      profileDossier: "Psychological profile",
      evolutionExplanation: "Explain crime evolution",
      generatePdf: "Generate pdf / download",
      listenBtn: "Dictate voice input",
      speakBtn: "Listen to response",
      stopBtn: "Mute voice",
      generating: "Compiling dossier...",
      ready: "Report ready",
      voiceActive: "Voice Active",
      ttsLabel: "Vocal Reader",
      quickHeader: "Tactical Assistants"
    },
    ta: {
      title: "CrimeDNA AI உத்தி உதவியாளர்",
      subtitle: "உண்நேர விசாரணை பகுப்பாய்வு, தானியங்கி அறிக்கை பதிவிறக்கம் மற்றும் குரல் கட்டளை கண்காணிப்பு.",
      welcome: "விசாரணை அனுமதி உறுதி செய்யப்பட்டது. சந்தேகம் உள்ளவர்கள் அல்லது அவர்களது குற்றப் பரிணாமம் பற்றி கேளுங்கள்.",
      placeholder: "உதவியாளரிடம் கேளுங்கள்: 'கார்த்திக் குற்றப் பரிணாமம் விளக்கு'...",
      selectSuspect: "சந்தேக நபர் விவரம் தேர்வு",
      dashboardWalkthrough: "டாஷ்போர்டு வழிகாட்டி",
      profileDossier: "உளவியல் பகுப்பாய்வு",
      evolutionExplanation: "குற்ற பரிணாம விளக்கம்",
      generatePdf: "PDF அறிக்கை உருவாக்கு",
      listenBtn: "குரல் உள்ளீடு",
      speakBtn: "குரல் ஒலி",
      stopBtn: "முடக்கு",
      generating: "அறிக்கை உருவாக்கப்படுகிறது...",
      ready: "பதிவிறக்க தயாராக உள்ளது",
      voiceActive: "குரல் ஒலிக்கிறது",
      ttsLabel: "குரல் ரீடர்",
      quickHeader: "உதவி கருவிகள்"
    },
    hi: {
      title: "CrimeDNA AI सामरिक सहायक",
      subtitle: "वास्तविक समय जांच विश्लेषण, स्वचालित रिपोर्ट पीढ़ी और आवाज कमांड ट्रैकिंग।",
      welcome: "सुरक्षा अनुमति की पुष्टि की गई। संदिग्ध या जोखिम विकास के बारे में प्रश्न पूछें।",
      placeholder: "सहायक से पूछें: 'कार्तिक के अपराध विकास की व्याख्या करें'...",
      selectSuspect: "संदिग्ध प्रोफ़ाइल चुनें",
      dashboardWalkthrough: "डैशबोर्ड गाइड",
      profileDossier: "मनोवैज्ञानिक विश्लेषण",
      evolutionExplanation: "अपराध विकास व्याख्या",
      generatePdf: "PDF रिपोर्ट उत्पन्न करें",
      listenBtn: "आवाज इनपुट",
      speakBtn: "आवाज सुनें",
      stopBtn: "म्यूट करें",
      generating: "रिपोर्ट बनाई जा रही है...",
      ready: "डाउनलोड के लिए तैयार",
      voiceActive: "आवाज चालू है",
      ttsLabel: "वॉयस रीडर",
      quickHeader: "त्वरित सहायता"
    },
    kn: {
      title: "CrimeDNA AI ತಾಂತ್ರಿಕ ಸಹಾಯಕ",
      subtitle: "ನೈಜ-ಸಮಯದ ಪ್ರಶ್ನೆ ಪ್ರಕ್ರಿಯೆ, ತಾಂತ್ರಿಕ ಬುದ್ಧಿವಂತಿಕೆ ಮತ್ತು PDF ವರದಿ ಡೌನ್‌ಲೋಡ್.",
      welcome: "ಭದ್ರತಾ ಒಪ್ಪಿಗೆ ದೃಢೀಕರಿಸಲಾಗಿದೆ. ಶಂಕಿತರ ಬಗ್ಗೆ ಅಥವಾ ಅವರ ಕ್ರಿಮಿನಲ್ ವಿಕಸನದ ಬಗ್ಗೆ ಕೇಳಿ.",
      placeholder: "ಸಹಾಯಕರನ್ನು ಕೇಳಿ: 'ಕಾರ್ತಿಕ್ ಅಪರಾಧ ವಿಕಸನ ವಿವರಿಸಿ'...",
      selectSuspect: "ಶಂಕಿತರ ವಿವರ ಆಯ್ಕೆಮಾಡಿ",
      dashboardWalkthrough: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಮಾರ್ಗದರ್ಶಿ",
      profileDossier: "ಮನೋವೈಜ್ಞಾನಿಕ ವಿಶ್ಲೇಷಣೆ",
      evolutionExplanation: "ಕ್ರಿಮಿನಲ್ ವಿಕಸನ ವಿವರಣೆ",
      generatePdf: "PDF ವರದಿ ರಚಿಸಿ",
      listenBtn: "ಧ್ವನಿ ಇನ್‌ಪುಟ್",
      speakBtn: "ಧ್ವನಿ ಓದುಗ",
      stopBtn: "ಮ್ಯೂಟ್ ಮಾಡಿ",
      generating: "ವರದಿ ತಯಾರಿಸಲಾಗುತ್ತಿದೆ...",
      ready: "ಡೌನ್‌ಲೋಡ್ ಮಾಡಲು ಸಿದ್ಧವಾಗಿದೆ",
      voiceActive: "ಧ್ವನಿ ಸಕ್ರಿಯವಾಗಿದೆ",
      ttsLabel: "ಧ್ವನಿ ಓದುಗ",
      quickHeader: "ತ್ವರಿತ ಸಹಾಯ"
    }
  };

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load active repeat offenders for selector
  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/offenders")
      .then((res) => res.json())
      .then((data) => {
        setOffenders(data);
        setLoadingOffenders(false);
      })
      .catch((err) => {
        console.error("Error loading offenders for assistant selector:", err);
        setLoadingOffenders(false);
      });
  }, []);

  // Update welcome message on language switch
  useEffect(() => {
    setMessages([
      { sender: "ai", text: assistantLangs[lang].welcome }
    ]);
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [lang]);

  const handleSendQuery = async (customText) => {
    const query = customText || chatInput.trim();
    if (!query) return;

    if (!customText) {
      setChatInput("");
    }

    // Add user message
    setMessages((prev) => [...prev, { sender: "user", text: query }]);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          language: lang,
          offender_id: selectedOffenderId ? parseInt(selectedOffenderId) : null
        })
      });

      if (!response.ok) throw new Error("Failed to process query");
      const data = await response.json();

      setMessages((prev) => [...prev, { sender: "ai", text: data.reply }]);

      // Trigger automatic TTS if enabled
      if (isTtsEnabled && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(data.reply);
        utter.lang = lang === "ta" ? "ta-IN" : lang === "hi" ? "hi-IN" : lang === "kn" ? "kn-IN" : "en-US";
        utter.onstart = () => setIsSpeaking(true);
        utter.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utter);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { sender: "ai", text: "Connection error: Unable to connect to CrimeDNA AI core backend." }]);
    }
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // Simulate input fallback
      setIsListening(true);
      setIsVisualizing(true);
      setTimeout(() => {
        setIsListening(false);
        setIsVisualizing(false);
        const activeOffender = offenders.find(o => o.id.toString() === selectedOffenderId);
        const name = activeOffender ? activeOffender.name : "Karthik";
        const queryText = `Show psychological dossier profile for ${name}`;
        handleSendQuery(queryText);
      }, 2200);
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.lang = lang === "ta" ? "ta-IN" : lang === "hi" ? "hi-IN" : lang === "kn" ? "kn-IN" : "en-US";
      rec.onstart = () => {
        setIsListening(true);
        setIsVisualizing(true);
      };
      rec.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        handleSendQuery(transcript);
      };
      rec.onend = () => {
        setIsListening(false);
        setIsVisualizing(false);
      };
      rec.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
      setIsVisualizing(false);
    }
  };

  const toggleSpeechReader = () => {
    const lastAiMsg = [...messages].reverse().find(m => m.sender === "ai");
    if (!lastAiMsg) return;

    if (isSpeaking) {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
    } else {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(lastAiMsg.text);
        utter.lang = lang === "ta" ? "ta-IN" : lang === "hi" ? "hi-IN" : lang === "kn" ? "kn-IN" : "en-US";
        utter.onstart = () => setIsSpeaking(true);
        utter.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utter);
      }
    }
  };

  const handleGeneratePDF = () => {
    const offender = offenders.find(o => o.id.toString() === selectedOffenderId);
    if (!offender) return;

    setIsGeneratingReport(true);
    setTimeout(() => {
      setIsGeneratingReport(false);
      
      const doc = new jsPDF();
      
      // ================= PAGE 1 =================
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(1);
      doc.rect(5, 5, 200, 287);
      doc.rect(7, 7, 196, 283);
      
      // Header
      doc.setFont("courier", "bold");
      doc.setFontSize(16);
      doc.text("KARNATAKA POLICE DEPARTMENT", 105, 20, { align: "center" });
      doc.setFontSize(11);
      doc.setFont("courier", "normal");
      doc.text("CRIMEVAULT INTELLIGENCE TACTICAL DOSSIER REPORT", 105, 26, { align: "center" });
      doc.line(15, 32, 195, 32);
      
      // Photo Placeholder Box
      doc.rect(145, 42, 45, 50);
      doc.setFontSize(7);
      doc.setFont("courier", "bold");
      doc.text("SUSPECT PHOTO RECORD", 167.5, 62, { align: "center" });
      doc.text("SECURE BINARY FILE", 167.5, 68, { align: "center" });
      doc.text(`#CDN-${offender.id.toString().padStart(4, "0")}`, 167.5, 74, { align: "center" });
      
      // Offender Details
      doc.setFont("courier", "bold");
      doc.setFontSize(10);
      doc.text(`SUSPECT NAME:      ${offender.name.toUpperCase()}`, 15, 45);
      doc.text(`ALIAS / HANDLE:    "${(offender.alias || offender.primary_alias || "NONE").toUpperCase()}"`, 15, 52);
      doc.text(`PROFILE DOSSIER ID: #CDN-${offender.id.toString().padStart(4, "0")}`, 15, 59);
      doc.text(`AGE / GENDER:       ${offender.age} YEARS / MALE`, 15, 66);
      doc.text(`ACTIVE STATUS:      ${offender.status.toUpperCase()}`, 15, 73);
      
      // Dynamic personal info
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
      const street = streetNames[(offender.id * 13) % streetNames.length];
      const area = areas[(offender.id * 17) % areas.length];
      const doorNo = (offender.id * 23) % 450 + 1;
      const mockAddress = `Door No. ${doorNo}, ${street}, ${area}, Bangalore`;
      
      const phoneSuffix = (103417 + offender.id * 7823) % 900000 + 100000;
      const mockPhone = `+91 9840${phoneSuffix}`;
      
      doc.text(`PHONE NUMBER:       ${mockPhone}`, 15, 80);
      
      const splitAddress = doc.splitTextToSize(`ADDRESS:            ${mockAddress}`, 120);
      doc.text(splitAddress, 15, 87);
      
      // Line divider
      doc.line(15, 100, 195, 100);
      
      // Risk metrics section
      doc.setFont("courier", "bold");
      doc.text("SECURITY ASSESSMENT & RECIDIVISM SCORING", 15, 108);
      doc.line(15, 112, 195, 112);
      
      doc.setFont("courier", "normal");
      doc.text(`RECIDIVISM SCORE:       ${offender.recidivism_score}%`, 15, 120);
      doc.text(`SECURITY RISK RATING:   ${offender.risk_score}/100`, 15, 127);
      
      const isRepeat = offender.history_count > 1;
      doc.text(`CLASSIFICATION:         ${isRepeat ? "CONFIRMED REPEAT OFFENDER" : "FIRST-TIME OFFENDER"}`, 15, 134);
      
      // Accomplices lookup
      const getAccomplices = (name) => {
        if (name.includes("Karthik")) return "Suresh Kumar (Suri), Selvam (Wire Selvam)";
        if (name.includes("Suresh")) return "Karthik (Racer Karthik), Selvam (Wire Selvam)";
        if (name.includes("Selvam")) return "Karthik (Racer Karthik), Suresh Kumar (Suri)";
        if (name.includes("Ranganathan")) return "Mohammed Bilal (Bilal), Vijay (T. Nagar Viji)";
        if (name.includes("Bilal")) return "Ranganathan (Ranga), Stephen (Steve)";
        if (name.includes("Senthil")) return "Hari (Hari Box), Saravanan (Saro)";
        if (name.includes("Madan")) return "Subash (Babu), Ravichandran (Ravi)";
        return "No specific co-offenders logged in database";
      };
      
      const accompliceList = getAccomplices(offender.name);
      const splitAccomplices = doc.splitTextToSize(`ASSOCIATED NETWORK:     ${accompliceList}`, 170);
      doc.text(splitAccomplices, 15, 141);
      
      // Section divider
      doc.line(15, 158, 195, 158);
      doc.setFont("courier", "bold");
      doc.text("CRIMINAL BEHAVIOR & EVOLUTION PATHWAY", 15, 166);
      doc.line(15, 170, 195, 170);
      
      // Evolution metrics
      doc.setFont("courier", "normal");
      const sortedHistory = [...offender.crime_history].sort((a, b) => new Date(a.date) - new Date(b.date));
      const initialStage = sortedHistory[0]?.category || "N/A";
      const currentStage = sortedHistory[sortedHistory.length - 1]?.category || "N/A";
      
      doc.text(`INITIAL INCIDENT STAGE: ${initialStage.toUpperCase()}`, 15, 178);
      doc.text(`CURRENT ESCALATED STAGE: ${currentStage.toUpperCase()}`, 15, 185);
      
      const evolutionSummary = `${offender.name} first appeared in law enforcement logs at the "${initialStage}" stage. Over the course of ${offender.history_count} incidents, their profile has escalated to the "${currentStage}" stage, showing increased severity indices and syndicate coordination affinity.`;
      const splitEvolutionSummary = doc.splitTextToSize(evolutionSummary, 170);
      doc.text(splitEvolutionSummary, 15, 192);
      
      // Line separator
      doc.line(15, 230, 195, 230);
      doc.setFont("courier", "bold");
      doc.text("RECOMMENDED TACTICAL ACTIONS:", 15, 238);
      doc.setFont("courier", "normal");
      const actionText = "1. Restrict geographic transit borders near suspected target hubs in Bangalore.\n2. Coordinate physical monitoring with the targeted task force division.\n3. Keep wire communication links under active surveillance.";
      const splitAction = doc.splitTextToSize(actionText, 170);
      doc.text(splitAction, 15, 245);
      
      // Page 1 Footer
      doc.line(15, 265, 195, 265);
      doc.setFont("courier", "bold");
      doc.setFontSize(8);
      doc.text("CONFIDENTIAL LAW ENFORCEMENT INTERNAL USE ONLY", 105, 272, { align: "center" });
      doc.text("GENERATED VIA CRIMEVAULT PLATFORM - PAGE 1 OF 2", 105, 277, { align: "center" });
      
      // ================= PAGE 2 =================
      doc.addPage();
      
      // Draw outer double borders on Page 2
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(1);
      doc.rect(5, 5, 200, 287);
      doc.rect(7, 7, 196, 283);
      
      // Header Page 2
      doc.setFont("courier", "bold");
      doc.setFontSize(14);
      doc.text("SUSPECT INCIDENT HISTORY SEQUENCE PATHWAY LOG", 105, 20, { align: "center" });
      doc.setFontSize(9);
      doc.setFont("courier", "normal");
      doc.text(`SUSPECT: ${offender.name.toUpperCase()} (ID: #CDN-${offender.id})`, 105, 25, { align: "center" });
      doc.line(15, 30, 195, 30);
      
      // Crime Timeline Grid
      doc.setFont("courier", "bold");
      doc.text("DATE", 15, 37);
      doc.text("CATEGORY", 45, 37);
      doc.text("LOCATION", 95, 37);
      doc.text("SEVERITY", 135, 37);
      doc.text("DESCRIPTION / STATUS", 155, 37);
      doc.line(15, 40, 195, 40);
      
      let y = 46;
      doc.setFont("courier", "normal");
      doc.setFontSize(8);
      if (offender.crime_history && offender.crime_history.length > 0) {
        offender.crime_history.forEach((crime) => {
          if (y < 250) {
            doc.text(crime.date, 15, y);
            doc.text(crime.category, 45, y);
            doc.text(crime.district, 95, y);
            doc.text(`${crime.severity}/10`, 135, y);
            
            // Description split
            const desc = crime.description || "No detailed logs";
            const splitDesc = doc.splitTextToSize(desc, 38);
            doc.text(splitDesc, 155, y);
            
            // Compute spacing based on description length
            const lines = splitDesc.length;
            y += Math.max(7, lines * 4.5);
          }
        });
      } else {
        doc.text("No historical records in SQLite database node.", 15, y);
      }
      
      // Page 2 Footer
      doc.line(15, 265, 195, 265);
      doc.setFont("courier", "bold");
      doc.setFontSize(8);
      doc.text("CONFIDENTIAL LAW ENFORCEMENT INTERNAL USE ONLY", 105, 272, { align: "center" });
      doc.text("GENERATED VIA CRIMEDNA AI PLATFORM - PAGE 2 OF 2", 105, 277, { align: "center" });
      
      // Save report
      doc.save(`Tactical_Dossier_CDN_${offender.id}.pdf`);
    }, 1200);
  };

  const activeOffender = offenders.find(o => o.id.toString() === selectedOffenderId);

  return (
    <div className="space-y-6">
      
      {/* Overview stats header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-400 bg-clip-text text-transparent">
            {assistantLangs[lang].title}
          </h1>
          <p className="text-gray-400 mt-1">{assistantLangs[lang].subtitle}</p>
        </div>
        
        {/* Language selectors */}
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-lg border border-white/10 shrink-0 shadow-lg">
          <span className="text-[10px] uppercase font-bold text-gray-400 px-2 flex items-center gap-1">
            <Languages className="h-3 w-3" /> Lang:
          </span>
          <button 
            onClick={() => setLang("en")} 
            className={`px-2.5 py-1 rounded text-2xs font-extrabold transition-all uppercase ${lang === "en" ? "bg-cyan-500/20 border border-cyan-500/30 text-white" : "text-gray-400 hover:text-white"}`}
          >
            EN
          </button>
          <button 
            onClick={() => setLang("ta")} 
            className={`px-2.5 py-1 rounded text-2xs font-extrabold transition-all uppercase ${lang === "ta" ? "bg-cyan-500/20 border border-cyan-500/30 text-white" : "text-gray-400 hover:text-white"}`}
          >
            தமிழ்
          </button>
          <button 
            onClick={() => setLang("hi")} 
            className={`px-2.5 py-1 rounded text-2xs font-extrabold transition-all uppercase ${lang === "hi" ? "bg-cyan-500/20 border border-cyan-500/30 text-white" : "text-gray-400 hover:text-white"}`}
          >
            हिंदी
          </button>
          <button 
            onClick={() => setLang("kn")} 
            className={`px-2.5 py-1 rounded text-2xs font-extrabold transition-all uppercase ${lang === "kn" ? "bg-cyan-500/20 border border-cyan-500/30 text-white" : "text-gray-400 hover:text-white"}`}
          >
            ಕನ್ನಡ
          </button>
        </div>
      </div>

      {/* Main interactive assistant grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chat window panel (2 cols) */}
        <div className="lg:col-span-2 flex flex-col justify-between h-[520px] bg-[#070b13]/85 rounded-xl border border-white/10 overflow-hidden shadow-2xl relative">
          
          {/* Messages block */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-xl p-3.5 text-xs leading-relaxed shadow-md ${
                  m.sender === "user" 
                    ? "bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 rounded-tr-none" 
                    : "bg-slate-900/90 border border-white/5 text-gray-300 rounded-tl-none"
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Action Input form */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendQuery(); }}
            className="p-4 border-t border-white/5 bg-slate-950/90 flex gap-2.5 items-center"
          >
            <button 
              type="button"
              onClick={handleVoiceInput}
              className={`p-3 rounded-lg border transition-all shrink-0 cursor-pointer ${
                isListening 
                  ? "bg-red-500/20 border-red-500/40 text-red-400 animate-pulse" 
                  : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
              }`}
              title={assistantLangs[lang].listenBtn}
            >
              {isListening ? <MicOff className="h-4.5 w-4.5" /> : <Mic className="h-4.5 w-4.5" />}
            </button>

            <input 
              type="text" 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={assistantLangs[lang].placeholder}
              className="flex-grow bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/25"
            />

            <button 
              type="submit"
              className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 transition-all shrink-0 cursor-pointer"
            >
              <Send className="h-4.5 w-4.5" />
            </button>
          </form>
        </div>

        {/* Sidebar commands and suspect context mapping (1 col) */}
        <div className="lg:col-span-1 flex flex-col justify-between h-[520px] glassmorphism p-5 rounded-xl border border-white/10 shadow-2xl">
          <div className="space-y-4 overflow-hidden flex flex-col h-full justify-between pb-1">
            
            {/* Suspect target binding dropdown */}
            <div className="space-y-1.5 shrink-0">
              <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
                {assistantLangs[lang].selectSuspect}
              </label>
              <select 
                value={selectedOffenderId}
                onChange={(e) => setSelectedOffenderId(e.target.value)}
                className="w-full bg-[#080d16] border border-white/10 rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-500/40"
              >
                <option value="">-- No Suspect Selected --</option>
                {offenders.map(o => (
                  <option key={o.id} value={o.id}>{o.name} ({o.alias || o.primary_alias})</option>
                ))}
              </select>
            </div>

            {/* Quick action buttons (scrollable wrapper) */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2 mt-2 pt-2 border-t border-white/5 scrollbar-thin">
              <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400 block pb-1 sticky top-0 bg-[#0c1220] z-10">
                {assistantLangs[lang].quickHeader}
              </span>

              {/* Suspect-specific contextual buttons */}
              {activeOffender ? (
                <div className="space-y-2">
                  <button 
                    type="button"
                    onClick={() => handleSendQuery(`Show psychological profile for ${activeOffender.name}`)}
                    className="w-full text-left px-3 py-2 bg-cyan-950/25 border border-cyan-500/20 rounded-lg text-[10px] text-cyan-300 font-bold hover:bg-cyan-500/20 hover:text-white transition-all flex items-center justify-between cursor-pointer"
                  >
                    <span>Psychological profile: {activeOffender.name}</span>
                    <Brain className="h-3 w-3 text-cyan-400 shrink-0" />
                  </button>

                  <button 
                    type="button"
                    onClick={() => handleSendQuery(`Show crime evolution progression for ${activeOffender.name}`)}
                    className="w-full text-left px-3 py-2 bg-cyan-950/25 border border-cyan-500/20 rounded-lg text-[10px] text-cyan-300 font-bold hover:bg-cyan-500/20 hover:text-white transition-all flex items-center justify-between cursor-pointer"
                  >
                    <span>Explain crime evolution: {activeOffender.name}</span>
                    <Sparkles className="h-3 w-3 text-cyan-400 shrink-0" />
                  </button>

                  <button 
                    type="button"
                    onClick={() => handleSendQuery(`Show accomplice relationships for ${activeOffender.name}`)}
                    className="w-full text-left px-3 py-2 bg-cyan-950/25 border border-cyan-500/20 rounded-lg text-[10px] text-cyan-300 font-bold hover:bg-cyan-500/20 hover:text-white transition-all flex items-center justify-between cursor-pointer"
                  >
                    <span>List close accomplices: {activeOffender.name}</span>
                    <UserCheck className="h-3 w-3 text-cyan-400 shrink-0" />
                  </button>

                  <button 
                    type="button"
                    onClick={() => handleSendQuery(`Is ${activeOffender.name} a repeat offender?`)}
                    className="w-full text-left px-3 py-2 bg-cyan-950/25 border border-cyan-500/20 rounded-lg text-[10px] text-cyan-300 font-bold hover:bg-cyan-500/20 hover:text-white transition-all flex items-center justify-between cursor-pointer"
                  >
                    <span>Is repeat offender: {activeOffender.name}</span>
                    <ShieldAlert className="h-3 w-3 text-cyan-400 shrink-0" />
                  </button>

                  <button 
                    type="button"
                    onClick={() => handleSendQuery(`Show current crime stage for ${activeOffender.name}`)}
                    className="w-full text-left px-3 py-2 bg-cyan-950/25 border border-cyan-500/20 rounded-lg text-[10px] text-cyan-300 font-bold hover:bg-cyan-500/20 hover:text-white transition-all flex items-center justify-between cursor-pointer"
                  >
                    <span>Show current stage: {activeOffender.name}</span>
                    <MapPin className="h-3 w-3 text-cyan-400 shrink-0" />
                  </button>

                  <button 
                    type="button"
                    onClick={() => handleSendQuery(`Show past crime stages for ${activeOffender.name}`)}
                    className="w-full text-left px-3 py-2 bg-cyan-950/25 border border-cyan-500/20 rounded-lg text-[10px] text-cyan-300 font-bold hover:bg-cyan-500/20 hover:text-white transition-all flex items-center justify-between cursor-pointer"
                  >
                    <span>Show past stages: {activeOffender.name}</span>
                    <Calendar className="h-3 w-3 text-cyan-400 shrink-0" />
                  </button>

                  <button 
                    type="button"
                    onClick={() => handleSendQuery(`Show personal contacts and address for ${activeOffender.name}`)}
                    className="w-full text-left px-3 py-2 bg-cyan-950/25 border border-cyan-500/20 rounded-lg text-[10px] text-cyan-300 font-bold hover:bg-cyan-500/20 hover:text-white transition-all flex items-center justify-between cursor-pointer"
                  >
                    <span>Personal details & contacts: {activeOffender.name}</span>
                    <Bot className="h-3 w-3 text-cyan-400 shrink-0" />
                  </button>
                </div>
              ) : (
                <div className="text-[10px] text-gray-500 italic p-3 text-center border border-white/5 rounded-lg bg-white/5">
                  Select a suspect profile from the dropdown to access contextual actions.
                </div>
              )}
            </div>

            {/* Vocal reading controls */}
            <div className="pt-3 border-t border-white/5 flex flex-col gap-2 shrink-0">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <button 
                    type="button"
                    onClick={toggleSpeechReader}
                    className={`p-2 rounded-lg border transition-all cursor-pointer ${
                      isSpeaking 
                        ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-400 animate-pulse shadow-md" 
                        : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
                    }`}
                    title={isSpeaking ? assistantLangs[lang].stopBtn : assistantLangs[lang].speakBtn}
                  >
                    {isSpeaking ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                  </button>
                  <div>
                    <span className="text-[9px] font-extrabold text-gray-400 uppercase block leading-none">
                      {assistantLangs[lang].ttsLabel}
                    </span>
                    <span className="text-[8px] text-gray-500 mt-0.5 block">
                      {isSpeaking ? assistantLangs[lang].voiceActive : "Voice synthesis reader"}
                    </span>
                  </div>
                </div>

                {/* Pulse waves */}
                {isVisualizing || isSpeaking ? (
                  <div className="flex items-end gap-0.5 h-4 shrink-0">
                    <span className="w-0.5 bg-cyan-400 rounded animate-[bounce_0.8s_infinite] h-2"></span>
                    <span className="w-0.5 bg-cyan-400 rounded animate-[bounce_1.1s_infinite] h-3.5"></span>
                    <span className="w-0.5 bg-cyan-400 rounded animate-[bounce_0.6s_infinite] h-1.5"></span>
                    <span className="w-0.5 bg-cyan-400 rounded animate-[bounce_0.9s_infinite] h-3"></span>
                  </div>
                ) : (
                  <div className="flex items-end gap-0.5 h-4 opacity-20 shrink-0">
                    <span className="w-0.5 bg-cyan-400 rounded h-1"></span>
                    <span className="w-0.5 bg-cyan-400 rounded h-1"></span>
                    <span className="w-0.5 bg-cyan-400 rounded h-1"></span>
                    <span className="w-0.5 bg-cyan-400 rounded h-1"></span>
                  </div>
                )}
              </div>

              {/* Auto Vocal Reader Toggle Switch */}
              <div className="flex items-center justify-between p-1.5 bg-slate-950/40 border border-white/5 rounded-lg">
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Auto Vocal Reader</span>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={isTtsEnabled} 
                    onChange={(e) => setIsTtsEnabled(e.target.checked)} 
                    className="sr-only peer"
                  />
                  <div className="w-7 h-4 bg-slate-900 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 peer-checked:after:bg-cyan-400 after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-cyan-950 border border-white/10 peer-checked:border-cyan-500/30"></div>
                </label>
              </div>
            </div>

            {/* PDF exporter button */}
            <button 
              onClick={handleGeneratePDF}
              disabled={isGeneratingReport || !selectedOffenderId}
              className="w-full py-2.5 mt-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-extrabold uppercase text-[9px] tracking-wider hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-30 rounded-lg cursor-pointer shrink-0"
            >
              <FileDown className="h-3.5 w-3.5" />
              {isGeneratingReport ? assistantLangs[lang].generating : assistantLangs[lang].generatePdf}
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
