"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const NUMBER = "+70 20 7777777";
const GREETING_MM =
  "မင်္ဂလာပါ Taurus AI ပါခင်ဗျ။ ဘာများဝန်ဆောင်မှု ပေးရမလဲခင်ဗျ";
const GREETING_EN = "How can I help you? I am Taurus AI.";

export default function AICallPage() {
  const [time, setTime] = useState(0);
  const [status, setStatus] = useState("Connecting...");
  const [messages, setMessages] = useState<Message[]>([]);
  const [listening, setListening] = useState(false);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(true);
  const [showPad, setShowPad] = useState(false);
  const [showSms, setShowSms] = useState(false);
  const [input, setInput] = useState("");
  const [dial, setDial] = useState(NUMBER);

  const timerRef = useRef<number | null>(null);
  const ringTimeoutRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const smsListRef = useRef<HTMLDivElement | null>(null);
  const ringtone1Ref = useRef<HTMLAudioElement | null>(null);
  const ringtone2Ref = useRef<HTMLAudioElement | null>(null);

  const formatted = useMemo(() => {
    const m = Math.floor(time / 60).toString().padStart(2, "0");
    const s = (time % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }, [time]);

  const isMyanmar = useCallback((text: string) => /[\u1000-\u109F]/.test(text), []);

  const speak = useCallback(
    (text: string) => {
      if (muted || !("speechSynthesis" in window)) return;
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = isMyanmar(text) ? "my-MM" : "en-US";
      utter.rate = 0.93;
      utter.pitch = 0.95;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    },
    [isMyanmar, muted]
  );

  const stopAudio = useCallback(() => {
    [ringtone1Ref.current, ringtone2Ref.current].forEach((a) => {
      if (!a) return;
      a.pause();
      a.currentTime = 0;
    });
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const safePlay = useCallback(
    async (audio: HTMLAudioElement | null) => {
      if (!audio || muted) return;
      try {
        await audio.play();
      } catch {}
    },
    [muted]
  );

  const startMic = useCallback(() => {
    const Ctor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!Ctor) {
      const msg = "ဒီ browser မှာ microphone speech input support မရှိသေးပါ။";
      setMessages((prev) => [...prev, { role: "assistant", content: msg }]);
      speak(msg);
      return;
    }

    const recog = new Ctor();
    recognitionRef.current = recog;
    recog.lang = "my-MM";
    recog.continuous = false;
    recog.interimResults = false;

    setListening(true);
    setStatus("Listening...");

    recog.onresult = async (e: any) => {
      const text = e?.results?.[0]?.[0]?.transcript || "";
      setListening(false);
      setStatus("Connected");
      if (text.trim()) {
        await sendToAI(text);
      }
    };

    recog.onerror = () => {
      setListening(false);
      setStatus("Connected");
    };

    recog.onend = () => {
      setListening(false);
      setStatus("Connected");
    };

    recog.start();
  }, [speak]);

  const sendToAI = useCallback(
    async (text: string) => {
      const clean = text.trim();
      if (!clean) return;

      const next = [...messages, { role: "user" as const, content: clean }];
      setMessages(next);

      try {
        const res = await fetch("/api/ai-call", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: next }),
        });

        const data = await res.json().catch(() => ({}));
        const reply =
          data?.reply || "စနစ်ကို အကောင်းဆုံး ပြင်ဆင်နေပါတယ်ခင်ဗျ";
        setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
        speak(reply);
      } catch {
        const fallback = "စနစ်ကို အကောင်းဆုံး ပြင်ဆင်နေပါတယ်ခင်ဗျ";
        setMessages((prev) => [...prev, { role: "assistant", content: fallback }]);
        speak(fallback);
      }
    },
    [messages, speak]
  );

  useEffect(() => {
    ringtone1Ref.current = new Audio("/ringtone-1.mp3");
    ringtone2Ref.current = new Audio("/ringtone-2.mp3");

    if (ringtone1Ref.current) {
      ringtone1Ref.current.loop = true;
      ringtone1Ref.current.preload = "auto";
    }
    if (ringtone2Ref.current) {
      ringtone2Ref.current.loop = false;
      ringtone2Ref.current.preload = "auto";
    }

    stopAudio();
    setStatus("Calling...");
    safePlay(ringtone1Ref.current);

    ringTimeoutRef.current = window.setTimeout(async () => {
      stopAudio();
      await safePlay(ringtone2Ref.current);

      const greeting = GREETING_MM;
      setStatus("Connected");
      setMessages([{ role: "assistant", content: greeting }]);
      speak(greeting);

      timerRef.current = window.setInterval(() => {
        setTime((t) => t + 1);
      }, 1000);

      startMic();
    }, 20000);

    return () => {
      if (ringTimeoutRef.current) window.clearTimeout(ringTimeoutRef.current);
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      stopAudio();
    };
  }, [safePlay, speak, startMic, stopAudio]);

  useEffect(() => {
    if (!smsListRef.current) return;
    smsListRef.current.scrollTop = smsListRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    const vol = speaker ? 1 : 0.15;
    if (ringtone1Ref.current) ringtone1Ref.current.volume = vol;
    if (ringtone2Ref.current) ringtone2Ref.current.volume = vol;
  }, [speaker]);

  function endCall() {
    if (ringTimeoutRef.current) window.clearTimeout(ringTimeoutRef.current);
    if (timerRef.current) window.clearInterval(timerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    stopAudio();
    window.location.href = "/login-gate";
  }

  function appendDial(v: string) {
    setDial((prev) => `${prev}${v}`);
  }

  function deleteDial() {
    setDial((prev) => prev.slice(0, -1));
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-black px-5 pb-8 pt-8">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => (window.location.href = "/login-gate")}
            className="rounded-full border border-white/10 px-3 py-2 text-xs text-white/70"
          >
            Back
          </button>

          <div className="text-center">
            <div className="text-[11px] uppercase tracking-[0.28em] text-white/40">
              I am Taurus AI
            </div>
          </div>

          <div className="w-[56px]" />
        </div>

        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="relative mb-8 flex h-[300px] w-[300px] items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(90,242,255,0.18)_0%,rgba(93,130,255,0.10)_30%,rgba(0,0,0,0)_72%)] blur-2xl" />
            <div className="absolute h-[240px] w-[240px] rounded-full border border-white/10" />
            <div className="absolute h-[180px] w-[180px] rounded-full border border-cyan-300/25" />
            <div className="absolute h-[120px] w-[120px] rounded-full bg-cyan-300/20 blur-2xl" />
            <div className="absolute h-[18px] w-[180px] rounded-full border border-cyan-300/20" />
            <div className="absolute h-[18px] w-[150px] rotate-90 rounded-full border border-blue-300/20" />
            <div className="absolute text-5xl">🌎</div>
          </div>

          <div className="text-center">
            <div className="text-[13px] uppercase tracking-[0.26em] text-white/45">
              Taurus AI Main Support
            </div>
            <div className="mt-3 text-[34px] font-semibold tracking-tight">{NUMBER}</div>
            <div className="mt-3 text-white/65">{status}</div>
            <div className="mt-2 text-lg text-white/82">{formatted}</div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <PhoneActionButton label="Mute" icon="🎤" active={muted} onClick={() => setMuted((v) => !v)} />
            <PhoneActionButton label="Speaker" icon="🔊" active={speaker} onClick={() => setSpeaker((v) => !v)} />
            <PhoneActionButton label="Keypad" icon="⌨️" active={showPad} onClick={() => setShowPad(true)} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <PhoneActionButton label="SMS" icon="💬" active={showSms} onClick={() => setShowSms(true)} />
            <PhoneActionButton label="Voice" icon={listening ? "🎙️" : "🗣️"} active={listening} onClick={startMic} />
            <PhoneEndButton label="End" icon="❌" onClick={endCall} />
          </div>
        </div>
      </div>

      {showPad && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-[420px] rounded-[32px] bg-[#111111] px-5 pb-6 pt-5 shadow-[0_-20px_60px_rgba(0,0,0,0.55)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-white/40">Dial Pad</div>
                <div className="mt-1 text-2xl font-semibold">{dial}</div>
              </div>
              <button
                onClick={() => setShowPad(false)}
                className="rounded-full border border-white/10 px-3 py-2 text-white/70"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map((n) => (
                <button
                  key={n}
                  onClick={() => appendDial(n)}
                  className="h-16 rounded-full bg-white/10 text-xl font-semibold text-white"
                >
                  {n}
                </button>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <button
                onClick={deleteDial}
                className="rounded-full bg-white/10 px-4 py-3 text-sm font-semibold text-red-300"
              >
                Delete
              </button>
              <button
                onClick={() => setShowPad(false)}
                className="rounded-full bg-green-500 px-4 py-3 text-sm font-semibold text-white"
              >
                Done
              </button>
              <button
                onClick={() => setDial(NUMBER)}
                className="rounded-full bg-white/10 px-4 py-3 text-sm font-semibold text-white/80"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {showSms && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-4 backdrop-blur-sm">
          <div className="flex h-[76vh] w-full max-w-[420px] flex-col rounded-[32px] bg-[#111111] px-5 pb-5 pt-5 shadow-[0_-20px_60px_rgba(0,0,0,0.55)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-white/40">SMS Support</div>
                <div className="mt-1 text-xl font-semibold">To {NUMBER}</div>
              </div>
              <button
                onClick={() => setShowSms(false)}
                className="rounded-full border border-white/10 px-3 py-2 text-white/70"
              >
                ✕
              </button>
            </div>

            <div ref={smsListRef} className="flex-1 overflow-y-auto rounded-[24px] bg-white/5 p-4">
              <div className="space-y-3">
                {messages.length === 0 && (
                  <div className="rounded-2xl bg-white/8 px-4 py-3 text-sm leading-7 text-white/70">
                    Call connected ဖြစ်ပြီးနောက် Taurus AI နဲ့ စကားပြောမှုတွေကို ဒီ panel မှာမြင်နိုင်ပါတယ်။
                  </div>
                )}

                {messages.map((msg, idx) => (
                  <div
                    key={`${msg.role}-${idx}`}
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-7 ${
                      msg.role === "assistant"
                        ? "bg-white/10 text-white"
                        : "ml-auto bg-cyan-500/15 text-cyan-50"
                    }`}
                  >
                    {msg.content}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-end gap-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type message..."
                className="min-h-[90px] flex-1 rounded-[24px] border border-white/10 bg-white/8 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30"
              />
              <button
                onClick={() => {
                  const text = input.trim();
                  if (!text) return;
                  setInput("");
                  sendManual(text);
                }}
                className="h-[90px] rounded-[24px] bg-cyan-500 px-5 text-sm font-semibold text-black"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );

  async function sendManual(text: string) {
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);

    try {
      const res = await fetch("/api/ai-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });

      const data = await res.json().catch(() => ({}));
      const reply = data?.reply || "စနစ်ကို အကောင်းဆုံး ပြင်ဆင်နေပါတယ်ခင်ဗျ";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      speak(reply);
    } catch {
      const fallback = "စနစ်ကို အကောင်းဆုံး ပြင်ဆင်နေပါတယ်ခင်ဗျ";
      setMessages((prev) => [...prev, { role: "assistant", content: fallback }]);
      speak(fallback);
    }
  }
}

function PhoneActionButton({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex h-[78px] flex-col items-center justify-center rounded-3xl transition ${
        active ? "bg-white/15 text-white" : "bg-white/10 text-white/80"
      }`}
    >
      <div className="text-xl">{icon}</div>
      <div className="mt-2 text-[12px] font-medium">{label}</div>
    </button>
  );
}

function PhoneEndButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex h-[78px] flex-col items-center justify-center rounded-3xl bg-red-500 text-white transition"
    >
      <div className="text-xl">{icon}</div>
      <div className="mt-2 text-[12px] font-medium">{label}</div>
    </button>
  );
}