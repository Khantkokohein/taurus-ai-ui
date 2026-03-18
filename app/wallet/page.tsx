"use client";

import Link from "next/link";

export default function WalletPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#030617] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(56,189,248,0.12),transparent_28%),radial-gradient(circle_at_78%_18%,rgba(59,130,246,0.08),transparent_20%),linear-gradient(135deg,#020617_0%,#040b24_55%,#020617_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-15 [background-image:linear-gradient(rgba(59,130,246,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.12)_1px,transparent_1px)] [background-size:56px_56px]" />
      <div className="absolute left-[6%] top-[18%] h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="absolute left-[18%] top-[35%] h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

      <section className="relative mx-auto max-w-7xl px-6 py-16 md:px-10 lg:px-12">
        <div className="mb-10 flex items-center justify-between gap-4">
          <div className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-300 backdrop-blur">
            Taurus Wallet • Slide 1
          </div>

          <Link
            href="/"
            className="rounded-xl border border-cyan-400/35 bg-white/5 px-5 py-3 text-sm font-semibold text-cyan-200 backdrop-blur transition hover:bg-cyan-400/10"
          >
            Back Home
          </Link>
        </div>

        <div className="grid items-center gap-14 lg:grid-cols-[1fr_1fr]">
          <div className="relative flex min-h-[420px] items-center justify-center">
            <div className="absolute h-[340px] w-[340px] rounded-full bg-cyan-400/8 blur-3xl" />

            <div className="relative w-full max-w-[520px]">
              <div className="absolute bottom-[-18px] left-[8%] right-[8%] h-12 rounded-full bg-cyan-300/10 blur-2xl" />

              <div className="relative h-[270px] w-full">
                <div className="absolute left-[6%] top-[10%] h-[190px] w-[320px] rounded-[28px] border border-cyan-300/15 bg-cyan-300/5 blur-[1px]" />

                <div className="absolute left-[4%] top-[8%] h-[190px] w-[340px] rounded-[28px] border border-cyan-300/60 bg-white/[0.02] shadow-[0_0_35px_rgba(103,232,249,0.15)]">
                  <div className="absolute left-[20px] top-[-16px] h-[34px] w-[140px] rounded-t-[18px] border border-cyan-300/45 border-b-0 bg-white/[0.02]" />
                  <div className="absolute inset-[14px] rounded-[20px] border border-cyan-300/20" />
                  <div className="absolute left-[22px] right-[22px] top-[26px] h-px bg-cyan-300/20" />
                  <div className="absolute left-[22px] right-[22px] bottom-[26px] h-px bg-cyan-300/15" />

                  <div className="absolute left-[30px] top-[40px] h-px w-[110px] rotate-[18deg] bg-cyan-300/25" />
                  <div className="absolute left-[80px] top-[28px] h-px w-[140px] rotate-[-12deg] bg-cyan-300/20" />
                  <div className="absolute left-[38px] top-[84px] h-px w-[180px] rotate-[9deg] bg-cyan-300/18" />
                  <div className="absolute left-[48px] top-[120px] h-px w-[150px] rotate-[-16deg] bg-cyan-300/16" />
                  <div className="absolute left-[150px] top-[54px] h-px w-[110px] rotate-[20deg] bg-cyan-300/20" />
                  <div className="absolute left-[170px] top-[118px] h-px w-[100px] rotate-[-8deg] bg-cyan-300/16" />

                  <div className="absolute left-1/2 top-1/2 h-[86px] w-[86px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/55 shadow-[0_0_18px_rgba(103,232,249,0.18)]" />
                  <div className="absolute left-1/2 top-1/2 h-[54px] w-[54px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/30" />

                  <div className="absolute right-[-34px] top-[64px] h-[60px] w-[60px] rounded-[16px] border border-cyan-300/55 bg-white/[0.02] shadow-[0_0_18px_rgba(103,232,249,0.1)]">
                    <div className="absolute inset-[10px] rounded-[10px] border border-cyan-300/15" />
                  </div>

                  <div className="absolute left-[40px] top-[38px] h-1.5 w-1.5 rounded-full bg-cyan-300/80 shadow-[0_0_10px_rgba(103,232,249,0.8)]" />
                  <div className="absolute left-[78px] top-[118px] h-1.5 w-1.5 rounded-full bg-cyan-300/70 shadow-[0_0_10px_rgba(103,232,249,0.7)]" />
                  <div className="absolute left-[250px] top-[58px] h-1.5 w-1.5 rounded-full bg-cyan-300/70 shadow-[0_0_10px_rgba(103,232,249,0.7)]" />
                  <div className="absolute left-[286px] top-[130px] h-1.5 w-1.5 rounded-full bg-cyan-300/80 shadow-[0_0_10px_rgba(103,232,249,0.8)]" />
                </div>
              </div>

              <div className="mt-2 pl-6 text-xs uppercase tracking-[0.32em] text-cyan-200/55">
                Taurus Wallet Interface
              </div>
            </div>
          </div>

          <div className="max-w-xl">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.32em] text-cyan-300">
              Taurus Wallet
            </p>

            <h1 className="text-4xl font-extrabold leading-tight md:text-6xl">
              Smart Digital Wallet
              <span className="mt-2 block text-cyan-300">
                Secure • Fast • Offline Ready
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-white/72 md:text-lg">
              Taurus Wallet is a premium ecosystem wallet designed for TAT Coin,
              AI-powered payment flow, offline payment support, and connected
              Taurus digital services in one clean platform.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  alert("Download link will be added here.");
                }}
                className="rounded-xl bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.25)] transition hover:scale-[1.02]"
              >
                Download App
              </a>

              <Link
                href="/wallet/slide-2"
                className="rounded-xl border border-cyan-400/35 bg-white/5 px-6 py-3 text-sm font-semibold text-cyan-200 backdrop-blur transition hover:bg-cyan-400/10"
              >
                Next Slide
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <div className="text-xl font-bold text-cyan-300">AI</div>
                <div className="mt-1 text-sm text-white/65">Smart payment flow</div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <div className="text-xl font-bold text-cyan-300">Secure</div>
                <div className="mt-1 text-sm text-white/65">Protected account layer</div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <div className="text-xl font-bold text-cyan-300">Offline</div>
                <div className="mt-1 text-sm text-white/65">Pay without internet</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}