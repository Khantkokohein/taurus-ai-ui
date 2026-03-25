"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const DEFAULT_NUMBER = "+70 20 7777777";
const GREETING_MM =
  "မင်္ဂလာပါ Taurus AI ပါခင်ဗျ။ ဘာများဝန်ဆောင်မှု ပေးရမလဲခင်ဗျ";
const GREETING_EN = "How can I help you? I am Taurus AI.";

export default function AICallPage() {
  const [callState, setCallState] = useState<"idle" | "ringing" | "connected">("idle");
  const [dialNumber, setDialNumber] = useState(DEFAULT_NUMBER);
  const [activeNumber, setActiveNumber] = useState(DEFAULT_NUMBER);
  const [statusText, setStatusText] = useState("Ready");
  const [callSeconds, setCallSeconds] = useState(0);

  const [showDialPad, setShowDialPad] = useState(false);
  const [showSms, setShowSms] = useState(false);

  const [speakerOn, setSpeakerOn] = useState(true);
  const [muteOn, setMuteOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [smsText, setSmsText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);

  const smsListRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const connectTimeoutRef = useRef<number | null>(null);

  const ringtone1Ref = useRef<HTMLAudioElement | null>(null);
  const ringtone2Ref = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);

  const formattedDuration = useMemo(() => {
    const m = Math.floor(callSeconds / 60).toString().padStart(2, "0");
    const s = (callSeconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }, [callSeconds]);

  const detectMyanmar = useCallback((text: string) => /[\u1000-\u109F]/.test(text), []);

  const speakText = useCallback(
    (text: string) => {
      if (muteOn || typeof window === "undefined" || !window.speechSynthesis) return;

      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = detectMyanmar(text) ? "my-MM" : "en-US";
      utter.rate = 0.95;
      utter.pitch = 0.95;

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    },
    [detectMyanmar, muteOn]
  );

  const stopAllAudio = useCallback(() => {
    [ringtone1Ref.current, ringtone2Ref.current].forEach((audio) => {
      if (!audio) return;
      audio.pause();
      audio.currentTime = 0;
    });
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const safePlay = useCallback(
    async (audio: HTMLAudioElement | null) => {
      if (!audio || muteOn) return;
      try {
        await audio.play();
      } catch {}
    },
    [muteOn]
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

    return () => {
      stopAllAudio();
      if (connectTimeoutRef.current) window.clearTimeout(connectTimeoutRef.current);
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [stopAllAudio]);

  useEffect(() => {
    if (!smsListRef.current) return;
    smsListRef.current.scrollTop = smsListRef.current.scrollHeight;
  }, [messages, sending]);

  useEffect(() => {
    const volume = speakerOn ? 1 : 0.1;
    if (ringtone1Ref.current) ringtone1Ref.current.volume = volume;
    if (ringtone2Ref.current) ringtone2Ref.current.volume = volume;
  }, [speakerOn]);

  useEffect(() => {
    if (callState !== "connected") {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = window.setInterval(() => {
      setCallSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [callState]);

  const beginConnectedState = useCallback(async (number: string) => {
    stopAllAudio();
    setCallState("connected");
    setStatusText("Connected");
    setCallSeconds(0);
    setActiveNumber(number);

    try {
      await safePlay(ringtone2Ref.current);
    } catch {}

    const greeting = GREETING_MM;
    setMessages([{ role: "assistant", content: greeting }]);
    speakText(greeting);
  }, [safePlay, speakText, stopAllAudio]);

  const startCall = useCallback(async (number?: string) => {
    const target = (number || dialNumber || DEFAULT_NUMBER).trim();

    if (connectTimeoutRef.current) window.clearTimeout(connectTimeoutRef.current);
    if (timerRef.current) window.clearInterval(timerRef.current);

    stopAllAudio();

    setCallState("ringing");
    setStatusText("Calling...");
    setCallSeconds(0);
    setActiveNumber(target);
    setMessages([]);
    setShowDialPad(false);

    await safePlay(ringtone1Ref.current);

    connectTimeoutRef.current = window.setTimeout(() => {
      beginConnectedState(target);
    }, 20000);
  }, [beginConnectedState, dialNumber, safePlay, stopAllAudio]);

  const endCall = useCallback(() => {
    if (connectTimeoutRef.current) window.clearTimeout(connectTimeoutRef.current);
    if (timerRef.current) window.clearInterval(timerRef.current);
    stopAllAudio();
    setCallState("idle");
    setStatusText("Ready");
    setCallSeconds(0);
    setMicOn(false);
  }, [stopAllAudio]);

  const sendToAI = useCallback(
    async (text: string) => {
      const clean = text.trim();
      if (!clean || sending || callState !== "connected") return;

      const next = [...messages, { role: "user" as const, content: clean }];
      setMessages(next);
      setSending(true);
      setSmsText("");

      try {
        const res = await fetch("/api/ai-call", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: next }),
        });

        const data = await res.json().catch(() => ({}));
        const reply =
          data?.reply ||
          "အတွင်းပိုင်းစနစ်ကို အကောင်းဆုံးပြင်ဆင်နေပါတယ်ခင်ဗျ။ စိတ်ဝင်စားစရာ features တွေကို အကောင်းဆုံး upgrade လုပ်နေပါတယ်ခင်ဗျ";

        setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
        speakText(reply);
      } catch {
        const fallback =
          "အတွင်းပိုင်းစနစ်ကို အကောင်းဆုံးပြင်ဆင်နေပါတယ်ခင်ဗျ။ စိတ်ဝင်စားစရာ features တွေကို အကောင်းဆုံး upgrade လုပ်နေပါတယ်ခင်ဗျ";
        setMessages((prev) => [...prev, { role: "assistant", content: fallback }]);
        speakText(fallback);
      } finally {
        setSending(false);
      }
    },
    [callState, messages, sending, speakText]
  );

  const startMic = useCallback(() => {
    if (callState !== "connected") return;

    const RecognitionCtor =
      typeof window !== "undefined"
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    if (!RecognitionCtor) {
      const msg = "ဒီ browser မှာ voice input support မရှိသေးပါ။ SMS panel ကို သုံးနိုင်ပါတယ်။";
      setMessages((prev) => [...prev, { role: "assistant", content: msg }]);
      speakText(msg);
      return;
    }

    const recognition = new RecognitionCtor();
    recognitionRef.current = recognition;
    recognition.lang = "my-MM";
    recognition.interimResults = false;
    recognition.continuous = false;

    setMicOn(true);
    setStatusText("Listening...");

    recognition.onresult = (event: any) => {
      const transcript = event?.results?.[0]?.[0]?.transcript || "";
      setMicOn(false);
      setStatusText("Connected");
      sendToAI(transcript);
    };

    recognition.onerror = () => {
      setMicOn(false);
      setStatusText("Connected");
    };

    recognition.onend = () => {
      setMicOn(false);
      setStatusText("Connected");
    };

    recognition.start();
  }, [callState, sendToAI, speakText]);

  const appendDial = useCallback((key: string) => {
    setDialNumber((prev) => `${prev}${key}`);
  }, []);

  const deleteDial = useCallback(() => {
    setDialNumber((prev) => prev.slice(0, -1));
  }, []);

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
              Taurus AI Main Support
            </div>
          </div>

          <div className="w-[56px]" />
        </div>

        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="relative mb-8 flex h-[280px] w-[280px] items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(165,105,255,0.22)_0%,rgba(86,177,255,0.12)_35%,rgba(0,0,0,0)_70%)] blur-2xl" />
            <div className="absolute h-[220px] w-[220px] rounded-full border border-white/10" />
            <div className="absolute h-[160px] w-[160px] rounded-full border border-cyan-300/25" />
            <div className="absolute h-[90px] w-[90px] rounded-full bg-white/10 shadow-[0_0_60px_rgba(177,227,255,0.18)]" />
            <div className="absolute h-[16px] w-[180px] rounded-full border border-cyan-300/20" />
            <div className="absolute h-[16px] w-[140px] rounded-full border border-purple-300/20 rotate-90" />
          </div>

          <div className="text-center">
            <div className="text-[13px] uppercase tracking-[0.26em] text-white/45">
              {callState === "idle" ? "Ready To Call" : callState === "ringing" ? "Calling Taurus AI" : "Connected"}
            </div>
            <div className="mt-3 text-[34px] font-semibold tracking-tight">{activeNumber}</div>
            <div className="mt-3 text-white/65">{statusText}</div>
            <div className="mt-2 text-lg text-white/82">{formattedDuration}</div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <PhoneActionButton label="Mute" icon="🎤" active={muteOn} onClick={() => setMuteOn((v) => !v)} />
            <PhoneActionButton label="Speaker" icon="🔊" active={speakerOn} onClick={() => setSpeakerOn((v) => !v)} />
            <PhoneActionButton label="Keypad" icon="⌨️" active={showDialPad} onClick={() => setShowDialPad(true)} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <PhoneActionButton label="SMS" icon="💬" active={showSms} onClick={() => setShowSms(true)} />
            <PhoneActionButton label="Voice" icon={micOn ? "🎙️" : "🗣️"} active={micOn} onClick={startMic} />
            <PhoneEndButton
              label={callState === "idle" ? "Call" : "End"}
              icon={callState === "idle" ? "📞" : "❌"}
              onClick={() => (callState === "idle" ? startCall(dialNumber) : endCall())}
              callState={callState}
            />
          </div>
        </div>
      </div>

      {showDialPad && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-[420px] rounded-[32px] bg-[#111111] px-5 pb-6 pt-5 shadow-[0_-20px_60px_rgba(0,0,0,0.55)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-white/40">Dial Pad</div>
                <div className="mt-1 text-2xl font-semibold">{dialNumber}</div>
              </div>
              <button
                onClick={() => setShowDialPad(false)}
                className="rounded-full border border-white/10 px-3 py-2 text-white/70"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map((num) => (
                <button
                  key={num}
                  onClick={() => appendDial(num)}
                  className="h-16 rounded-full bg-white/10 text-xl font-semibold text-white"
                >
                  {num}
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
                onClick={() => startCall(dialNumber)}
                className="rounded-full bg-green-500 px-4 py-3 text-sm font-semibold text-white"
              >
                Call
              </button>
              <button
                onClick={() => setDialNumber(DEFAULT_NUMBER)}
                className="rounded-full bg-white/10 px-4 py-3 text-sm font-semibold text-white/80"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {showSms && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="flex h-[76vh] w-full max-w-[420px] flex-col rounded-[32px] bg-[#111111] px-5 pb-5 pt-5 shadow-[0_-20px_60px_rgba(0,0,0,0.55)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-white/40">SMS Support</div>
                <div className="mt-1 text-xl font-semibold">To {activeNumber}</div>
              </div>
              <button
                onClick={() => setShowSms(false)}
                className="rounded-full border border-white/10 px-3 py-2 text-white/70"
              >
                ✕
              </button>
            </div>

            <div
              ref={smsListRef}
              className="flex-1 overflow-y-auto rounded-[24px] bg-white/5 p-4"
            >
              <div className="space-y-3">
                {messages.length === 0 && (
                  <div className="rounded-2xl bg-white/8 px-4 py-3 text-sm leading-7 text-white/70">
                    Call connected ဖြစ်ပြီးနောက် Taurus AI ကို SMS support နဲ့ မေးမြန်းနိုင်ပါတယ်။
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

                {sending && (
                  <div className="max-w-[85%] rounded-2xl bg-white/10 px-4 py-3 text-sm text-white/75">
                    Taurus AI is preparing a response...
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 flex items-end gap-3">
              <textarea
                value={smsText}
                onChange={(e) => setSmsText(e.target.value)}
                placeholder="Type message..."
                className="min-h-[90px] flex-1 rounded-[24px] border border-white/10 bg-white/8 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30"
              />
              <button
                onClick={() => sendToAI(smsText)}
                disabled={sending || callState !== "connected"}
                className="h-[90px] rounded-[24px] bg-cyan-500 px-5 text-sm font-semibold text-black disabled:opacity-60"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
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
  callState,
}: {
  label: string;
  icon: string;
  onClick: () => void;
  callState: "idle" | "ringing" | "connected";
}) {
  return (
    <button
      onClick={onClick}
      className={`flex h-[78px] flex-col items-center justify-center rounded-3xl transition ${
        callState === "idle" ? "bg-green-500 text-white" : "bg-red-500 text-white"
      }`}
    >
      <div className="text-xl">{icon}</div>
      <div className="mt-2 text-[12px] font-medium">{label}</div>
    </button>
  );
}