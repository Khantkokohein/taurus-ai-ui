"use client";

import { useState } from "react";

export default function LoginGatePage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  function handleContinue() {
    if (code === "TAURUS2026") {
      localStorage.setItem("taurus_access", "granted");
      window.location.href = "/";
    } else {
      setError("Invalid access code");
    }
  }

  function goToAICall() {
    window.location.href = "/ai-call";
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#eef7ff_0%,#ddeeff_50%,#d1e8ff_100%)] px-6">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-120px] top-[-80px] h-[320px] w-[320px] rounded-full bg-[#89cfff]/30 blur-3xl" />
        <div className="absolute right-[-100px] top-[140px] h-[260px] w-[260px] rounded-full bg-[#7ec8ff]/20 blur-3xl" />
        <div className="absolute bottom-[-80px] left-[18%] h-[280px] w-[280px] rounded-full bg-[#55b6ff]/18 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.18)_1px,transparent_1px)] bg-[size:46px_46px] opacity-30" />
      </div>

      <div className="relative w-full max-w-[420px]">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mx-auto inline-flex rounded-full border border-[#9fd6ff] bg-white/60 px-4 py-2 text-xs font-semibold text-[#0f5f9a] backdrop-blur-sm">
            Taurus Secure Entry
          </div>

          <h1 className="mt-6 text-3xl font-bold text-[#0a2540]">
            Taurus AI Access
          </h1>

          <p className="mt-3 text-sm text-[#5b6b7a]">
            Enter your access code or talk directly with Taurus AI
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/70 bg-white/78 p-6 shadow-[0_18px_50px_rgba(33,98,155,0.10)] backdrop-blur-md">
          {/* Input */}
          <div>
            <label className="text-sm font-medium text-[#0a2540]">
              Access Code
            </label>

            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError("");
              }}
              placeholder="Enter code"
              className="mt-2 w-full rounded-xl border border-[#d1dbe8] bg-white/90 px-4 py-3 text-sm text-[#0a2540] outline-none transition placeholder:text-[#9aabbb] focus:border-blue-600"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="mt-3 text-sm text-red-500">
              {error}
            </div>
          )}

          {/* Continue Button */}
          <button
            onClick={handleContinue}
            className="mt-6 w-full rounded-xl bg-[linear-gradient(90deg,#2563eb_0%,#3b82f6_100%)] py-3 text-white font-semibold shadow-[0_12px_24px_rgba(37,99,235,0.20)] transition hover:opacity-95"
          >
            Continue
          </button>

          {/* Divider */}
          <div className="mt-6 flex items-center gap-2">
            <div className="h-px flex-1 bg-[#d9e6f2]" />
            <span className="text-xs text-[#94a3b8]">OR</span>
            <div className="h-px flex-1 bg-[#d9e6f2]" />
          </div>

          {/* AI CALL BUTTON */}
          <button
            onClick={goToAICall}
            className="mt-6 w-full rounded-xl border border-[#9fd6ff] bg-[linear-gradient(180deg,#edf8ff_0%,#dbf1ff_100%)] py-3 font-semibold text-[#0c5f93] shadow-[0_10px_22px_rgba(78,154,214,0.12)] transition hover:opacity-95"
          >
            📞 Call Taurus AI
          </button>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-[#7f96ad]">
          Taurus AI © Secure Access System
        </div>
      </div>
    </main>
  );
}