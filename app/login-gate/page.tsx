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
    <main className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-[420px]">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-[#0a2540]">
            Taurus AI Access
          </h1>
          <p className="mt-3 text-sm text-[#5b6b7a]">
            Enter your access code or talk directly with Taurus AI
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-[#e5e7eb] rounded-2xl p-6 shadow-sm">

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
              className="mt-2 w-full rounded-xl border border-[#d1d5db] px-4 py-3 text-sm outline-none focus:border-blue-600"
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
            className="mt-6 w-full rounded-xl bg-blue-600 py-3 text-white font-semibold hover:bg-blue-700 transition"
          >
            Continue
          </button>

          {/* Divider */}
          <div className="mt-6 flex items-center gap-2">
            <div className="h-px flex-1 bg-[#e5e7eb]" />
            <span className="text-xs text-[#94a3b8]">OR</span>
            <div className="h-px flex-1 bg-[#e5e7eb]" />
          </div>

          {/* 🔥 AI CALL BUTTON */}
          <button
            onClick={goToAICall}
            className="mt-6 w-full rounded-xl bg-[#34c759] py-3 text-white font-semibold hover:bg-[#28a745] transition"
          >
            📞 Call Taurus AI
          </button>

        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-[#94a3b8]">
          Taurus AI © Secure Access System
        </div>

      </div>
    </main>
  );
}