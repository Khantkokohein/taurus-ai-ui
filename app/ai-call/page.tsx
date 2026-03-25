"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    webkitSpeechRecognition?: any;
    SpeechRecognition?: any;
  }
}

type CallState =
  | "idle"
  | "ringing"
  | "connected"
  | "listening"
  | "processing"
  | "ended";

const SUPPORT_NUMBER = "+70 20 7777777";
const RING_SECONDS = 20;
const SESSION_SECONDS = 300;

export default function CallAiPage() {
  const router = useRouter();

  const [callState, setCallState] = useState<CallState>("idle");
  const [ringSecondsLeft, setRingSecondsLeft] = useState(RING_SECONDS);
  const [sessionSecondsLeft, setSessionSecondsLeft] = useState(SESSION_SECONDS);
  const [transcript, setTranscript] = useState("");
  const [aiReply, setAiReply] = useState("");
  const [statusText, setStatusText] = useState("Ready to call Taurus AI Support");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [supported, setSupported] = useState(true);

  const recognitionRef = useRef<any>(null);
  const ringIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);
  const answeredRef = useRef(false);
  const sessionActiveRef = useRef(false);
  const isListeningRef = useRef(false);
  const isProcessingRef = useRef(false);
  const isSpeakingRef = useRef(false);

  const ringAudio1 = useRef<HTMLAudioElement | null>(null);
  const ringAudio2 = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    mountedRef.current = true;

    const hasSpeech =
      typeof window !== "undefined" &&
      "speechSynthesis" in window &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);

    if (!hasSpeech) {
      setSupported(false);
      setStatusText("This browser does not fully support voice features.");
    }

    const loadVoices = () => {
      try {
        window.speechSynthesis.getVoices();
      } catch {}
    };

    loadVoices();
    if ("speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    ringAudio1.current = new Audio("/sounds/ring1.mp3");
    ringAudio2.current = new Audio("/sounds/ring2.mp3");

    if (ringAudio1.current) {
      ringAudio1.current.loop = false;
      ringAudio1.current.preload = "auto";
    }

    if (ringAudio2.current) {
      ringAudio2.current.loop = false;
      ringAudio2.current.preload = "auto";
    }

    return () => {
      mountedRef.current = false;
      cleanupAll();
    };
  }, []);

  const stopRingtones = () => {
    if (ringAudio1.current) {
      ringAudio1.current.pause();
      ringAudio1.current.currentTime = 0;
    }

    if (ringAudio2.current) {
      ringAudio2.current.pause();
      ringAudio2.current.currentTime = 0;
    }
  };

  const cleanupAll = () => {
    if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
    if (sessionIntervalRef.current) clearInterval(sessionIntervalRef.current);

    ringIntervalRef.current = null;
    sessionIntervalRef.current = null;

    try {
      recognitionRef.current?.stop?.();
    } catch {}

    try {
      window.speechSynthesis?.cancel();
    } catch {}

    stopRingtones();

    answeredRef.current = false;
    sessionActiveRef.current = false;
    isListeningRef.current = false;
    isProcessingRef.current = false;
    isSpeakingRef.current = false;
  };

  const formatTime = (total: number) => {
    const safe = Math.max(0, total);
    const m = Math.floor(safe / 60);
    const s = safe % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const scheduleAutoListen = () => {
    if (!mountedRef.current) return;
    if (!sessionActiveRef.current) return;

    setTimeout(() => {
      if (!mountedRef.current) return;
      if (!sessionActiveRef.current) return;
      if (isListeningRef.current) return;
      if (isProcessingRef.current) return;
      if (isSpeakingRef.current) return;
      startListening();
    }, 450);
  };

  const speakText = async (text: string) => {
    return new Promise<void>((resolve) => {
      if (!("speechSynthesis" in window)) {
        resolve();
        return;
      }

      try {
        window.speechSynthesis.cancel();
      } catch {}

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;

      const voices = window.speechSynthesis.getVoices();
      const preferred =
        voices.find((v) => /my|burmese|myanmar/i.test(`${v.lang} ${v.name}`)) ||
        voices.find((v) => /en/i.test(v.lang)) ||
        voices[0];

      if (preferred) utterance.voice = preferred;

      utterance.onstart = () => {
        isSpeakingRef.current = true;
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        isSpeakingRef.current = false;
        setIsSpeaking(false);
        resolve();
        scheduleAutoListen();
      };

      utterance.onerror = () => {
        isSpeakingRef.current = false;
        setIsSpeaking(false);
        resolve();
        scheduleAutoListen();
      };

      window.speechSynthesis.speak(utterance);
    });
  };

  const startSessionTimer = () => {
    setSessionSecondsLeft(SESSION_SECONDS);
    sessionActiveRef.current = true;

    if (sessionIntervalRef.current) clearInterval(sessionIntervalRef.current);

    sessionIntervalRef.current = setInterval(() => {
      setSessionSecondsLeft((prev) => {
        if (prev <= 1) {
          if (sessionIntervalRef.current) clearInterval(sessionIntervalRef.current);
          endCall("5-minute session ended.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SR) {
      setStatusText("Speech recognition is not supported in this browser.");
      return;
    }

    if (!sessionActiveRef.current) return;
    if (isListeningRef.current) return;
    if (isProcessingRef.current) return;
    if (isSpeakingRef.current) return;

    try {
      recognitionRef.current?.stop?.();
    } catch {}

    const recognition = new SR();
    recognition.lang = navigator.language || "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    let finalText = "";

    recognition.onstart = () => {
      isListeningRef.current = true;
      setCallState("listening");
      setStatusText("Listening...");
    };

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const heard = result?.[0]?.transcript || "";
        if (result.isFinal) {
          finalText += ` ${heard}`;
        } else {
          interim += ` ${heard}`;
        }
      }

      const displayText = (finalText || interim).trim();
      if (displayText) {
        setTranscript(displayText);
      }
    };

    recognition.onerror = () => {
      isListeningRef.current = false;
      setCallState("connected");
      setStatusText("Voice capture failed. Listening again...");
      scheduleAutoListen();
    };

    recognition.onend = async () => {
      isListeningRef.current = false;

      const cleaned = finalText.trim() || transcript.trim();

      if (!sessionActiveRef.current) return;
      if (isProcessingRef.current) return;
      if (isSpeakingRef.current) return;

      if (!cleaned) {
        setCallState("connected");
        setStatusText("No speech detected. Auto listening...");
        scheduleAutoListen();
        return;
      }

      isProcessingRef.current = true;
      setCallState("processing");
      setStatusText("Taurus AI is thinking...");

      try {
        const res = await fetch("/api/call-ai", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: cleaned,
            language: navigator.language || "en-US",
            supportNumber: SUPPORT_NUMBER,
          }),
        });

        const data = await res.json();

        const reply =
          data?.reply ||
          "I received your request. Please tell me more clearly so I can assist you.";

        setAiReply(reply);
        setStatusText("Taurus AI is replying...");
        setCallState("connected");

        isProcessingRef.current = false;
        await speakText(reply);
      } catch {
        const fallback = "I am here to help. Please say that again.";
        setAiReply(fallback);
        setStatusText("Taurus AI is replying...");
        setCallState("connected");

        isProcessingRef.current = false;
        await speakText(fallback);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const answerCall = async () => {
    if (answeredRef.current) return;
    answeredRef.current = true;

    if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
    ringIntervalRef.current = null;

    stopRingtones();

    setCallState("connected");
    setStatusText("Taurus AI answered the call.");
    startSessionTimer();

    const intro = "Hello, Taurus AI. How can I help you today?";
    setAiReply(intro);
    await speakText(intro);
  };

  const startCall = async () => {
    cleanupAll();

    setTranscript("");
    setAiReply("");
    setRingSecondsLeft(RING_SECONDS);
    setSessionSecondsLeft(SESSION_SECONDS);
    setCallState("ringing");
    setStatusText(`Calling Taurus AI Support ${SUPPORT_NUMBER}...`);

    let toggle = false;

    const playNextRing = () => {
      if (!mountedRef.current || answeredRef.current) return;

      if (toggle) {
        if (ringAudio1.current) {
          ringAudio1.current.currentTime = 0;
          ringAudio1.current.play().catch(() => {});
        }
      } else {
        if (ringAudio2.current) {
          ringAudio2.current.currentTime = 0;
          ringAudio2.current.play().catch(() => {});
        }
      }

      toggle = !toggle;
    };

    playNextRing();

    ringIntervalRef.current = setInterval(() => {
      setRingSecondsLeft((prev) => {
        const next = prev - 2;

        if (next <= 0) {
          answerCall();
          return 0;
        }

        return next;
      });

      if (!answeredRef.current) {
        playNextRing();
      }
    }, 2000);
  };

  const endCall = (message = "Call ended.") => {
    cleanupAll();
    setCallState("ended");
    setStatusText(message);
  };

  const backGate = () => {
    cleanupAll();
    router.push("/login-gate");
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-8 pt-6">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={backGate}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] tracking-[0.28em] text-white/75 transition hover:bg-white/10"
          >
            BACK
          </button>

          <div className="text-right">
            <p className="text-[10px] uppercase tracking-[0.35em] text-white/35">
              Taurus AI
            </p>
            <p className="text-[11px] text-white/55">Calling Customer Support</p>
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center justify-between">
          <div className="mt-6 flex flex-col items-center">
            <div className="mb-4 text-center">
              <p className="text-[12px] uppercase tracking-[0.35em] text-white/35">
                iPhone Dial Style
              </p>
            </div>

            <button
              onClick={startCall}
              disabled={
                callState === "ringing" ||
                callState === "connected" ||
                callState === "listening" ||
                callState === "processing"
              }
              className="relative flex h-72 w-72 items-center justify-center rounded-full border border-white/10 bg-gradient-to-b from-[#101010] to-[#050505] shadow-[0_40px_120px_rgba(0,0,0,0.6)] transition disabled:opacity-60"
            >
              <div className="absolute inset-4 rounded-full border border-white/10 bg-[#0d0d0d]" />
              <div className="absolute inset-10 rounded-full border border-white/10 bg-black" />
              <div className="relative z-10 text-center">
                <p className="text-[11px] uppercase tracking-[0.35em] text-white/35">
                  Taurus AI
                </p>
                <h1 className="mt-3 text-3xl font-medium tracking-wide text-white">
                  {SUPPORT_NUMBER}
                </h1>
                <p className="mt-3 text-sm text-white/55">
                  {callState === "idle" && "Tap to Call"}
                  {callState === "ringing" && `Ringing... ${ringSecondsLeft}s`}
                  {callState === "connected" && "Connected"}
                  {callState === "listening" && "Listening..."}
                  {callState === "processing" && "AI Thinking..."}
                  {callState === "ended" && "Call Ended"}
                </p>
              </div>
            </button>

            <div className="mt-6 flex w-full items-center justify-center gap-3">
              <div className="rounded-full border border-white/10 bg-white/6 px-5 py-3 text-sm text-white">
                {isSpeaking
                  ? "AI Speaking..."
                  : callState === "listening"
                  ? "Mic On"
                  : "Auto Talk"}
              </div>

              <button
                onClick={() => endCall()}
                className="rounded-full border border-red-500/20 bg-red-500/10 px-5 py-3 text-sm text-red-200 transition hover:bg-red-500/15"
              >
                End
              </button>
            </div>
          </div>

          <div className="mt-8 w-full rounded-[30px] border border-white/10 bg-[#0b0b0b] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.35em] text-white/30">
                  Live Status
                </p>
                <p className="mt-2 text-sm text-white/80">{statusText}</p>
              </div>

              <div className="text-right">
                <p className="text-[10px] uppercase tracking-[0.3em] text-white/30">
                  Session
                </p>
                <p className="mt-2 text-lg text-white">
                  {callState === "ringing"
                    ? formatTime(ringSecondsLeft)
                    : formatTime(sessionSecondsLeft)}
                </p>
              </div>
            </div>

            <div className="grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-black p-4">
                <p className="text-[10px] uppercase tracking-[0.25em] text-white/30">
                  Your Voice
                </p>
                <p className="mt-2 min-h-[44px] text-sm text-white/88">
                  {transcript || "No speech captured yet."}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black p-4">
                <p className="text-[10px] uppercase tracking-[0.25em] text-white/30">
                  Taurus AI Reply
                </p>
                <p className="mt-2 min-h-[44px] text-sm text-white/88">
                  {aiReply || "AI reply will appear here."}
                </p>
              </div>
            </div>

            {!supported && (
              <div className="mt-4 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-3 text-xs text-yellow-100">
                Browser voice recognition or voice playback support is limited on this device.
              </div>
            )}

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-white/50">
              Auto Talk Mode is on. After AI finishes speaking, microphone will reopen automatically until the 5-minute session ends.
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}