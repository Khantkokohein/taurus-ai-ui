"use client";

import Link from "next/link";

export default function WalletSlide6() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020617] text-white">
      {/* background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(16,185,129,0.15),transparent_28%),radial-gradient(circle_at_70%_20%,rgba(34,211,238,0.12),transparent_25%),linear-gradient(135deg,#020617_0%,#03201a_55%,#020617_100%)]" />

      {/* glow */}
      <div className="absolute left-[15%] top-[20%] h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="absolute right-[10%] top-[18%] h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />

      <section className="relative mx-auto max-w-6xl px-6 py-12 text-center">
        {/* header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-300">
            Taurus Wallet • Slide 6
          </div>

          <Link
            href="/wallet/slide-5"
            className="rounded-xl border border-emerald-400/30 px-5 py-2 text-sm text-emerald-200 hover:bg-emerald-400/10"
          >
            Back
          </Link>
        </div>

        {/* hero */}
        <h1 className="text-4xl font-extrabold md:text-6xl leading-tight">
          In-App Purchase Coin
          <span className="block text-emerald-300">TAT Ecosystem Value</span>
        </h1>

        <p className="mt-6 max-w-3xl mx-auto text-white/70 leading-8">
          Taurus Wallet uses TAT Coin as an internal value system designed for
          ecosystem usage. Users can spend their balance across services, unlock
          premium features, and access digital tools — all within one unified
          platform.
        </p>

        {/* feature cards */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <h3 className="text-xl font-bold text-emerald-300">
              In-App Purchase
            </h3>
            <p className="mt-3 text-sm text-white/70 leading-7">
              Use TAT Coin to unlock premium features, services, and digital
              upgrades across Taurus ecosystem products.
            </p>
          </div>

          <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-6 backdrop-blur">
            <h3 className="text-xl font-bold text-red-300">
              No Withdrawal
            </h3>
            <p className="mt-3 text-sm text-red-100/80 leading-7">
              TAT Coin cannot be withdrawn, transferred externally, or converted
              into cash. It is strictly designed for in-app ecosystem usage.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <h3 className="text-xl font-bold text-emerald-300">
              Multi-Service Usage
            </h3>
            <p className="mt-3 text-sm text-white/70 leading-7">
              Spend your balance on VPN access, mobile top up, offline payments,
              AI tools, and future Taurus services.
            </p>
          </div>
        </div>

        {/* value explanation */}
        <div className="mt-12 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-8 backdrop-blur">
          <h3 className="text-2xl font-bold text-emerald-200">
            Why TAT Coin Matters
          </h3>

          <p className="mt-4 text-sm md:text-base text-emerald-50/80 leading-7 max-w-3xl mx-auto">
            TAT Coin creates a closed-loop ecosystem where value stays inside the
            platform. This allows faster transactions, better control, reduced
            risk, and seamless service integration across all Taurus products.
          </p>
        </div>

        {/* CTA */}
        <div className="mt-14">
          <h3 className="text-2xl font-bold text-white">
            Start Using Taurus Wallet
          </h3>

          <p className="mt-3 text-white/70">
            Experience a new way of using digital balance inside a powerful
            ecosystem.
          </p>

          <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            {/* Download button */}
            <a
              href="#download-link"
              className="rounded-xl bg-emerald-400 px-8 py-4 font-semibold text-black hover:scale-[1.05]"
            >
              Download Wallet
            </a>

            {/* Open Web */}
            <Link
              href="/wallet"
              className="rounded-xl border border-emerald-400/40 px-8 py-4 text-emerald-200 hover:bg-emerald-400/10"
            >
              Open Web Version
            </Link>
          </div>
        </div>

        {/* footer nav */}
        <div className="mt-12 flex justify-center gap-4">
          <Link
            href="/wallet/slide-5"
            className="rounded-xl border border-emerald-400/30 px-6 py-3 text-emerald-200 hover:bg-emerald-400/10"
          >
            Previous
          </Link>

          <Link
            href="/wallet"
            className="rounded-xl bg-emerald-400 px-6 py-3 font-semibold text-black"
          >
            Back to Wallet
          </Link>
        </div>
      </section>
    </main>
  );
}