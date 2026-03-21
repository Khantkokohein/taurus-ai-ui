"use client";

import { useState } from "react";

export default function SimStorePage() {
  const [search, setSearch] = useState("");

  // 👉 range
  const start = 1000000;

  // 👉 generate 200 numbers (performance safe)
  const numbers = Array.from({ length: 200 }, (_, i) => start + i);

  // 👉 manual removed list (မင်း edit လုပ်နိုင်)
  const removedList = new Set<number>([
    1111111,
    1234567,
    7777777,
    1000000,
  ]);

  // 👉 auto premium detect
  function isPremium(num: number) {
    const s = num.toString();

    // all same
    if (/^(\d)\1{6}$/.test(s)) return true;

    // sequence
    if ("0123456789".includes(s)) return true;

    // reverse
    if ("9876543210".includes(s)) return true;

    // repeating block
    if (/(\d)\1{2,}/.test(s)) return true;

    // mirror
    if (s === s.split("").reverse().join("")) return true;

    return false;
  }

  // 👉 normal numbers (auto + manual remove)
  const normalNumbers = numbers.filter(
    (num) =>
      !isPremium(num) &&
      !removedList.has(num) &&
      num.toString().includes(search)
  );

  // 👉 premium numbers
  const premiumNumbers = numbers.filter(
    (num) => isPremium(num) && num.toString().includes(search)
  );

  return (
    <main className="min-h-screen bg-[#05081f] text-white px-6 py-10">
      <h1 className="text-4xl font-bold mb-4">Taurus SIM Store</h1>

      {/* Search */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search number (e.g. 777)"
        className="w-full mb-8 p-3 rounded-xl bg-[#0f172a] border border-white/10 outline-none"
      />

      {/* 🔹 NORMAL NUMBERS */}
      <h2 className="text-2xl mb-4 text-cyan-300">Normal Numbers</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {normalNumbers.map((num) => (
          <div
            key={num}
            className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur hover:border-cyan-400/30 transition"
          >
            <h2 className="text-xl font-semibold mb-2">
              +70 20 {num}
            </h2>

            <p className="text-white/60 mb-2">Normal Number</p>

            <p className="text-cyan-300 font-bold mb-4">1000 TAT</p>

            <button
              onClick={() => alert("Login required")}
              className="w-full py-2 rounded-xl bg-cyan-400 text-black font-semibold hover:bg-cyan-300"
            >
              Buy Now
            </button>
          </div>
        ))}
      </div>

      {/* 🔥 PREMIUM SECTION */}
      <h2 className="text-2xl mt-12 mb-4 text-yellow-400">
        Premium Numbers ⭐
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {premiumNumbers.map((num) => (
          <div
            key={num}
            className="p-5 rounded-2xl bg-white/5 border border-yellow-400/30 backdrop-blur"
          >
            <h2 className="text-xl font-semibold mb-2">
              +70 20 {num}
            </h2>

            <p className="text-yellow-400 mb-2">Premium Number ⭐</p>

            <p className="text-yellow-300 font-bold mb-4">
              {50000} TAT
            </p>

            <button
              onClick={() => alert("Login required")}
              className="w-full py-2 rounded-xl bg-yellow-400 text-black font-semibold hover:bg-yellow-300"
            >
              Buy Premium
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}