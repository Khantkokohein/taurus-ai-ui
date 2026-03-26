"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type CallState = "idle" | "ringing" | "connected" | "ended";
type VoiceState = "idle" | "ai-speaking" | "listening" | "thinking";

const RING_DURATION_SECONDS = 20;
const AI_NUMBER_PREFIX = "+70 20 ";
const REQUIRED_LOCAL_NUMBER = "7777777";

// Burmese support first. If you want English-first, change to "en-US"
const RECOGNITION_LANG = "my-MM";

export default function AICallPage() {
  const [callState, setCallState] = useState<CallState>("idle");
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [statusText, setStatusText] = useState("Enter 7777777 and start the call.");
  const [errorText, setErrorText] = useState("");
  const [replyText, setReplyText] = useState("");
  const [heardText, setHeardText] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [ringCountdown, setRingCountdown] = useState(RING_DURATION_SECONDS);
  const [currentRingtone, setCurrentRingtone] = useState("");
  const [speechUnlocked, setSpeechUnlocked] = useState(false);

  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const ringTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const callActiveRef = useRef(false);
  const aiSpeakingRef = useRef(false);
  const recognitionStartingRef = useRef(false);

  const ringtones = useMemo(
    () => ["/ringtone-1.mp3", "/ringtone-2.mp3"],
    []
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setErrorText("This browser does not support speech recognition.");
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = RECOGNITION_LANG;
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onstart = () => {
      recognitionStartingRef.current = false;
      if (!callActiveRef.current) return;
      setVoiceState("listening");
      setStatusText("Listening...");
    };

    recognition.onresult = async (event: any) => {
      if (!callActiveRef.current) return;

      const result =
        event.results?.[event.results.length - 1]?.[0]?.transcript?.trim() || "";

      if (!result) return;

      setHeardText(result);
      setStatusText(`You: ${result}`);
      setVoiceState("thinking");

      try {
        stopRecognition();

        const res = await fetch("/api/ai-call", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: result,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || "AI request failed");
        }

        const answer = data?.text || "I am here and listening.";
        setReplyText(answer);
        setStatusText("Taurus AI is speaking...");
        speakText(answer, () => {
          if (callActiveRef.current) {
            startRecognition();
          }
        });
      } catch (error) {
        console.error(error);
        setErrorText("AI response failed.");
        setVoiceState("idle");
        if (callActiveRef.current) {
          setTimeout(() => startRecognition(), 600);
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Recognition error:", event);
      recognitionStartingRef.current = false;

      if (!callActiveRef.current) return;

      setVoiceState("idle");
      setStatusText("Mic stopped. Restarting...");

      setTimeout(() => {
        if (callActiveRef.current && !aiSpeakingRef.current) {
          startRecognition();
        }
      }, 800);
    };

    recognition.onend = () => {
      recognitionStartingRef.current = false;

      if (!callActiveRef.current) return;
      if (aiSpeakingRef.current) return;

      setTimeout(() => {
        if (callActiveRef.current && !aiSpeakingRef.current) {
          startRecognition();
        }
      }, 700);
    };

    recognitionRef.current = recognition;

    // preload voices
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };

    return () => {
      callActiveRef.current = false;
      stopRingtone();
      stopRecognition();
      window.speechSynthesis.cancel();
    };
  }, []);

  function formatPhoneNumber(value: string) {
    return value.replace(/\D/g, "").slice(0, 7);
  }

  function getRandomRingtone() {
    return ringtones[Math.floor(Math.random() * ringtones.length)];
  }

  function unlockSpeechSystem() {
    if (typeof window === "undefined") return;
    if (speechUnlocked) return;

    const utterance = new SpeechSynthesisUtterance(" ");
    utterance.volume = 0;
    window.speechSynthesis.speak(utterance);
    setSpeechUnlocked(true);
  }

  function playRingtone() {
    if (!ringtoneRef.current) return;

    const randomTone = getRandomRingtone();
    ringtoneRef.current.src = randomTone;
    ringtoneRef.current.loop = true;
    setCurrentRingtone(randomTone.split("/").pop() || "");

    ringtoneRef.current.play().catch((error) => {
      console.error("Ringtone playback failed:", error);
      setErrorText("Ringtone could not play.");
    });
  }

  function stopRingtone() {
    if (!ringtoneRef.current) return;
    ringtoneRef.current.pause();
    ringtoneRef.current.currentTime = 0;
  }

  function startRecognition() {
    if (!recognitionRef.current) return;
    if (!callActiveRef.current) return;
    if (aiSpeakingRef.current) return;
    if (recognitionStartingRef.current) return;

    recognitionStartingRef.current = true;

    try {
      recognitionRef.current.start();
    } catch {
      recognitionStartingRef.current = false;
    }
  }

  function stopRecognition() {
    try {
      recognitionRef.current?.stop?.();
    } catch {}
  }

  function speakText(text: string, onEnd?: () => void) {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const hasMyanmar = /[\u1000-\u109F]/.test(text);
    utterance.lang = hasMyanmar ? "my-MM" : "en-US";
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const matchedVoice =
        voices.find((v) => hasMyanmar && v.lang.toLowerCase().includes("my")) ||
        voices.find((v) => !hasMyanmar && v.lang.toLowerCase().includes("en")) ||
        voices[0];

      if (matchedVoice) utterance.voice = matchedVoice;
    }

    utterance.onstart = () => {
      aiSpeakingRef.current = true;
      setVoiceState("ai-speaking");
      setStatusText("Taurus AI is speaking...");
    };

    utterance.onend = () => {
      aiSpeakingRef.current = false;
      setVoiceState("idle");
      setStatusText("Listening...");
      onEnd?.();
    };

    utterance.onerror = () => {
      aiSpeakingRef.current = false;
      setVoiceState("idle");
      setErrorText("Voice playback failed.");
      onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  }

  function beginRingCountdown() {
    if (ringTimerRef.current) clearInterval(ringTimerRef.current);

    ringTimerRef.current = setInterval(() => {
      setRingCountdown((prev) => {
        if (prev <= 1) {
          if (ringTimerRef.current) clearInterval(ringTimerRef.current);
          ringTimerRef.current = null;
          connectCall();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function connectCall() {
    stopRingtone();
    setCallState("connected");
    setStatusText("Connected");
    setVoiceState("ai-speaking");

    // user gesture already happened from Start Call button
    speakText("Hello, I am Taurus AI. How can I help you today?", () => {
      if (callActiveRef.current) {
        startRecognition();
      }
    });
  }

  function startCall() {
    if (!phoneNumber.trim()) {
      setErrorText("Enter number 7777777 first.");
      return;
    }

    if (phoneNumber !== REQUIRED_LOCAL_NUMBER) {
      setErrorText("Only 7777777 is allowed for this Taurus AI demo.");
      return;
    }

    setErrorText("");
    setReplyText("");
    setHeardText("");
    setRingCountdown(RING_DURATION_SECONDS);
    setCallState("ringing");
    setVoiceState("idle");
    setStatusText(`Calling ${AI_NUMBER_PREFIX}${phoneNumber}...`);
    callActiveRef.current = true;

    unlockSpeechSystem();
    playRingtone();
    beginRingCountdown();
  }

  function endCall() {
    callActiveRef.current = false;
    setCallState("ended");
    setVoiceState("idle");
    setStatusText("Call ended.");
    stopRingtone();
    stopRecognition();
    if (ringTimerRef.current) clearInterval(ringTimerRef.current);
    ringTimerRef.current = null;
    window.speechSynthesis.cancel();
  }

  const waveformBars = Array.from({ length: 12 });

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <audio ref={ringtoneRef} preload="auto" />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(255,255,255,0.06),transparent_25%),radial-gradient(circle_at_50%_55%,rgba(0,229,255,0.07),transparent_20%),radial-gradient(circle_at_50%_60%,rgba(175,82,222,0.10),transparent_24%)]" />
      <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:72px_72px]" />

      <section className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-[430px] rounded-[44px] border border-white/10 bg-zinc-950/95 p-4 shadow-[0_0_80px_rgba(255,255,255,0.08)] backdrop-blur-2xl">
          <div className="rounded-[36px] border border-white/8 bg-black/95 p-5 shadow-inner shadow-white/5">
            <div className="mx-auto mb-4 h-1.5 w-28 rounded-full bg-white/10" />

            <div className="mb-6 flex items-center justify-between text-xs text-white/45">
              <span>{currentRingtone || "No ringtone yet"}</span>
              <span>
                {callState === "connected"
                  ? voiceState === "listening"
                    ? "Mic on"
                    : voiceState === "thinking"
                    ? "Thinking"
                    : voiceState === "ai-speaking"
                    ? "AI speaking"
                    : "Connected"
                  : "Mic off"}
              </span>
            </div>

            <div className="mb-6 text-center">
              <p className="text-xs uppercase tracking-[0.35em] text-white/40">
                Taurus AI Support
              </p>

              <div className="mt-5 flex items-center justify-center">
                <div
                  className={[
                    "relative flex h-44 w-44 items-center justify-center rounded-full border border-white/10 transition-all duration-500",
                    voiceState === "listening"
                      ? "shadow-[0_0_65px_rgba(34,197,94,0.22)]"
                      : voiceState === "ai-speaking"
                      ? "shadow-[0_0_65px_rgba(56,189,248,0.22)]"
                      : voiceState === "thinking"
                      ? "shadow-[0_0_65px_rgba(250,204,21,0.18)]"
                      : "shadow-[0_0_50px_rgba(255,255,255,0.08)]",
                  ].join(" ")}
                >
                  <div className="absolute inset-4 rounded-full border border-white/5" />
                  <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.06),transparent_65%)] blur-2xl" />

                  {(voiceState === "ai-speaking" || voiceState === "listening") && (
                    <div className="absolute inset-0 flex items-end justify-center gap-1 px-8 pb-10">
                      {waveformBars.map((_, index) => (
                        <span
                          key={index}
                          className="w-1 rounded-full bg-white/80 animate-pulse"
                          style={{
                            height:
                              voiceState === "ai-speaking"
                                ? `${20 + ((index * 9) % 38)}px`
                                : `${12 + ((index * 5) % 24)}px`,
                            animationDuration: `${0.5 + (index % 4) * 0.15}s`,
                          }}
                        />
                      ))}
                    </div>
                  )}

                  <div className="relative z-10 flex h-28 w-28 items-center justify-center rounded-full bg-white/5 backdrop-blur-xl">
                    <div className="text-center">
                      <p className="text-3xl font-semibold tracking-tight">
                        {callState === "ringing"
                          ? formatClock(ringCountdown)
                          : "LIVE"}
                      </p>
                      <p className="mt-1 text-[10px] uppercase tracking-[0.28em] text-white/45">
                        {callState === "ringing" ? "ringing" : voiceState}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {callState === "ringing" && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-sm text-white/60">Auto calling Taurus AI...</span>
                </div>
              )}
            </div>

            <div className="mb-4 text-center">
              <p className="text-2xl font-semibold tracking-tight text-white">
                {AI_NUMBER_PREFIX}
                {phoneNumber || "•••••••"}
              </p>
              <p className="mt-2 text-sm text-white/60">{statusText}</p>
              {errorText ? (
                <p className="mt-2 text-sm text-rose-300">{errorText}</p>
              ) : null}
            </div>

            <div className="space-y-3">
              <label className="block text-xs uppercase tracking-[0.3em] text-white/40">
                Dial Taurus Number
              </label>

              <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <span className="text-lg text-white/60">{AI_NUMBER_PREFIX}</span>
                <input
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(formatPhoneNumber(e.target.value));
                    setErrorText("");
                  }}
                  inputMode="numeric"
                  placeholder="7777777"
                  className="w-[140px] bg-transparent text-center text-lg tracking-[0.18em] text-white outline-none placeholder:text-white/20"
                />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3 text-center text-sm">
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
                <p className="text-white/45">Mode</p>
                <p className="mt-1 font-medium text-white">Voice Call</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
                <p className="text-white/45">Mic</p>
                <p className="mt-1 font-medium text-white">
                  {voiceState === "listening" ? "On" : "Standby"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
                <p className="text-white/45">Call</p>
                <p className="mt-1 font-medium text-white">
                  {callState === "connected" ? "Live" : "Ready"}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                <p className="text-xs uppercase tracking-[0.25em] text-white/40">
                  You said
                </p>
                <p className="mt-2 min-h-[24px] text-sm text-white/85">
                  {heardText || "Waiting for your voice..."}
                </p>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                <p className="text-xs uppercase tracking-[0.25em] text-white/40">
                  Taurus AI reply
                </p>
                <p className="mt-2 min-h-[24px] text-sm text-white/85">
                  {replyText || "AI reply will appear here..."}
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-4">
              <button
                onClick={() => {
                  setHeardText("");
                  setReplyText("");
                  setErrorText("");
                  setStatusText("Reset done.");
                  setCallState("idle");
                  setVoiceState("idle");
                  setRingCountdown(RING_DURATION_SECONDS);
                  stopRingtone();
                  stopRecognition();
                  window.speechSynthesis.cancel();
                  callActiveRef.current = false;
                }}
                className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xl transition hover:bg-white/10"
                aria-label="Reset call"
              >
                ⟲
              </button>

              {callState !== "connected" && callState !== "ringing" ? (
                <button
                  onClick={startCall}
                  className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500 text-4xl shadow-[0_0_45px_rgba(16,185,129,0.35)] transition hover:scale-[1.03]"
                  aria-label="Start call"
                >
                  ☎
                </button>
              ) : (
                <button
                  onClick={endCall}
                  className="flex h-24 w-24 items-center justify-center rounded-full bg-rose-500 text-4xl shadow-[0_0_45px_rgba(244,63,94,0.35)] transition hover:scale-[1.03]"
                  aria-label="End call"
                >
                  ✕
                </button>
              )}

              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xl">
                {voiceState === "listening"
                  ? "🎙️"
                  : voiceState === "ai-speaking"
                  ? "🔊"
                  : voiceState === "thinking"
                  ? "🧠"
                  : "•"}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 text-center text-[11px] text-white/45">
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
                Ring: 20s
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
                2 Ringtones
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
                Phone UI
              </div>
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