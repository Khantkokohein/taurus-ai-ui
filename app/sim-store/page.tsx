"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/client";

type SimItem = {
  id: string;
  number: string;
  status: "available" | "sold";
  type?: "normal" | "vip" | "premium";
  highlight?: boolean;
  is_giveaway?: boolean;
  price?: number | null;
  is_on_sale?: boolean;
  sale_price?: number | null;
};

type OwnedSimItem = {
  id: string;
  number: string;
};

type FormState = {
  full_name: string;
  age: string;
  nrc: string;
  address: string;
  father_name: string;
  job: string;
};

type OwnershipRow = {
  id: string;
  device_id: string | null;
  active: boolean | null;
  number_id: string | null;
  numbers?:
    | {
        id: string;
        number: string | null;
        suffix_7: string | null;
      }
    | {
        id: string;
        number: string | null;
        suffix_7: string | null;
      }[]
    | null;
};

const INITIAL_FORM: FormState = {
  full_name: "",
  age: "",
  nrc: "",
  address: "",
  father_name: "",
  job: "",
};

export default function SimStorePage() {
  const [numbers, setNumbers] = useState<SimItem[]>([]);
  const [ownedNumbers, setOwnedNumbers] = useState<OwnedSimItem[]>([]);
  const [selected, setSelected] = useState<SimItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deviceId, setDeviceId] = useState("");
  const [step, setStep] = useState(1);

  const [form, setForm] = useState<FormState>(INITIAL_FORM);

  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [nrcFrontFile, setNrcFrontFile] = useState<File | null>(null);
  const [nrcBackFile, setNrcBackFile] = useState<File | null>(null);

  const [selfiePreview, setSelfiePreview] = useState("");
  const [nrcFrontPreview, setNrcFrontPreview] = useState("");
  const [nrcBackPreview, setNrcBackPreview] = useState("");

  useEffect(() => {
    void boot();
  }, []);

  async function boot() {
    const id = initDevice();
    await Promise.all([loadNumbers(), loadOwnedNumbers(id)]);
  }

  function initDevice() {
    let id = localStorage.getItem("device_id");

    if (!id) {
      id = "DEV-" + Math.random().toString(36).substring(2, 12).toUpperCase();
      localStorage.setItem("device_id", id);
    }

    setDeviceId(id);
    return id;
  }

  async function loadNumbers() {
    const { data, error } = await supabase
      .from("numbers")
      .select("*")
      .eq("status", "available")
      .order("number", { ascending: true });

    if (error) {
      console.error("Load numbers error:", error.message);
      return;
    }

    setNumbers((data || []) as SimItem[]);
  }

  async function loadOwnedNumbers(currentDeviceId?: string) {
    const activeDeviceId = currentDeviceId || deviceId;
    if (!activeDeviceId) return;

    const { data, error } = await supabase
      .from("ownership")
      .select(
        `
        id,
        device_id,
        active,
        number_id,
        numbers:number_id (
          id,
          number,
          suffix_7
        )
      `
      )
      .eq("device_id", activeDeviceId)
      .eq("active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Load owned numbers error:", error.message);
      return;
    }

    const mapped: OwnedSimItem[] = ((data || []) as unknown as OwnershipRow[])
      .map((item) => {
        const linkedNumber = Array.isArray(item.numbers)
          ? item.numbers[0]
          : item.numbers;

        return {
          id: item.id,
          number: linkedNumber?.number || linkedNumber?.suffix_7 || "",
        };
      })
      .filter((item) => item.number);

    setOwnedNumbers(mapped);
  }

  function resetFormState() {
    setSelected(null);
    setShowForm(false);
    setLoading(false);
    setStep(1);
    setForm(INITIAL_FORM);
    setSelfieFile(null);
    setNrcFrontFile(null);
    setNrcBackFile(null);
    setSelfiePreview("");
    setNrcFrontPreview("");
    setNrcBackPreview("");
  }

  function openForm(item: SimItem) {
    setSelected(item);
    setShowForm(true);
    setStep(1);
    setForm(INITIAL_FORM);
    setSelfieFile(null);
    setNrcFrontFile(null);
    setNrcBackFile(null);
    setSelfiePreview("");
    setNrcFrontPreview("");
    setNrcBackPreview("");
  }

  function getPreview(file: File, setter: (url: string) => void) {
    const url = URL.createObjectURL(file);
    setter(url);
  }

  function onPickFile(
    e: React.ChangeEvent<HTMLInputElement>,
    type: "selfie" | "front" | "back"
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Only image files are allowed");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be under 5MB");
      return;
    }

    if (type === "selfie") {
      setSelfieFile(file);
      getPreview(file, setSelfiePreview);
    }

    if (type === "front") {
      setNrcFrontFile(file);
      getPreview(file, setNrcFrontPreview);
    }

    if (type === "back") {
      setNrcBackFile(file);
      getPreview(file, setNrcBackPreview);
    }
  }

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const featuredNumbers = useMemo(
    () =>
      numbers.filter(
        (n) =>
          n.status === "available" &&
          (n.highlight || n.type === "vip" || n.type === "premium")
      ),
    [numbers]
  );

  const normalNumbers = useMemo(
    () =>
      numbers.filter(
        (n) =>
          n.status === "available" &&
          !n.highlight &&
          n.type !== "vip" &&
          n.type !== "premium"
      ),
    [numbers]
  );

  function validateStep(currentStep: number) {
    if (currentStep === 1) {
      if (!selected) {
        alert("Please select a SIM number");
        return false;
      }
    }

    if (currentStep === 2) {
      if (
        !form.full_name.trim() ||
        !form.age.trim() ||
        !form.nrc.trim() ||
        !form.address.trim() ||
        !form.father_name.trim() ||
        !form.job.trim()
      ) {
        alert("Please fill all personal information fields");
        return false;
      }
    }

    if (currentStep === 3) {
      if (!selfieFile) {
        alert("Please upload a selfie / face photo");
        return false;
      }
    }

    if (currentStep === 4) {
      if (!nrcFrontFile || !nrcBackFile) {
        alert("Please upload NRC front and back images");
        return false;
      }
    }

    return true;
  }

  function nextStep() {
    if (!validateStep(step)) return;
    setStep((prev) => Math.min(prev + 1, 5));
  }

  function prevStep() {
    setStep((prev) => Math.max(prev - 1, 1));
  }

  async function uploadImage(file: File, bucket: string, folder: string) {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeNumber = selected?.number?.replace(/\s+/g, "") || "unknown";
    const filename = `${folder}/${deviceId}-${safeNumber}-${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from(bucket).upload(filename, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error) {
      throw new Error(`${bucket} upload failed: ${error.message}`);
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filename);
    return data.publicUrl;
  }

  async function confirmOwnership() {
    if (!selected) return;

    if (!validateStep(2) || !validateStep(3) || !validateStep(4)) {
      return;
    }

    setLoading(true);

    try {
      const currentDeviceId = deviceId || initDevice();

      const { data: existingOwnership, error: ownershipCheckError } = await supabase
        .from("ownership")
        .select("id")
        .eq("device_id", currentDeviceId)
        .eq("active", true)
        .limit(1);

      if (ownershipCheckError) {
        throw new Error(`Ownership check failed: ${ownershipCheckError.message}`);
      }

      if (existingOwnership && existingOwnership.length > 0) {
        throw new Error("This device already owns a SIM");
      }

      const { data: currentNumber, error: numberCheckError } = await supabase
        .from("numbers")
        .select("id, status, number")
        .eq("id", selected.id)
        .single();

      if (numberCheckError) {
        throw new Error(`Number check failed: ${numberCheckError.message}`);
      }

      if (!currentNumber || currentNumber.status !== "available") {
        await loadNumbers();
        throw new Error("This SIM is no longer available");
      }

      const selfieUrl = await uploadImage(selfieFile!, "sim-selfies", "selfies");
      const nrcFrontUrl = await uploadImage(nrcFrontFile!, "sim-nrc", "nrc-front");
      const nrcBackUrl = await uploadImage(nrcBackFile!, "sim-nrc", "nrc-back");

      const registrationPayload = {
        number: selected.number,
        full_name: form.full_name.trim(),
        age: form.age.trim(),
        nrc: form.nrc.trim(),
        address: form.address.trim(),
        father_name: form.father_name.trim(),
        job: form.job.trim(),
        device_id: currentDeviceId,
        selfie_url: selfieUrl,
        nrc_front_url: nrcFrontUrl,
        nrc_back_url: nrcBackUrl,
        status: "approved",
      };

      const { data: registrationInsert, error: registrationError } = await supabase
        .from("sim_registrations")
        .insert([registrationPayload])
        .select("id")
        .single();

      if (registrationError) {
        throw new Error(`Registration save failed: ${registrationError.message}`);
      }

      const ownershipPayload = {
        user_id: null,
        number_id: selected.id,
        number: selected.number,
        owner_name: form.full_name.trim(),
        owner_nrc: form.nrc.trim(),
        owner_note: null,
        device_id: currentDeviceId,
        registration_id: registrationInsert.id,
        active: true,
      };

      const { error: ownershipError } = await supabase
        .from("ownership")
        .insert([ownershipPayload]);

      if (ownershipError) {
        throw new Error(`Ownership save failed: ${ownershipError.message}`);
      }

      const { error: updateNumberError } = await supabase
        .from("numbers")
        .update({ status: "sold" })
        .eq("id", selected.id);

      if (updateNumberError) {
        throw new Error(`Number update failed: ${updateNumberError.message}`);
      }

      alert("✅ SIM Ownership Activated Successfully");
      resetFormState();
      await Promise.all([loadNumbers(), loadOwnedNumbers(currentDeviceId)]);
    } catch (error) {
      console.error("SIM register error:", error);
      alert(
        error instanceof Error
          ? `❌ ${error.message}`
          : "❌ Something went wrong"
      );
      setLoading(false);
    }
  }

  function getCardStyle(item: SimItem) {
    if (item.status === "sold") {
      return "border-white/10 bg-white/5";
    }

    if (item.type === "vip") {
      return "border-yellow-400/40 bg-gradient-to-br from-yellow-400/10 via-black to-yellow-900/20 shadow-[0_0_30px_rgba(250,204,21,0.15)]";
    }

    if (item.type === "premium") {
      return "border-fuchsia-400/40 bg-gradient-to-br from-fuchsia-500/10 via-[#050816] to-cyan-500/10 shadow-[0_0_30px_rgba(217,70,239,0.14)]";
    }

    if (item.highlight) {
      return "border-cyan-400/40 bg-gradient-to-br from-cyan-400/10 via-[#050816] to-blue-500/10 shadow-[0_0_30px_rgba(34,211,238,0.14)]";
    }

    return "border-cyan-400/20 bg-[#07101f]/90 shadow-[0_0_20px_rgba(34,211,238,0.06)]";
  }

  function getBadge(item: SimItem) {
    if (item.is_giveaway) return "GIVEAWAY";
    if (item.type === "vip") return "VIP NUMBER";
    if (item.type === "premium") return "PREMIUM";
    if (item.highlight) return "FEATURED";
    return "STANDARD";
  }

  function getPriceLabel(item: SimItem) {
    if (item.is_giveaway) return "FREE";
    if (item.is_on_sale && item.sale_price) {
      return `${Number(item.sale_price).toLocaleString()} TAT`;
    }
    if (item.price) return `${Number(item.price).toLocaleString()} TAT`;
    return "";
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_30%),linear-gradient(135deg,#020617_0%,#030712_35%,#06121f_100%)] text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8 overflow-hidden rounded-[28px] border border-cyan-400/20 bg-white/5 p-6 backdrop-blur-xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1 text-xs font-semibold tracking-[0.2em] text-cyan-300">
                TAURUS DIGITAL IDENTITY NETWORK
              </div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                Taurus SIM Store
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-white/65 sm:text-base">
                Secure SIM ownership registration with personal information,
                face photo, NRC front and back verification, and automatic
                activation for first-time purchase.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <div className="text-xs text-white/45">Available</div>
                <div className="mt-1 text-2xl font-bold text-cyan-300">
                  {numbers.filter((n) => n.status === "available").length}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <div className="text-xs text-white/45">Owned</div>
                <div className="mt-1 text-2xl font-bold text-red-300">
                  {ownedNumbers.length}
                </div>
              </div>
              <div className="col-span-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 sm:col-span-1">
                <div className="text-xs text-white/45">Device Lock</div>
                <div className="mt-1 truncate text-sm font-semibold text-green-300">
                  {deviceId || "Loading..."}
                </div>
              </div>
            </div>
          </div>
        </div>

        {featuredNumbers.length > 0 && (
          <section className="mb-10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-wide text-white">
                Featured Numbers
              </h2>
              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                Premium Selection
              </span>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {featuredNumbers.map((n) => (
                <div
                  key={n.id}
                  className={`group rounded-[28px] border p-5 transition duration-300 hover:-translate-y-1 ${getCardStyle(
                    n
                  )}`}
                >
                  <div className="mb-6 flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-[0.24em] text-white/45">
                        Taurus Number
                      </div>
                      <div className="mt-2 text-2xl font-black tracking-[0.15em] text-white sm:text-3xl">
                        +70 20 {n.number}
                      </div>
                    </div>

                    <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-bold tracking-[0.18em] text-white/80">
                      {getBadge(n)}
                    </div>
                  </div>

                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-sm">
                      {n.status === "sold" ? (
                        <span className="font-semibold text-red-300">● Owned</span>
                      ) : (
                        <span className="font-semibold text-green-300">● Available</span>
                      )}
                    </div>
                    <div className="text-xs text-white/45">1 Device = 1 SIM</div>
                  </div>

                  <div className="mb-5">
                    {n.is_giveaway ? (
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-yellow-300">FREE</span>
                        <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-2 py-1 text-[10px] font-medium text-yellow-300">
                          GIVEAWAY
                        </span>
                      </div>
                    ) : (
                      <div className="text-sm font-semibold text-cyan-300">
                        {getPriceLabel(n)}
                      </div>
                    )}
                  </div>

                  {n.status === "available" && (
                    <button
                      onClick={() => openForm(n)}
                      className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-black text-black transition hover:scale-[1.01]"
                    >
                      Register This SIM
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-wide text-white">
              Available Numbers
            </h2>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/65">
              Direct Activation
            </span>
          </div>

          {normalNumbers.length === 0 ? (
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-10 text-center text-white/50">
              No standard numbers available right now.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {normalNumbers.map((n) => (
                <div
                  key={n.id}
                  className={`rounded-[26px] border p-5 transition duration-300 hover:-translate-y-1 ${getCardStyle(
                    n
                  )}`}
                >
                  <div className="mb-2 text-xs uppercase tracking-[0.22em] text-white/40">
                    Taurus Number
                  </div>

                  <div className="text-2xl font-black tracking-[0.14em] text-cyan-300">
                    +70 20 {n.number}
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-sm">
                      <span className="font-semibold text-green-300">● Available</span>
                    </div>
                    <div className="text-[10px] font-bold tracking-[0.16em] text-white/45">
                      {getBadge(n)}
                    </div>
                  </div>

                  <div className="mt-4">
                    {n.is_giveaway ? (
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-yellow-300">FREE</span>
                        <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-2 py-1 text-[10px] font-medium text-yellow-300">
                          GIVEAWAY
                        </span>
                      </div>
                    ) : (
                      <div className="text-sm font-semibold text-cyan-300">
                        {getPriceLabel(n)}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => openForm(n)}
                    className="mt-5 w-full rounded-2xl border border-cyan-400/30 bg-cyan-400/90 px-4 py-3 text-sm font-black text-black transition hover:bg-cyan-300"
                  >
                    Register SIM
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-wide text-white/90">
              Owned Numbers
            </h2>
            <span className="rounded-full border border-red-400/20 bg-red-400/10 px-3 py-1 text-xs font-semibold text-red-300">
              Locked
            </span>
          </div>

          {ownedNumbers.length === 0 ? (
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-8 text-center text-white/50">
              No owned numbers yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {ownedNumbers.map((n) => (
                <div
                  key={n.id}
                  className="rounded-[24px] border border-white/10 bg-white/5 p-5"
                >
                  <div className="text-xs uppercase tracking-[0.22em] text-white/40">
                    Taurus Number
                  </div>
                  <div className="mt-2 text-2xl font-black tracking-[0.14em] text-white/80">
                    +70 20 {n.number}
                  </div>
                  <div className="mt-3 text-sm font-semibold text-red-300">● Owned</div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {showForm && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-4 py-6 backdrop-blur-md">
          <div className="max-h-[95vh] w-full max-w-3xl overflow-y-auto rounded-[30px] border border-cyan-400/20 bg-[#06101d]/95 p-5 shadow-[0_0_50px_rgba(34,211,238,0.14)] sm:p-7">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <div className="mb-2 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-bold tracking-[0.18em] text-cyan-300">
                  SIM REGISTRATION
                </div>
                <h2 className="text-2xl font-black tracking-tight">
                  +70 20 {selected.number}
                </h2>
                <p className="mt-2 text-sm text-white/55">
                  Complete personal information, selfie, and NRC images to
                  activate ownership instantly.
                </p>
              </div>

              <button
                onClick={resetFormState}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/70 transition hover:bg-white/10"
              >
                Close
              </button>
            </div>

            <div className="mb-6">
              <div className="mb-3 flex items-center justify-between text-xs font-semibold tracking-[0.18em] text-white/45">
                <span>STEP {step} OF 5</span>
                <span>{Math.round((step / 5) * 100)}%</span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 transition-all duration-300"
                  style={{ width: `${(step / 5) * 100}%` }}
                />
              </div>
            </div>

            {step === 1 && (
              <div className="rounded-[26px] border border-white/10 bg-white/5 p-5">
                <div className="text-xs uppercase tracking-[0.22em] text-white/40">
                  Selected Number
                </div>
                <div className="mt-3 text-3xl font-black tracking-[0.16em] text-cyan-300">
                  +70 20 {selected.number}
                </div>
                <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm text-white/70">
                  This SIM will be permanently linked to this device after
                  successful registration.
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InputBox
                  label="Full Name"
                  value={form.full_name}
                  onChange={(value) => updateField("full_name", value)}
                  placeholder="Enter full name"
                />
                <InputBox
                  label="Age"
                  value={form.age}
                  onChange={(value) => updateField("age", value)}
                  placeholder="Enter age"
                />
                <InputBox
                  label="NRC / ID Number"
                  value={form.nrc}
                  onChange={(value) => updateField("nrc", value)}
                  placeholder="Enter NRC / ID"
                />
                <InputBox
                  label="Occupation"
                  value={form.job}
                  onChange={(value) => updateField("job", value)}
                  placeholder="Enter occupation"
                />
                <div className="sm:col-span-2">
                  <InputBox
                    label="Address"
                    value={form.address}
                    onChange={(value) => updateField("address", value)}
                    placeholder="Enter address"
                  />
                </div>
                <div className="sm:col-span-2">
                  <InputBox
                    label="Father Name"
                    value={form.father_name}
                    onChange={(value) => updateField("father_name", value)}
                    placeholder="Enter father name"
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <UploadCard
                title="Selfie / Face Photo"
                description="Upload a clear front-facing selfie photo."
                preview={selfiePreview}
                inputId="selfie-upload"
                onChange={(e) => onPickFile(e, "selfie")}
              />
            )}

            {step === 4 && (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <UploadCard
                  title="NRC Front"
                  description="Upload NRC front side image."
                  preview={nrcFrontPreview}
                  inputId="nrc-front-upload"
                  onChange={(e) => onPickFile(e, "front")}
                />
                <UploadCard
                  title="NRC Back"
                  description="Upload NRC back side image."
                  preview={nrcBackPreview}
                  inputId="nrc-back-upload"
                  onChange={(e) => onPickFile(e, "back")}
                />
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4">
                <div className="rounded-[26px] border border-white/10 bg-white/5 p-5">
                  <div className="mb-4 text-lg font-bold">Review Information</div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <ReviewItem label="Selected Number" value={`+70 20 ${selected.number}`} />
                    <ReviewItem label="Device ID" value={deviceId} />
                    <ReviewItem label="Full Name" value={form.full_name} />
                    <ReviewItem label="Age" value={form.age} />
                    <ReviewItem label="NRC / ID" value={form.nrc} />
                    <ReviewItem label="Occupation" value={form.job} />
                    <ReviewItem label="Address" value={form.address} />
                    <ReviewItem label="Father Name" value={form.father_name} />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <PreviewMini title="Selfie" preview={selfiePreview} />
                  <PreviewMini title="NRC Front" preview={nrcFrontPreview} />
                  <PreviewMini title="NRC Back" preview={nrcBackPreview} />
                </div>

                <div className="rounded-[24px] border border-green-400/20 bg-green-400/10 p-4 text-sm text-white/75">
                  After confirmation, this SIM will be activated immediately and
                  locked to this device. Recovery or device change will require
                  admin review later.
                </div>
              </div>
            )}

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-between">
              <button
                onClick={step === 1 ? resetFormState : prevStep}
                disabled={loading}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white/80 transition hover:bg-white/10 sm:w-auto"
              >
                {step === 1 ? "Cancel" : "Back"}
              </button>

              {step < 5 ? (
                <button
                  onClick={nextStep}
                  disabled={loading}
                  className="w-full rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-black text-black transition hover:bg-cyan-300 sm:w-auto"
                >
                  Continue
                </button>
              ) : (
                <button
                  onClick={confirmOwnership}
                  disabled={loading}
                  className="w-full rounded-2xl bg-green-400 px-5 py-3 text-sm font-black text-black transition hover:bg-green-300 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                >
                  {loading ? "Processing..." : "Confirm Ownership"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InputBox({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
      <div className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-white/45">
        {label}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/50"
      />
    </div>
  );
}

function UploadCard({
  title,
  description,
  preview,
  inputId,
  onChange,
}: {
  title: string;
  description: string;
  preview: string;
  inputId: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="rounded-[26px] border border-white/10 bg-white/5 p-5">
      <div className="mb-2 text-lg font-bold">{title}</div>
      <div className="mb-4 text-sm text-white/55">{description}</div>

      <label
        htmlFor={inputId}
        className="flex min-h-[260px] cursor-pointer items-center justify-center overflow-hidden rounded-[24px] border border-dashed border-cyan-400/30 bg-black/20 p-3 transition hover:border-cyan-300/60"
      >
        {preview ? (
          <img
            src={preview}
            alt={title}
            className="h-full max-h-[320px] w-full rounded-[20px] object-cover"
          />
        ) : (
          <div className="text-center">
            <div className="mb-2 text-sm font-bold text-cyan-300">Tap to Upload</div>
            <div className="text-xs text-white/45">PNG, JPG, JPEG under 5MB</div>
          </div>
        )}
      </label>

      <input
        id={inputId}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onChange}
      />
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-white/40">
        {label}
      </div>
      <div className="break-words text-sm font-semibold text-white/85">{value}</div>
    </div>
  );
}

function PreviewMini({
  title,
  preview,
}: {
  title: string;
  preview: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
      <div className="mb-3 text-sm font-bold text-white/75">{title}</div>
      <div className="overflow-hidden rounded-[18px] border border-white/10 bg-black/20">
        {preview ? (
          <img
            src={preview}
            alt={title}
            className="h-[180px] w-full object-cover"
          />
        ) : (
          <div className="flex h-[180px] items-center justify-center text-xs text-white/35">
            No Image
          </div>
        )}
      </div>
    </div>
  );
}