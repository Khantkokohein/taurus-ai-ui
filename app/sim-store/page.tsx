"use client";

import { useState } from "react";

export default function SimStorePage() {
  const [search, setSearch] = useState("");

  const start = 1000000;
  const end = 2000000;

  // generate only 100 numbers (performance safe)
  const numbers = Array.from({ length: 100 }, (_, i) => start + i);

  const filtered = numbers.filter((num) =>
    num.toString().includes(search)
  );

  return (
    <main className="min-h-screen bg-[#05081f] text-white px-6 py-10">
      <h1 className="text-4xl font-bold mb-4">Taurus SIM Store</h1>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search number (e.g. 777)"
        className="w-full mb-6 p-3 rounded-xl bg-[#0f172a] border border-white/10"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((num) => (
          <div
            key={num}
            className="p-5 rounded-2xl bg-white/5 border border-white/10"
          >
            <h2 className="text-xl font-semibold mb-2">
              +70 20 {num}
            </h2>

            <p className="text-white/60 mb-2">Normal Number</p>

            <p className="text-cyan-300 font-bold mb-4">
              1000 TAT
            </p>

            <button
              onClick={() => alert("Login required")}
              className="w-full py-2 rounded-xl bg-cyan-400 text-black font-semibold"
            >
              Buy Now
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}