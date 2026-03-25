"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    webkitSpeechRecognition?: any;
    SpeechRecognition?: any;
  }
}

const SUPPORT_NUMBER = "+70 20 7777777";

export default function AiCallPage() {
  const router = useRouter();

  const [digits, setDigits] = useState(SUPPORT_NUMBER);
  const [isCalling, setIsCalling] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [aiReply, setAiReply] = useState("");
  const [transcript, setTranscript] = useState("");
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);

  const ring1Ref = useRef<HTMLAudioElement | null>(null);
  const ring2Ref = useRef<HTMLAudioElement | null>(null);
  const ringIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const answerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recognitionRef = useRef<any>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    ring1Ref.current = new Audio("/sounds/ring1.mp3");
    ring2Ref.current = new Audio("/sounds/ring2.mp3");

    if (ring1Ref.current) ring1Ref.current.preload = "auto";
    if (ring2Ref.current) ring2Ref.current.preload = "auto";

    return () => {
      mountedRef.current = false;
      stopAllAudio();
      stopRecognition();

      if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
      if (answerTimeoutRef.current) clearTimeout(answerTimeoutRef.current);

      try {
        window.speechSynthesis.cancel();
      } catch {}
    };
  }, []);

  const stopAllAudio = () => {
    if (ring1Ref.current) {
      ring1Ref.current.pause();
      ring1Ref.current.currentTime = 0;
    }
    if (ring2Ref.current) {
      ring2Ref.current.pause();
      ring2Ref.current.currentTime = 0;
    }
  };

  const stopRecognition = () => {
    try {
      recognitionRef.current?.stop?.();
    } catch {}
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

      utterance.onstart = () => setIsAiSpeaking(true);
      utterance.onend = () => {
        setIsAiSpeaking(false);
        resolve();
      };
      utterance.onerror = () => {
        setIsAiSpeaking(false);
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  };

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    stopRecognition();

    const recognition = new SR();
    recognition.lang = navigator.language || "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = async (event: any) => {
      const text = event?.results?.[0]?.[0]?.transcript?.trim?.() || "";
      if (!text) return;

      setTranscript(text);

      try {
        const res = await fetch("/api/call-ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            language: navigator.language || "en-US",
            supportNumber: SUPPORT_NUMBER,
          }),
        });

        const data = await res.json();
        const reply =
          data?.reply || "Hello. Taurus AI support is ready to help you.";
        setAiReply(reply);
        await speakText(reply);

        if (mountedRef.current && isConnected) {
          setTimeout(() => {
            if (mountedRef.current && isConnected) {
              startListening();
            }
          }, 500);
        }
      } catch {
        const fallback = "Sorry, please say that again.";
        setAiReply(fallback);
        await speakText(fallback);

        if (mountedRef.current && isConnected) {
          setTimeout(() => {
            if (mountedRef.current && isConnected) {
              startListening();
            }
          }, 500);
        }
      }
    };

    recognition.onerror = () => {
      if (mountedRef.current && isConnected) {
        setTimeout(() => {
          if (mountedRef.current && isConnected) {
            startListening();
          }
        }, 700);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const startRingLoop = () => {
    let toggle = false;

    const playNext = () => {
      if (toggle) {
        ring1Ref.current?.play().catch(() => {});
      } else {
        ring2Ref.current?.play().catch(() => {});
      }
      toggle = !toggle;
    };

    playNext();

    if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
    ringIntervalRef.current = setInterval(() => {
      playNext();
    }, 2000);
  };

  const handleCall = async () => {
    if (isCalling || isConnected) return;

    setDigits(SUPPORT_NUMBER);
    setTranscript("");
    setAiReply("");
    setIsCalling(true);
    setIsConnected(false);

    startRingLoop();

    if (answerTimeoutRef.current) clearTimeout(answerTimeoutRef.current);
    answerTimeoutRef.current = setTimeout(async () => {
      stopAllAudio();
      if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;

      setIsCalling(false);
      setIsConnected(true);

      const intro = "Hello, Taurus AI Support. How can I help you today?";
      setAiReply(intro);
      await speakText(intro);
      startListening();
    }, 20000);
  };

  const handleEnd = () => {
    stopAllAudio();
    stopRecognition();

    if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
    if (answerTimeoutRef.current) clearTimeout(answerTimeoutRef.current);

    ringIntervalRef.current = null;
    answerTimeoutRef.current = null;

    try {
      window.speechSynthesis.cancel();
    } catch {}

    setIsCalling(false);
    setIsConnected(false);
    setIsAiSpeaking(false);
  };

  const dialKeys = [
    { n: "1", s: "" },
    { n: "2", s: "ABC" },
    { n: "3", s: "DEF" },
    { n: "4", s: "GHI" },
    { n: "5", s: "JKL" },
    { n: "6", s: "MNO" },
    { n: "7", s: "PQRS" },
    { n: "8", s: "TUV" },
    { n: "9", s: "WXYZ" },
    { n: "*", s: "" },
    { n: "0", s: "+" },
    { n: "#", s: "" },
  ];

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pt-6 pb-8">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-3xl font-semibold tracking-tight">12:41</div>
          <button
            onClick={() => router.push("/login-gate")}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/85"
          >
            Back
          </button>
        </div>

        <div className="mb-4 mt-3 flex flex-col items-center">
          <div className="text-center">
            <h1 className="text-[28px] font-medium tracking-wide">
              Taurus Ai Support
            </h1>
          </div>

          <div className="relative mt-4 h-20 w-[260px] overflow-hidden">
            <div className="absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 bg-white/10" />
            <div className="absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent blur-sm" />
            <div
              className={`absolute top-1/2 h-3 w-12 -translate-y-1/2 rounded-full bg-gradient-to-r from-cyan-300 via-purple-400 to-cyan-300 blur-[1px] ${
                isCalling || isConnected || isAiSpeaking
                  ? "animate-[supportNano_2.2s_linear_infinite]"
                  : "animate-[supportNanoIdle_4.5s_ease-in-out_infinite]"
              }`}
            />
            <div
              className={`absolute top-1/2 h-7 w-7 -translate-y-1/2 rounded-full bg-white/90 shadow-[0_0_18px_rgba(255,255,255,0.65)] ${
                isCalling || isConnected || isAiSpeaking
                  ? "animate-[supportOrb_2.2s_linear_infinite]"
                  : "animate-[supportOrbIdle_4.5s_ease-in-out_infinite]"
              }`}
            />
          </div>
        </div>

        <div className="mb-6 min-h-[42px] text-center text-[34px] font-light tracking-wide">
          {digits}
        </div>

        <div className="grid grid-cols-3 gap-x-7 gap-y-6 px-4">
          {dialKeys.map((key) => (
            <button
              key={key.n}
              type="button"
              className="flex h-[92px] w-[92px] flex-col items-center justify-center rounded-full border border-white/10 bg-[#111216] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
            >
              <span className="text-[42px] font-semibold leading-none">
                {key.n}
              </span>
              <span className="mt-1 text-[12px] font-semibold tracking-[0.18em] text-white/90">
                {key.s}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-center">
          {!isCalling && !isConnected ? (
            <button
              onClick={handleCall}
              className="flex h-[88px] w-[88px] items-center justify-center rounded-full bg-[#16a137] shadow-[0_8px_30px_rgba(22,161,55,0.35)]"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-10 w-10 fill-white"
                aria-hidden="true"
              >
                <path d="M6.62 10.79a15.054 15.054 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1C10.3 21 3 13.7 3 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.25 1.01l-2.2 2.2z" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleEnd}
              className="flex h-[88px] w-[88px] items-center justify-center rounded-full bg-[#b91c1c] shadow-[0_8px_30px_rgba(185,28,28,0.35)]"
            >
              <span className="h-1.5 w-9 rounded-full bg-white" />
            </button>
          )}
        </div>

        <div className="mt-auto pt-12">
          <div className="grid grid-cols-5 gap-2 rounded-[34px] border border-white/10 bg-[#101114] px-3 py-3">
            {[
              "Favorites",
              "Recents",
              "Contacts",
              "Keypad",
              "Voicemail",
            ].map((item, index) => (
              <div
                key={item}
                className={`flex flex-col items-center justify-center rounded-[24px] px-2 py-3 ${
                  index === 3 ? "bg-white/10" : ""
                }`}
              >
                <div
                  className={`mb-2 h-6 w-6 rounded-full ${
                    index === 3 ? "bg-[#2491ff]" : "bg-white"
                  } ${index === 4 ? "rounded-[10px]" : ""} ${
                    index === 1 ? "h-5 w-5 border-4 border-white bg-transparent" : ""
                  } ${index === 2 ? "rounded-full border-4 border-white bg-transparent" : ""}
                  ${index === 0 ? "clip-path-star" : ""}`}
                />
                <span
                  className={`text-[11px] ${
                    index === 3 ? "text-[#2491ff]" : "text-white"
                  }`}
                >
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes supportNano {
          0% {
            transform: translate(0, -50%);
            opacity: 0.7;
          }
          50% {
            transform: translate(210px, -50%);
            opacity: 1;
          }
          100% {
            transform: translate(0, -50%);
            opacity: 0.7;
          }
        }

        @keyframes supportOrb {
          0% {
            transform: translate(0, -50%) scale(0.95);
            opacity: 0.85;
          }
          50% {
            transform: translate(228px, -50%) scale(1.08);
            opacity: 1;
          }
          100% {
            transform: translate(0, -50%) scale(0.95);
            opacity: 0.85;
          }
        }

        @keyframes supportNanoIdle {
          0% {
            transform: translate(20px, -50%);
            opacity: 0.55;
          }
          50% {
            transform: translate(170px, -50%);
            opacity: 0.95;
          }
          100% {
            transform: translate(20px, -50%);
            opacity: 0.55;
          }
        }

        @keyframes supportOrbIdle {
          0% {
            transform: translate(24px, -50%) scale(0.9);
            opacity: 0.65;
          }
          50% {
            transform: translate(182px, -50%) scale(1);
            opacity: 0.95;
          }
          100% {
            transform: translate(24px, -50%) scale(0.9);
            opacity: 0.65;
          }
        }

        .clip-path-star {
          clip-path: polygon(
            50% 0%,
            61% 35%,
            98% 35%,
            68% 57%,
            79% 91%,
            50% 70%,
            21% 91%,
            32% 57%,
            2% 35%,
            39% 35%
          );
        }
      `}</style>
    </main>
  );
}