"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/client";

type SimItem = {
  id: string;
  number: string;
  status: "available" | "sold";
};

export default function SimStorePage() {
  const [numbers, setNumbers] = useState<SimItem[]>([]);
  const [selected, setSelected] = useState<SimItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [deviceId, setDeviceId] = useState("");

  const [form, setForm] = useState({
    full_name: "",
    age: "",
    nrc: "",
    address: "",
    father_name: "",
    job: "",
  });

  useEffect(() => {
    initDevice();
    loadNumbers();
  }, []);

  async function initDevice() {
    let id = localStorage.getItem("device_id");

    if (!id) {
      id = "DEV-" + Math.random().toString(36).substring(2, 12);
      localStorage.setItem("device_id", id);
    }

    setDeviceId(id);
  }

  async function loadNumbers() {
    const { data } = await supabase.from("numbers").select("*");
    setNumbers((data || []) as SimItem[]);
  }

  function openForm(item: SimItem) {
    setSelected(item);
    setShowForm(true);
  }

  async function confirmOwnership() {
    if (!selected) return;

    if (!form.full_name || !form.nrc) {
      alert("Required fields missing");
      return;
    }

    setLoading(true);

    // 🔒 DEVICE CHECK
    const { data: existing } = await supabase
      .from("ownership")
      .select("*")
      .eq("device_id", deviceId);

    if (existing && existing.length > 0) {
      alert("❌ This device already owns a SIM");
      setLoading(false);
      return;
    }

    // 🔒 UPDATE NUMBER
    await supabase
      .from("numbers")
      .update({ status: "sold" })
      .eq("id", selected.id);

    // 🔒 SAVE FULL DATA
    await supabase.from("sim_registrations").insert({
      number: selected.number,
      ...form,
      device_id: deviceId,
    });

    // 🔒 SAVE OWNERSHIP
    await supabase.from("ownership").insert({
      number: selected.number,
      owner_name: form.full_name,
      owner_nrc: form.nrc,
      device_id: deviceId,
    });

    alert("✅ SIM Ownership Activated");

    setLoading(false);
    setShowForm(false);
    loadNumbers();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#020617] to-[#020617] text-white p-6">

      {/* HEADER */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight">
          Taurus SIM Network
        </h1>
        <p className="text-white/50 mt-2">
          Secure Digital Identity • Ownership System
        </p>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-2 gap-5">

        {numbers.map((n) => (
          <div
            key={n.id}
            className="rounded-2xl p-5 border border-white/10 bg-[#020617] shadow-[0_0_20px_rgba(0,255,255,0.05)] hover:scale-[1.03] transition"
          >
            <div className="text-xs text-white/40 mb-1">
              Taurus Number
            </div>

            <div className="text-xl font-bold text-cyan-400 tracking-widest">
              +70 20 {n.number}
            </div>

            <div className="mt-2 text-sm">
              {n.status === "sold" ? (
                <span className="text-red-400">● Owned</span>
              ) : (
                <span className="text-green-400">● Available</span>
              )}
            </div>

            {n.status === "available" && (
              <button
                onClick={() => openForm(n)}
                className="mt-4 w-full py-2 rounded-xl bg-cyan-400 text-black font-bold hover:bg-cyan-300 transition"
              >
                Register SIM
              </button>
            )}
          </div>
        ))}

      </div>

      {/* MODAL */}
      {showForm && selected && (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center">

          <div className="bg-[#020617] border border-cyan-400/20 p-6 rounded-2xl w-[350px]">

            <h2 className="text-xl font-bold mb-2">
              Identity Verification
            </h2>

            <p className="text-sm text-white/50 mb-4">
              +70 20 {selected.number}
            </p>

            {/* INPUTS */}
            {[
              ["Full Name", "full_name"],
              ["Age", "age"],
              ["NRC / ID", "nrc"],
              ["Address", "address"],
              ["Father Name", "father_name"],
              ["Occupation", "job"],
            ].map(([label, key]) => (
              <input
                key={key}
                placeholder={label}
                className="mb-3 p-3 w-full rounded-lg bg-black border border-white/10 focus:border-cyan-400 outline-none"
                onChange={(e) =>
                  setForm({ ...form, [key]: e.target.value })
                }
              />
            ))}

            {/* BUTTON */}
            <button
              onClick={confirmOwnership}
              disabled={loading}
              className="bg-green-400 text-black w-full py-3 rounded-xl font-bold mt-2"
            >
              {loading ? "Processing..." : "Confirm Ownership"}
            </button>

            <button
              onClick={() => setShowForm(false)}
              className="bg-red-400 text-black w-full py-3 rounded-xl font-bold mt-2"
            >
              Cancel
            </button>

          </div>
        </div>
      )}

    </div>
  );
}