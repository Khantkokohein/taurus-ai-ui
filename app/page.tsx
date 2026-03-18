"use client";

import Link from "next/link";

export default function Home() {
  const brands = [
    {
      name: "Taurus AI Recruitment",
      href: "https://taurus-ai-beta.vercel.app/",
      clickable: true,
      external: true,
    },
    {
      name: "Taurus VPN",
      href: "/vpn",
      clickable: true,
      external: false,
    },
    {
      name: "Taurus Wallet",
      href: "/wallet",
      clickable: true,
      external: false,
    },
    {
      name: "Taurus Market",
      href: "#",
      clickable: false,
      external: false,
    },
    {
      name: "Taurus Music",
      href: "/beats",
      clickable: true,
      external: false,
    },
    {
  name: "Taurus Chat",
  href: "/chat",
  clickable: true,
  external: false,
},
    {
      name: "Offline Pay",
      href: "/wallet/slide-4",
      clickable: true,
      external: false,
    },
    {
      name: "In-App Purchase Coin",
      href: "/wallet/slide-6",
      clickable: true,
      external: false,
    },
  ];

  const handleDomainsComingSoon = (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    alert("Domains feature coming soon.");
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05081f] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_35%_35%,rgba(168,85,247,0.22),transparent_24%),radial-gradient(circle_at_75%_30%,rgba(59,130,246,0.12),transparent_22%),linear-gradient(135deg,#040817_0%,#070b2d_45%,#030617_100%)]" />

      <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(59,130,246,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.14)_1px,transparent_1px)] [background-size:64px_64px]" />

      <div className="absolute left-[8%] top-[12%] h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="absolute left-[18%] top-[20%] h-80 w-80 rounded-full bg-fuchsia-500/20 blur-3xl" />
      <div className="absolute right-[10%] top-[10%] h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

      <section className="relative mx-auto max-w-7xl px-6 py-10 md:px-10 lg:px-12">
        <div className="mb-10 inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-300 backdrop-blur">
          Taurus Ecosystem • AI Calling Landing Page
        </div>

        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative flex min-h-[420px] items-center justify-center">
            <div className="absolute h-[360px] w-[360px] rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="absolute h-[280px] w-[280px] rounded-full border border-cyan-300/25" />
            <div className="absolute h-[380px] w-[380px] rounded-full border border-fuchsia-400/10" />
            <div className="absolute h-[440px] w-[440px] rounded-full border border-cyan-300/10" />

            <div className="absolute h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.18)_0%,rgba(168,85,247,0.12)_28%,rgba(0,0,0,0)_65%)] blur-2xl" />

            <div className="relative flex h-[240px] w-[240px] items-center justify-center rounded-full border border-white/10 bg-white/5 shadow-[0_0_100px_rgba(34,211,238,0.18)] backdrop-blur-md">
              <div className="absolute inset-[-22px] rounded-full border border-cyan-300/10" />
              <div className="absolute inset-[-44px] rounded-full border border-fuchsia-400/10" />
              <div className="text-center">
                <div className="text-7xl font-extrabold tracking-tight md:text-8xl">
                  AI
                </div>
                <div className="mt-2 text-xs uppercase tracking-[0.35em] text-cyan-200/80">
                  Taurus Intelligence
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-2xl">
            <p className="mb-4 text-base font-medium uppercase tracking-[0.25em] text-cyan-300">
              Artificial Intelligence
            </p>

            <h1 className="text-4xl font-extrabold leading-tight md:text-6xl">
              Taurus AI
              <span className="block text-cyan-300">Deep Calling System</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-white/75 md:text-lg">
              Smart AI-powered voice calling system for customer support,
              recruitment communication, service automation, and future Taurus
              digital ecosystem integration.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/trial"
                className="rounded-xl bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_25px_rgba(34,211,238,0.35)] transition hover:scale-[1.02]"
              >
                Start Free Trial
              </Link>

              <Link
                href="/vpn"
                className="rounded-xl border border-cyan-400/40 bg-white/5 px-6 py-3 text-sm font-semibold text-cyan-200 backdrop-blur transition hover:bg-cyan-400/10"
              >
                Use For VPN
              </Link>

              <button
                onClick={handleDomainsComingSoon}
                className="rounded-xl border border-cyan-400/40 bg-white/5 px-6 py-3 text-sm font-semibold text-cyan-200 backdrop-blur transition hover:bg-cyan-400/10"
              >
                Domains
              </button>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <div className="text-2xl font-bold text-cyan-300">AI</div>
                <div className="mt-1 text-sm text-white/70">
                  Intelligent voice automation
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <div className="text-2xl font-bold text-cyan-300">24/7</div>
                <div className="mt-1 text-sm text-white/70">
                  Continuous support handling
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <div className="text-2xl font-bold text-cyan-300">Multi Use</div>
                <div className="mt-1 text-sm text-white/70">
                  Recruitment, VPN, wallet and more
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold md:text-3xl">
                Taurus Ecosystem
              </h2>
              <p className="mt-2 text-sm text-white/65 md:text-base">
                Current and upcoming Taurus products inside one connected system.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {brands.map((brand) =>
              brand.clickable ? (
                brand.external ? (
                  <a
                    key={brand.name}
                    href={brand.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur transition hover:border-cyan-400/30 hover:bg-white/10"
                  >
                    <div className="mb-3 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-xs font-medium text-cyan-300">
                      Taurus Brand
                    </div>
                    <h3 className="text-lg font-semibold text-white">
                      {brand.name}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-white/60">
                      Integrated service module planned for the Taurus platform.
                    </p>
                  </a>
                ) : (
                  <Link
                    key={brand.name}
                    href={brand.href}
                    className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur transition hover:border-cyan-400/30 hover:bg-white/10"
                  >
                    <div className="mb-3 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-xs font-medium text-cyan-300">
                      Taurus Brand
                    </div>
                    <h3 className="text-lg font-semibold text-white">
                      {brand.name}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-white/60">
                      Integrated service module planned for the Taurus platform.
                    </p>
                  </Link>
                )
              ) : (
                <div
                  key={brand.name}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur transition hover:border-cyan-400/30 hover:bg-white/10"
                >
                  <div className="mb-3 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-xs font-medium text-cyan-300">
                    Taurus Brand
                  </div>
                  <h3 className="text-lg font-semibold text-white">
                    {brand.name}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-white/60">
                    Integrated service module planned for the Taurus platform.
                  </p>
                </div>
              )
            )}
          </div>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <h3 className="text-2xl font-bold">How It Works</h3>
            <ol className="mt-5 space-y-3 text-sm leading-7 text-white/75 md:text-base">
              <li>1. User places a call or receives an automated call.</li>
              <li>2. Taurus AI answers and processes the request flow.</li>
              <li>3. The system provides support, routing, or task handling.</li>
            </ol>
          </div>

          <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-6 backdrop-blur">
            <h3 className="text-2xl font-bold text-cyan-200">Project Contact</h3>
            <p className="mt-4 text-sm leading-7 text-cyan-50/80 md:text-base">
              Domain email, live demo link, and production deployment will be
              added after setup completion.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}