"use client";

import { useEffect, useState } from "react";

export default function SimStorePage() {
  const [numbers, setNumbers] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const stored =
      JSON.parse(localStorage.getItem("sim_numbers") || "[]");
    setNumbers(stored);
  }, []);

  const filtered = numbers.filter((item) =>
    item.number.includes(search)
  );

  return (
    <main className="min-h-screen bg-[#05081f] text-white px-6 py-10">
      <h1 className="text-4xl font-bold mb-6">Taurus SIM Store</h1>

      {/* Search */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search number (e.g. 777)"
        className="w-full mb-8 p-3 rounded-xl bg-black/30 border border-white/10"
      />

      {/* Empty */}
      {filtered.length === 0 && (
        <p className="text-white/50">No numbers available.</p>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur"
          >
            <h2 className="text-xl font-semibold mb-2">
              +70 20 {item.number}
            </h2>

            {/* TYPE */}
            <p
              className={`mb-2 ${
                item.type === "vip"
                  ? "text-red-400"
                  : item.type === "premium"
                  ? "text-yellow-400"
                  : "text-cyan-300"
              }`}
            >
              {item.type.toUpperCase()}
            </p>

            {/* PRICE */}
            <p className="font-bold mb-4">
              {item.price.toLocaleString()} TAT
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