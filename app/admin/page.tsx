"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/client";

type SimType = "normal" | "premium" | "vip";
type SimStatus = "available" | "sold";

type SimItem = {
  id: string;
  number: string;
  price: number;
  type: SimType;
  isOnSale: boolean;
  salePrice: number | null;
  status: SimStatus;
  createdAt: string;
};

type OwnerClaim = {
  id: string;
  number: string;
  ownerName: string;
  ownerNote: string;
  claimedAt: string;
};

type NumberRow = {
  id: string;
  number: string | null;
  suffix_7: string | null;
  tier: string | null;
  status: string | null;
  created_at: string | null;
  price: number | null;
  is_on_sale: boolean | null;
  sale_price: number | null;
};

type OwnershipRow = {
  id: string;
  number: string | null;
  owner_name: string | null;
  owner_note: string | null;
  created_at: string | null;
  active: boolean | null;
};

function formatPrice(value: number | null) {
  if (value === null) return "-";
  return `${Number(value).toLocaleString()} TAT`;
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

function mapTierToType(tier: string | null): SimType {
  const value = (tier || "").toLowerCase();

  if (value === "vip") return "vip";
  if (value === "premium") return "premium";
  return "normal";
}

function mapRowToSimItem(row: NumberRow): SimItem {
  return {
    id: row.id,
    number: row.number || row.suffix_7 || "",
    price: Number(row.price ?? 1000),
    type: mapTierToType(row.tier),
    isOnSale: Boolean(row.is_on_sale),
    salePrice: row.sale_price === null ? null : Number(row.sale_price),
    status: row.status === "sold" ? "sold" : "available",
    createdAt: row.created_at || new Date().toISOString(),
  };
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
    void loadAll();
  }, []);

  const loadAll = async () => {
    await Promise.all([loadNumbers(), loadClaims()]);
  };

  const loadNumbers = async () => {
    const { data, error } = await supabase
      .from("numbers")
      .select(
        "id, number, suffix_7, tier, status, created_at, price, is_on_sale, sale_price"
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Load numbers error:", error.message);
      alert(`Failed to load numbers: ${error.message}`);
      return;
    }

    const mapped = ((data || []) as NumberRow[]).map(mapRowToSimItem);
    setList(mapped);
  };

  const loadClaims = async () => {
    const { data, error } = await supabase
      .from("ownership")
      .select("id, number, owner_name, owner_note, created_at, active")
      .eq("active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Load ownership error:", error.message);
      return;
    }

    const mapped: OwnerClaim[] = ((data || []) as OwnershipRow[])
      .filter((item) => item.number)
      .map((item) => ({
        id: item.id,
        number: item.number || "",
        ownerName: item.owner_name || "Owner",
        ownerNote: item.owner_note || "",
        claimedAt: item.created_at || new Date().toISOString(),
      }));

    setClaims(mapped);
  };

  const addNumber = async () => {
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

    const { error } = await supabase.from("numbers").insert([
      {
        number: cleanNumber,
        suffix_7: cleanNumber,
        tier: type,
        status,
        price,
        is_on_sale: isOnSale,
        sale_price: finalSalePrice,
      },
    ]);

    if (error) {
      alert(`Failed to add number: ${error.message}`);
      return;
    }

    setNumber("");
    setPrice(1000);
    setType("normal");
    setIsOnSale(false);
    setSalePrice("");
    setStatus("available");

    await loadNumbers();
  };

  const deleteNumber = async (id: string, simNumber: string) => {
    const ok = window.confirm("Delete this number?");
    if (!ok) return;

    const { error } = await supabase.from("numbers").delete().eq("id", id);

    if (error) {
      alert(`Failed to delete number: ${error.message}`);
      return;
    }

    await supabase.from("ownership").update({ active: false }).eq("number", simNumber);

    await loadAll();
  };

  const toggleSoldStatus = async (id: string) => {
    const currentItem = list.find((item) => item.id === id);
    if (!currentItem) return;

    const nextStatus: SimStatus =
      currentItem.status === "sold" ? "available" : "sold";

    const { error } = await supabase
      .from("numbers")
      .update({ status: nextStatus })
      .eq("id", id);

    if (error) {
      alert(`Failed to update status: ${error.message}`);
      return;
    }

    if (nextStatus === "available") {
      await supabase
        .from("ownership")
        .update({ active: false })
        .eq("number", currentItem.number)
        .eq("active", true);
    }

    await loadAll();
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

  const assignToMe = async () => {
    if (!selectedItem) return;

    const cleanOwnerName = ownerName.trim();
    if (!cleanOwnerName) {
      alert("Please enter owner name.");
      return;
    }

    setIsClaiming(true);

    const { error: numberError } = await supabase
      .from("numbers")
      .update({ status: "sold" })
      .eq("id", selectedItem.id);

    if (numberError) {
      alert(`Failed to assign number: ${numberError.message}`);
      setIsClaiming(false);
      return;
    }

    await supabase
      .from("ownership")
      .update({ active: false })
      .eq("number", selectedItem.number)
      .eq("active", true);

    const { error: ownershipError } = await supabase.from("ownership").insert([
      {
        number: selectedItem.number,
        owner_name: cleanOwnerName,
        owner_note: ownerNote.trim() || null,
        owner_nrc: null,
        device_id: null,
        registration_id: null,
        active: true,
      },
    ]);

    if (ownershipError) {
      alert(`Failed to save ownership: ${ownershipError.message}`);
      setIsClaiming(false);
      return;
    }

    await loadAll();
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
    const map = new Map<string, OwnerClaim>();
    for (const item of claims) {
      map.set(item.number, item);
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
              Add, price, discount, and control sold status for Taurus SIM
              numbers.
            </p>
          </div>

          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-200 backdrop-blur">
            Supabase live mode • data saved in database
          </div>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <div className="text-sm text-white/60">Total</div>
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

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <div className="text-sm text-white/60">Sold</div>
            <div className="mt-2 text-3xl font-bold text-white">
              {stats.sold}
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
                Review all SIM listings currently stored in database mode.
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
                  const claim = claimMap.get(item.number);

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
                          onClick={() => deleteNumber(item.id, item.number)}
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
                          Status:{" "}
                          {item.status === "sold"
                            ? "Sale completed"
                            : "Available now"}
                        </div>
                        <div>
                          Added: {new Date(item.createdAt).toLocaleString()}
                        </div>
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
                          {item.status === "sold"
                            ? "Mark Available"
                            : "Mark Sold"}
                        </button>

                        <button
                          onClick={() => openClaimModal(item)}
                          className="rounded-xl border border-yellow-400/25 bg-yellow-400/10 px-4 py-2 text-sm font-medium text-yellow-200 transition hover:bg-yellow-400/15"
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
              This will directly reserve this number for the owner in database.
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