"use client";

import { useState } from "react";
import Link from "next/link";

export default function TrialPage() {
  const [suggestion, setSuggestion] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!suggestion.trim()) return;
    // 🔹 future: send to supabase / api
    console.log("Suggestion:", suggestion);

    setSubmitted(true);
    setSuggestion("");
  };

  return (
    <main className="relative min-h-screen bg-[#05081f] text-white overflow-hidden">
      {/* background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(14,30,88,0.6)_0%,rgba(7,12,45,0.95)_40%,#030617_100%)]" />

      <section className="relative mx-auto max-w-5xl px-6 py-10 md:px-10">
        {/* header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm tracking-[0.3em] text-cyan-300">
              TAURUS AI
            </p>
            <h1 className="mt-2 text-4xl font-extrabold">
              Taurus Calling Access
            </h1>
          </div>

          <Link
            href="/"
            className="rounded-xl border border-cyan-400/30 bg-white/5 px-4 py-2 text-sm text-cyan-200 hover:bg-cyan-400/10"
          >
            Back
          </Link>
        </div>

        {/* card */}
        <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-xl">
          <h2 className="text-xl font-semibold text-cyan-300">
            Direct Call Access
          </h2>

          <p className="mt-3 text-sm text-white/70 leading-6">
            This system allows real-time Taurus user-to-user calling.
            No login required. Your device will be used as identity.
          </p>

          {/* CALL BUTTON */}
          <div className="mt-6 flex justify-center">
            <Link
              href="/call"
              className="rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-6 py-3 font-semibold text-black shadow-lg hover:scale-[1.05] transition"
            >
              📞 Enter Call System
            </Link>
          </div>

          {/* divider */}
          <div className="my-8 h-[1px] bg-white/10" />

          {/* suggestion box */}
          <div>
            <h3 className="text-lg font-semibold text-cyan-300">
              Suggestion Box
            </h3>

            <p className="mt-2 text-sm text-white/60">
              Help improve Taurus AI. Send feedback or ideas.
            </p>

            <textarea
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
              placeholder="Type your suggestion..."
              className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm outline-none focus:border-cyan-400"
              rows={4}
            />

            <button
              onClick={handleSubmit}
              className="mt-3 w-full rounded-xl bg-cyan-400 py-2 font-semibold text-black hover:opacity-90"
            >
              Submit Suggestion
            </button>

            {submitted && (
              <div className="mt-3 text-green-400 text-sm text-center">
                ✔ Suggestion submitted
              </div>
            )}
          </div>

          {/* footer */}
          <div className="mt-8 text-center text-xs text-white/50">
            Taurus AI — Real-time Communication System
          </div>
        </div>
      </section>
    </main>
  );
}