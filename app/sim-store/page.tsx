"use client";

import { useEffect, useMemo, useState } from "react";

type SimType = "normal" | "premium" | "vip";
type SimStatus = "available" | "sold";

type SimItem = {
  id: number;
  number: string;
  price: number;
  type: SimType;
  isOnSale: boolean;
  salePrice: number | null;
  status: SimStatus;
  createdAt: string;
};

function getTypeBadge(type: SimType) {
  if (type === "vip") {
    return (
      <span className="inline-flex rounded-full border border-red-400/30 bg-red-400/10 px-2.5 py-1 text-xs font-medium text-red-300">
        VIP
      </span>
    );
  }

  if (type === "premium") {
    return (
      <span className="inline-flex rounded-full border border-yellow-400/30 bg-yellow-400/10 px-2.5 py-1 text-xs font-medium text-yellow-300">
        Premium
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-xs font-medium text-cyan-300">
      Normal
    </span>
  );
}

export default function SimStorePage() {
  const [numbers, setNumbers] = useState<SimItem[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("sim_numbers") || "[]");
    setNumbers(stored);
  }, []);

  const filteredNumbers = useMemo(() => {
    const keyword = search.trim();
    if (!keyword) return numbers;
    return numbers.filter((item) => item.number.includes(keyword));
  }, [numbers, search]);

  const saleNumbers = filteredNumbers.filter(
    (item) => item.isOnSale && item.status === "available"
  );

  const normalNumbers = filteredNumbers.filter(
    (item) =>
      item.type === "normal" && !item.isOnSale
  );

  const premiumNumbers = filteredNumbers.filter(
    (item) =>
      item.type === "premium" && !item.isOnSale
  );

  const vipNumbers = filteredNumbers.filter(
    (item) =>
      item.type === "vip" && !item.isOnSale
  );

  const soldNumbers = filteredNumbers.filter((item) => item.status === "sold");

  const renderCard = (item: SimItem, color: "cyan" | "yellow" | "red" | "green") => {
    const colorMap = {
      cyan: {
        border: "border-white/10",
        bg: "bg-white/5",
        hover: "hover:border-cyan-400/30 hover:bg-white/10",
        price: "text-cyan-300",
        button: "bg-cyan-400 text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.20)]",
      },
      yellow: {
        border: "border-yellow-400/20",
        bg: "bg-yellow-400/5",
        hover: "hover:border-yellow-400/35 hover:bg-white/10",
        price: "text-yellow-300",
        button: "bg-yellow-300 text-slate-950 shadow-[0_0_20px_rgba(253,224,71,0.20)]",
      },
      red: {
        border: "border-red-400/20",
        bg: "bg-red-400/5",
        hover: "hover:border-red-400/35 hover:bg-white/10",
        price: "text-red-300",
        button: "bg-red-300 text-slate-950 shadow-[0_0_20px_rgba(248,113,113,0.20)]",
      },
      green: {
        border: "border-green-400/20",
        bg: "bg-green-400/5",
        hover: "hover:border-green-400/35 hover:bg-white/10",
        price: "text-green-300",
        button: "bg-green-300 text-slate-950 shadow-[0_0_20px_rgba(74,222,128,0.20)]",
      },
    };

    const style = colorMap[color];
    const sold = item.status === "sold";

    return (
      <div
        key={item.id}
        className={`rounded-2xl border p-5 backdrop-blur transition ${style.border} ${style.bg} ${style.hover}`}
      >
        <div className="mb-3 flex flex-wrap gap-2">
          {getTypeBadge(item.type)}
          {item.isOnSale && item.status === "available" && (
            <span className="inline-flex rounded-full border border-green-400/20 bg-green-400/10 px-2.5 py-1 text-xs font-medium text-green-300">
              SALE
            </span>
          )}
          {sold && (
            <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-xs font-medium text-white/80">
              Sold
            </span>
          )}
        </div>

        <h3 className="text-lg font-semibold text-white">+70 20 {item.number}</h3>

        <p className="mt-2 text-sm leading-6 text-white/60">
          Taurus SIM number listing from the admin dashboard.
        </p>

        <div className="mt-4">
          {item.isOnSale && item.salePrice && item.status === "available" ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-white/35 line-through">
                {item.price.toLocaleString()} TAT
              </span>
              <span className="text-lg font-bold text-green-300">
                {item.salePrice.toLocaleString()} TAT
              </span>
            </div>
          ) : (
            <div className={`text-xl font-bold ${style.price}`}>
              {item.price.toLocaleString()} TAT
            </div>
          )}
        </div>

        {sold ? (
          <button
            disabled
            className="mt-5 w-full cursor-not-allowed rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white/55"
          >
            Sold Out
          </button>
        ) : (
          <button
            onClick={() => alert("Login required before purchase.")}
            className={`mt-5 w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:scale-[1.01] ${style.button}`}
          >
            Buy Now
          </button>
        )}
      </div>
    );
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05081f] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.16),transparent_24%),radial-gradient(circle_at_80%_15%,rgba(168,85,247,0.16),transparent_22%),linear-gradient(135deg,#040817_0%,#070b2d_45%,#030617_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(59,130,246,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.12)_1px,transparent_1px)] [background-size:64px_64px]" />

      <section className="relative mx-auto max-w-7xl px-6 py-10 md:px-10 lg:px-12">
        <div className="mb-6 inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-300 backdrop-blur">
          Taurus SIM • Digital Number Marketplace
        </div>

        <div className="mb-10 max-w-3xl">
          <h1 className="text-4xl font-extrabold md:text-5xl">Taurus SIM Store</h1>
          <p className="mt-4 text-base leading-8 text-white/75 md:text-lg">
            Browse sale items, normal listings, premium numbers, and VIP selections.
          </p>
        </div>

        <div className="mb-10 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <label className="mb-3 block text-sm font-medium text-cyan-200">
            Search Taurus Number
          </label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search number (example: 777, 123, 000)"
            className="w-full rounded-2xl border border-white/10 bg-[#0b1228] px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-cyan-400/40"
          />
        </div>

        <div className="mb-12">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-green-300">Sale Numbers</h2>
              <p className="mt-1 text-sm text-white/60">
                Discounted Taurus SIM numbers available right now.
              </p>
            </div>
            <div className="text-sm text-white/50">{saleNumbers.length} result(s)</div>
          </div>

          {saleNumbers.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/60 backdrop-blur">
              No sale numbers found.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {saleNumbers.map((item) => renderCard(item, "green"))}
            </div>
          )}
        </div>

        <div className="mb-12">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-cyan-300">Normal Numbers</h2>
              <p className="mt-1 text-sm text-white/60">
                Standard Taurus numbers available now.
              </p>
            </div>
            <div className="text-sm text-white/50">{normalNumbers.length} result(s)</div>
          </div>

          {normalNumbers.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/60 backdrop-blur">
              No normal numbers found.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {normalNumbers.map((item) => renderCard(item, "cyan"))}
            </div>
          )}
        </div>

        <div className="mb-12">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-yellow-300">Premium Numbers</h2>
              <p className="mt-1 text-sm text-white/60">
                Premium Taurus SIM numbers with stronger visual identity.
              </p>
            </div>
            <div className="text-sm text-white/50">{premiumNumbers.length} result(s)</div>
          </div>

          {premiumNumbers.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/60 backdrop-blur">
              No premium numbers found.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {premiumNumbers.map((item) => renderCard(item, "yellow"))}
            </div>
          )}
        </div>

        <div className="mb-12">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-red-300">VIP Numbers</h2>
              <p className="mt-1 text-sm text-white/60">
                High-value Taurus SIM numbers for premium buyers.
              </p>
            </div>
            <div className="text-sm text-white/50">{vipNumbers.length} result(s)</div>
          </div>

          {vipNumbers.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/60 backdrop-blur">
              No VIP numbers found.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {vipNumbers.map((item) => renderCard(item, "red"))}
            </div>
          )}
        </div>

        <div>
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Sold Numbers</h2>
              <p className="mt-1 text-sm text-white/60">
                These numbers are already sold and cannot be purchased again.
              </p>
            </div>
            <div className="text-sm text-white/50">{soldNumbers.length} result(s)</div>
          </div>

          {soldNumbers.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/60 backdrop-blur">
              No sold numbers found.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {soldNumbers.map((item) => renderCard(item, "cyan"))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}