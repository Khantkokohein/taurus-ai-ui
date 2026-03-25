"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function LoginGatePage() {
  const [dailyCode, setDailyCode] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [unlocked, setUnlocked] = useState(false);

  const DAILY_CODE = "28465";

  const particles = useMemo(
    () =>
      Array.from({ length: 14 }).map((_, i) => ({
        id: i,
        top: `${8 + ((i * 11) % 82)}%`,
        left: `${6 + ((i * 17) % 88)}%`,
        delay: `${(i % 5) * 0.7}s`,
        duration: `${5 + (i % 4)}s`,
      })),
    []
  );

  useEffect(() => {
    if (!statusMessage) return;
    const t = setTimeout(() => setStatusMessage(""), 2500);
    return () => clearTimeout(t);
  }, [statusMessage]);

  const handleDailyCode = () => {
    if (dailyCode === DAILY_CODE) {
      setUnlocked(true);
      setStatusMessage("Daily code accepted.");
    } else {
      setUnlocked(false);
      setStatusMessage("Invalid daily code.");
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.05),transparent_22%),radial-gradient(circle_at_50%_55%,rgba(103,232,249,0.10),transparent_24%),radial-gradient(circle_at_50%_52%,rgba(216,180,254,0.12),transparent_18%)]" />
      <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.14)_1px,transparent_1px)] [background-size:72px_72px]" />

      {/* floating dust */}
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute h-1 w-1 rounded-full bg-white/40 animate-pulse"
          style={{
            top: p.top,
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}

      {/* top micro labels */}
      <div className="pointer-events-none absolute left-4 top-4 text-[8px] uppercase tracking-[0.28em] text-white/55 sm:left-6 sm:text-[9px]">
        Taurus AI
        <br />
        Login Gate
      </div>

      <div className="pointer-events-none absolute left-1/2 top-4 hidden -translate-x-1/2 text-center text-[8px] uppercase tracking-[0.24em] text-white/40 md:block">
        Secure Preview Access
        <br />
        Under Configuration
      </div>

      <div className="pointer-events-none absolute right-4 top-4 text-right text-[8px] uppercase tracking-[0.24em] text-white/40 sm:right-6 sm:text-[9px]">
        Platform
        <br />
        Build Phase
      </div>

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-10 pt-20 sm:px-6 lg:grid lg:grid-cols-[0.95fr_1fr_0.95fr] lg:items-center lg:gap-10 lg:px-10 lg:pt-12">
        {/* Left */}
        <div className="order-1">
          <h1 className="max-w-[320px] text-[42px] font-semibold leading-[0.86] sm:max-w-[420px] sm:text-[64px] lg:max-w-[500px] lg:text-[88px]">
            <span className="block italic font-light text-white/95">Creative</span>
            <span className="block uppercase">Developer.</span>
          </h1>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/ai-call"
              className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-5 py-3 text-sm text-cyan-200 transition hover:bg-cyan-300/20"
            >
              AI Support
            </Link>

            <Link
              href="/ai-call"
              className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm text-white/90 transition hover:bg-white/10"
            >
              Quick Call
            </Link>
          </div>

          <p className="mt-6 max-w-xl text-base leading-8 text-white/60 sm:text-lg">
            Taurus AI login gate is currently being refined. Preview structure,
            AI support flow, and access layers are still under setup.
          </p>

          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-[11px] uppercase tracking-[0.28em] text-white/38 sm:text-xs">
            <span>AI Calling Customer Service</span>
            <span>SIM Preview</span>
            <span>Wallet</span>
            <span>VPN</span>
          </div>
        </div>

        {/* Center Orb */}
        <div className="order-2 flex items-center justify-center py-10 lg:py-0">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-cyan-300/10 blur-3xl" />
            <div className="absolute inset-0 rounded-full bg-fuchsia-300/10 blur-3xl" />
            <div className="absolute left-1/2 top-[86%] h-24 w-[85%] -translate-x-1/2 rounded-[100%] bg-white/20 blur-3xl opacity-45" />

            {/* Orb animation wrapper */}
            <div className="animate-[floatOrb_3s_ease-in-out_infinite]">
              <div className="relative h-56 w-56 rounded-full border border-white/15 bg-[radial-gradient(circle_at_35%_30%,rgba(255,255,255,0.95),rgba(200,245,255,0.88)_18%,rgba(241,174,255,0.72)_48%,rgba(163,234,255,0.72)_72%,rgba(255,255,255,0.24)_88%,rgba(0,0,0,0.08)_100%)] shadow-[0_0_100px_rgba(255,255,255,0.12)] sm:h-72 sm:w-72 lg:h-[340px] lg:w-[340px]">
                <div className="absolute inset-0 rounded-full border border-white/20" />
                <div className="absolute inset-[8%] rounded-full border border-white/10" />
                <div className="absolute inset-0 rounded-full animate-[spin_18s_linear_infinite] bg-[conic-gradient(from_180deg,rgba(255,255,255,0.00),rgba(255,255,255,0.18),rgba(255,255,255,0.00))] mix-blend-screen" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="order-3 w-full">
          <div className="mx-auto w-full max-w-xl rounded-[30px] border border-white/10 bg-white/5 p-5 backdrop-blur-2xl shadow-[0_0_60px_rgba(255,255,255,0.06)] sm:p-6">
            <p className="text-[11px] uppercase tracking-[0.35em] text-white/40">
              Login Gate Status
            </p>

            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
              Under Maintenance
            </h2>

            <p className="mt-4 text-sm leading-7 text-white/60 sm:text-base">
              This access gate is not fully opened yet. Authentication flow,
              security layers, and preview controls are still being configured.
            </p>

            <div className="mt-6 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                <p className="text-sm text-white/90">Sign up / Sign in later</p>
                <p className="mt-1 text-xs leading-6 text-white/45">
                  Account flow is not live yet. Public preview access is active.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                <p className="text-sm text-white/90">Daily login code</p>
                <p className="mt-1 text-xs leading-6 text-white/45">
                  Manual daily code can be changed anytime for preview access.
                </p>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <input
                    value={dailyCode}
                    onChange={(e) => setDailyCode(e.target.value)}
                    placeholder="Enter daily code"
                    className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/22 focus:border-cyan-300/40"
                  />
                  <button
                    onClick={handleDailyCode}
                    className="rounded-2xl border border-cyan-300/30 bg-cyan-300/10 px-5 py-3 text-sm text-cyan-200 transition hover:bg-cyan-300/20"
                  >
                    Login Code
                  </button>
                </div>

                {statusMessage ? (
                  <p
                    className={`mt-3 text-sm ${
                      unlocked ? "text-emerald-300" : "text-rose-300"
                    }`}
                  >
                    {statusMessage}
                  </p>
                ) : null}
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                <p className="text-sm text-white/90">Call Taurus AI</p>
                <p className="mt-1 text-xs leading-6 text-white/45">
                  Tap to open the AI call screen and test voice support.
                </p>

                <Link
                  href="/ai-call"
                  className="mt-4 block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm text-white/90 transition hover:bg-white/10"
                >
                  Open AI Call
                </Link>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                disabled
                className="cursor-not-allowed rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/35"
              >
                Sign Up Later
              </button>
              <button
                disabled
                className="cursor-not-allowed rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/35"
              >
                Sign In Later
              </button>
            </div>
          </div>
        </div>
      </section>

      <style jsx global>{`
        @keyframes floatOrb {
          0%,
          100% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-12px) scale(1.015);
          }
        }
      `}</style>
    </main>
  );
}