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

type DirectLine = {
  id: number;
  name: string;
  number: string;
  role: string;
  description: string;
  category: "ai" | "family" | "owner";
};

const RESERVED_NUMBERS = ["9999999", "8888888", "7777777", "6666666"];

const DIRECT_LINES: DirectLine[] = [
  {
    id: 1,
    name: "Founder AI",
    number: "9999999",
    role: "Owner Approved",
    description: "Direct founder-level communication line with owner permission access.",
    category: "owner",
  },
  {
    id: 2,
    name: "Support AI",
    number: "8888888",
    role: "AI Service Line",
    description: "Official support line for service guidance and customer help.",
    category: "ai",
  },
  {
    id: 3,
    name: "Sales AI",
    number: "7777777",
    role: "AI Sales Line",
    description: "Official sales line for plans, numbers, and Taurus telecom services.",
    category: "ai",
  },
  {
    id: 4,
    name: "Family Priority Line",
    number: "6666666",
    role: "Family Access",
    description: "Reserved family access line enabled directly by owner approval.",
    category: "family",
  },
];

export default function SimStorePage() {
  const [numbers, setNumbers] = useState<SimItem[]>([]);
  const [search, setSearch] = useState("");

  const [selected, setSelected] = useState<SimItem | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [selectedDirect, setSelectedDirect] = useState<DirectLine | null>(null);
  const [showDirectModal, setShowDirectModal] = useState(false);

  const [form, setForm] = useState({
    name: "",
    age: "",
    nrc: "",
    address: "",
  });

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("sim_numbers") || "[]") as SimItem[];
    setNumbers(stored);
  }, []);

  const searchableNumbers = useMemo(() => {
    const keyword = search.trim();
    if (!keyword) return numbers;
    return numbers.filter((n) => n.number.includes(keyword));
  }, [numbers, search]);

  const storeNumbers = useMemo(() => {
    return searchableNumbers.filter((n) => !RESERVED_NUMBERS.includes(n.number));
  }, [searchableNumbers]);

  const saleNumbers = storeNumbers.filter(
    (n) => n.isOnSale && n.status === "available"
  );

  const normalNumbers = storeNumbers.filter(
    (n) => n.type === "normal" && !n.isOnSale && n.status === "available"
  );

  const premiumNumbers = storeNumbers.filter(
    (n) => n.type === "premium" && !n.isOnSale && n.status === "available"
  );

  const vipNumbers = storeNumbers.filter(
    (n) => n.type === "vip" && !n.isOnSale && n.status === "available"
  );

  const soldNumbers = storeNumbers.filter((n) => n.status === "sold");

  const stats = useMemo(() => {
    return {
      total: storeNumbers.length,
      available: storeNumbers.filter((n) => n.status === "available").length,
      sold: storeNumbers.filter((n) => n.status === "sold").length,
      reserved: DIRECT_LINES.length,
    };
  }, [storeNumbers]);

  const buyNow = (item: SimItem) => {
    setSelected(item);
    setShowForm(true);
  };

  const closeBuyModal = () => {
    setSelected(null);
    setShowForm(false);
    setForm({
      name: "",
      age: "",
      nrc: "",
      address: "",
    });
  };

  const confirmBuy = () => {
    if (!selected) return;

    if (!form.name.trim() || !form.nrc.trim()) {
      alert("Fill required fields");
      return;
    }

    const updated = numbers.map((n) =>
      n.id === selected.id ? { ...n, status: "sold" as SimStatus } : n
    );

    localStorage.setItem("sim_numbers", JSON.stringify(updated));
    setNumbers(updated);

    const ownership = JSON.parse(localStorage.getItem("ownership") || "[]");

    ownership.push({
      number: selected.number,
      owner_name: form.name,
      owner_age: form.age,
      owner_nrc: form.nrc,
      owner_address: form.address,
      owned_at: new Date().toISOString(),
      source: "store_purchase",
    });

    localStorage.setItem("ownership", JSON.stringify(ownership));

    alert("SIM purchased successfully");
    closeBuyModal();
  };

  const openDirectLine = (line: DirectLine) => {
    setSelectedDirect(line);
    setShowDirectModal(true);
  };

  const closeDirectModal = () => {
    setSelectedDirect(null);
    setShowDirectModal(false);
  };

  const confirmDirectUse = () => {
    if (!selectedDirect) return;

    const directAccess = JSON.parse(localStorage.getItem("owner_direct_access") || "[]");

    directAccess.push({
      id: Date.now(),
      name: selectedDirect.name,
      number: selectedDirect.number,
      role: selectedDirect.role,
      used_at: new Date().toISOString(),
      source: "owner_permission",
    });

    localStorage.setItem("owner_direct_access", JSON.stringify(directAccess));

    alert(`${selectedDirect.name} is now available for direct owner-approved use.`);
    closeDirectModal();
  };

  const renderTypeBadge = (type: SimType) => {
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
  };

  const renderStoreCard = (
    item: SimItem,
    tone: "cyan" | "green" | "yellow" | "red"
  ) => {
    const styleMap = {
      cyan: {
        border: "border-cyan-400/20",
        bg: "bg-cyan-400/5",
        price: "text-cyan-300",
        button: "bg-cyan-400 text-slate-950",
      },
      green: {
        border: "border-green-400/20",
        bg: "bg-green-400/5",
        price: "text-green-300",
        button: "bg-green-400 text-slate-950",
      },
      yellow: {
        border: "border-yellow-400/20",
        bg: "bg-yellow-400/5",
        price: "text-yellow-300",
        button: "bg-yellow-300 text-slate-950",
      },
      red: {
        border: "border-red-400/20",
        bg: "bg-red-400/5",
        price: "text-red-300",
        button: "bg-red-300 text-slate-950",
      },
    };

    const style = styleMap[tone];

    return (
      <div
        key={item.id}
        className={`rounded-3xl border p-5 backdrop-blur transition hover:translate-y-[-2px] ${style.border} ${style.bg}`}
      >
        <div className="mb-3 flex flex-wrap gap-2">
          {renderTypeBadge(item.type)}
          {item.isOnSale && item.status === "available" && (
            <span className="inline-flex rounded-full border border-green-400/20 bg-green-400/10 px-2.5 py-1 text-xs font-medium text-green-300">
              Sale
            </span>
          )}
          {item.status === "sold" && (
            <span className="inline-flex rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-xs font-medium text-white/80">
              Sold
            </span>
          )}
        </div>

        <h3 className="text-xl font-bold text-white">+70 20 {item.number}</h3>

        <p className="mt-2 text-sm leading-6 text-white/60">
          Global Taurus SIM marketplace listing with telecom-grade digital number allocation.
        </p>

        <div className="mt-4">
          {item.isOnSale && item.salePrice ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-white/35 line-through">
                {item.price.toLocaleString()} TAT
              </span>
              <span className={`text-xl font-bold ${style.price}`}>
                {item.salePrice.toLocaleString()} TAT
              </span>
            </div>
          ) : (
            <div className={`text-xl font-bold ${style.price}`}>
              {item.price.toLocaleString()} TAT
            </div>
          )}
        </div>

        {item.status === "sold" ? (
          <button
            disabled
            className="mt-5 w-full cursor-not-allowed rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white/55"
          >
            Sold Out
          </button>
        ) : (
          <button
            onClick={() => buyNow(item)}
            className={`mt-5 w-full rounded-2xl px-4 py-3 text-sm font-semibold shadow-[0_0_24px_rgba(255,255,255,0.08)] transition hover:scale-[1.01] ${style.button}`}
          >
            Buy Now
          </button>
        )}
      </div>
    );
  };

  const renderDirectCard = (line: DirectLine) => {
    const tone =
      line.category === "owner"
        ? "border-violet-400/25 bg-violet-400/10 text-violet-200"
        : line.category === "family"
        ? "border-pink-400/25 bg-pink-400/10 text-pink-200"
        : "border-cyan-400/25 bg-cyan-400/10 text-cyan-200";

    return (
      <div
        key={line.id}
        className={`rounded-3xl border p-5 backdrop-blur ${tone}`}
      >
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="inline-flex rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-xs font-medium text-white">
            {line.role}
          </span>
          <span className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
            Direct Use
          </span>
        </div>

        <h3 className="text-xl font-bold text-white">{line.name}</h3>
        <div className="mt-2 text-lg font-semibold text-white">+70 20 {line.number}</div>

        <p className="mt-3 text-sm leading-6 text-white/70">{line.description}</p>

        <div className="mt-5 grid grid-cols-1 gap-3">
          <button
            onClick={() => openDirectLine(line)}
            className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.01]"
          >
            Use Direct
          </button>
        </div>
      </div>
    );
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05081f] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(59,130,246,0.20),transparent_25%),radial-gradient(circle_at_85%_15%,rgba(168,85,247,0.18),transparent_22%),radial-gradient(circle_at_50%_80%,rgba(16,185,129,0.12),transparent_30%),linear-gradient(135deg,#030617_0%,#07112d_42%,#040816_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(59,130,246,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.12)_1px,transparent_1px)] [background-size:64px_64px]" />

      <section className="relative mx-auto max-w-7xl px-6 py-10 md:px-10 lg:px-12">
        <div className="mb-6 inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-300 backdrop-blur">
          Taurus Global SIM • Digital Telecom Company
        </div>

        <div className="mb-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <h1 className="text-4xl font-extrabold leading-tight md:text-5xl">
              Global SIM Marketplace
              <span className="block bg-gradient-to-r from-cyan-300 via-white to-violet-300 bg-clip-text text-transparent">
                Owner Approved + Public Purchase Flow
              </span>
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-white/75 md:text-lg">
              Premium Taurus telecom marketplace for normal, premium, and VIP numbers,
              with direct owner-approved AI and family access lines outside the public buy flow.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <div className="text-sm text-white/60">Available</div>
              <div className="mt-2 text-3xl font-bold text-cyan-300">{stats.available}</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <div className="text-sm text-white/60">Reserved Direct</div>
              <div className="mt-2 text-3xl font-bold text-violet-300">{stats.reserved}</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <div className="text-sm text-white/60">Sold</div>
              <div className="mt-2 text-3xl font-bold text-white">{stats.sold}</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <div className="text-sm text-white/60">Total Listings</div>
              <div className="mt-2 text-3xl font-bold text-green-300">{stats.total}</div>
            </div>
          </div>
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

        <div className="mb-14">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-violet-200">Owner Approved Direct Lines</h2>
              <p className="mt-1 text-sm text-white/60">
                AI, family, and owner-authorized lines that do not require buying or registration.
              </p>
            </div>
            <div className="text-sm text-white/50">{DIRECT_LINES.length} line(s)</div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {DIRECT_LINES.map((line) => renderDirectCard(line))}
          </div>
        </div>

        <div className="mb-14">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-green-300">Sale Numbers</h2>
              <p className="mt-1 text-sm text-white/60">
                Discounted public numbers available for direct purchase.
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
              {saleNumbers.map((item) => renderStoreCard(item, "green"))}
            </div>
          )}
        </div>

        <div className="mb-14">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-cyan-300">Normal Numbers</h2>
              <p className="mt-1 text-sm text-white/60">
                Standard marketplace numbers for public purchase.
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
              {normalNumbers.map((item) => renderStoreCard(item, "cyan"))}
            </div>
          )}
        </div>

        <div className="mb-14">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-yellow-300">Premium Numbers</h2>
              <p className="mt-1 text-sm text-white/60">
                High-identity premium digital telecom numbers.
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
              {premiumNumbers.map((item) => renderStoreCard(item, "yellow"))}
            </div>
          )}
        </div>

        <div className="mb-14">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-red-300">VIP Numbers</h2>
              <p className="mt-1 text-sm text-white/60">
                Premium executive lines for high-value buyers.
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
              {vipNumbers.map((item) => renderStoreCard(item, "red"))}
            </div>
          )}
        </div>

        <div>
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Sold Numbers</h2>
              <p className="mt-1 text-sm text-white/60">
                Completed allocations from the public store.
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
              {soldNumbers.map((item) => renderStoreCard(item, "cyan"))}
            </div>
          )}
        </div>
      </section>

      {showForm && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-xl rounded-3xl border border-cyan-400/20 bg-[#0b1026] p-6 text-white">
            <h2 className="text-2xl font-bold">Identity Required for Purchase</h2>
            <p className="mt-2 text-white/70">
              Public marketplace numbers require buyer identity before allocation.
            </p>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm text-white/55">Selected Number</div>
              <div className="mt-2 text-xl font-bold text-white">
                +70 20 {selected.number}
              </div>
              <div className="mt-2 text-sm text-cyan-300">
                Price:{" "}
                {(
                  selected.isOnSale && selected.salePrice
                    ? selected.salePrice
                    : selected.price
                ).toLocaleString()}{" "}
                TAT
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              <input
                placeholder="Full Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-2xl border border-white/10 bg-[#0b1228] px-4 py-3 text-white outline-none placeholder:text-white/25"
              />

              <input
                placeholder="Age"
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
                className="w-full rounded-2xl border border-white/10 bg-[#0b1228] px-4 py-3 text-white outline-none placeholder:text-white/25"
              />

              <input
                placeholder="NRC / ID"
                value={form.nrc}
                onChange={(e) => setForm({ ...form, nrc: e.target.value })}
                className="w-full rounded-2xl border border-white/10 bg-[#0b1228] px-4 py-3 text-white outline-none placeholder:text-white/25"
              />

              <input
                placeholder="Address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full rounded-2xl border border-white/10 bg-[#0b1228] px-4 py-3 text-white outline-none placeholder:text-white/25"
              />
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={closeBuyModal}
                className="rounded-2xl border border-white/10 px-4 py-3"
              >
                Cancel
              </button>

              <button
                onClick={confirmBuy}
                className="rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950"
              >
                Confirm Purchase
              </button>
            </div>
          </div>
        </div>
      )}

      {showDirectModal && selectedDirect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-xl rounded-3xl border border-violet-400/20 bg-[#0b1026] p-6 text-white">
            <h2 className="text-2xl font-bold">Owner Approved Direct Access</h2>
            <p className="mt-2 text-white/70">
              This line does not require purchase or registration. It is enabled directly by owner permission.
            </p>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm text-white/55">Direct Line</div>
              <div className="mt-2 text-xl font-bold text-white">
                {selectedDirect.name}
              </div>
              <div className="mt-2 text-lg text-violet-200">+70 20 {selectedDirect.number}</div>
              <div className="mt-3 text-sm text-white/65">{selectedDirect.description}</div>
            </div>

            <div className="mt-6 rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4 text-sm leading-6 text-emerald-200">
              Direct lines are reserved for AI, family, and owner-authorized access. No buying. No identity registration.
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={closeDirectModal}
                className="rounded-2xl border border-white/10 px-4 py-3"
              >
                Cancel
              </button>

              <button
                onClick={confirmDirectUse}
                className="rounded-2xl bg-white px-4 py-3 font-semibold text-slate-950"
              >
                Enable Direct Use
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}