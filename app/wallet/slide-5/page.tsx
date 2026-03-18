"use client";

import Link from "next/link";

const services = [
  {
    title: "Taurus AI",
    desc: "Smart assistant, automation, and tools",
  },
  {
    title: "Taurus VPN",
    desc: "Private secure internet access",
  },
  {
    title: "Mobile Top Up",
    desc: "Recharge phone balance instantly",
  },
  {
    title: "Offline Pay",
    desc: "Pay even without internet access",
  },
  {
    title: "Digital Products",
    desc: "Buy services, tools, and upgrades",
  },
  {
    title: "In-App Purchases",
    desc: "Unlock premium features and access",
  },
];

export default function WalletSlide5() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020617] text-white">
      {/* background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_30%,rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.12),transparent_25%),linear-gradient(135deg,#020617_0%,#031b1b_55%,#020617_100%)]" />

      <section className="relative mx-auto max-w-7xl px-6 py-10">
        {/* header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-300">
            Taurus Wallet • Slide 5
          </div>

          <Link
            href="/wallet/slide-4"
            className="rounded-xl border border-cyan-400/30 px-5 py-2 text-sm text-cyan-200 hover:bg-cyan-400/10"
          >
            Back
          </Link>
        </div>

        {/* hero */}
        <div className="max-w-3xl mb-12">
          <h1 className="text-4xl font-extrabold md:text-6xl leading-tight">
            Taurus Ecosystem
            <span className="block text-cyan-300">
              One Wallet • Multiple Services
            </span>
          </h1>

          <p className="mt-6 text-white/70 leading-8">
            Taurus Wallet is not just a balance system. It is the entry point into
            the Taurus ecosystem, allowing users to access multiple services,
            digital products, and in-app features using a single unified wallet.
          </p>
        </div>

        {/* services grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((item) => (
            <div
              key={item.title}
              className="group relative rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur transition hover:scale-[1.02] hover:border-cyan-300/40"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-300/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition" />

              <h3 className="text-xl font-bold text-cyan-300">
                {item.title}
              </h3>

              <p className="mt-3 text-sm text-white/70 leading-7">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        {/* retention section */}
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
            <h3 className="text-2xl font-bold text-cyan-300">
              Ecosystem Retention
            </h3>
            <p className="mt-4 text-white/70 leading-7">
              Taurus Wallet keeps users inside the ecosystem by offering multiple
              services in one place. Users can continuously interact, spend,
              upgrade, and engage without leaving the platform.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
            <h3 className="text-2xl font-bold text-cyan-300">
              Entertainment Layer
            </h3>
            <p className="mt-4 text-white/70 leading-7">
              Future expansion includes entertainment and engagement features such
              as rewards, gamified systems, and user interaction tools to increase
              activity and retention.
            </p>
          </div>
        </div>

        {/* explanation */}
        <div className="mt-10 rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-6 backdrop-blur">
          <h3 className="text-2xl font-bold text-cyan-200">
            Unified Experience
          </h3>
          <p className="mt-4 text-sm md:text-base text-cyan-50/80 leading-7">
            Taurus Wallet acts as a central hub where all services connect. Users
            can use one balance across AI tools, VPN, payments, and digital
            services without switching platforms.
          </p>
        </div>

        {/* footer */}
        <div className="mt-10 flex gap-4">
          <Link
            href="/wallet/slide-4"
            className="rounded-xl border border-cyan-400/30 px-6 py-3 text-cyan-200 hover:bg-cyan-400/10"
          >
            Previous
          </Link>

          <Link
            href="/wallet/slide-6"
            className="rounded-xl bg-cyan-400 px-6 py-3 font-semibold text-black hover:scale-[1.02]"
          >
            Next Slide
          </Link>
        </div>
      </section>
    </main>
  );
}