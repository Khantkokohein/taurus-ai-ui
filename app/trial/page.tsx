"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function TrialPage() {
  const [user, setUser] = useState<any>(null);
  const [isRobotChecked, setIsRobotChecked] = useState(false);

  const canCall = user && isRobotChecked;

  // 🔥 Check session on load
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    getUser();
  }, []);

  // 🔥 Google Login
  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "https://taurusai.site/trial",
      },
    });
  };

  // 🔥 Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05081f] text-white">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(14,30,88,0.65)_0%,rgba(7,12,45,0.95)_38%,#030617_100%)]" />

      <section className="relative mx-auto max-w-5xl px-6 py-10 md:px-10">
        
        {/* HEADER */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
              TAURUS AI
            </p>
            <h1 className="mt-2 text-4xl font-extrabold md:text-5xl">
              Start Free Trial
            </h1>
          </div>

          <Link
            href="/"
            className="rounded-xl border border-cyan-400/30 bg-white/5 px-5 py-3 text-sm font-semibold text-cyan-200 backdrop-blur transition hover:bg-cyan-400/10"
          >
            Back to Main UI
          </Link>
        </div>

        {/* MAIN BOX */}
        <div className="rounded-[32px] border border-white/10 bg-white/8 p-6 shadow-[0_0_50px_rgba(0,0,0,0.45)] backdrop-blur-xl md:p-7">

          {/* TITLE */}
          <h2 className="text-2xl font-bold text-cyan-300">
            AI Calling Test Access
          </h2>

          {/* DESCRIPTION */}
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70 md:text-base">
            Experience Taurus AI Calling in a controlled demo environment.
            Sign in, verify your access, and test how AI handles real-time
            voice interaction for business communication.
          </p>

          {/* 🔥 LOGIN */}
          <div className="mt-6 text-center">
            {!user ? (
              <button
                onClick={handleGoogleLogin}
                className="w-full rounded-2xl border border-cyan-400/40 bg-white/5 py-3 font-semibold text-cyan-200 hover:bg-cyan-400/10 transition"
              >
                Continue with Google
              </button>
            ) : (
              <div className="space-y-2">
                <div className="text-green-400 text-sm">
                  ✔ Logged in as {user.email}
                </div>
                <button
                  onClick={handleLogout}
                  className="text-xs text-red-400 underline"
                >
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* 🔥 ROBOT CHECK */}
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
            <input
              type="checkbox"
              checked={isRobotChecked}
              onChange={(e) => setIsRobotChecked(e.target.checked)}
            />
            <span className="text-sm text-white/70">
              I am not a robot
            </span>
          </div>

          {/* 🔥 CALL BUTTON */}
          <div className="mt-6 flex justify-center">
            {canCall ? (
              <Link
                href="/call"
                className="rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-6 py-3 text-base font-semibold text-black shadow-[0_0_30px_rgba(34,211,238,0.5)] transition hover:scale-[1.05]"
              >
                📞 Call Test Now
              </Link>
            ) : (
              <button
                disabled
                className="rounded-2xl bg-gray-600 px-6 py-3 text-base font-semibold text-white opacity-50 cursor-not-allowed"
              >
                🔒 Login & Verify to Call
              </button>
            )}
          </div>

          {/* INFO */}
          <div className="mt-6 text-xs text-white/60 text-center">
            Taurus AI Calling — Smart Voice Interaction for the Future of Business
          </div>

        </div>
      </section>
    </main>
  );
}