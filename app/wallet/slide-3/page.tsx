"use client";

import Link from "next/link";

export default function WalletSlide3() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020617] text-white">
      {/* background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(56,189,248,0.12),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(99,102,241,0.12),transparent_25%),linear-gradient(135deg,#020617_0%,#030b1f_55%,#020617_100%)]" />

      <section className="relative mx-auto max-w-7xl px-6 py-10">
        {/* header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-300">
            Taurus Wallet • Slide 3
          </div>

          <Link
            href="/wallet/slide-2"
            className="rounded-xl border border-cyan-400/30 px-5 py-2 text-sm text-cyan-200 hover:bg-cyan-400/10"
          >
            Back
          </Link>
        </div>

        {/* title */}
        <div className="max-w-3xl mb-10">
          <h1 className="text-4xl font-extrabold md:text-6xl leading-tight">
            Secure Wallet System
            <span className="block text-cyan-300">
              Smart Balance & In-App Economy
            </span>
          </h1>

          <p className="mt-5 text-white/70 leading-8">
            Taurus Wallet is a secure internal digital wallet designed for the
            Taurus ecosystem. It stores TAT-based balance used for services like
            mobile top up, VPN access, offline payment, and in-app purchases.
          </p>
        </div>

        {/* grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Security */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <h3 className="text-xl font-bold text-cyan-300">Security</h3>
            <ul className="mt-4 space-y-2 text-sm text-white/70">
              <li>• Protected account system</li>
              <li>• Safe transaction handling</li>
              <li>• Future AI fraud detection</li>
            </ul>
          </div>

          {/* No Withdrawal */}
          <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-5 backdrop-blur">
            <h3 className="text-xl font-bold text-red-300">No Withdrawal</h3>
            <ul className="mt-4 space-y-2 text-sm text-red-100/80">
              <li>• Cannot withdraw to bank</li>
              <li>• No external wallet transfer</li>
              <li>• No cash conversion</li>
              <li>• In-app use only</li>
            </ul>
          </div>

          {/* Usage */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <h3 className="text-xl font-bold text-cyan-300">Usage</h3>
            <ul className="mt-4 space-y-2 text-sm text-white/70">
              <li>• Mobile Top Up</li>
              <li>• Taurus VPN</li>
              <li>• Offline Pay</li>
              <li>• In-App Purchase</li>
              <li>• Ecosystem services</li>
            </ul>
          </div>

          {/* Rewards */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <h3 className="text-xl font-bold text-cyan-300">Rewards</h3>
            <ul className="mt-4 space-y-2 text-sm text-white/70">
              <li>• Daily login reward</li>
              <li>• Referral bonus</li>
              <li>• Future usage rewards</li>
            </ul>
          </div>
        </div>

        {/* explanation box */}
        <div className="mt-10 rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-6 backdrop-blur">
          <h3 className="text-2xl font-bold text-cyan-200">
            Important Notice
          </h3>
          <p className="mt-4 text-sm md:text-base text-cyan-50/80 leading-7">
            TAT balance is designed for internal Taurus ecosystem usage only. It
            cannot be withdrawn, transferred to external wallets, or converted
            into cash. Users can spend their balance on services such as VPN,
            mobile top up, offline payments, and in-app upgrades.
          </p>
        </div>

        {/* footer */}
        <div className="mt-10 flex gap-4">
          <Link
            href="/wallet/slide-2"
            className="rounded-xl border border-cyan-400/30 px-6 py-3 text-cyan-200 hover:bg-cyan-400/10"
          >
            Previous
          </Link>

          <Link
            href="/wallet/slide-4"
            className="rounded-xl bg-cyan-400 px-6 py-3 font-semibold text-black"
          >
            Next Slide
          </Link>
        </div>
      </section>
    </main>
  );
}