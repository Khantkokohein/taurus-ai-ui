"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/client";

type SimItem = {
  id: string;
  number: string;
  price: number;
  type: "normal" | "premium" | "vip";
  is_on_sale: boolean;
  sale_price: number | null;
  status: "available" | "sold";
};

const OWNER_PREVIEW = [
  "0000000","1111111","2222222","3333333","4444444",
  "5555555","6666666","7777777","8888888","9999999"
];

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

  // 🔥 LOAD FROM SUPABASE
  useEffect(() => {
    loadNumbers();
  }, []);

  async function loadNumbers() {
    const { data, error } = await supabase
      .from("numbers")
      .select("*");

    if (!error && data) {
      setNumbers(data);
    }
  }

  const filtered = useMemo(() => {
    return numbers.filter((n) =>
      n.number.includes(search)
    );
  }, [numbers, search]);

  // 🔥 BUY FLOW (DB UPDATE)
  async function confirmBuy() {
    if (!selected) return;

    if (!form.name || !form.nrc) {
      alert("Fill required fields");
      return;
    }

    // 1. update number → sold
    await supabase
      .from("numbers")
      .update({ status: "sold" })
      .eq("id", selected.id);

    // 2. save ownership
    await supabase.from("ownership").insert({
      number: selected.number,
      owner_name: form.name,
      owner_age: form.age,
      owner_nrc: form.nrc,
      owner_address: form.address,
    });

    alert("Purchased Successfully");

    setShowForm(false);
    loadNumbers();
  }

  // 🔥 OWNER DIRECT USE (DB SAVE)
  async function useDirect(num: string) {
    await supabase.from("owner_direct_access").insert({
      name: "Owner Line",
      number: num,
    });

    alert(`Direct enabled: +70 20 ${num}`);
  }

  return (
    <div className="p-6 text-white">

      <h1 className="text-3xl font-bold mb-6">
        Taurus SIM Store
      </h1>

      {/* 🔍 SEARCH */}
      <input
        placeholder="Search number"
        className="mb-6 p-3 bg-black rounded w-full"
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* 🔥 OWNER NUMBERS */}
      <h2 className="text-xl mb-3 text-violet-300">
        Owner Approved Numbers
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
        {OWNER_PREVIEW.map((num) => (
          <div key={num} className="p-4 bg-[#111] rounded-xl">
            <div>+70 20 {num}</div>

            <button
              onClick={() => useDirect(num)}
              className="mt-3 bg-white text-black px-3 py-2 rounded w-full"
            >
              Use Direct
            </button>
          </div>
        ))}
      </div>

      {/* 🔥 STORE NUMBERS */}
      <h2 className="text-xl mb-3">
        Available Numbers
      </h2>

      <div className="grid grid-cols-2 gap-4">
        {filtered.map((n) => (
          <div key={n.id} className="p-4 bg-[#111] rounded-xl">

            <div>+70 20 {n.number}</div>
            <div>{n.price} TAT</div>

            {n.status === "sold" ? (
              <div className="text-red-400 mt-2">Sold</div>
            ) : (
              <button
                onClick={() => {
                  setSelected(n);
                  setShowForm(true);
                }}
                className="mt-3 bg-cyan-400 text-black px-4 py-2 rounded w-full"
              >
                Buy Now
              </button>
            )}
          </div>
        ))}
      </div>

      {/* 🔥 BUY FORM */}
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