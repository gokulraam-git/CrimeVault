import React, { useState } from "react";
import { FileUp, Info, CheckCircle2, AlertCircle, RefreshCw, FileText, Database } from "lucide-react";

export default function DatasetManager() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file) => {
    const name = file.name.toLowerCase();
    if (name.endsWith(".csv") || name.endsWith(".xls") || name.endsWith(".xlsx")) {
      setSelectedFile(file);
      setErrorMsg("");
      setUploadResult(null);
      setRestoreSuccess(false);
    } else {
      setErrorMsg("Security Validation: Only .csv, .xls, or .xlsx files are supported.");
      setSelectedFile(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setErrorMsg("");
    setUploadResult(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/dataset/import", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Upload analysis failed.");
      }

      const data = await response.json();
      setUploadResult(data);
      setSelectedFile(null);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Unable to upload dataset. Check backend connection.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRestoreDefault = async () => {
    setIsRestoring(true);
    setRestoreSuccess(false);
    setErrorMsg("");
    setUploadResult(null);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/admin/seed", {
        method: "POST"
      });
      if (!response.ok) throw new Error("Restoration failed.");
      setRestoreSuccess(true);
    } catch (err) {
      console.error(err);
      setErrorMsg("Error: Failed to restore default seed dataset.");
    } finally {
      setIsRestoring(false);
    }
  };

  const downloadSampleTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "title,category,description,date,latitude,longitude,district,severity,status,suspect_name,suspect_alias,suspect_age,suspect_risk_score\n"
      + "Vehicle Theft Incident,Vehicle Theft,Suspect stolen motorcycle at bazaar,2026-07-10 14:30:00,12.9352,77.6244,Koramangala,7,Arrested,Karthik,Racer Karthik,28,82.4\n"
      + "Housebreaking Report,Burglary,Entry via back window of empty home,2026-07-12 03:15:00,12.9698,77.7500,Whitefield,6,Under Investigation,Suresh Kumar,Suri,34,68.9\n"
      + "Syndicate Cash Transaction,Money Laundering,Suspicious money mule operations,2026-07-15 11:00:00,12.9308,77.5838,Jayanagar,9,Under Investigation,Karthik,Racer Karthik,28,82.4\n";
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "crimevault_sample_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-400 bg-clip-text text-transparent">
          Dataset Manager
        </h1>
        <p className="text-gray-400 mt-1">Import new law enforcement datasets to completely analyze and dynamically update platform states.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Drag and Drop Box */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glassmorphism p-6 rounded-2xl border border-white/10 relative overflow-hidden">
            <h2 className="text-base font-extrabold text-white mb-4 flex items-center gap-2">
              <FileUp className="h-5 w-5 text-cyan-400" /> Upload File (.csv, .xls, .xlsx)
            </h2>

            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                dragActive 
                  ? "border-cyan-500 bg-cyan-500/10 scale-[0.99]" 
                  : selectedFile 
                    ? "border-emerald-500/50 bg-emerald-500/5" 
                    : "border-white/10 hover:border-white/20 bg-slate-950/20"
              }`}
            >
              <input 
                type="file" 
                id="file-upload-input" 
                className="hidden" 
                onChange={handleFileChange}
                accept=".csv, .xls, .xlsx"
              />

              <div className="flex flex-col items-center justify-center gap-3">
                <div className={`p-4 rounded-full ${selectedFile ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-900 text-gray-400 animate-pulse"}`}>
                  <FileText className="h-8 w-8" />
                </div>

                {selectedFile ? (
                  <div>
                    <p className="text-sm font-bold text-white mb-1">{selectedFile.name}</p>
                    <p className="text-3xs text-gray-400 uppercase font-bold tracking-wider">
                      Size: {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-gray-300 font-semibold mb-1">
                      Drag and drop your dataset here, or{" "}
                      <label htmlFor="file-upload-input" className="text-cyan-400 hover:text-cyan-300 underline cursor-pointer">
                        browse files
                      </label>
                    </p>
                    <p className="text-3xs text-gray-500 font-medium">CSV, XLS, or XLSX tables supported (Max: 50MB)</p>
                  </div>
                )}

                {selectedFile && (
                  <div className="flex items-center gap-2 mt-4">
                    <button 
                      onClick={handleUpload}
                      disabled={isUploading}
                      className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-cyan-500/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                      {isUploading ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" /> Analyzing & Uploading...
                        </>
                      ) : (
                        "Upload & Change Details"
                      )}
                    </button>
                    <button 
                      onClick={() => setSelectedFile(null)}
                      disabled={isUploading}
                      className="px-4 py-2 border border-white/10 text-gray-400 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="mt-4 p-3 bg-red-950/20 border border-red-500/25 text-red-400 text-3xs font-semibold rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Upload Success Details */}
            {uploadResult && (
              <div className="mt-4 p-4 bg-emerald-950/20 border border-emerald-500/25 rounded-xl text-emerald-400 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{uploadResult.message}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-emerald-500/10 text-3xs">
                  <div>
                    <span className="text-gray-400 font-medium">Crime Incidents Parsed:</span>
                    <strong className="text-white ml-2 text-xs">{uploadResult.crimes_loaded}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium">Suspect Profile Folders:</span>
                    <strong className="text-white ml-2 text-xs">{uploadResult.offenders_loaded}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Database Control box */}
          <div className="glassmorphism p-6 rounded-2xl border border-white/10">
            <h3 className="text-sm font-extrabold text-white mb-2 flex items-center gap-2">
              <Database className="h-4 w-4 text-cyan-400" /> Database Administration Tools
            </h3>
            <p className="text-3xs text-gray-400 mb-4 leading-normal">
              Reset or restore the original Karnataka Police Department seed files. Restoring will clear current active custom imports and load original syndicate network connections.
            </p>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleRestoreDefault}
                disabled={isRestoring}
                className="px-4 py-2 bg-slate-900 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                {isRestoring ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Restoring seed...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3.5 w-3.5" /> Restore Default Seed Data
                  </>
                )}
              </button>
              <button 
                onClick={downloadSampleTemplate}
                className="px-4 py-2 border border-cyan-500/20 hover:border-cyan-500/40 bg-cyan-950/10 text-cyan-400 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Download Sample CSV Template
              </button>
            </div>

            {restoreSuccess && (
              <div className="mt-3 p-3 bg-emerald-950/20 border border-emerald-500/25 text-emerald-400 text-3xs font-semibold rounded-lg flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Database successfully restored to default seed logs.</span>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info/Specs instructions */}
        <div className="space-y-4">
          <div className="glassmorphism p-6 rounded-2xl border border-white/10 space-y-4">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Info className="h-4.5 w-4.5 text-cyan-400" /> File Import Specs
            </h3>

            <p className="text-3xs text-gray-400 leading-relaxed">
              The AI Core parses columns dynamically. Please format columns to align with these metrics for accurate geospatial and suspect mapping.
            </p>

            <div className="space-y-3 pt-2 border-t border-white/5">
              <div>
                <p className="text-[10px] font-bold text-white mb-0.5">Required Headers</p>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-1.5 py-0.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-3xs font-bold rounded">category</span>
                  <span className="px-1.5 py-0.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-3xs font-bold rounded">district</span>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-white mb-0.5">Recommended Geospatial Columns</p>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-1.5 py-0.5 bg-slate-900 border border-white/10 text-gray-300 text-3xs font-bold rounded">latitude</span>
                  <span className="px-1.5 py-0.5 bg-slate-900 border border-white/10 text-gray-300 text-3xs font-bold rounded">longitude</span>
                  <span className="px-1.5 py-0.5 bg-slate-900 border border-white/10 text-gray-300 text-3xs font-bold rounded">severity</span>
                  <span className="px-1.5 py-0.5 bg-slate-900 border border-white/10 text-gray-300 text-3xs font-bold rounded">date</span>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-white mb-0.5">Suspect Mapping Columns</p>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-1.5 py-0.5 bg-slate-900 border border-white/10 text-gray-300 text-3xs font-bold rounded">suspect_name</span>
                  <span className="px-1.5 py-0.5 bg-slate-900 border border-white/10 text-gray-300 text-3xs font-bold rounded">suspect_alias</span>
                  <span className="px-1.5 py-0.5 bg-slate-900 border border-white/10 text-gray-300 text-3xs font-bold rounded">suspect_age</span>
                  <span className="px-1.5 py-0.5 bg-slate-900 border border-white/10 text-gray-300 text-3xs font-bold rounded">suspect_risk_score</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
