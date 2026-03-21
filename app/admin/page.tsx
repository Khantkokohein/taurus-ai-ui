"use client";

import { useEffect, useMemo, useState } from "react";

type SimType = "normal" | "premium" | "vip";

type SimItem = {
  id: number;
  number: string;
  price: number;
  type: SimType;
  isOnSale: boolean;
  salePrice: number | null;
  createdAt: string;
};

function getTypeFromPrice(price: number): SimType {
  if (price >= 10000) return "vip";
  if (price >= 5000) return "premium";
  return "normal";
}

function formatPrice(value: number | null) {
  if (value === null) return "-";
  return `${value.toLocaleString()} TAT`;
}

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

export default function AdminPage() {
  const [number, setNumber] = useState("");
  const [price, setPrice] = useState(1000);
  const [isOnSale, setIsOnSale] = useState(false);
  const [salePrice, setSalePrice] = useState("");
  const [list, setList] = useState<SimItem[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("sim_numbers") || "[]");
    setList(stored);
  }, []);

  const addNumber = () => {
    const cleanNumber = number.trim();

    if (!cleanNumber) {
      alert("Please enter a SIM number.");
      return;
    }

    if (!/^\d{7}$/.test(cleanNumber)) {
      alert("SIM number must be exactly 7 digits.");
      return;
    }

    const exists = list.some((item) => item.number === cleanNumber);
    if (exists) {
      alert("This number already exists.");
      return;
    }

    const finalSalePrice =
      isOnSale && salePrice.trim() ? Number(salePrice.trim()) : null;

    if (isOnSale) {
      if (!finalSalePrice || finalSalePrice <= 0) {
        alert("Please enter a valid sale price.");
        return;
      }

      if (finalSalePrice >= price) {
        alert("Sale price should be lower than the main price.");
        return;
      }
    }

    const newItem: SimItem = {
      id: Date.now(),
      number: cleanNumber,
      price,
      type: getTypeFromPrice(price),
      isOnSale,
      salePrice: finalSalePrice,
      createdAt: new Date().toISOString(),
    };

    const updated = [newItem, ...list];
    localStorage.setItem("sim_numbers", JSON.stringify(updated));
    setList(updated);

    setNumber("");
    setPrice(1000);
    setIsOnSale(false);
    setSalePrice("");
  };

  const deleteNumber = (id: number) => {
    const ok = window.confirm("Delete this number?");
    if (!ok) return;

    const updated = list.filter((item) => item.id !== id);
    localStorage.setItem("sim_numbers", JSON.stringify(updated));
    setList(updated);
  };

  const filteredList = useMemo(() => {
    const keyword = search.trim();
    if (!keyword) return list;

    return list.filter((item) => item.number.includes(keyword));
  }, [list, search]);

  const stats = useMemo(() => {
    const total = list.length;
    const normal = list.filter((item) => item.type === "normal").length;
    const premium = list.filter((item) => item.type === "premium").length;
    const vip = list.filter((item) => item.type === "vip").length;
    const onSale = list.filter((item) => item.isOnSale).length;

    return { total, normal, premium, vip, onSale };
  }, [list]);

  const previewType = getTypeFromPrice(price);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05081f] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.16),transparent_24%),radial-gradient(circle_at_80%_15%,rgba(168,85,247,0.18),transparent_22%),linear-gradient(135deg,#040817_0%,#070b2d_45%,#030617_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(59,130,246,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.12)_1px,transparent_1px)] [background-size:64px_64px]" />

      <section className="relative mx-auto max-w-7xl px-6 py-10 md:px-10 lg:px-12">
        <div className="mb-6 inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-300 backdrop-blur">
          Taurus SIM • Admin Dashboard
        </div>

        <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold md:text-5xl">
              SIM Store Control Panel
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-white/75 md:text-lg">
              Add, price, and manage Taurus SIM numbers for your marketplace.
            </p>
          </div>

          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-200 backdrop-blur">
            Local mode active • data saved in browser
          </div>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <div className="text-sm text-white/60">Total Numbers</div>
            <div className="mt-2 text-3xl font-bold text-cyan-300">
              {stats.total}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <div className="text-sm text-white/60">Normal</div>
            <div className="mt-2 text-3xl font-bold text-cyan-300">
              {stats.normal}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <div className="text-sm text-white/60">Premium</div>
            <div className="mt-2 text-3xl font-bold text-yellow-300">
              {stats.premium}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <div className="text-sm text-white/60">VIP</div>
            <div className="mt-2 text-3xl font-bold text-red-300">
              {stats.vip}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <div className="text-sm text-white/60">On Sale</div>
            <div className="mt-2 text-3xl font-bold text-green-300">
              {stats.onSale}
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Add New SIM Number</h2>
                <p className="mt-1 text-sm text-white/60">
                  Create a new listing for Taurus SIM Store.
                </p>
              </div>

              <div>{getTypeBadge(previewType)}</div>
            </div>

            <div className="grid gap-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-cyan-200">
                  SIM Number
                </label>
                <div className="rounded-2xl border border-white/10 bg-[#0b1228] px-4 py-3">
                  <div className="mb-1 text-xs uppercase tracking-[0.2em] text-white/35">
                    Number Format
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white/60">+70 20</span>
                    <input
                      value={number}
                      onChange={(e) =>
                        setNumber(e.target.value.replace(/\D/g, "").slice(0, 7))
                      }
                      placeholder="1234567"
                      className="w-full bg-transparent text-lg font-semibold text-white outline-none placeholder:text-white/25"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-cyan-200">
                  Main Price
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full rounded-2xl border border-white/10 bg-[#0b1228] px-4 py-3 text-white outline-none transition focus:border-cyan-400/40"
                />
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0b1228] p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-medium text-white">
                      Sale Mode
                    </div>
                    <div className="mt-1 text-xs text-white/50">
                      Enable discount pricing for this SIM.
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsOnSale((prev) => !prev)}
                    className={`relative h-8 w-16 rounded-full transition ${
                      isOnSale ? "bg-green-500/80" : "bg-white/10"
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-6 w-6 rounded-full bg-white transition ${
                        isOnSale ? "left-9" : "left-1"
                      }`}
                    />
                  </button>
                </div>

                {isOnSale && (
                  <div className="mt-4">
                    <label className="mb-2 block text-sm font-medium text-green-200">
                      Sale Price
                    </label>
                    <input
                      type="number"
                      value={salePrice}
                      onChange={(e) => setSalePrice(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-[#0f1730] px-4 py-3 text-white outline-none transition focus:border-green-400/40"
                      placeholder="800"
                    />
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
                <div className="mb-3 text-sm font-medium text-cyan-200">
                  Live Preview
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="mb-3">{getTypeBadge(previewType)}</div>

                  <div className="text-lg font-semibold text-white">
                    +70 20 {number || "0000000"}
                  </div>

                  <div className="mt-2 text-sm text-white/55">
                    Preview of how this number will appear in the store.
                  </div>

                  <div className="mt-4">
                    {isOnSale && salePrice ? (
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-white/35 line-through">
                          {price.toLocaleString()} TAT
                        </span>
                        <span className="text-lg font-bold text-green-300">
                          {Number(salePrice).toLocaleString()} TAT
                        </span>
                        <span className="rounded-full border border-green-400/20 bg-green-400/10 px-2 py-1 text-xs font-medium text-green-300">
                          SALE
                        </span>
                      </div>
                    ) : (
                      <div className="text-lg font-bold text-cyan-300">
                        {price.toLocaleString()} TAT
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={addNumber}
                className="rounded-2xl bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_28px_rgba(34,211,238,0.25)] transition hover:scale-[1.01]"
              >
                Add SIM Number
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Store Records</h2>
              <p className="mt-1 text-sm text-white/60">
                Review all SIM listings currently stored in local mode.
              </p>
            </div>

            <div className="mb-5">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search stored number"
                className="w-full rounded-2xl border border-white/10 bg-[#0b1228] px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-cyan-400/40"
              />
            </div>

            <div className="max-h-[720px] space-y-4 overflow-y-auto pr-1">
              {filteredList.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-[#0b1228] p-5 text-sm text-white/50">
                  No saved numbers found.
                </div>
              ) : (
                filteredList.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-white/10 bg-[#0b1228] p-5"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>{getTypeBadge(item.type)}</div>

                      <button
                        onClick={() => deleteNumber(item.id)}
                        className="rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-400/15"
                      >
                        Delete
                      </button>
                    </div>

                    <div className="text-lg font-semibold text-white">
                      +70 20 {item.number}
                    </div>

                    <div className="mt-3 space-y-1 text-sm text-white/60">
                      <div>Main Price: {formatPrice(item.price)}</div>
                      <div>
                        Sale Price:{" "}
                        {item.isOnSale
                          ? formatPrice(item.salePrice)
                          : "Not on sale"}
                      </div>
                      <div>
                        Added: {new Date(item.createdAt).toLocaleString()}
                      </div>
                    </div>

                    <div className="mt-4">
                      {item.isOnSale && item.salePrice ? (
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-white/35 line-through">
                            {item.price.toLocaleString()} TAT
                          </span>
                          <span className="text-lg font-bold text-green-300">
                            {item.salePrice.toLocaleString()} TAT
                          </span>
                          <span className="rounded-full border border-green-400/20 bg-green-400/10 px-2 py-1 text-xs font-medium text-green-300">
                            SALE
                          </span>
                        </div>
                      ) : (
                        <div className="text-lg font-bold text-cyan-300">
                          {item.price.toLocaleString()} TAT
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}