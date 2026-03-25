"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AICallPage() {
  const router = useRouter();
  const [aiResponse, setAiResponse] = useState("Connecting to Thorr AI...");
  const [isTyping, setIsTyping] = useState(false);

  // Gemini API ကို Route Handler ကတစ်ဆင့် လှမ်းခေါ်တဲ့ Function
  async function startCall() {
    setIsTyping(true);
    try {
      const res = await fetch("/api/gemini", { method: "POST" });
      const data = await res.json();
      
      if (data.error) throw new Error(data.error);

      const text = data.text;
      let i = 0;
      const interval = setInterval(() => {
        setAiResponse(text.substring(0, i));
        i++;
        if (i > text.length) {
          clearInterval(interval);
          setIsTyping(false);
        }
      }, 40);
    } catch (err) {
      setAiResponse("Connection failed. Please check your API Key in .env.local");
      setIsTyping(false);
    }
  }

  useEffect(() => {
    startCall();
  }, []);

  return (
    <main className="relative min-h-screen bg-black flex items-center justify-center p-6 overflow-hidden">
      {/* Background Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-900/20 to-black z-0" />

      <div className="relative z-10 w-full max-w-[360px] h-[720px] bg-[#050505] border-[10px] border-[#151515] rounded-[60px] flex flex-col p-8 shadow-[0_0_100px_rgba(0,195,255,0.15)]">
        {/* Dynamic Island / Notch Area */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-[#151515] rounded-b-3xl" />

        {/* AI Profile Section */}
        <div className="mt-20 text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 bg-cyan-500 rounded-full animate-ping opacity-20" />
            <div className="relative w-24 h-24 bg-gradient-to-tr from-cyan-600 to-blue-400 rounded-full flex items-center justify-center shadow-xl shadow-cyan-500/30">
              <div className="w-16 h-16 bg-black/20 rounded-full backdrop-blur-sm flex items-center justify-center text-cyan-200">
                AI
              </div>
            </div>
          </div>
          <h3 className="text-3xl font-bold tracking-tight text-white">Thorr AI</h3>
          <p className="text-cyan-400 text-[10px] tracking-[0.5em] uppercase mt-3 font-semibold">Secure Line Active</p>
        </div>

        {/* AI Response Text Area */}
        <div className="mt-auto mb-12 bg-white/[0.03] p-6 rounded-[35px] border border-white/5 min-h-[220px] flex items-center shadow-inner">
          <p className="text-sm leading-relaxed text-white/90 font-medium italic">
            {aiResponse}
            {isTyping && <span className="inline-block w-1.5 h-4 bg-cyan-500 ml-2 animate-pulse" />}
          </p>
        </div>

        {/* Hang Up Button */}
        <button 
          onClick={() => router.push("/")}
          className="w-20 h-20 bg-red-500/10 border border-red-500/40 rounded-full mx-auto mb-6 flex items-center justify-center hover:bg-red-500 transition-all group"
        >
          <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center group-hover:scale-90 transition-transform">
             <span className="text-white text-xl">✕</span>
          </div>
        </button>
      </div>
    </main>
  );
}