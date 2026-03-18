"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

const modes = [
  {
    title: "Morning Mode",
    subtitle: "Fresh start dashboard",
    desc: "Bright and clear interface for checking balance, rewards, and daily actions at the start of the day.",
    glow: "from-cyan-300/35 via-sky-400/20 to-transparent",
    ring: "border-cyan-300/30",
    badge: "MORNING",
    image: "/wallet/morning.png",
  },
  {
    title: "Afternoon Mode",
    subtitle: "Clean active workspace",
    desc: "Balanced daytime layout designed for payments, wallet activity, and service access during peak use hours.",
    glow: "from-blue-300/30 via-cyan-300/15 to-transparent",
    ring: "border-blue-300/30",
    badge: "AFTERNOON",
    image: "/wallet/afternoon.png",
  },
  {
    title: "Evening Mode",
    subtitle: "Warm transition view",
    desc: "Soft visual tone for a more relaxed experience while managing services, rewards, and account activity.",
    glow: "from-fuchsia-300/30 via-orange-300/15 to-transparent",
    ring: "border-fuchsia-300/30",
    badge: "EVENING",
    image: "/wallet/evening.png",
  },
  {
    title: "Night Mode",
    subtitle: "Focused premium interface",
    desc: "Dark immersive layout for secure late-hour usage, ecosystem drops, and uninterrupted navigation.",
    glow: "from-indigo-300/30 via-cyan-300/10 to-transparent",
    ring: "border-indigo-300/30",
    badge: "NIGHT",
    image: "/wallet/night.png",
  },
];

export default function WalletSlide2() {
  const [selected, setSelected] = useState<any>(null);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#030617] text-white">
      {/* background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(56,189,248,0.12),transparent_28%),radial-gradient(circle_at_78%_18%,rgba(59,130,246,0.08),transparent_20%),linear-gradient(135deg,#020617_0%,#040b24_55%,#020617_100%)]" />

      {/* header */}
      <section className="relative mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-300">
            Taurus Wallet • Slide 2
          </div>

          <Link
            href="/wallet"
            className="rounded-xl border border-cyan-400/30 px-5 py-2 text-sm text-cyan-200 hover:bg-cyan-400/10"
          >
            Back
          </Link>
        </div>

        {/* title */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold md:text-5xl">
            Daily Time Modes
            <span className="block text-cyan-300">
              Adaptive Visual Dashboard
            </span>
          </h1>

          <p className="mt-4 max-w-2xl text-white/70">
            Tap any mode to preview the real wallet interface for that time.
          </p>
        </div>

        {/* grid */}
        <div className="grid gap-5 md:grid-cols-2">
          {modes.map((mode) => (
            <button
              key={mode.title}
              onClick={() => setSelected(mode)}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 text-left backdrop-blur transition hover:border-cyan-400/40 hover:bg-white/10"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${mode.glow} opacity-70`}
              />

              <div className="relative">
                <div
                  className={`mb-4 h-[140px] rounded-xl border ${mode.ring} bg-[#071224] flex items-center justify-center`}
                >
                  <span className="text-cyan-300 text-sm">
                    Click to Preview
                  </span>
                </div>

                <h2 className="text-xl font-bold">{mode.title}</h2>
                <p className="text-cyan-300 text-sm">{mode.subtitle}</p>
                <p className="mt-2 text-sm text-white/70">{mode.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* footer */}
        <div className="mt-8 flex gap-4">
          <Link
            href="/wallet"
            className="rounded-xl border border-cyan-400/30 px-6 py-3 text-cyan-200 hover:bg-cyan-400/10"
          >
            Previous
          </Link>

          <Link
            href="/wallet/slide-3"
            className="rounded-xl bg-cyan-400 px-6 py-3 font-semibold text-black"
          >
            Next Slide
          </Link>
        </div>
      </section>

      {/* MODAL */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="relative w-full max-w-4xl px-4">
            <button
              onClick={() => setSelected(null)}
              className="absolute right-4 top-4 z-10 rounded-full bg-black/60 px-3 py-1 text-sm"
            >
              ✕
            </button>

            <div className="relative h-[70vh] w-full overflow-hidden rounded-xl">
              <Image
                src={selected.image}
                alt={selected.title}
                fill
                className="object-cover"
              />
            </div>

            <div className="mt-4 text-center">
              <h2 className="text-2xl font-bold">{selected.title}</h2>
              <p className="text-cyan-300">{selected.subtitle}</p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}