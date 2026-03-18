"use client";

import Link from "next/link";

export default function WalletSlide4() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05040a] text-white">
      {/* background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(251,191,36,0.14),transparent_26%),radial-gradient(circle_at_78%_18%,rgba(249,115,22,0.12),transparent_22%),linear-gradient(135deg,#05040a_0%,#120912_55%,#04050b_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-10 [background-image:linear-gradient(rgba(251,191,36,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(251,191,36,0.14)_1px,transparent_1px)] [background-size:56px_56px]" />

      {/* glow */}
      <div className="absolute left-[8%] top-[18%] h-72 w-72 rounded-full bg-amber-300/10 blur-3xl" />
      <div className="absolute right-[10%] top-[20%] h-72 w-72 rounded-full bg-orange-400/10 blur-3xl" />

      <section className="relative mx-auto max-w-7xl px-6 py-10">
        {/* header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-sm text-amber-200">
            Taurus Wallet • Slide 4
          </div>

          <Link
            href="/wallet/slide-3"
            className="rounded-xl border border-amber-300/30 px-5 py-2 text-sm text-amber-100 hover:bg-amber-300/10"
          >
            Back
          </Link>
        </div>

        {/* hero */}
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          {/* left visual */}
          <div className="relative flex min-h-[460px] items-center justify-center">
            <div className="absolute h-[340px] w-[340px] rounded-full bg-amber-300/8 blur-3xl" />
            <div className="absolute h-[420px] w-[420px] rounded-full border border-amber-300/10" />
            <div className="absolute h-[500px] w-[500px] rounded-full border border-orange-300/10" />

            <div className="relative flex h-[320px] w-[320px] items-center justify-center rounded-full border border-amber-300/10 bg-white/[0.03] shadow-[0_0_80px_rgba(251,191,36,0.08)]">
              <div className="absolute h-[180px] w-[180px] rounded-full border border-amber-300/20" />
              <div className="absolute h-[240px] w-[240px] rounded-full border border-orange-300/10" />

              {/* phone */}
              <div className="absolute left-[18%] top-[26%] h-[150px] w-[88px] rounded-[24px] border border-white/10 bg-[#120d14] shadow-[0_0_24px_rgba(249,115,22,0.08)]">
                <div className="absolute left-1/2 top-3 h-1.5 w-10 -translate-x-1/2 rounded-full bg-white/10" />
                <div className="absolute left-[10px] right-[10px] top-[22px] bottom-[12px] rounded-[16px] border border-amber-300/10 bg-gradient-to-b from-amber-300/10 to-orange-300/5" />
                <div className="absolute left-1/2 top-[54%] h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-300/30" />
              </div>

              {/* merchant card */}
              <div className="absolute right-[12%] top-[32%] w-[120px] rounded-[18px] border border-white/10 bg-[#120d14] p-3 shadow-[0_0_24px_rgba(251,191,36,0.08)]">
                <div className="h-2.5 w-14 rounded-full bg-amber-300/50" />
                <div className="mt-3 h-8 rounded-xl bg-white/[0.04]" />
                <div className="mt-2 h-2.5 w-20 rounded-full bg-white/20" />
              </div>

              {/* connection lines */}
              <div className="absolute left-[44%] top-[48%] h-px w-[74px] bg-gradient-to-r from-amber-300/60 to-orange-300/50" />
              <div className="absolute left-[58%] top-[47%] h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.8)]" />

              {/* bottom badge */}
              <div className="absolute bottom-[18%] rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-xs tracking-[0.28em] text-amber-100/90">
                OFFLINE PAY
              </div>
            </div>
          </div>

          {/* right content */}
          <div className="max-w-xl">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.32em] text-amber-200">
              Offline Payment
            </p>

            <h1 className="text-4xl font-extrabold leading-tight md:text-6xl">
              Pay Without Internet
              <span className="mt-2 block text-amber-300">
                Built for real-world use
              </span>
            </h1>

            <p className="mt-6 text-base leading-8 text-white/72 md:text-lg">
              Taurus Wallet includes an offline payment concept for ecosystem use.
              This feature is designed for situations where a user may not have a
              stable internet connection but still needs to complete payment
              activity inside the Taurus environment.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
                <div className="text-lg font-bold text-amber-300">Use Cases</div>
                <div className="mt-3 text-sm leading-7 text-white/68">
                  Shop payments, local services, ecosystem merchant acceptance,
                  and controlled offline confirmation flow.
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
                <div className="text-lg font-bold text-amber-300">Goal</div>
                <div className="mt-3 text-sm leading-7 text-white/68">
                  Make Taurus Wallet useful even when users face unstable
                  connectivity or limited access conditions.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* details */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
            <h3 className="text-xl font-bold text-amber-300">How It Works</h3>
            <ul className="mt-4 space-y-2 text-sm leading-7 text-white/70">
              <li>• User starts a payment request</li>
              <li>• Merchant or service confirms locally</li>
              <li>• Wallet stores the action state</li>
              <li>• Final sync can happen later</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
            <h3 className="text-xl font-bold text-amber-300">Why It Matters</h3>
            <ul className="mt-4 space-y-2 text-sm leading-7 text-white/70">
              <li>• Better local usability</li>
              <li>• More flexible payment flow</li>
              <li>• Strong ecosystem utility</li>
              <li>• Supports real on-ground adoption</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
            <h3 className="text-xl font-bold text-amber-300">Current Status</h3>
            <ul className="mt-4 space-y-2 text-sm leading-7 text-white/70">
              <li>• Product concept confirmed</li>
              <li>• UI direction planned</li>
              <li>• Logic can be refined later</li>
              <li>• Expansion ready for merchants</li>
            </ul>
          </div>
        </div>

        {/* notice */}
        <div className="mt-10 rounded-3xl border border-amber-300/20 bg-amber-300/10 p-6 backdrop-blur">
          <h3 className="text-2xl font-bold text-amber-100">
            Important Explanation
          </h3>
          <p className="mt-4 text-sm leading-7 text-amber-50/85 md:text-base">
            Offline Pay is a controlled Taurus Wallet feature concept. It is not
            intended as unrestricted external cash transfer. The purpose is to
            support ecosystem transactions and merchant-style usage within Taurus
            services when internet availability is limited.
          </p>
        </div>

        {/* footer */}
        <div className="mt-10 flex gap-4">
          <Link
            href="/wallet/slide-3"
            className="rounded-xl border border-amber-300/30 px-6 py-3 text-amber-100 hover:bg-amber-300/10"
          >
            Previous
          </Link>

          <Link
            href="/wallet/slide-5"
            className="rounded-xl bg-amber-300 px-6 py-3 font-semibold text-black hover:scale-[1.02]"
          >
            Next Slide
          </Link>
        </div>
      </section>
    </main>
  );
}