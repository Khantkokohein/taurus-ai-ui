"use client";

import Link from "next/link";

export default function VpnPage() {
  const handleComingSoon = (
    e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>
  ) => {
    e.preventDefault();
    alert("Download will be available soon.");
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050816] text-white">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(37,99,235,0.16),transparent_18%),radial-gradient(circle_at_18%_28%,rgba(59,130,246,0.12),transparent_24%),radial-gradient(circle_at_82%_20%,rgba(251,146,60,0.10),transparent_20%),linear-gradient(180deg,#040814_0%,#071226_45%,#030611_100%)]" />

      {/* Glow */}
      <div className="absolute left-[6%] top-[20%] h-60 w-60 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="absolute right-[8%] top-[20%] h-60 w-60 rounded-full bg-orange-400/10 blur-3xl" />

      {/* Grid */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[44%] opacity-30 [background-image:linear-gradient(rgba(59,130,246,0.22)_1px,transparent_1px)] [background-size:100%_36px]" />

      <section className="relative mx-auto max-w-7xl px-6 py-8 md:px-10 lg:px-12">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.32em] text-cyan-300">
              Taurus VPN
            </p>
            <h1 className="mt-2 text-4xl font-extrabold md:text-6xl leading-tight">
              Secure VPN
              <span className="block text-cyan-300">Download Center</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm text-white/70">
              Fast, secure, and Taurus-powered private access for your devices.
            </p>
          </div>

          <Link
            href="/"
            className="mt-2 rounded-xl border border-cyan-400/30 px-5 py-3 text-sm text-cyan-200 hover:bg-cyan-400/10"
          >
            Back to Main UI
          </Link>
        </div>

        {/* Main */}
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          {/* LEFT (PERFECT CENTER) */}
          <div className="flex items-center justify-center">
            <div className="relative flex h-[360px] w-[360px] items-center justify-center rounded-full border border-cyan-300/10 bg-cyan-300/5 shadow-[0_0_90px_rgba(34,211,238,0.15)]">
              
              {/* Rings */}
              <div className="absolute h-[420px] w-[420px] rounded-full border border-cyan-300/10" />
              <div className="absolute h-[480px] w-[480px] rounded-full border border-blue-300/10" />

              {/* Center content */}
              <div className="flex flex-col items-center justify-center text-center">
                
                {/* Shield */}
                <div className="relative mb-8 flex items-center justify-center">
                  <div className="absolute h-32 w-32 rounded-full bg-cyan-300/10 blur-2xl" />

                  <div
                    className="relative h-28 w-24 border-[4px] border-cyan-300 shadow-[0_0_30px_rgba(103,232,249,0.5)]"
                    style={{
                      clipPath:
                        "polygon(50% 0%, 88% 12%, 88% 52%, 50% 100%, 12% 52%, 12% 12%)",
                    }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex flex-col items-center">
                        <div className="h-5 w-5 rounded border border-cyan-200" />
                        <div className="mt-[-7px] h-3 w-3 rounded-full border border-cyan-200" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* VPN TEXT (FIXED CENTER) */}
                <div className="text-center">
                  <div className="text-6xl font-black tracking-tight text-cyan-200">
                    VPN
                  </div>
                  <div className="mt-2 text-[11px] tracking-[0.35em] text-cyan-200/70">
                    TAURUS SECURE
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-8">
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-7 backdrop-blur-xl shadow-[0_0_40px_rgba(0,0,0,0.45)]">
              <div className="mb-4 text-xs text-cyan-300">
                Download & Install
              </div>

              <h2 className="text-2xl font-bold">
                Get Taurus VPN on Your Device
              </h2>

              <p className="mt-4 text-sm text-white/70">
                Choose your platform to start using Taurus VPN.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <a
                  href="#"
                  onClick={handleComingSoon}
                  className="rounded-2xl bg-cyan-400 py-4 text-center font-semibold text-black hover:scale-[1.02]"
                >
                  Download Android
                </a>

                <a
                  href="#"
                  onClick={handleComingSoon}
                  className="rounded-2xl border border-cyan-400/30 py-4 text-center text-cyan-200 hover:bg-cyan-400/10"
                >
                  Download Windows
                </a>

                <button
                  onClick={handleComingSoon}
                  className="rounded-2xl border border-white/10 py-4 text-white/50"
                >
                  iPhone (Soon)
                </button>

                <button
                  onClick={handleComingSoon}
                  className="rounded-2xl border border-white/10 py-4 text-white/50"
                >
                  Mac (Soon)
                </button>
              </div>
            </div>

            {/* Features */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-white/5 p-4 border border-white/10">
                <div className="text-cyan-300 font-bold">Fast</div>
                <p className="text-sm text-white/60 mt-1">
                  Quick connection and speed optimized.
                </p>
              </div>

              <div className="rounded-2xl bg-white/5 p-4 border border-white/10">
                <div className="text-cyan-300 font-bold">Secure</div>
                <p className="text-sm text-white/60 mt-1">
                  Encrypted and protected traffic.
                </p>
              </div>

              <div className="rounded-2xl bg-white/5 p-4 border border-white/10">
                <div className="text-cyan-300 font-bold">Future</div>
                <p className="text-sm text-white/60 mt-1">
                  More features coming soon.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}