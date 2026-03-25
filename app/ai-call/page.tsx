"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";

type SmsMessage = {
  role: "user" | "assistant";
  content: string;
};

const DEFAULT_NUMBER = "+70 20 7777777";

const GREETING_TEXT =
  "မင်္ဂလာပါ Taurus AI Calling Customer Service က ကြိုဆိုပါတယ်။ ဘာများဝန်ဆောင်မှု ပေးရမလဲခင်ဗျ";

const FALLBACK_REPLY =
  "အတွင်းပိုင်းစနစ်ကို အကောင်းဆုံးပြင်ဆင်နေပါတယ်ခင်ဗျ။ စိတ်ဝင်စားစရာ features တွေကို အကောင်းဆုံး upgrade လုပ်နေပါတယ်ခင်ဗျ။";

export default function AICallPage() {
  const [callState, setCallState] = useState<"idle" | "ringing" | "connected">(
    "idle"
  );
  const [statusText, setStatusText] = useState("Ready");
  const [callSeconds, setCallSeconds] = useState(0);

  const [showDialPad, setShowDialPad] = useState(false);
  const [showSms, setShowSms] = useState(false);

  const [dialNumber, setDialNumber] = useState(DEFAULT_NUMBER);
  const [activeNumber, setActiveNumber] = useState(DEFAULT_NUMBER);

  const [speakerOn, setSpeakerOn] = useState(true);
  const [muteOn, setMuteOn] = useState(false);

  const [smsText, setSmsText] = useState("");
  const [smsSending, setSmsSending] = useState(false);
  const [smsMessages, setSmsMessages] = useState<SmsMessage[]>([]);

  const [pointerTarget, setPointerTarget] = useState({ x: 0, y: 0 });
  const [focusZone, setFocusZone] = useState<"left" | "center" | "right">(
    "center"
  );

  const smsListRef = useRef<HTMLDivElement | null>(null);
  const durationTimerRef = useRef<number | null>(null);
  const ringtoneTimeoutRef = useRef<number | null>(null);

  const ringtone1Ref = useRef<HTMLAudioElement | null>(null);
  const ringtone2Ref = useRef<HTMLAudioElement | null>(null);
  const greetingRef = useRef<HTMLAudioElement | null>(null);

  const formattedDuration = useMemo(() => {
    const m = Math.floor(callSeconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (callSeconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }, [callSeconds]);

  useEffect(() => {
    ringtone1Ref.current = new Audio("/ring3tone-1.mp");
    ringtone2Ref.current = new Audio("/ringtone-2.mp3");
    greetingRef.current = new Audio("/greeting.mp3");

    if (ringtone1Ref.current) {
      ringtone1Ref.current.loop = true;
      ringtone1Ref.current.preload = "auto";
    }
    if (ringtone2Ref.current) {
      ringtone2Ref.current.loop = false;
      ringtone2Ref.current.preload = "auto";
    }
    if (greetingRef.current) {
      greetingRef.current.loop = false;
      greetingRef.current.preload = "auto";
    }

    return () => {
      stopAllAudio();
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (callState !== "connected") {
      if (durationTimerRef.current) {
        window.clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
      return;
    }

    durationTimerRef.current = window.setInterval(() => {
      setCallSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (durationTimerRef.current) {
        window.clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
    };
  }, [callState]);

  useEffect(() => {
    if (!smsListRef.current) return;
    smsListRef.current.scrollTop = smsListRef.current.scrollHeight;
  }, [smsMessages, smsSending]);

  useEffect(() => {
    const volume = speakerOn ? 1 : 0.15;
    if (ringtone1Ref.current) ringtone1Ref.current.volume = volume;
    if (ringtone2Ref.current) ringtone2Ref.current.volume = volume;
    if (greetingRef.current) greetingRef.current.volume = volume;
  }, [speakerOn]);

  useEffect(() => {
    if (muteOn) {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      if (greetingRef.current) {
        greetingRef.current.pause();
        greetingRef.current.currentTime = 0;
      }
    }
  }, [muteOn]);

  useEffect(() => {
    return () => {
      if (durationTimerRef.current) window.clearInterval(durationTimerRef.current);
      if (ringtoneTimeoutRef.current) window.clearTimeout(ringtoneTimeoutRef.current);
      stopAllAudio();
    };
  }, []);

  const stopAllAudio = useCallback(() => {
    [ringtone1Ref.current, ringtone2Ref.current, greetingRef.current].forEach(
      (audio) => {
        if (!audio) return;
        audio.pause();
        audio.currentTime = 0;
      }
    );
  }, []);

  const safePlay = useCallback(
    async (audio: HTMLAudioElement | null) => {
      if (!audio || muteOn) return;
      try {
        await audio.play();
      } catch {
        // ignore
      }
    },
    [muteOn]
  );

  const speakFallbackGreeting = useCallback(() => {
    if (muteOn || typeof window === "undefined" || !window.speechSynthesis) return;
    const utter = new SpeechSynthesisUtterance(GREETING_TEXT);
    utter.lang = "my-MM";
    utter.rate = 0.96;
    utter.pitch = 0.95;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }, [muteOn]);

  const playGreetingSequence = useCallback(async () => {
    await safePlay(ringtone2Ref.current);

    if (greetingRef.current && !muteOn) {
      try {
        await greetingRef.current.play();
        return;
      } catch {
        speakFallbackGreeting();
        return;
      }
    }

    speakFallbackGreeting();
  }, [muteOn, safePlay, speakFallbackGreeting]);

  const beginConnectedState = useCallback(
    async (number: string) => {
      stopAllAudio();
      setActiveNumber(number);
      setCallState("connected");
      setStatusText("Connected");
      setCallSeconds(0);
      setSmsMessages([
        {
          role: "assistant",
          content: GREETING_TEXT,
        },
      ]);
      await playGreetingSequence();
    },
    [playGreetingSequence, stopAllAudio]
  );

  const startCall = useCallback(
    async (number?: string) => {
      const target = (number || dialNumber || DEFAULT_NUMBER).trim();

      if (ringtoneTimeoutRef.current) window.clearTimeout(ringtoneTimeoutRef.current);
      if (durationTimerRef.current) window.clearInterval(durationTimerRef.current);

      if (window.speechSynthesis) window.speechSynthesis.cancel();

      setShowDialPad(false);
      setCallState("ringing");
      setStatusText("Calling...");
      setCallSeconds(0);
      setActiveNumber(target);
      setSmsMessages([]);

      stopAllAudio();
      await safePlay(ringtone1Ref.current);

      ringtoneTimeoutRef.current = window.setTimeout(() => {
        beginConnectedState(target);
      }, 20000);
    },
    [beginConnectedState, dialNumber, safePlay, stopAllAudio]
  );

  const endCall = useCallback(() => {
    if (ringtoneTimeoutRef.current) window.clearTimeout(ringtoneTimeoutRef.current);
    if (durationTimerRef.current) window.clearInterval(durationTimerRef.current);

    ringtoneTimeoutRef.current = null;
    durationTimerRef.current = null;

    if (window.speechSynthesis) window.speechSynthesis.cancel();

    stopAllAudio();
    setCallState("idle");
    setStatusText("Ready");
    setCallSeconds(0);
  }, [stopAllAudio]);

  const updatePointer = useCallback(
    (clientX: number, clientY: number, rect: DOMRect) => {
      const nx = ((clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((clientY - rect.top) / rect.height) * 2 - 1);

      const x = THREE.MathUtils.clamp(nx, -1, 1);
      const y = THREE.MathUtils.clamp(ny, -1, 1);

      setPointerTarget({ x, y });

      if (x < -0.22) setFocusZone("left");
      else if (x > 0.22) setFocusZone("right");
      else setFocusZone("center");
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      updatePointer(e.clientX, e.clientY, rect);
    },
    [updatePointer]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const touch = e.touches[0];
      if (!touch) return;
      const rect = e.currentTarget.getBoundingClientRect();
      updatePointer(touch.clientX, touch.clientY, rect);
    },
    [updatePointer]
  );

  const resetPointer = useCallback(() => {
    setPointerTarget({ x: 0, y: 0 });
    setFocusZone("center");
  }, []);

  const appendDial = useCallback((key: string) => {
    setDialNumber((prev) => `${prev}${key}`);
  }, []);

  const deleteDial = useCallback(() => {
    setDialNumber((prev) => prev.slice(0, -1));
  }, []);

  const sendSmsToAi = useCallback(async () => {
    const text = smsText.trim();
    if (!text || smsSending || callState !== "connected") return;

    const nextMessages: SmsMessage[] = [...smsMessages, { role: "user", content: text }];
    setSmsMessages(nextMessages);
    setSmsText("");
    setSmsSending(true);

    try {
      const res = await fetch("/api/ai-call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: nextMessages }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || FALLBACK_REPLY);
      }

      setSmsMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data?.reply || FALLBACK_REPLY,
        },
      ]);
    } catch {
      setSmsMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: FALLBACK_REPLY,
        },
      ]);
    } finally {
      setSmsSending(false);
    }
  }, [callState, smsMessages, smsSending, smsText]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#eef6ff] text-[#0d1b2a]">
      <div
        className="absolute inset-0"
        onMouseMove={handleMouseMove}
        onMouseLeave={resetPointer}
        onTouchMove={handleTouchMove}
        onTouchEnd={resetPointer}
      >
        <Canvas
          dpr={[1, 1.5]}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
          }}
          camera={{ position: [0, 0, 11], fov: 42 }}
        >
          <Scene3D pointer={pointerTarget} focus={focusZone} />
        </Canvas>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(255,255,255,0.88)_0%,rgba(236,246,255,0.78)_30%,rgba(207,229,249,0.38)_58%,rgba(197,221,244,0.18)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.22)_0%,rgba(232,243,255,0.14)_40%,rgba(201,226,246,0.20)_100%)]" />

      <div className="relative z-20 flex min-h-screen flex-col">
        <header className="px-4 pt-4 sm:px-6 sm:pt-6">
          <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-3">
            <div className="rounded-full border border-white/70 bg-white/72 px-4 py-2 text-[11px] font-semibold tracking-[0.24em] text-[#1e5f95] shadow-[0_10px_30px_rgba(84,144,197,0.12)] backdrop-blur-xl">
              LOGIN AI CALL SUPPORT GATE
            </div>

            <div className="hidden rounded-full border border-white/70 bg-white/72 px-4 py-2 text-[11px] font-semibold tracking-[0.2em] text-[#3e698b] shadow-[0_10px_30px_rgba(84,144,197,0.10)] backdrop-blur-xl sm:block">
              ROLE · TAURUS AI MAIN SUPPORT
            </div>
          </div>
        </header>

        <section className="flex flex-1 items-end justify-center px-4 pb-6 pt-4 sm:px-6 sm:pb-8">
          <div className="mx-auto grid w-full max-w-[1480px] grid-cols-1 gap-5 lg:grid-cols-[320px_minmax(0,1fr)_320px]">
            <aside className="hidden lg:block">
              <GlassCard>
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-[11px] font-semibold tracking-[0.22em] text-[#5d84a4]">
                    CALL STATUS
                  </p>
                  <StatusDot active={callState !== "idle"} />
                </div>

                <div className="space-y-3">
                  <InfoRow label="Support Line" value={activeNumber} />
                  <InfoRow label="Role" value="Taurus AI Main Support" />
                  <InfoRow label="State" value={statusText} />
                  <InfoRow label="Duration" value={formattedDuration} />
                </div>

                <div className="mt-5 rounded-3xl border border-white/70 bg-white/60 p-4">
                  <p className="text-sm leading-7 text-[#4b6d88]">
                    White-glass telecom support UI with nano hologram chamber,
                    touch reaction, dial pad overlay, and SMS overlay.
                  </p>
                </div>
              </GlassCard>
            </aside>

            <div className="flex min-h-[760px] flex-col justify-between">
              <div className="flex items-start justify-center pt-2 sm:pt-6">
                <div className="w-full max-w-[580px] rounded-[34px] border border-white/80 bg-white/72 p-4 shadow-[0_26px_90px_rgba(111,159,201,0.18)] backdrop-blur-[28px] sm:p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-semibold tracking-[0.25em] text-[#5d84a4]">
                        SUPPORT CALL INTERFACE
                      </div>
                      <h1 className="mt-1 text-[24px] font-semibold text-[#102133] sm:text-[28px]">
                        Login AI Call Support Gate
                      </h1>
                    </div>

                    <div className="rounded-full border border-white/70 bg-white/80 px-4 py-1.5 text-[12px] font-semibold text-[#316a96]">
                      {callState === "idle"
                        ? "Ready"
                        : callState === "ringing"
                        ? "Calling"
                        : "Connected"}
                    </div>
                  </div>

                  <div className="mb-4 grid grid-cols-2 gap-3">
                    <MiniMetric title="Call Number" value={activeNumber} />
                    <MiniMetric title="Call Duration" value={formattedDuration} />
                  </div>

                  <div className="mb-4 rounded-[28px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.76)_0%,rgba(240,248,255,0.62)_100%)] px-5 py-5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                    <div className="text-[12px] font-semibold tracking-[0.2em] text-[#6488a5]">
                      TAURUS AI MAIN SUPPORT
                    </div>
                    <div className="mt-2 text-[26px] font-semibold text-[#14263a]">
                      {activeNumber}
                    </div>
                    <div className="mt-2 text-sm text-[#5a7892]">{statusText}</div>
                  </div>

                  <div className="grid grid-cols-5 gap-3">
                    <ActionButton
                      label="Mute"
                      active={muteOn}
                      onClick={() => setMuteOn((prev) => !prev)}
                      icon="🎤"
                    />
                    <ActionButton
                      label="Speaker"
                      active={speakerOn}
                      onClick={() => setSpeakerOn((prev) => !prev)}
                      icon="🔊"
                    />
                    <ActionButton
                      label="Keypad"
                      active={showDialPad}
                      onClick={() => setShowDialPad(true)}
                      icon="⌨️"
                    />
                    <ActionButton
                      label="SMS"
                      active={showSms}
                      onClick={() => setShowSms(true)}
                      icon="💬"
                    />
                    <ActionButton
                      label={callState === "idle" ? "Call" : "End"}
                      danger={callState !== "idle"}
                      onClick={() =>
                        callState === "idle" ? startCall(dialNumber) : endCall()
                      }
                      icon={callState === "idle" ? "📞" : "❌"}
                    />
                  </div>
                </div>
              </div>
            </div>

            <aside className="hidden lg:block">
              <GlassCard>
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-[11px] font-semibold tracking-[0.22em] text-[#5d84a4]">
                    INTERACTION FOCUS
                  </p>
                  <div className="rounded-full border border-white/70 bg-white/80 px-3 py-1 text-[11px] font-semibold text-[#316a96]">
                    {focusZone.toUpperCase()}
                  </div>
                </div>

                <div className="space-y-3">
                  <FocusPill active={focusZone === "left"} label="Left Panels Active" />
                  <FocusPill active={focusZone === "center"} label="Center Hologram Active" />
                  <FocusPill active={focusZone === "right"} label="Right Panels Active" />
                </div>

                <div className="mt-5 rounded-3xl border border-white/70 bg-white/60 p-4">
                  <p className="text-sm leading-7 text-[#4b6d88]">
                    Mouse move or touch move လုပ်ရင် scene rotation, panel depth
                    shift, glow follow automatically ပြောင်းမယ်။
                  </p>
                </div>
              </GlassCard>
            </aside>
          </div>
        </section>
      </div>

      {showDialPad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#dceaf6]/70 p-4 backdrop-blur-md">
          <div className="w-full max-w-[380px] rounded-[34px] border border-white/90 bg-white/88 p-5 shadow-[0_30px_90px_rgba(89,140,184,0.24)] backdrop-blur-[28px]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold tracking-[0.22em] text-[#6287a4]">
                  DIGITAL DIAL PAD
                </div>
                <div className="mt-1 text-xl font-semibold text-[#102133]">
                  {dialNumber}
                </div>
              </div>

              <button
                onClick={() => setShowDialPad(false)}
                className="rounded-full border border-white/80 bg-white/72 px-3 py-2 text-sm font-semibold text-[#5a7892]"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map(
                (num) => (
                  <button
                    key={num}
                    onClick={() => appendDial(num)}
                    className="h-16 rounded-2xl border border-white/80 bg-white/75 text-xl font-semibold text-[#1a3044] shadow-[0_14px_32px_rgba(91,143,187,0.12)]"
                  >
                    {num}
                  </button>
                )
              )}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <button
                onClick={deleteDial}
                className="rounded-2xl border border-white/80 bg-white/75 px-4 py-3 text-sm font-semibold text-[#cf4a4a]"
              >
                ⌫ Delete
              </button>

              <button
                onClick={() => startCall(dialNumber)}
                className="rounded-2xl border border-[#a8eed8] bg-[linear-gradient(180deg,#e6fff6_0%,#d7f7ec_100%)] px-4 py-3 text-sm font-semibold text-[#177d56]"
              >
                📞 Call
              </button>

              <button
                onClick={() => setDialNumber(DEFAULT_NUMBER)}
                className="rounded-2xl border border-white/80 bg-white/75 px-4 py-3 text-sm font-semibold text-[#4f6f8d]"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {showSms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#dceaf6]/70 p-4 backdrop-blur-md">
          <div className="flex h-[78vh] w-full max-w-[430px] flex-col rounded-[34px] border border-white/90 bg-white/88 p-5 shadow-[0_30px_90px_rgba(89,140,184,0.24)] backdrop-blur-[28px]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold tracking-[0.22em] text-[#6287a4]">
                  SMS SUPPORT PANEL
                </div>
                <div className="mt-1 text-xl font-semibold text-[#102133]">
                  To {activeNumber}
                </div>
              </div>

              <button
                onClick={() => setShowSms(false)}
                className="rounded-full border border-white/80 bg-white/72 px-3 py-2 text-sm font-semibold text-[#5a7892]"
              >
                ✕
              </button>
            </div>

            <div
              ref={smsListRef}
              className="flex-1 overflow-y-auto rounded-[26px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.76)_0%,rgba(240,248,255,0.62)_100%)] p-4"
            >
              <div className="space-y-3">
                {smsMessages.length === 0 && (
                  <div className="rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-sm leading-7 text-[#597894]">
                    Call connected ဖြစ်ပြီးနောက် SMS support ကို ဒီနေရာကနေ
                    အသုံးပြုနိုင်ပါတယ်။
                  </div>
                )}

                {smsMessages.map((msg, idx) => (
                  <div
                    key={`${msg.role}-${idx}`}
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-7 ${
                      msg.role === "assistant"
                        ? "border border-white/80 bg-white/78 text-[#1a3348]"
                        : "ml-auto border border-[#d7ebff] bg-[linear-gradient(180deg,#edf7ff_0%,#e3f1ff_100%)] text-[#163148]"
                    }`}
                  >
                    {msg.content}
                  </div>
                ))}

                {smsSending && (
                  <div className="max-w-[85%] rounded-2xl border border-white/80 bg-white/78 px-4 py-3 text-sm text-[#4f6f8d]">
                    အကောင်းဆုံး response ကို ပြင်ဆင်ပေးနေပါတယ်ခင်ဗျ...
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 flex items-end gap-3">
              <textarea
                value={smsText}
                onChange={(e) => setSmsText(e.target.value)}
                placeholder="SMS message ရိုက်ပါ..."
                className="min-h-[92px] flex-1 rounded-[24px] border border-white/80 bg-white/78 px-4 py-3 text-sm text-[#173248] outline-none placeholder:text-[#7f9ab0]"
              />
              <button
                onClick={sendSmsToAi}
                disabled={smsSending || callState !== "connected"}
                className="h-[92px] rounded-[24px] border border-white/80 bg-[linear-gradient(180deg,#eff9ff_0%,#dff0ff_100%)] px-5 text-sm font-semibold text-[#25608d] disabled:opacity-60"
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

function GlassCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[32px] border border-white/85 bg-white/72 p-5 shadow-[0_24px_90px_rgba(111,159,201,0.16)] backdrop-blur-[26px]">
      {children}
    </div>
  );
}

function StatusDot({ active }: { active: boolean }) {
  return (
    <span
      className={`h-2.5 w-2.5 rounded-full ${
        active
          ? "bg-[#31da96] shadow-[0_0_18px_rgba(49,218,150,0.7)]"
          : "bg-[#94aac0]"
      }`}
    />
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/80 bg-white/70 px-4 py-3">
      <span className="text-xs font-semibold tracking-[0.16em] text-[#6c8ca8]">
        {label}
      </span>
      <span className="text-sm font-medium text-[#193147]">{value}</span>
    </div>
  );
}

function MiniMetric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/80 bg-white/70 px-4 py-3">
      <div className="text-[11px] font-semibold tracking-[0.2em] text-[#6c8ca8]">
        {title}
      </div>
      <div className="mt-2 text-sm font-medium text-[#163046]">{value}</div>
    </div>
  );
}

function FocusPill({ active, label }: { active: boolean; label: string }) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
        active
          ? "border-white bg-[linear-gradient(180deg,#f4fbff_0%,#e9f5ff_100%)] text-[#205a85] shadow-[0_14px_30px_rgba(95,162,214,0.12)]"
          : "border-white/80 bg-white/68 text-[#5d7b96]"
      }`}
    >
      {label}
    </div>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  active,
  danger,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-[24px] border px-3 py-4 shadow-[0_14px_32px_rgba(91,143,187,0.12)] transition hover:translate-y-[-1px] ${
        danger
          ? "border-[#ffd8d8] bg-[linear-gradient(180deg,#fff1f1_0%,#ffe6e6_100%)] text-[#c24444]"
          : active
          ? "border-[#d7ebff] bg-[linear-gradient(180deg,#f2fbff_0%,#e6f4ff_100%)] text-[#205a85]"
          : "border-white/80 bg-white/75 text-[#466782]"
      }`}
    >
      <div className="text-lg">{icon}</div>
      <div className="mt-1 text-[11px] font-semibold">{label}</div>
    </button>
  );
}

function Scene3D({
  pointer,
  focus,
}: {
  pointer: { x: number; y: number };
  focus: "left" | "center" | "right";
}) {
  const rootRef = useRef<THREE.Group | null>(null);
  const chamberRef = useRef<THREE.Group | null>(null);
  const glowRef = useRef<THREE.Mesh | null>(null);

  useFrame((state) => {
    if (!rootRef.current || !chamberRef.current || !glowRef.current) return;

    rootRef.current.rotation.y = THREE.MathUtils.lerp(
      rootRef.current.rotation.y,
      pointer.x * 0.22,
      0.06
    );
    rootRef.current.rotation.x = THREE.MathUtils.lerp(
      rootRef.current.rotation.x,
      pointer.y * 0.12,
      0.05
    );

    chamberRef.current.position.x = THREE.MathUtils.lerp(
      chamberRef.current.position.x,
      pointer.x * 0.65,
      0.05
    );
    chamberRef.current.position.y = THREE.MathUtils.lerp(
      chamberRef.current.position.y,
      pointer.y * 0.35,
      0.05
    );

    glowRef.current.position.x = THREE.MathUtils.lerp(
      glowRef.current.position.x,
      pointer.x * 3.2,
      0.08
    );
    glowRef.current.position.y = THREE.MathUtils.lerp(
      glowRef.current.position.y,
      pointer.y * 1.8 + 0.25,
      0.08
    );

    rootRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.28) * 0.008;
  });

  return (
    <>
      <AdaptivePixelRatio />
      <fog attach="fog" args={["#edf7ff", 12, 26]} />
      <ambientLight intensity={0.85} color="#ffffff" />
      <directionalLight position={[0, 6, 8]} intensity={1} color="#ffffff" />
      <pointLight position={[0, 1, 5]} intensity={1.5} color="#8feeff" />
      <pointLight position={[-5, 1, 3]} intensity={1.1} color="#7dc6ff" />
      <pointLight position={[5, 1, 3]} intensity={1.1} color="#7dc6ff" />

      <group ref={rootRef}>
        <group ref={chamberRef} position={[0, -0.15, 0]}>
          <StageBase />
          <CenterHologram focus={focus} />
          <SidePanel side="left" focus={focus} />
          <SidePanel side="left-mid" focus={focus} />
          <SidePanel side="right-mid" focus={focus} />
          <SidePanel side="right" focus={focus} />
          <FloatingDust />
        </group>

        <mesh ref={glowRef} position={[0, 0.2, 1.4]}>
          <planeGeometry args={[1.6, 1.6]} />
          <meshBasicMaterial
            color="#9cf4ff"
            transparent
            opacity={0.22}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>

      <EffectComposer multisampling={0}>
        <Bloom
          luminanceThreshold={0.08}
          luminanceSmoothing={0.45}
          intensity={1.25}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

function AdaptivePixelRatio() {
  const { gl } = useThree();

  useEffect(() => {
    const apply = () => {
      const mobile = window.innerWidth < 768;
      gl.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.2 : 1.5));
    };

    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, [gl]);

  return null;
}

function StageBase() {
  const ringRef = useRef<THREE.Group | null>(null);

  useFrame((state) => {
    if (!ringRef.current) return;
    ringRef.current.rotation.z = state.clock.elapsedTime * 0.12;
  });

  return (
    <group position={[0, -2.15, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.38, 0]}>
        <circleGeometry args={[5.65, 96]} />
        <meshBasicMaterial color="#d5e9fa" transparent opacity={0.44} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.33, 0]}>
        <ringGeometry args={[3.7, 4.85, 96]} />
        <meshBasicMaterial
          color="#95f2ff"
          transparent
          opacity={0.22}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <group ref={ringRef} position={[0, -0.26, 0]}>
        <HoloRing scale={1.25} y={0.0} opacity={0.28} />
        <HoloRing scale={1.0} y={0.04} opacity={0.18} />
        <HoloRing scale={0.78} y={0.08} opacity={0.14} />
      </group>

      <mesh position={[0, 0.54, -1.52]}>
        <boxGeometry args={[8.7, 2.7, 0.2]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transmission={0.86}
          roughness={0.14}
          thickness={0.62}
          transparent
          opacity={0.22}
          metalness={0.02}
          reflectivity={0.45}
        />
      </mesh>

      <mesh position={[0, 1.35, -1.44]}>
        <boxGeometry args={[9.8, 0.08, 0.05]} />
        <meshBasicMaterial
          color="#c9fdff"
          transparent
          opacity={0.52}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function HoloRing({
  scale,
  y,
  opacity,
}: {
  scale: number;
  y: number;
  opacity: number;
}) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]} scale={scale}>
      <ringGeometry args={[3.0, 3.12, 128]} />
      <meshBasicMaterial
        color="#9af5ff"
        transparent
        opacity={opacity}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

function CenterHologram({ focus }: { focus: "left" | "center" | "right" }) {
  const centerRef = useRef<THREE.Group | null>(null);
  const auraRef = useRef<THREE.Mesh | null>(null);

  useFrame((state) => {
    if (!centerRef.current || !auraRef.current) return;

    centerRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.35) * 0.05 + 0.15;
    centerRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.7) * 0.08;

    const pulse =
      0.26 +
      Math.sin(state.clock.elapsedTime * 2.0) * 0.05 +
      (focus === "center" ? 0.08 : 0);

    (auraRef.current.material as THREE.MeshBasicMaterial).opacity = pulse;
  });

  return (
    <group ref={centerRef} position={[0, -0.42, 0.2]}>
      <mesh ref={auraRef} position={[0, 1.2, -0.18]}>
        <planeGeometry args={[2.4, 3.9]} />
        <meshBasicMaterial
          color="#aef7ff"
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh position={[0, 1.12, 0]}>
        <sphereGeometry args={[0.35, 28, 28]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.96}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh position={[0, 0.28, 0]}>
        <capsuleGeometry args={[0.46, 1.4, 8, 18]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.84}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh position={[-0.78, 0.52, 0]} rotation={[0, 0, 0.48]}>
        <capsuleGeometry args={[0.08, 0.96, 6, 12]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.64}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh position={[0.78, 0.52, 0]} rotation={[0, 0, -0.48]}>
        <capsuleGeometry args={[0.08, 0.96, 6, 12]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.64}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh position={[-0.34, -0.8, 0]} rotation={[0, 0, 0.14]}>
        <capsuleGeometry args={[0.08, 1.05, 6, 12]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.64}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh position={[0.34, -0.8, 0]} rotation={[0, 0, -0.14]}>
        <capsuleGeometry args={[0.08, 1.05, 6, 12]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.64}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <OrbitBand radius={1.15} y={1.45} speed={0.8} opacity={focus === "center" ? 0.42 : 0.26} />
      <OrbitBand radius={1.45} y={0.92} speed={-0.65} opacity={focus === "center" ? 0.34 : 0.2} />
      <OrbitBand radius={1.1} y={0.15} speed={1.1} opacity={focus === "center" ? 0.3 : 0.18} />
    </group>
  );
}

function OrbitBand({
  radius,
  y,
  speed,
  opacity,
}: {
  radius: number;
  y: number;
  speed: number;
  opacity: number;
}) {
  const bandRef = useRef<THREE.Group | null>(null);

  useFrame((state) => {
    if (!bandRef.current) return;
    bandRef.current.rotation.z = state.clock.elapsedTime * speed;
  });

  return (
    <group ref={bandRef} position={[0, y, 0]}>
      <mesh rotation={[Math.PI / 2.4, 0, 0]}>
        <torusGeometry args={[radius, 0.018, 12, 100]} />
        <meshBasicMaterial
          color="#aef7ff"
          transparent
          opacity={opacity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function SidePanel({
  side,
  focus,
}: {
  side: "left" | "left-mid" | "right-mid" | "right";
  focus: "left" | "center" | "right";
}) {
  const ref = useRef<THREE.Group | null>(null);

  const config = useMemo(() => {
    switch (side) {
      case "left":
        return { x: -4.05, y: -0.2, z: -0.35, rotY: 0.26, scale: 1.06, group: "left" as const };
      case "left-mid":
        return { x: -2.5, y: -0.4, z: 0.2, rotY: 0.13, scale: 0.86, group: "left" as const };
      case "right-mid":
        return { x: 2.5, y: -0.38, z: 0.18, rotY: -0.13, scale: 0.92, group: "right" as const };
      default:
        return { x: 4.05, y: -0.18, z: -0.35, rotY: -0.26, scale: 1.08, group: "right" as const };
    }
  }, [side]);

  const active = focus === config.group;

  useFrame((state) => {
    if (!ref.current) return;

    const lift = Math.sin(state.clock.elapsedTime * 0.8 + config.x) * 0.08;
    ref.current.position.x = THREE.MathUtils.lerp(
      ref.current.position.x,
      config.x + (active ? config.x * 0.02 : 0),
      0.06
    );
    ref.current.position.y = THREE.MathUtils.lerp(
      ref.current.position.y,
      config.y + lift,
      0.06
    );
    ref.current.position.z = THREE.MathUtils.lerp(
      ref.current.position.z,
      config.z + (active ? 0.24 : 0),
      0.06
    );
    ref.current.rotation.y = THREE.MathUtils.lerp(
      ref.current.rotation.y,
      config.rotY,
      0.06
    );
  });

  return (
    <group
      ref={ref}
      position={[config.x, config.y, config.z]}
      rotation={[0, config.rotY, 0]}
      scale={config.scale}
    >
      <PanelCard width={1.72} height={2.28} active={active} />
      <PanelBars active={active} />
    </group>
  );
}

function PanelCard({
  width,
  height,
  active,
}: {
  width: number;
  height: number;
  active: boolean;
}) {
  return (
    <group>
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={0.24}
          transmission={0.86}
          roughness={0.12}
          thickness={0.25}
          metalness={0.02}
          reflectivity={0.45}
        />
      </mesh>

      <mesh position={[0, 0, 0.02]}>
        <planeGeometry args={[width * 0.98, height * 0.98]} />
        <meshBasicMaterial
          color={active ? "#b9fbff" : "#d8f7ff"}
          transparent
          opacity={active ? 0.24 : 0.12}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <LinePlane position={[0, height / 2 - 0.06, 0.03]} size={[width * 0.82, 0.03]} opacity={active ? 0.72 : 0.42} />
      <LinePlane position={[0, -height / 2 + 0.06, 0.03]} size={[width * 0.82, 0.03]} opacity={active ? 0.42 : 0.24} />
      <LinePlane position={[-width / 2 + 0.04, 0, 0.03]} size={[0.03, height * 0.82]} opacity={active ? 0.52 : 0.26} />
      <LinePlane position={[width / 2 - 0.04, 0, 0.03]} size={[0.03, height * 0.82]} opacity={active ? 0.52 : 0.26} />
    </group>
  );
}

function LinePlane({
  position,
  size,
  opacity,
}: {
  position: [number, number, number];
  size: [number, number];
  opacity: number;
}) {
  return (
    <mesh position={position}>
      <planeGeometry args={size} />
      <meshBasicMaterial
        color="#c6fbff"
        transparent
        opacity={opacity}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

function PanelBars({ active }: { active: boolean }) {
  const bars = useMemo(
    () => [
      { x: -0.35, w: 0.12, h: 0.48, y: -0.48 },
      { x: -0.15, w: 0.12, h: 0.82, y: -0.3 },
      { x: 0.05, w: 0.12, h: 0.62, y: -0.4 },
      { x: 0.25, w: 0.12, h: 1.05, y: -0.18 },
    ],
    []
  );

  return (
    <group position={[0, 0, 0.05]}>
      {bars.map((bar, i) => (
        <mesh key={`${bar.x}-${i}`} position={[bar.x, bar.y, 0]}>
          <planeGeometry args={[bar.w, bar.h]} />
          <meshBasicMaterial
            color={active ? "#cbffff" : "#dff9ff"}
            transparent
            opacity={active ? 0.68 : 0.4}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}

      <mesh position={[0, 0.72, 0]}>
        <planeGeometry args={[0.92, 0.08]} />
        <meshBasicMaterial
          color="#e0ffff"
          transparent
          opacity={active ? 0.72 : 0.4}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh position={[0, 0.42, 0]}>
        <planeGeometry args={[0.74, 0.05]} />
        <meshBasicMaterial
          color="#d5fbff"
          transparent
          opacity={active ? 0.5 : 0.28}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function FloatingDust() {
  const pointsRef = useRef<THREE.Points | null>(null);

  const { positions, colors } = useMemo(() => {
    const count = 180;
    const pos = new Float32Array(count * 3);
    const color = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      pos[i3 + 0] = (Math.random() - 0.5) * 11;
      pos[i3 + 1] = Math.random() * 5 - 1.5;
      pos[i3 + 2] = (Math.random() - 0.5) * 4;

      color[i3 + 0] = 0.75;
      color[i3 + 1] = 0.96;
      color[i3 + 2] = 1.0;
    }

    return { positions: pos, colors: color };
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y = state.clock.elapsedTime * 0.03;
    pointsRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.08) * 0.08;
  });

  return (
    <points ref={pointsRef} position={[0, 0.45, -0.6]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        vertexColors
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}