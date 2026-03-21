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

type OwnerClaim = {
  id: number;
  simId: number;
  number: string;
  ownerName: string;
  ownerNote: string;
  claimedAt: string;
  source: "owner_direct";
};

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

function getStatusBadge(status: SimStatus) {
  if (status === "sold") {
    return (
      <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-xs font-medium text-white/80">
        Sold
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full border border-green-400/30 bg-green-400/10 px-2.5 py-1 text-xs font-medium text-green-300">
      Available
    </span>
  );
}

export default function AdminPage() {
  const [number, setNumber] = useState("");
  const [price, setPrice] = useState(1000);
  const [type, setType] = useState<SimType>("normal");
  const [isOnSale, setIsOnSale] = useState(false);
  const [salePrice, setSalePrice] = useState("");
  const [status, setStatus] = useState<SimStatus>("available");
  const [list, setList] = useState<SimItem[]>([]);
  const [search, setSearch] = useState("");

  const [claims, setClaims] = useState<OwnerClaim[]>([]);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SimItem | null>(null);
  const [ownerName, setOwnerName] = useState("Founder");
  const [ownerNote, setOwnerNote] = useState("");
  const [isClaiming, setIsClaiming] = useState(false);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("sim_numbers") || "[]");
    const storedClaims = JSON.parse(localStorage.getItem("sim_owner_claims") || "[]");
    setList(stored);
    setClaims(storedClaims);
  }, []);

  const saveList = (updated: SimItem[]) => {
    localStorage.setItem("sim_numbers", JSON.stringify(updated));
    setList(updated);
  };

  const saveClaims = (updated: OwnerClaim[]) => {
    localStorage.setItem("sim_owner_claims", JSON.stringify(updated));
    setClaims(updated);
  };

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
      type,
      isOnSale,
      salePrice: finalSalePrice,
      status,
      createdAt: new Date().toISOString(),
    };

    saveList([newItem, ...list]);

    setNumber("");
    setPrice(1000);
    setType("normal");
    setIsOnSale(false);
    setSalePrice("");
    setStatus("available");
  };

  const deleteNumber = (id: number) => {
    const ok = window.confirm("Delete this number?");
    if (!ok) return;

    const updatedList = list.filter((item) => item.id !== id);
    const updatedClaims = claims.filter((item) => item.simId !== id);

    saveList(updatedList);
    saveClaims(updatedClaims);
  };

  const toggleSoldStatus = (id: number) => {
    const updated = list.map((item) => {
      if (item.id !== id) return item;

      if (item.status === "sold") {
        return { ...item, status: "available" as SimStatus };
      }

      return { ...item, status: "sold" as SimStatus };
    });

    const changedItem = updated.find((item) => item.id === id);

    if (changedItem?.status === "available") {
      saveClaims(claims.filter((item) => item.simId !== id));
    }

    saveList(updated);
  };

  const openClaimModal = (item: SimItem) => {
    setSelectedItem(item);
    setOwnerName("Founder");
    setOwnerNote("");
    setShowClaimModal(true);
  };

  const closeClaimModal = () => {
    setShowClaimModal(false);
    setSelectedItem(null);
    setOwnerName("Founder");
    setOwnerNote("");
    setIsClaiming(false);
  };

  const assignToMe = () => {
    if (!selectedItem) return;

    const cleanOwnerName = ownerName.trim();
    if (!cleanOwnerName) {
      alert("Please enter owner name.");
      return;
    }

    setIsClaiming(true);

    const updatedList = list.map((item) =>
      item.id === selectedItem.id
        ? { ...item, status: "sold" as SimStatus }
        : item
    );

    const filteredClaims = claims.filter((item) => item.simId !== selectedItem.id);

    const newClaim: OwnerClaim = {
      id: Date.now(),
      simId: selectedItem.id,
      number: selectedItem.number,
      ownerName: cleanOwnerName,
      ownerNote: ownerNote.trim(),
      claimedAt: new Date().toISOString(),
      source: "owner_direct",
    };

    saveList(updatedList);
    saveClaims([newClaim, ...filteredClaims]);

    alert("Number assigned to owner successfully.");
    closeClaimModal();
  };

  const filteredList = useMemo(() => {
    const keyword = search.trim();
    if (!keyword) return list;
    return list.filter((item) => item.number.includes(keyword));
  }, [list, search]);

  const stats = useMemo(() => {
    return {
      total: list.length,
      normal: list.filter((item) => item.type === "normal").length,
      premium: list.filter((item) => item.type === "premium").length,
      vip: list.filter((item) => item.type === "vip").length,
      onSale: list.filter((item) => item.isOnSale).length,
      sold: list.filter((item) => item.status === "sold").length,
    };
  }, [list]);

  const claimMap = useMemo(() => {
    const map = new Map<number, OwnerClaim>();
    for (const item of claims) {
      map.set(item.simId, item);
    }
    return map;
  }, [claims]);

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
              Add, price, discount, and control sold status for Taurus SIM numbers.
            </p>
          </div>

          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-200 backdrop-blur">
            Local mode active • data saved in browser
          </div>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <div className="text-sm text-white/60">Total</div>
            <div className="mt-2 text-3xl font-bold text-cyan-300">{stats.total}</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <div className="text-sm text-white/60">Normal</div>
            <div className="mt-2 text-3xl font-bold text-cyan-300">{stats.normal}</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <div className="text-sm text-white/60">Premium</div>
            <div className="mt-2 text-3xl font-bold text-yellow-300">{stats.premium}</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <div className="text-sm text-white/60">VIP</div>
            <div className="mt-2 text-3xl font-bold text-red-300">{stats.vip}</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <div className="text-sm text-white/60">On Sale</div>
            <div className="mt-2 text-3xl font-bold text-green-300">{stats.onSale}</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <div className="text-sm text-white/60">Sold</div>
            <div className="mt-2 text-3xl font-bold text-white">{stats.sold}</div>
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

              <div>{getTypeBadge(type)}</div>
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

              <div className="grid gap-5 md:grid-cols-2">
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

                <div>
                  <label className="mb-2 block text-sm font-medium text-cyan-200">
                    Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as SimType)}
                    className="w-full rounded-2xl border border-white/10 bg-[#0b1228] px-4 py-3 text-white outline-none transition focus:border-cyan-400/40"
                  >
                    <option value="normal">Normal</option>
                    <option value="premium">Premium</option>
                    <option value="vip">VIP</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-[#0b1228] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-medium text-white">Sale Mode</div>
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

                <div className="rounded-2xl border border-white/10 bg-[#0b1228] p-4">
                  <label className="mb-2 block text-sm font-medium text-cyan-200">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as SimStatus)}
                    className="w-full rounded-2xl border border-white/10 bg-[#0f1730] px-4 py-3 text-white outline-none transition focus:border-cyan-400/40"
                  >
                    <option value="available">Available</option>
                    <option value="sold">Sold</option>
                  </select>

                  <div className="mt-4">{getStatusBadge(status)}</div>
                </div>
              </div>

              <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
                <div className="mb-3 text-sm font-medium text-cyan-200">
                  Live Preview
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="mb-3 flex items-center gap-2">
                    {getTypeBadge(type)}
                    {getStatusBadge(status)}
                  </div>

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
                filteredList.map((item) => {
                  const claim = claimMap.get(item.id);

                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-white/10 bg-[#0b1228] p-5"
                    >
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="flex flex-wrap gap-2">
                          {getTypeBadge(item.type)}
                          {getStatusBadge(item.status)}
                          {item.isOnSale && (
                            <span className="inline-flex rounded-full border border-green-400/20 bg-green-400/10 px-2.5 py-1 text-xs font-medium text-green-300">
                              Sale
                            </span>
                          )}
                        </div>

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
                          Sale Price: {item.isOnSale ? formatPrice(item.salePrice) : "Not on sale"}
                        </div>
                        <div>Status: {item.status === "sold" ? "Sale completed" : "Available now"}</div>
                        <div>Added: {new Date(item.createdAt).toLocaleString()}</div>
                      </div>

                      {claim && (
                        <div className="mt-4 rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4">
                          <div className="text-sm font-semibold text-cyan-200">
                            Owner Claim Record
                          </div>
                          <div className="mt-2 text-sm text-white/70">
                            Owner: {claim.ownerName}
                          </div>
                          <div className="mt-1 text-sm text-white/55">
                            Claimed: {new Date(claim.claimedAt).toLocaleString()}
                          </div>
                          {claim.ownerNote && (
                            <div className="mt-1 text-sm text-white/55">
                              Note: {claim.ownerNote}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="mt-4">
                        {item.isOnSale && item.salePrice ? (
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-white/35 line-through">
                              {item.price.toLocaleString()} TAT
                            </span>
                            <span className="text-lg font-bold text-green-300">
                              {item.salePrice.toLocaleString()} TAT
                            </span>
                          </div>
                        ) : (
                          <div className="text-lg font-bold text-cyan-300">
                            {item.price.toLocaleString()} TAT
                          </div>
                        )}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          onClick={() => toggleSoldStatus(item.id)}
                          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                            item.status === "sold"
                              ? "border border-cyan-400/25 bg-cyan-400/10 text-cyan-200 hover:bg-cyan-400/15"
                              : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
                          }`}
                        >
                          {item.status === "sold" ? "Mark Available" : "Mark Sold"}
                        </button>

                        <button
                          onClick={() => openClaimModal(item)}
                          disabled={item.status === "sold" && !claim}
                          className="rounded-xl border border-yellow-400/25 bg-yellow-400/10 px-4 py-2 text-sm font-medium text-yellow-200 transition hover:bg-yellow-400/15 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Assign to Me
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </section>

      {showClaimModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-xl rounded-3xl border border-cyan-400/20 bg-[#0b1026] p-6 text-white">
            <h2 className="text-2xl font-bold">Assign Number to Owner</h2>
            <p className="mt-2 text-white/70">
              This will keep the original add flow unchanged and directly reserve this number for the owner.
            </p>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm text-white/55">Selected Number</div>
              <div className="mt-2 text-xl font-bold text-white">
                +70 20 {selectedItem.number}
              </div>
              <div className="mt-2 text-sm text-cyan-300">
                Price:{" "}
                {(
                  selectedItem.isOnSale && selectedItem.salePrice
                    ? selectedItem.salePrice
                    : selectedItem.price
                ).toLocaleString()}{" "}
                TAT
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-cyan-200">
                  Owner Name
                </label>
                <input
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="Founder"
                  className="w-full rounded-2xl border border-white/10 bg-[#0b1228] px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-cyan-400/40"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-cyan-200">
                  Note
                </label>
                <textarea
                  value={ownerNote}
                  onChange={(e) => setOwnerNote(e.target.value)}
                  rows={3}
                  placeholder="Optional note"
                  className="w-full rounded-2xl border border-white/10 bg-[#0b1228] px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-cyan-400/40"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={closeClaimModal}
                className="rounded-xl border border-white/10 px-4 py-3"
              >
                Cancel
              </button>

              <button
                onClick={assignToMe}
                disabled={isClaiming}
                className="rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 disabled:opacity-60"
              >
                {isClaiming ? "Assigning..." : "Confirm Assign to Me"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}