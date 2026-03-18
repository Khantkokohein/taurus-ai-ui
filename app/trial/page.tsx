import Link from "next/link";

export default function TrialPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05081f] text-white">
      {/* Base dark gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(14,30,88,0.65)_0%,rgba(7,12,45,0.95)_38%,#030617_100%)]" />

      {/* Left glow */}
      <div className="absolute left-[-8%] top-[12%] h-[420px] w-[420px] rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="absolute left-[8%] top-[34%] h-[340px] w-[340px] rounded-full bg-fuchsia-500/20 blur-3xl" />

      {/* Right glow */}
      <div className="absolute right-[-8%] top-[10%] h-[360px] w-[360px] rounded-full bg-fuchsia-500/20 blur-3xl" />
      <div className="absolute right-[6%] bottom-[14%] h-[360px] w-[360px] rounded-full bg-cyan-400/20 blur-3xl" />

      {/* Left circuit lines */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-[32%] opacity-70">
        <div className="absolute left-[8%] top-[10%] h-[220px] w-[220px] rounded-full border border-cyan-300/20" />
        <div className="absolute left-[14%] top-[18%] h-[180px] w-[180px] rounded-full border border-cyan-300/15" />
        <div className="absolute left-[2%] top-[26%] h-[260px] w-[260px] rounded-full border border-fuchsia-400/15" />

        <div className="absolute left-[10%] top-[20%] h-px w-[180px] bg-cyan-300/35" />
        <div className="absolute left-[18%] top-[24%] h-px w-[120px] bg-cyan-300/25" />
        <div className="absolute left-[5%] top-[34%] h-px w-[210px] bg-fuchsia-400/30" />
        <div className="absolute left-[15%] top-[42%] h-px w-[170px] bg-cyan-300/25" />
        <div className="absolute left-[8%] top-[56%] h-px w-[220px] bg-fuchsia-400/25" />
        <div className="absolute left-[20%] top-[64%] h-px w-[120px] bg-cyan-300/25" />

        <div className="absolute left-[24%] top-[20%] h-[70px] w-px bg-cyan-300/25" />
        <div className="absolute left-[36%] top-[34%] h-[90px] w-px bg-fuchsia-400/25" />
        <div className="absolute left-[26%] top-[56%] h-[80px] w-px bg-cyan-300/25" />

        <div className="absolute left-[11%] top-[19.3%] h-2 w-2 rounded-sm bg-cyan-300/80 shadow-[0_0_12px_rgba(103,232,249,0.8)]" />
        <div className="absolute left-[31%] top-[19.3%] h-2 w-2 rounded-sm bg-cyan-300/70 shadow-[0_0_12px_rgba(103,232,249,0.8)]" />
        <div className="absolute left-[12%] top-[33.3%] h-2 w-2 rounded-sm bg-fuchsia-400/80 shadow-[0_0_12px_rgba(232,121,249,0.8)]" />
        <div className="absolute left-[32%] top-[41.3%] h-2 w-2 rounded-sm bg-cyan-300/80 shadow-[0_0_12px_rgba(103,232,249,0.8)]" />
        <div className="absolute left-[18%] top-[55.3%] h-2 w-2 rounded-sm bg-fuchsia-400/80 shadow-[0_0_12px_rgba(232,121,249,0.8)]" />
      </div>

      {/* Right circuit lines */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[32%] opacity-70">
        <div className="absolute right-[8%] top-[8%] h-[220px] w-[220px] rounded-full border border-fuchsia-400/20" />
        <div className="absolute right-[12%] top-[18%] h-[180px] w-[180px] rounded-full border border-fuchsia-400/15" />
        <div className="absolute right-[4%] bottom-[14%] h-[240px] w-[240px] rounded-full border border-cyan-300/15" />

        <div className="absolute right-[8%] top-[19%] h-px w-[180px] bg-fuchsia-400/35" />
        <div className="absolute right-[14%] top-[27%] h-px w-[120px] bg-cyan-300/25" />
        <div className="absolute right-[6%] top-[39%] h-px w-[220px] bg-fuchsia-400/25" />
        <div className="absolute right-[12%] top-[54%] h-px w-[180px] bg-cyan-300/25" />
        <div className="absolute right-[10%] top-[68%] h-px w-[210px] bg-cyan-300/25" />

        <div className="absolute right-[26%] top-[19%] h-[80px] w-px bg-fuchsia-400/25" />
        <div className="absolute right-[18%] top-[39%] h-[92px] w-px bg-cyan-300/25" />
        <div className="absolute right-[30%] top-[54%] h-[90px] w-px bg-cyan-300/25" />

        <div className="absolute right-[9%] top-[18.3%] h-2 w-2 rounded-sm bg-fuchsia-400/80 shadow-[0_0_12px_rgba(232,121,249,0.8)]" />
        <div className="absolute right-[28%] top-[18.3%] h-2 w-2 rounded-sm bg-fuchsia-400/80 shadow-[0_0_12px_rgba(232,121,249,0.8)]" />
        <div className="absolute right-[12%] top-[38.3%] h-2 w-2 rounded-sm bg-cyan-300/80 shadow-[0_0_12px_rgba(103,232,249,0.8)]" />
        <div className="absolute right-[31%] top-[53.3%] h-2 w-2 rounded-sm bg-cyan-300/80 shadow-[0_0_12px_rgba(103,232,249,0.8)]" />
        <div className="absolute right-[14%] top-[67.3%] h-2 w-2 rounded-sm bg-cyan-300/80 shadow-[0_0_12px_rgba(103,232,249,0.8)]" />
      </div>

      {/* Soft grid */}
      <div className="pointer-events-none absolute inset-0 opacity-10 [background-image:linear-gradient(rgba(59,130,246,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.18)_1px,transparent_1px)] [background-size:56px_56px]" />

      {/* Content */}
      <section className="relative mx-auto max-w-5xl px-6 py-10 md:px-10">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
              TAURUS AI
            </p>
            <h1 className="mt-2 text-4xl font-extrabold md:text-5xl">
              Start Free Trial
            </h1>
          </div>

          <Link
            href="/"
            className="rounded-xl border border-cyan-400/30 bg-white/5 px-5 py-3 text-sm font-semibold text-cyan-200 backdrop-blur transition hover:bg-cyan-400/10"
          >
            Back to Main UI
          </Link>
        </div>

        <div className="rounded-[32px] border border-white/10 bg-white/8 p-6 shadow-[0_0_50px_rgba(0,0,0,0.45)] backdrop-blur-xl md:p-7">
          <h2 className="text-2xl font-bold text-cyan-300">
            Free Trial Request Form
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70 md:text-base">
            This page is reserved for the free trial flow. Later, we can connect
            it to a real form, database, or Twilio process.
          </p>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-white/75">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Enter your full name"
                className="w-full rounded-2xl border border-white/10 bg-[#0a1030]/90 px-4 py-3 text-white outline-none placeholder:text-white/30"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/75">
                Email Address
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full rounded-2xl border border-white/10 bg-[#0a1030]/90 px-4 py-3 text-white outline-none placeholder:text-white/30"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/75">
                Business Type
              </label>
              <input
                type="text"
                placeholder="Customer support / recruitment / business"
                className="w-full rounded-2xl border border-white/10 bg-[#0a1030]/90 px-4 py-3 text-white outline-none placeholder:text-white/30"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/75">
                Phone Number
              </label>
              <input
                type="text"
                placeholder="Enter your phone number"
                className="w-full rounded-2xl border border-white/10 bg-[#0a1030]/90 px-4 py-3 text-white outline-none placeholder:text-white/30"
              />
            </div>
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm text-white/75">
              Project Notes
            </label>
            <textarea
              placeholder="Tell us how you want to use Taurus AI"
              rows={5}
              className="w-full rounded-2xl border border-white/10 bg-[#0a1030]/90 px-4 py-3 text-white outline-none placeholder:text-white/30"
            />
          </div>

          <div className="mt-6">
            <button className="rounded-xl bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_25px_rgba(34,211,238,0.45)] transition hover:scale-[1.02]">
              Submit Trial Request
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}