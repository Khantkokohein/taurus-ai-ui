import Link from "next/link";

export default function LoginGatePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06),transparent_20%),radial-gradient(circle_at_50%_55%,rgba(125,211,252,0.10),transparent_24%),radial-gradient(circle_at_55%_48%,rgba(216,180,254,0.14),transparent_18%)]" />
      <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:90px_90px]" />

      {/* Top tiny labels */}
      <div className="pointer-events-none absolute left-5 top-4 text-[9px] uppercase tracking-[0.35em] text-white/65">
        Taurus AI
        <br />
        Login Gate
      </div>

      <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 text-center text-[9px] uppercase tracking-[0.28em] text-white/45">
        Secure preview access
        <br />
        under configuration
      </div>

      <div className="pointer-events-none absolute right-8 top-4 text-right text-[9px] uppercase tracking-[0.28em] text-white/45">
        Platform
        <br />
        build phase
      </div>

      {/* Buttons */}
      <div className="absolute right-6 top-16 z-20 flex gap-3">
        <Link
          href="/ai-call"
          className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-200 transition hover:bg-cyan-300/20"
        >
          AI Support
        </Link>
        <Link
          href="/ai-call"
          className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/90 transition hover:bg-white/10"
        >
          Quick Call
        </Link>
      </div>

      <section className="relative z-10 grid min-h-screen grid-cols-1 items-center px-6 md:px-10 lg:grid-cols-[1.05fr_1fr_0.9fr]">
        {/* Left */}
        <div className="self-center">
          <h1 className="max-w-md text-5xl font-semibold leading-[0.9] md:text-7xl">
            <span className="block italic font-light text-white/95">Creative</span>
            <span className="block uppercase">Developer.</span>
          </h1>

          <p className="mt-8 max-w-sm text-sm leading-7 text-white/55">
            Taurus AI login gate is currently being refined. Preview structure,
            AI support flow, and access layers are still under setup.
          </p>

          <div className="mt-10 flex flex-wrap gap-3 text-[11px] uppercase tracking-[0.28em] text-white/35">
            <span>AI Calling</span>
            <span>SIM Preview</span>
            <span>Wallet</span>
            <span>VPN</span>
          </div>
        </div>

        {/* Center orb */}
        <div className="relative flex items-center justify-center py-16">
          <div className="absolute h-[380px] w-[380px] rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-8 h-28 w-[85%] rounded-[100%] bg-white/10 blur-2xl opacity-60" />

          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-white/20 blur-2xl" />
            <div className="relative h-56 w-56 animate-[spin_16s_linear_infinite] rounded-full bg-[conic-gradient(from_180deg,#fff_0deg,#9fe7ff_60deg,#f0b0ff_130deg,#c4fff9_220deg,#fff_360deg)] p-[2px] shadow-[0_0_80px_rgba(255,255,255,0.16)] md:h-72 md:w-72">
              <div className="h-full w-full rounded-full bg-[radial-gradient(circle_at_35%_30%,rgba(255,255,255,0.95),rgba(220,230,255,0.86)_20%,rgba(245,168,255,0.72)_45%,rgba(110,232,255,0.62)_68%,rgba(255,255,255,0.22)_84%,rgba(0,0,0,0.08)_100%)]" />
            </div>

            <div className="absolute inset-x-6 -bottom-14 h-16 rounded-[100%] bg-[radial-gradient(circle,rgba(255,255,255,0.45),rgba(255,255,255,0.05)_60%,transparent_100%)] blur-xl" />
          </div>
        </div>

        {/* Right info panel */}
        <div className="mx-auto w-full max-w-md rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl shadow-[0_0_60px_rgba(255,255,255,0.06)]">
          <p className="text-[11px] uppercase tracking-[0.35em] text-white/40">
            Login Gate Status
          </p>

          <h2 className="mt-3 text-2xl font-semibold">
            Under Maintenance
          </h2>

          <p className="mt-4 text-sm leading-7 text-white/60">
            This access gate is not fully opened yet. Authentication flow,
            security layers, and preview controls are still being configured.
          </p>

          <div className="mt-6 space-y-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
              <p className="text-sm text-white/85">Create account</p>
              <p className="mt-1 text-xs text-white/40">
                Username, password, security code setup pending
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
              <p className="text-sm text-white/85">Daily preview code</p>
              <p className="mt-1 text-xs text-white/40">
                Public learning mode will be added here
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
              <p className="text-sm text-white/85">SIM store</p>
              <p className="mt-1 text-xs text-white/40">
                Preview only, purchasing remains locked
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              disabled
              className="cursor-not-allowed rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/35"
            >
              Enter Gate
            </button>
            <Link
              href="/ai-call"
              className="rounded-2xl border border-cyan-300/30 bg-cyan-300/10 px-4 py-3 text-center text-sm text-cyan-200 transition hover:bg-cyan-300/20"
            >
              Call Support
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}