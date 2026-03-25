"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginGate() {
  const router = useRouter();

  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState("");

  const handleLogin = () => {
    if (code === "7777") {
      router.push("/");
    } else {
      alert("Invalid Code");
    }
  };

  const handleCall = () => {
    router.push("/ai-call");
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden text-white">
      <div className="absolute top-5 left-0 right-0 flex justify-between px-6 z-20">
        <button
          onClick={() => setShowModal(true)}
          className="text-xs border border-white/20 px-4 py-2 rounded-full hover:bg-white/10 transition"
        >
          Login
        </button>

        <button
          onClick={handleCall}
          className="text-xs border border-white px-4 py-2 rounded-full hover:bg-white hover:text-black transition"
        >
          Call Now
        </button>
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-40 h-40 rounded-full bg-gradient-to-br from-purple-400 via-pink-300 to-blue-400 blur-[2px] animate-pulse shadow-[0_0_80px_rgba(255,255,255,0.2)]" />
      </div>

      <div className="absolute left-10 bottom-20 z-10">
        <h1 className="text-4xl font-light tracking-wide">
          Taurus AI
          <br />
          <span className="text-white/60">Calling System</span>
        </h1>
      </div>

      {showModal && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-30">
          <div className="bg-white/10 border border-white/20 rounded-2xl p-6 w-[300px] text-center">
            <h2 className="mb-4 text-sm text-white/80">
              Enter Access Code
            </h2>

            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="••••"
              className="w-full px-4 py-2 rounded-lg bg-black/50 border border-white/20 text-center outline-none"
            />

            <button
              onClick={handleLogin}
              className="mt-4 w-full bg-white text-black py-2 rounded-lg text-sm"
            >
              Enter
            </button>

            <button
              onClick={() => setShowModal(false)}
              className="mt-2 text-xs text-white/50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}