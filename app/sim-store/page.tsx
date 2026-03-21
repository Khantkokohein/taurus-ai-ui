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

export default function SimStorePage() {
  const [numbers, setNumbers] = useState<SimItem[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<SimItem | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    name: "",
    age: "",
    nrc: "",
    address: "",
  });

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("sim_numbers") || "[]");

    // 🔥 FILTER SYSTEM NUMBERS (IMPORTANT FIX)
    const filtered = stored.filter(
      (n: SimItem) =>
        !["9999999", "8888888", "7777777"].includes(n.number)
    );

    setNumbers(filtered);
  }, []);

  const filteredNumbers = useMemo(() => {
    return numbers.filter((n) => n.number.includes(search));
  }, [numbers, search]);

  const normalNumbers = filteredNumbers.filter(
    (n) => n.type === "normal" && n.status === "available"
  );

  const soldNumbers = filteredNumbers.filter(
    (n) => n.status === "sold"
  );

  const buyNow = (item: SimItem) => {
    setSelected(item);
    setShowForm(true);
  };

  const confirmBuy = () => {
    if (!form.name || !form.nrc) {
      alert("Fill required fields");
      return;
    }

    const updated = numbers.map((n) =>
      n.id === selected?.id ? { ...n, status: "sold" as SimStatus } : n
    );

    localStorage.setItem("sim_numbers", JSON.stringify(updated));
    setNumbers(updated);

    // 🔥 SAVE OWNERSHIP (IMPORTANT)
    const ownership = JSON.parse(localStorage.getItem("ownership") || "[]");

    ownership.push({
      number: selected?.number,
      owner_name: form.name,
      owned_at: new Date().toISOString(),
    });

    localStorage.setItem("ownership", JSON.stringify(ownership));

    alert("Purchased Successfully");
    setShowForm(false);
  };

  return (
    <div className="p-6 text-white">

      <h1 className="text-3xl font-bold mb-6">SIM Store</h1>

      <input
        placeholder="Search number"
        className="mb-6 p-3 bg-black rounded"
        onChange={(e) => setSearch(e.target.value)}
      />

      <h2 className="text-xl mb-3">Available Numbers</h2>

      <div className="grid grid-cols-2 gap-4">
        {normalNumbers.map((n) => (
          <div key={n.id} className="p-4 bg-[#111] rounded-xl">
            <div className="text-lg">+70 20 {n.number}</div>
            <div>{n.price} TAT</div>

            <button
              onClick={() => buyNow(n)}
              className="mt-3 bg-cyan-400 text-black px-4 py-2 rounded"
            >
              Buy Now
            </button>
          </div>
        ))}
      </div>

      <h2 className="text-xl mt-10 mb-3">Sold Numbers</h2>

      {soldNumbers.map((n) => (
        <div key={n.id} className="p-3 bg-gray-800 mb-2">
          +70 20 {n.number}
        </div>
      ))}

      {/* 🔥 IDENTITY FORM */}
      {showForm && selected && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center">

          <div className="bg-[#111] p-6 rounded-xl w-[300px]">

            <h2 className="text-xl mb-4">Identity Required</h2>

            <input
              placeholder="Full Name"
              className="mb-2 p-2 w-full bg-black"
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
            />

            <input
              placeholder="Age"
              className="mb-2 p-2 w-full bg-black"
              onChange={(e) =>
                setForm({ ...form, age: e.target.value })
              }
            />

            <input
              placeholder="NRC"
              className="mb-2 p-2 w-full bg-black"
              onChange={(e) =>
                setForm({ ...form, nrc: e.target.value })
              }
            />

            <input
              placeholder="Address"
              className="mb-4 p-2 w-full bg-black"
              onChange={(e) =>
                setForm({ ...form, address: e.target.value })
              }
            />

            <button
              onClick={confirmBuy}
              className="bg-green-400 text-black px-4 py-2 w-full mb-2"
            >
              Confirm
            </button>

            <button
              onClick={() => setShowForm(false)}
              className="bg-red-400 text-black px-4 py-2 w-full"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}