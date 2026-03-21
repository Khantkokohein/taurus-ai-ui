"use client";

import { useMemo, useState } from "react";

const MAX_LENGTH = 14;

const presets = [
  { label: "Taurus Classic", value: "classic" },
  { label: "Sales AI", value: "sales" },
  { label: "Support AI", value: "support" },
  { label: "Founder AI", value: "founder" },
];

const pad = [
  [
    { key: "1", sub: "" },
    { key: "2", sub: "ABC" },
    { key: "3", sub: "DEF" },
  ],
  [
    { key: "4", sub: "GHI" },
    { key: "5", sub: "JKL" },
    { key: "6", sub: "MNO" },
  ],
  [
    { key: "7", sub: "PQRS" },
    { key: "8", sub: "TUV" },
    { key: "9", sub: "WXYZ" },
  ],
  [
    { key: "*", sub: "" },
    { key: "0", sub: "+" },
    { key: "#", sub: "" },
  ],
];

export default function WebCallPage() {
  const [dialMode, setDialMode] = useState("classic");
  const [phone, setPhone] = useState("+70 20");
  const [isCalling, setIsCalling] = useState(false);

  const cleanedNumber = useMemo(() => phone.replace(/\s+/g, ""), [phone]);

  const handleAppend = (value: string) => {
    if (isCalling) return;

    const next = `${phone}${value}`;
    if (next.replace(/\s+/g, "").length > MAX_LENGTH) return;
    setPhone(next);
  };

  const handleDelete = () => {
    if (isCalling) return;
    if (phone.length <= 6) return;
    setPhone((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (isCalling) return;
    setPhone("+70 20");
  };

  const handleCall = () => {
    if (cleanedNumber.length < 8) return;
    setIsCalling(true);

    setTimeout(() => {
      setIsCalling(false);
      alert(`Calling ${phone}`);
    }, 1200);
  };

  const statusText = isCalling
    ? "Connecting to Taurus AI..."
    : cleanedNumber.length > 6
    ? "Ready to call"
    : "Enter number";

  return (
    <main className="min-h-screen bg-[#e9ecef] px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center justify-center">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[1fr_430px]">
          <section className="hidden lg:block">
            <div className="max-w-xl">
              <div className="inline-flex rounded-full border border-slate-300 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-600 backdrop-blur">
                Taurus AI Web Call
              </div>

              <h1 className="mt-6 text-5xl font-extrabold leading-tight text-slate-900">
                Smart Calling
                <span className="block text-slate-500">Inside Taurus AI</span>
              </h1>

              <p className="mt-6 max-w-lg text-lg leading-8 text-slate-600">
                Secure browser-based dial experience for Taurus AI calling,
                support routing, and future intelligent voice automation.
              </p>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm">
                  <div className="text-2xl font-bold text-slate-900">AI</div>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Intelligent response handling
                  </p>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm">
                  <div className="text-2xl font-bold text-slate-900">Web</div>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Browser-first calling flow
                  </p>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm">
                  <div className="text-2xl font-bold text-slate-900">Live</div>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Built for production upgrade
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="mx-auto w-full max-w-[430px]">
            <div className="relative overflow-hidden rounded-[42px] border border-slate-300 bg-[#f5f5f7] shadow-[0_20px_70px_rgba(0,0,0,0.18)]">
              <div className="flex justify-center pt-5">
                <div className="h-8 w-32 rounded-full bg-black" />
              </div>

              <div className="px-5 pb-8 pt-3">
                <div className="flex items-start justify-end">
                  <select
                    value={dialMode}
                    onChange={(e) => setDialMode(e.target.value)}
                    className="rounded-full border border-slate-300 bg-white px-5 py-3 text-base font-medium text-slate-800 shadow-sm outline-none"
                  >
                    {presets.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-6 rounded-[28px] bg-white px-5 py-6 shadow-sm">
                  <p className="text-center text-sm font-medium text-slate-500">
                    {presets.find((item) => item.value === dialMode)?.label}
                  </p>

                  <div className="mt-4 min-h-[68px] text-center">
                    <div className="break-all text-[34px] font-semibold tracking-[0.08em] text-slate-900">
                      {phone}
                    </div>
                  </div>

                  <div className="mt-3 text-center text-sm text-slate-500">
                    {statusText}
                  </div>
                </div>

                <div className="mt-7 grid gap-y-6">
                  {pad.map((row, rowIndex) => (
                    <div
                      key={rowIndex}
                      className="grid grid-cols-3 justify-items-center gap-4"
                    >
                      {row.map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => handleAppend(item.key)}
                          className="flex h-24 w-24 flex-col items-center justify-center rounded-full border border-slate-300 bg-[#f6f6f4] text-slate-900 shadow-sm transition active:scale-95"
                        >
                          <span className="text-[28px] font-medium leading-none">
                            {item.key}
                          </span>
                          <span className="mt-2 text-xs font-medium tracking-[0.25em] text-slate-500">
                            {item.sub}
                          </span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>

                <div className="mt-7 flex items-center justify-center gap-5">
                  <button
                    type="button"
                    onClick={handleClear}
                    className="flex h-14 min-w-[88px] items-center justify-center rounded-full border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition active:scale-95"
                  >
                    Clear
                  </button>

                  <button
                    type="button"
                    onClick={handleCall}
                    disabled={cleanedNumber.length < 8 || isCalling}
                    className="flex h-20 w-20 items-center justify-center rounded-full bg-[#1fc95d] text-3xl shadow-[0_12px_30px_rgba(31,201,93,0.35)] transition active:scale-95 disabled:opacity-60"
                  >
                    ☎
                  </button>

                  <button
                    type="button"
                    onClick={handleDelete}
                    className="flex h-14 min-w-[88px] items-center justify-center rounded-full border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition active:scale-95"
                  >
                    Delete
                  </button>
                </div>

                <div className="mt-7 text-center text-xs leading-6 text-slate-500">
                  Taurus AI Web Call interface — production-ready browser dial
                  experience
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}