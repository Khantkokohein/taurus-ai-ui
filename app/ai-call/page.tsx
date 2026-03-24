"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const PHONE_PREFIX = "+70 20 ";
const AI_NUMBER = "+70 20 7777777";
const MAX_SUFFIX_DIGITS = 7;
const AI_REPLY_DELAY_MS = 20000;
const RINGTONES = ["/ringtone1.mp3", "/ringtone2.mp3"];

const keypadRows = [
  [
    { key: "1", sub: "" },
    { key: "2", sub: "ABC" },
    { key: "3", sub: "DEF" },
  ],
  [
    { key: "4", sub: "GHI" },
    { key: "5", sub: "JKL" },
    { key: "6", sub: "MNO" },
  ],
  [
    { key: "7", sub: "PQRS" },
    { key: "8", sub: "TUV" },
    { key: "9", sub: "WXYZ" },
  ],
  [
    { key: "*", sub: "" },
    { key: "0", sub: "+" },
    { key: "#", sub: "" },
  ],
];

function normalizeNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(-7);
  return `${PHONE_PREFIX}${digits}`;
}

function getSuffix(value: string) {
  if (!value.startsWith(PHONE_PREFIX)) return "";
  return value.slice(PHONE_PREFIX.length);
}

function isValidAiNumber(value: string) {
  return value === AI_NUMBER;
}

export default function AICallPage() {
  const [targetNumber, setTargetNumber] = useState(PHONE_PREFIX);
  const [statusText, setStatusText] = useState("Dial Taurus AI number to continue");
  const [showCallScreen, setShowCallScreen] = useState(false);
  const [callStage, setCallStage] = useState<"idle" | "calling" | "connected">("idle");
  const [callText, setCallText] = useState("Calling Taurus AI...");
  const [callSeconds, setCallSeconds] = useState(0);

  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  const delayTimeoutRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const listenTimeoutRef = useRef<number | null>(null);

  const isAiReady = useMemo(() => isValidAiNumber(targetNumber), [targetNumber]);

  function unlockSpeech() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    try {
      const synth = window.speechSynthesis;
      synth.cancel();
      synth.resume();

      const warmup = new SpeechSynthesisUtterance(" ");
      warmup.volume = 0;
      warmup.rate = 1;
      warmup.pitch = 1;
      warmup.lang = "en-US";
      synth.speak(warmup);
    } catch {}
  }

  function speakText(
    text: string,
    options?: { rate?: number; pitch?: number; lang?: string; onEnd?: () => void }
  ) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      options?.onEnd?.();
      return;
    }

    const synth = window.speechSynthesis;

    const run = () => {
      try {
        synth.cancel();
        synth.resume();

        const utter = new SpeechSynthesisUtterance(text);
        utter.rate = options?.rate ?? 0.95;
        utter.pitch = options?.pitch ?? 1;
        utter.volume = 1;
        utter.lang = options?.lang ?? "en-US";

        const voices = synth.getVoices();
        const preferred =
          voices.find((v) => v.lang === utter.lang) ||
          voices.find((v) => utter.lang.startsWith("en") && v.lang.startsWith("en")) ||
          voices[0];

        if (preferred) {
          utter.voice = preferred;
        }

        utter.onend = () => {
          options?.onEnd?.();
        };

        utter.onerror = () => {
          options?.onEnd?.();
        };

        synth.speak(utter);
      } catch {
        options?.onEnd?.();
      }
    };

    const voices = synth.getVoices();
    if (voices.length > 0) {
      run();
    } else {
      synth.onvoiceschanged = () => {
        run();
        synth.onvoiceschanged = null;
      };
      window.setTimeout(run, 300);
    }
  }

  function speakGreeting() {
    setCallText("Welcome to Taurus AI. How can I help you?");
    speakText("Welcome to Taurus AI. How can I help you?", {
      lang: "en-US",
      rate: 0.95,
      onEnd: () => {
        window.setTimeout(() => {
          startListeningForQuestion();
        }, 800);
      },
    });
  }

  function speakAccessCodeSequence() {
    const intro = "ဟုတ်ကဲ့ လူကြီးမင်း တောင်းဆိုသော password လေးကတော့";
    const chars = ["T", "A", "U", "R", "U", "S", "2", "0", "2", "6"];

    setCallText("ဟုတ်ကဲ့ လူကြီးမင်း တောင်းဆိုသော password လေးကတော့...");

    speakText(intro, {
      lang: "my-MM",
      rate: 0.9,
      onEnd: () => {
        let index = 0;

        const speakNext = () => {
          if (index >= chars.length) return;

          speakText(chars[index], {
            lang: "en-US",
            rate: 0.6,
            pitch: 1,
            onEnd: () => {
              index += 1;
              window.setTimeout(speakNext, 500);
            },
          });
        };

        window.setTimeout(speakNext, 500);
      },
    });
  }

  function speakServiceMessage() {
    setCallText("ဝန်ဆောင်မှုကို တိုးတက်အောင် ဆက်လုပ်ဆောင်ရွက်နေပါသည်");
    speakText("ဝန်ဆောင်မှုကို တိုးတက်အောင် ဆက်လုပ်ဆောင်ရွက်နေပါသည်", {
      lang: "my-MM",
      rate: 0.9,
    });
  }

  function handleCustomerQuestion(text: string) {
    const q = text.toLowerCase().trim();

    if (!q) {
      speakGreeting();
      return;
    }

    const hasPassword =
      q.includes("password") ||
      q.includes("pass word") ||
      q.includes("access code") ||
      q.includes("code") ||
      q.includes("pin");

    if (hasPassword) {
      speakAccessCodeSequence();
      return;
    }

    speakServiceMessage();
  }

  function clearListeningTimeout() {
    if (listenTimeoutRef.current) {
      window.clearTimeout(listenTimeoutRef.current);
      listenTimeoutRef.current = null;
    }
  }

  function startListeningForQuestion() {
    clearListeningTimeout();

    const SpeechRecognitionCtor =
      typeof window !== "undefined"
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    if (!SpeechRecognitionCtor) {
      setCallText("Speech input is limited on this device. Tap AI Line for password.");
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }

      const recognition = new SpeechRecognitionCtor();
      recognitionRef.current = recognition;
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        clearListeningTimeout();
        const transcript = event?.results?.[0]?.[0]?.transcript || "";
        handleCustomerQuestion(transcript);
      };

      recognition.onerror = () => {
        clearListeningTimeout();
        speakServiceMessage();
      };

      recognition.onend = () => {
        recognitionRef.current = null;
      };

      recognition.start();

      listenTimeoutRef.current = window.setTimeout(() => {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch {}
          recognitionRef.current = null;
        }
        setCallText("No voice detected. Tap Mic and say password, or tap AI Line.");
      }, 6000);
    } catch {
      speakServiceMessage();
    }
  }

  useEffect(() => {
    return () => {
      stopRingtone();
      clearListeningTimeout();

      if (delayTimeoutRef.current) {
        window.clearTimeout(delayTimeoutRef.current);
        delayTimeoutRef.current = null;
      }

      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
        recognitionRef.current = null;
      }

      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (!showCallScreen || callStage !== "connected") {
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
  }, [showCallScreen, callStage]);

  function appendToTarget(value: string) {
    const suffix = getSuffix(targetNumber);

    if (/^\d$/.test(value)) {
      if (suffix.length >= MAX_SUFFIX_DIGITS) return;
      setTargetNumber(`${PHONE_PREFIX}${suffix}${value}`);
      setStatusText("Ready to dial");
    }
  }

  function deleteTarget() {
    const suffix = getSuffix(targetNumber);
    if (!suffix.length) return;
    setTargetNumber(`${PHONE_PREFIX}${suffix.slice(0, -1)}`);
    setStatusText("Editing number");
  }

  function clearTarget() {
    setTargetNumber(PHONE_PREFIX);
    setStatusText("Dial Taurus AI number to continue");
  }

  function fillAiNumber() {
    setTargetNumber(AI_NUMBER);
    setStatusText("Taurus AI number selected");
  }

  async function playRingtone() {
    if (!ringtoneRef.current) return;

    try {
      const randomIndex = Math.floor(Math.random() * RINGTONES.length);
      const selectedRingtone = RINGTONES[randomIndex];

      ringtoneRef.current.src = selectedRingtone;
      ringtoneRef.current.currentTime = 0;
      ringtoneRef.current.loop = false;

      await ringtoneRef.current.play();
    } catch {
      setStatusText("Ringtone file could not play. Check public/ringtone1.mp3 and ringtone2.mp3");
    }
  }

  function stopRingtone() {
    if (!ringtoneRef.current) return;
    ringtoneRef.current.pause();
    ringtoneRef.current.currentTime = 0;
  }

  function handleCallNow() {
    if (!isValidAiNumber(targetNumber)) {
      setStatusText("Please dial Taurus AI number only");
      return;
    }

    if (delayTimeoutRef.current) {
      window.clearTimeout(delayTimeoutRef.current);
      delayTimeoutRef.current = null;
    }

    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    clearListeningTimeout();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    unlockSpeech();
    stopRingtone();
    setCallSeconds(0);
    setShowCallScreen(true);
    setCallStage("calling");
    setCallText("Calling Taurus AI...");
    setStatusText("Connecting to Taurus AI...");
    void playRingtone();

    delayTimeoutRef.current = window.setTimeout(() => {
      stopRingtone();
      setCallStage("connected");
      setStatusText("Taurus AI answered the call");

      window.setTimeout(() => {
        speakGreeting();
      }, 300);
    }, AI_REPLY_DELAY_MS);
  }

  function handleMessageNow() {
    if (!isValidAiNumber(targetNumber)) {
      setStatusText("Please dial Taurus AI number first");
      return;
    }

    setStatusText("Taurus AI message screen will be added in next step.");
  }

  function handleMicTap() {
    if (callStage !== "connected") return;
    unlockSpeech();
    startListeningForQuestion();
  }

  function handleAudioTap() {
    if (callStage !== "connected") return;
    unlockSpeech();
    speakGreeting();
  }

  function handleAiLineTap() {
    if (callStage !== "connected") return;
    unlockSpeech();
    speakAccessCodeSequence();
  }

  function endCall() {
    stopRingtone();
    clearListeningTimeout();

    if (delayTimeoutRef.current) {
      window.clearTimeout(delayTimeoutRef.current);
      delayTimeoutRef.current = null;
    }

    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    setShowCallScreen(false);
    setCallStage("idle");
    setCallText("Calling Taurus AI...");
    setCallSeconds(0);
    setStatusText("Call ended");
  }

  const formattedDuration = useMemo(() => {
    const mins = Math.floor(callSeconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (callSeconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  }, [callSeconds]);

  return (
    <main className="min-h-screen bg-[#dfe3e8] px-3 py-4">
      <audio ref={ringtoneRef} preload="auto" className="hidden" />

      <div className="mx-auto max-w-[460px]">
        <div className="overflow-hidden rounded-[42px] border border-black/10 bg-[#f2f2f7] shadow-[0_30px_80px_rgba(0,0,0,0.22)]">
          <div className="flex justify-center pt-3">
            <div className="h-7 w-32 rounded-full bg-black" />
          </div>

          <div className="px-3 pb-4 pt-2">
            <div className="flex items-center justify-between px-2">
              <div className="text-sm font-semibold text-[#111111]">9:41</div>
              <div className="text-xs text-[#111111]">Taurus AI Signal ▮▮▮</div>
            </div>

            <div className="mt-3 px-2">
              <div className="text-[28px] font-bold tracking-[-0.03em] text-[#111111]">
                Taurus AI Call
              </div>
              <div className="mt-1 text-sm text-[#8e8e93]">
                Direct AI line without SIM or web-call route
              </div>
            </div>

            <div className="mt-4 rounded-[34px] bg-[#f2f2f7]">
              <div className="space-y-4 px-1">
                <div className="rounded-[30px] bg-white px-5 py-5 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#0a84ff] text-2xl font-bold text-white">
                      AI
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8e8e93]">
                        Taurus AI Direct Line
                      </div>
                      <div className="mt-1 text-2xl font-bold tracking-[-0.03em] text-[#111111]">
                        +70 20 7777777
                      </div>
                      <div className="mt-1 text-sm text-[#8e8e93]">
                        Sales AI • Instant AI support
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={fillAiNumber}
                      className="w-full rounded-2xl bg-[#0a84ff] px-4 py-3 text-sm font-semibold text-white"
                    >
                      Use Taurus AI Number
                    </button>
                  </div>
                </div>

                <div className="rounded-[30px] bg-white px-5 py-6 shadow-sm">
                  <div className="text-center">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#8e8e93]">
                      Dial Number
                    </div>

                    <input
                      value={targetNumber}
                      onChange={(e) => {
                        setTargetNumber(normalizeNumber(e.target.value));
                        setStatusText("Editing number");
                      }}
                      className="w-full rounded-2xl border border-[#e5e5ea] bg-[#f7f7fa] px-4 py-3 text-center text-lg font-semibold text-[#111111] outline-none"
                      placeholder="+70 20 7777777"
                    />

                    <div className="mt-4 break-all text-[34px] font-semibold tracking-[0.04em] text-[#111111]">
                      {targetNumber}
                    </div>

                    <div
                      className={`mt-3 text-sm ${
                        isAiReady ? "text-[#34c759]" : "text-[#8e8e93]"
                      }`}
                    >
                      {statusText}
                    </div>
                  </div>
                </div>

                <div className="flex justify-center gap-2">
                  <button
                    onClick={clearTarget}
                    className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#111111] shadow-sm"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={deleteTarget}
                    className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#111111] shadow-sm"
                  >
                    Delete
                  </button>
                </div>

                <div className="grid gap-y-5">
                  {keypadRows.map((row, rowIndex) => (
                    <div
                      key={rowIndex}
                      className="grid grid-cols-3 justify-items-center gap-4"
                    >
                      {row.map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => appendToTarget(item.key)}
                          className="flex h-[82px] w-[82px] flex-col items-center justify-center rounded-full bg-white text-[#111111] shadow-sm transition active:scale-95"
                        >
                          <span className="text-[30px] font-medium leading-none">
                            {item.key}
                          </span>
                          <span className="mt-1 text-[10px] font-medium tracking-[0.22em] text-[#8e8e93]">
                            {item.sub}
                          </span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>

                <div className="mt-2 grid grid-cols-2 gap-4 pb-2">
                  <button
                    type="button"
                    onClick={handleCallNow}
                    className={`flex h-16 items-center justify-center rounded-[24px] px-4 text-base font-semibold text-white shadow-sm transition active:scale-[0.98] ${
                      isAiReady ? "bg-[#34c759]" : "bg-[#a7dcb7]"
                    }`}
                  >
                    📞 Call Now AI
                  </button>

                  <button
                    type="button"
                    onClick={handleMessageNow}
                    className={`flex h-16 items-center justify-center rounded-[24px] px-4 text-base font-semibold text-white shadow-sm transition active:scale-[0.98] ${
                      isAiReady ? "bg-[#0a84ff]" : "bg-[#9dc5ff]"
                    }`}
                  >
                    ✉️ Message AI
                  </button>
                </div>

                <div className="rounded-[28px] bg-white px-4 py-4 shadow-sm">
                  <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8e8e93]">
                    Available Questions
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-2xl bg-[#f7f7fa] px-3 py-3 text-sm font-medium text-[#111111]">
                      Service Info
                    </div>
                    <div className="rounded-2xl bg-[#f7f7fa] px-3 py-3 text-sm font-medium text-[#111111]">
                      Pricing
                    </div>
                    <div className="rounded-2xl bg-[#f7f7fa] px-3 py-3 text-sm font-medium text-[#111111]">
                      Free Trial
                    </div>
                    <div className="rounded-2xl bg-[#f7f7fa] px-3 py-3 text-sm font-medium text-[#111111]">
                      Support
                    </div>
                  </div>

                  <div className="mt-4 text-sm leading-6 text-[#8e8e93]">
                    Ask only about Taurus AI services. Unrelated questions will be
                    rejected by the assistant.
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-[28px] bg-white/80 px-4 py-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-[#111111]">
                    Taurus AI Direct
                  </div>
                  <div className="text-xs text-[#8e8e93]">
                    Production-style AI dial experience
                  </div>
                </div>

                <div
                  className={`rounded-full px-3 py-2 text-xs font-semibold ${
                    isAiReady ? "bg-[#34c759] text-white" : "bg-[#f2f2f7] text-[#111111]"
                  }`}
                >
                  {isAiReady ? "Ready" : "Idle"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showCallScreen && (
        <div className="fixed inset-0 z-[60] bg-[radial-gradient(circle_at_top,rgba(65,79,255,0.32),transparent_28%),linear-gradient(180deg,#0b1228_0%,#111827_100%)] px-6 py-8 text-white">
          <div className="mx-auto flex min-h-full max-w-[460px] flex-col">
            <div className="flex justify-center pt-2">
              <div className="h-7 w-32 rounded-full bg-black/80" />
            </div>

            <div className="mt-12 text-center">
              <div className="text-sm text-white/60">
                {callStage === "calling" && "Calling..."}
                {callStage === "connected" && "Connected"}
              </div>

              <div className="mt-3 text-[34px] font-bold tracking-[-0.03em]">
                Taurus AI
              </div>

              <div className="mt-2 text-base text-white/75">{AI_NUMBER}</div>

              <div className="mt-4 text-sm text-[#9cc3ff]">
                {callStage === "connected" ? formattedDuration : "Please wait..."}
              </div>

              <div className="mt-6 text-base font-medium leading-7 text-white/90">
                {callText}
              </div>
            </div>

            <div className="mt-14 flex justify-center">
              <div className="relative flex h-36 w-36 items-center justify-center rounded-full bg-white/10 text-5xl shadow-[0_0_50px_rgba(255,255,255,0.08)]">
                <div className="absolute inset-0 rounded-full border border-white/20" />
                <div className="absolute inset-3 rounded-full border border-white/10" />
                AI
              </div>
            </div>

            <div className="mt-auto pb-8">
              <div className="grid grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={handleMicTap}
                  className="flex h-20 flex-col items-center justify-center rounded-full bg-white/10 backdrop-blur active:scale-95"
                >
                  <span className="text-2xl">🎙️</span>
                  <span className="mt-1 text-xs">Mic</span>
                </button>

                <button
                  type="button"
                  onClick={handleAudioTap}
                  className="flex h-20 flex-col items-center justify-center rounded-full bg-white/10 backdrop-blur active:scale-95"
                >
                  <span className="text-2xl">🔊</span>
                  <span className="mt-1 text-xs">Audio</span>
                </button>

                <button
                  type="button"
                  onClick={handleAiLineTap}
                  className="flex h-20 flex-col items-center justify-center rounded-full bg-white/10 backdrop-blur active:scale-95"
                >
                  <span className="text-2xl">✨</span>
                  <span className="mt-1 text-xs">AI Line</span>
                </button>
              </div>

              <div className="mt-6 flex justify-center">
                <button
                  onClick={endCall}
                  className="flex h-20 w-20 items-center justify-center rounded-full bg-[#ff3b30] text-3xl text-white shadow-[0_12px_30px_rgba(255,59,48,0.35)]"
                >
                  📞
                </button>
              </div>

              <div className="mt-8 flex justify-center">
                <div className="rounded-full border border-[#284a8f] bg-[#0b1632]/70 px-8 py-3 text-xl font-semibold tracking-tight text-white shadow-[0_0_25px_rgba(34,85,170,0.18)]">
                  taurusai.site
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}