"use client";

import Link from "next/link";

export default function Home() {
  const brands = [
    {
      name: "Taurus AI Recruitment",
      href: "https://recruitment.taurusai.site/",
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
      name: "Taurus Sim Store",
      href: "/sim-store",
      clickable: true,
      external: false,
    },
    {
      name: "Taurus Web Call",
      href: "/web-call",
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

      <section className="relative mx-auto max-w-7xl px-6 py-10 md:px-10 lg:px-12">

        {/* HERO */}
        <div className="mb-10 inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-300 backdrop-blur">
          Taurus Ecosystem • AI Calling Landing Page
        </div>

        <h1 className="text-4xl font-extrabold md:text-6xl">
          Taurus AI
          <span className="block text-cyan-300">
            Deep Calling System
          </span>
        </h1>

        <p className="mt-6 max-w-xl text-base text-white/75 md:text-lg">
          Smart AI-powered voice calling system for customer support,
          recruitment communication, and service automation.
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/trial"
            className="rounded-xl bg-cyan-400 px-6 py-3 text-sm font-semibold text-black"
          >
            Start Free Trial
          </Link>

          <Link
            href="/vpn"
            className="rounded-xl border border-cyan-400/40 px-6 py-3 text-sm text-cyan-200"
          >
            Use For VPN
          </Link>

          <button
            onClick={handleDomainsComingSoon}
            className="rounded-xl border border-cyan-400/40 px-6 py-3 text-sm text-cyan-200"
          >
            Domains
          </button>
        </div>

        {/* ECOSYSTEM */}
        <div className="mt-16 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {brands.map((brand) =>
            brand.clickable ? (
              brand.external ? (
                <a
                  key={brand.name}
                  href={brand.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-2xl border border-white/10 bg-white/5 p-5"
                >
                  <h3 className="text-lg font-semibold">
                    {brand.name}
                  </h3>
                </a>
              ) : (
                <Link
                  key={brand.name}
                  href={brand.href}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5"
                >
                  <h3 className="text-lg font-semibold">
                    {brand.name}
                  </h3>
                </Link>
              )
            ) : (
              <div
                key={brand.name}
                className="rounded-2xl border border-white/10 bg-white/5 p-5"
              >
                <h3 className="text-lg font-semibold">
                  {brand.name}
                </h3>
              </div>
            )
          )}
        </div>

        {/* CONTACT */}
        <div className="mt-16 rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-6">
          <h3 className="text-2xl font-bold text-cyan-200">
            Contact Us
          </h3>

          <div className="mt-4 space-y-4 text-sm text-cyan-50/80">

            <div>
              Support Email:
              <br />
              support@taurusai.site
            </div>

            <div>
              AI Number:
              <br />
              +70 20 7777777
            </div>

            <div>
              Founder Number:
              <br />
              +70 20 9999999
            </div>

            <div>
              Built in Mawlamyine, Myanmar
            </div>

          </div>
        </div>

      </section>
    </main>
  );
}