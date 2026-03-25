"use client";
import { useState } from "react";

export default function LoginGate() {
  const [showCallScreen, setShowCallScreen] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const handleFakeLogin = () => {
    // ဝင်လို့မရအောင် တမင်ပိတ်ထားတဲ့ Logic
    setError("SECURITY BREACH: Access Key is invalid or expired.");
  };

  return (
    <div className="relative z-10 flex min-h-screen flex-col items-center justify-center bg-transparent">
      
      {/* --- Main Page UI (Creative Developer Style) --- */}
      {!showCallScreen && (
        <div className="w-full max-w-6xl flex flex-col items-center">
          {/* Header Texts */}
          <div className="flex w-full justify-between items-start px-10 mb-20 opacity-60 text-[10px] tracking-[0.5em] uppercase">
            <div>Project: Thorr AI</div>
            <div className="text-right italic underline">Authentication Required</div>
          </div>

          {/* Center Content (Creative Developer Look) */}
          <div className="text-center">
             <h1 className="text-[80px] md:text-[120px] font-thin leading-none tracking-tighter italic text-white drop-shadow-2xl">
               Creative
             </h1>
             <h2 className="text-[60px] md:text-[90px] font-black leading-none tracking-tighter uppercase text-white mt-[-10px]">
               Developer.
             </h2>
          </div>

          {/* Enter Button (Fake Gate) */}
          <div className="mt-20">
            <button 
              onClick={() => setOpenModal(true)}
              className="px-10 py-4 border border-white/20 rounded-full hover:bg-white hover:text-black transition-all duration-700 text-[10px] tracking-[0.4em] uppercase"
            >
              Access System
            </button>
          </div>

          {/* Test Bypass (Hidden) */}
          <button 
            onClick={() => setShowCallScreen(true)}
            className="mt-10 opacity-5 hover:opacity-100 text-[8px] transition-opacity"
          >
            [DEBUG_BYPASS]
          </button>
        </div>
      )}

      {/* --- Fake Password Modal --- */}
      {openModal && !showCallScreen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-6">
          <div className="w-full max-w-[400px] text-center">
            <h3 className="text-white text-[12px] tracking-[0.6em] uppercase mb-10 opacity-50">Encryption Key</h3>
            <input 
              type="password" 
              value={code} 
              onChange={(e) => setCode(e.target.value)}
              className="w-full bg-transparent border-b border-white/20 p-4 text-center text-2xl outline-none focus:border-white transition-colors text-white"
              placeholder="••••••••"
            />
            {error && <p className="text-red-500 text-[10px] mt-6 tracking-widest uppercase">{error}</p>}
            
            <div className="mt-12 flex flex-col gap-4">
               <button onClick={handleFakeLogin} className="text-[10px] tracking-widest uppercase py-4 border border-white/10 hover:border-red-500 hover:text-red-500 transition-all">Execute</button>
               <button onClick={() => setOpenModal(false)} className="text-[8px] opacity-30 uppercase tracking-[0.4em]">Abort</button>
            </div>
          </div>
        </div>
      )}

      {/* --- AI Call Screen UI --- */}
      {showCallScreen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-2xl">
          <div className="relative w-[340px] h-[680px] bg-[#050505] border-[1px] border-white/10 rounded-[50px] flex flex-col p-8 overflow-hidden shadow-[0_0_100px_rgba(255,255,255,0.05)]">
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#151515] rounded-b-2xl" />
            
            <div className="mt-20 text-center">
              <div className="w-20 h-20 border border-white/10 rounded-full mx-auto mb-6 flex items-center justify-center animate-pulse">
                 <div className="w-10 h-10 bg-white/10 rounded-full" />
              </div>
              <h3 className="text-2xl font-light tracking-widest text-white uppercase">Thorr AI</h3>
              <p className="text-[8px] tracking-[0.8em] uppercase text-white/30 mt-4">Active Line</p>
            </div>

            <div className="mt-auto mb-16 px-4">
              <p className="text-[12px] leading-relaxed text-white/70 italic text-center font-light">
                "System is restricted to Taurus developers only. Please verify your credentials."
              </p>
            </div>

            <button 
              onClick={() => setShowCallScreen(false)}
              className="w-14 h-14 bg-red-900/20 border border-red-500/30 rounded-full mx-auto flex items-center justify-center hover:bg-red-500 transition-all"
            >
              <span className="text-white">✕</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}