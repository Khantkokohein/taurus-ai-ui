"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type CallState =
  | "idle"
  | "dialing"
  | "ringing"
  | "connecting"
  | "connected"
  | "ended";

type VoiceState = "silent" | "listening" | "speaking";

const RING_DURATION_SECONDS = 20;
const FREE_CALL_DURATION_SECONDS = 5 * 60;
const TAURUS_GREETING =
  "Hello, I am Taurus AI. Your support line is now connected. How can I help you today?";

export default function AICallPage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [callState, setCallState] = useState<CallState>("idle");
  const [voiceState, setVoiceState] = useState<VoiceState>("silent");
  const [ringCountdown, setRingCountdown] = useState(RING_DURATION_SECONDS);
  const [sessionSecondsLeft, setSessionSecondsLeft] = useState(FREE_CALL_DURATION_SECONDS);
  const [statusText, setStatusText] = useState("Enter a number to start your Taurus AI call.");
  const [micReady, setMicReady] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [currentRingtonePath, setCurrentRingtonePath] = useState("");

  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  const ringTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognitionRef = useRef<any>(null);
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isMountedRef = useRef(true);

  const ringtones = useMemo(
    () => ["/ringtone-1.mp3", "/ringtone-2.mp3"],
    []
  );

  useEffect(() => {
    speechSynthesisRef.current = typeof window !== "undefined" ? window.speechSynthesis : null;
    return () => {
      isMountedRef.current = false;
      stopAllAudio();
      stopRecognition();
      stopTimers();
      stopMediaStream();
    };
  }, []);

  const formattedRingCountdown = formatClock(ringCountdown);
  const formattedSessionCountdown = formatClock(sessionSecondsLeft);

  function formatPhoneNumber(value: string) {
    return value.replace(/[^\d+\-()\s]/g, "").slice(0, 22);
  }

  function randomRingtone() {
    return ringtones[Math.floor(Math.random() * ringtones.length)];
  }

  function stopTimers() {
    if (ringTimerRef.current) clearInterval(ringTimerRef.current);
    if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    ringTimerRef.current = null;
    sessionTimerRef.current = null;
  }

  function stopMediaStream() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  function stopAllAudio() {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
    }
  }

  function stopRecognition() {
    try {
      recognitionRef.current?.stop?.();
    } catch {}
  }

  async function prepareMic() {
    try {
      setErrorText("");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      streamRef.current = stream;
      setMicReady(true);
      return true;
    } catch (error) {
      console.error(error);
      setErrorText("Microphone permission is required for Taurus AI voice support.");
      setMicReady(false);
      return false;
    }
  }

  async function startCall() {
    if (!phoneNumber.trim()) {
      setErrorText("Please enter a phone number first.");
      return;
    }

    const ok = await prepareMic();
    if (!ok) return;

    const selected = randomRingtone();
    setCurrentRingtonePath(selected);
    setRingCountdown(RING_DURATION_SECONDS);
    setSessionSecondsLeft(FREE_CALL_DURATION_SECONDS);
    setCallState("dialing");
    setVoiceState("silent");
    setStatusText("Dialing Taurus AI support...");

    requestAnimationFrame(() => {
      setCallState("ringing");
      setStatusText("Calling... please wait while Taurus AI answers.");
      playRingtone(selected);
      beginRingCountdown();
    });
  }

  function playRingtone(path: string) {
    if (!ringtoneRef.current) return;
    ringtoneRef.current.src = path;
    ringtoneRef.current.loop = true;
    ringtoneRef.current.play().catch((error) => {
      console.error("Ringtone playback failed:", error);
      setErrorText("Ringtone could not play. Check the audio files in /public.");
    });
  }

  function beginRingCountdown() {
    stopTimers();

    ringTimerRef.current = setInterval(() => {
      setRingCountdown((prev) => {
        if (prev <= 1) {
          if (ringTimerRef.current) clearInterval(ringTimerRef.current);
          ringTimerRef.current = null;
          answerCall();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function answerCall() {
    if (!isMountedRef.current) return;

    setCallState("connecting");
    setStatusText("Taurus AI is connecting...");

    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }

    setTimeout(() => {
      if (!isMountedRef.current) return;
      setCallState("connected");
      setStatusText("Connected. Taurus AI is ready.");
      speakText(TAURUS_GREETING, () => {
        startVoiceLoop();
      });
      beginSessionTimer();
    }, 900);
  }

  function beginSessionTimer() {
    sessionTimerRef.current = setInterval(() => {
      setSessionSecondsLeft((prev) => {
        if (prev <= 1) {
          if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
          sessionTimerRef.current = null;
          endCall("Your 5 minute free Taurus AI call has ended.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function speakText(text: string, onEnd?: () => void) {
    if (!speechSynthesisRef.current) return;

    speechSynthesisRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onstart = () => {
      setVoiceState("speaking");
      setStatusText("Taurus AI is speaking...");
    };

    utterance.onend = () => {
      setVoiceState("silent");
      setStatusText("Connected. Listening...");
      onEnd?.();
    };

    speechSynthesisRef.current.speak(utterance);
  }

  function createRecognition() {
    const SR =
      typeof window !== "undefined"
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    if (!SR) {
      setErrorText("This browser does not support Speech Recognition.");
      return null;
    }

    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setVoiceState("listening");
      setStatusText("Listening...");
    };

    recognition.onresult = async (event: any) => {
      const result = event.results?.[event.results.length - 1]?.[0]?.transcript?.trim();
      if (!result) return;

      try {
        stopRecognition();
        setVoiceState("silent");
        setStatusText("Taurus AI is thinking...");

        const response = await fetch("/api/ai-call", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: result,
            phoneNumber,
            mode: "voice_support",
          }),
        });

        const data = await response.json();
        const answer = data?.text || "I am here and listening.";

        speakText(answer, () => {
          if (callState === "connected") {
            startVoiceLoop();
          }
        });
      } catch (error) {
        console.error(error);
        setErrorText("AI response failed.");
        if (callState === "connected") {
          startVoiceLoop();
        }
      }
    };

    recognition.onerror = () => {
      if (callState === "connected") {
        setVoiceState("silent");
        setStatusText("Connected. Listening...");
        setTimeout(() => startVoiceLoop(), 700);
      }
    };

    recognition.onend = () => {
      if (callState === "connected" && voiceState !== "speaking") {
        setTimeout(() => startVoiceLoop(), 400);
      }
    };

    return recognition;
  }

  function startVoiceLoop() {
    if (callState !== "connected") return;
    if (speechSynthesisRef.current?.speaking) return;

    if (!recognitionRef.current) {
      recognitionRef.current = createRecognition();
    }

    try {
      recognitionRef.current?.start?.();
    } catch {}
  }

  function endCall(customMessage?: string) {
    stopTimers();
    stopAllAudio();
    stopRecognition();
    stopMediaStream();
    setCallState("ended");
    setVoiceState("silent");
    setMicReady(false);
    setStatusText(customMessage || "Call ended.");
  }

  function resetCall() {
    stopTimers();
    stopAllAudio();
    stopRecognition();
    stopMediaStream();
    setCallState("idle");
    setVoiceState("silent");
    setRingCountdown(RING_DURATION_SECONDS);
    setSessionSecondsLeft(FREE_CALL_DURATION_SECONDS);
    setStatusText("Enter a number to start your Taurus AI call.");
    setErrorText("");
    setMicReady(false);
    setCurrentRingtonePath("");
  }

  const canStart = callState === "idle" || callState === "ended";

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.07),transparent_25%),radial-gradient(circle_at_50%_50%,rgba(0,229,255,0.08),transparent_20%),radial-gradient(circle_at_50%_60%,rgba(175,82,222,0.10),transparent_22%)]" />
      <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] [background-size:72px_72px]" />

      <audio ref={ringtoneRef} preload="auto" />

      <header className="relative z-20 flex items-center justify-between px-6 py-5 md:px-10">
        <div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-white/50">Taurus AI</p>
          <h1 className="mt-2 text-sm font-medium tracking-[0.28em] text-white/90">
            AI CALL INTERFACE
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login-gate"
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10"
          >
            Back to Gate
          </Link>
          <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-300">
            Free Voice Test
          </div>
        </div>
      </header>

      <section className="relative z-10 flex min-h-[calc(100vh-88px)] items-center justify-center px-4 pb-8 pt-2">
        <div className="w-full max-w-[420px] rounded-[42px] border border-white/10 bg-zinc-950/90 p-4 shadow-[0_0_60px_rgba(255,255,255,0.08)] backdrop-blur-2xl">
          <div className="rounded-[34px] border border-white/8 bg-black/90 p-4 shadow-inner shadow-white/5">
            <div className="mx-auto mb-4 h-1.5 w-28 rounded-full bg-white/10" />

            <div className="relative overflow-hidden rounded-[30px] border border-white/8 bg-[radial-gradient(circle_at_50%_10%,rgba(255,255,255,0.07),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-5">
              <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.1),transparent_70%)]" />

              <div className="mb-6 flex items-center justify-between text-xs text-white/45">
                <span>{currentRingtonePath ? currentRingtonePath.split("/").pop() : "No ringtone yet"}</span>
                <span>{micReady ? "Mic ready" : "Mic off"}</span>
              </div>

              <div className="mb-6 text-center">
                <p className="text-xs uppercase tracking-[0.35em] text-white/40">Taurus AI Support</p>
                <div className="mt-4 flex items-center justify-center">
                  <div
                    className={[
                      "relative flex h-40 w-40 items-center justify-center rounded-full border border-white/10 transition-all duration-500",
                      voiceState === "listening"
                        ? "shadow-[0_0_60px_rgba(34,197,94,0.18)]"
                        : voiceState === "speaking"
                        ? "shadow-[0_0_60px_rgba(56,189,248,0.18)]"
                        : "shadow-[0_0_50px_rgba(255,255,255,0.08)]",
                    ].join(" ")}
                  >
                    <div className="absolute inset-3 rounded-full border border-white/5" />
                    <div
                      className={[
                        "absolute inset-0 rounded-full blur-2xl",
                        voiceState === "listening"
                          ? "bg-emerald-400/15"
                          : voiceState === "speaking"
                          ? "bg-cyan-400/15"
                          : "bg-fuchsia-400/10",
                      ].join(" ")}
                    />
                    <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-white/5 backdrop-blur-xl">
                      <div className="text-center">
                        <p className="text-3xl font-semibold tracking-tight">
                          {callState === "ringing"
                            ? formattedRingCountdown
                            : formattedSessionCountdown}
                        </p>
                        <p className="mt-1 text-[10px] uppercase tracking-[0.28em] text-white/45">
                          {callState === "ringing" ? "ringing" : "session"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-4 text-center">
                <p className="text-2xl font-semibold tracking-tight text-white">
                  {phoneNumber || "+95 ••• ••• •••"}
                </p>
                <p className="mt-2 text-sm text-white/55">{statusText}</p>
                {errorText ? <p className="mt-2 text-sm text-rose-300">{errorText}</p> : null}
              </div>

              <div className="space-y-3">
                <label className="block text-xs uppercase tracking-[0.3em] text-white/40">
                  Dial Number
                </label>
                <input
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                  inputMode="tel"
                  placeholder="Enter any phone number"
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center text-lg tracking-[0.15em] text-white outline-none placeholder:text-white/20 focus:border-cyan-300/40"
                />
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3 text-center text-sm">
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
                  <p className="text-white/45">Mode</p>
                  <p className="mt-1 font-medium text-white">Voice Only</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
                  <p className="text-white/45">Camera</p>
                  <p className="mt-1 font-medium text-white">Off</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
                  <p className="text-white/45">Trial</p>
                  <p className="mt-1 font-medium text-white">5 Min</p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-center gap-4">
                <button
                  onClick={resetCall}
                  className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xl transition hover:bg-white/10"
                  aria-label="Reset call"
                >
                  ⟲
                </button>

                <button
                  onClick={canStart ? startCall : () => endCall("Call ended by user.")}
                  className={[
                    "flex h-20 w-20 items-center justify-center rounded-full text-2xl font-semibold transition",
                    canStart
                      ? "bg-emerald-500 text-black shadow-[0_0_40px_rgba(34,197,94,0.28)] hover:scale-[1.03]"
                      : "bg-rose-500 text-white shadow-[0_0_40px_rgba(244,63,94,0.28)] hover:scale-[1.03]",
                  ].join(" ")}
                  aria-label={canStart ? "Start call" : "End call"}
                >
                  {canStart ? "☎" : "✕"}
                </button>

                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xl">
                  {voiceState === "listening" ? "🎙️" : voiceState === "speaking" ? "🔊" : "•"}
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 text-center text-[11px] text-white/45">
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">Ring: 20s</div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">No Camera</div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">Black Theme</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function formatClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
}
