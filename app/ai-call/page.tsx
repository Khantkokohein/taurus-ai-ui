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

const AI_NUMBER_PREFIX = "+70 20 ";
const REQUIRED_LOCAL_NUMBER = "7777777";

const LIVE_MODEL = "models/gemini-2.0-flash-exp";

export default function AICallPage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [callState, setCallState] = useState<CallState>("idle");
  const [voiceState, setVoiceState] = useState<VoiceState>("silent");
  const [ringCountdown, setRingCountdown] = useState(RING_DURATION_SECONDS);
  const [sessionSecondsLeft, setSessionSecondsLeft] = useState(
    FREE_CALL_DURATION_SECONDS
  );
  const [statusText, setStatusText] = useState(
    "Enter 7777777 to start your Taurus AI call."
  );
  const [micReady, setMicReady] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [currentRingtonePath, setCurrentRingtonePath] = useState("");

  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  const ringTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isMountedRef = useRef(true);

  const wsRef = useRef<WebSocket | null>(null);
  const liveTokenRef = useRef<string | null>(null);

  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  const outputQueueRef = useRef<Float32Array[]>([]);
  const outputDrainRunningRef = useRef(false);
  const micStreamingStartedRef = useRef(false);
  const initialGreetingSentRef = useRef(false);

  const ringtones = useMemo(
    () => ["/ringtone-1.mp3", "/ringtone-2.mp3"],
    []
  );

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      stopAllAudio();
      stopTimers();
      stopMediaStream();
      closeLiveSession();
    };
  }, []);

  const formattedRingCountdown = formatClock(ringCountdown);
  const formattedSessionCountdown = formatClock(sessionSecondsLeft);

  const fullAICallNumber = phoneNumber
    ? `${AI_NUMBER_PREFIX}${phoneNumber}`
    : `${AI_NUMBER_PREFIX}•••••••`;

  function formatPhoneNumber(value: string) {
    return value.replace(/\D/g, "").slice(0, 7);
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

    outputQueueRef.current = [];
    outputDrainRunningRef.current = false;
  }

  function closeLiveSession() {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current.onaudioprocess = null;
      processorRef.current = null;
    }

    if (mediaSourceRef.current) {
      mediaSourceRef.current.disconnect();
      mediaSourceRef.current = null;
    }

    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close().catch(() => {});
      inputAudioContextRef.current = null;
    }

    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close().catch(() => {});
      outputAudioContextRef.current = null;
    }

    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {}
      wsRef.current = null;
    }

    micStreamingStartedRef.current = false;
    initialGreetingSentRef.current = false;
    outputQueueRef.current = [];
    outputDrainRunningRef.current = false;
    setVoiceState("silent");
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
      setErrorText(
        "Microphone permission is required for Taurus AI voice support."
      );
      setMicReady(false);
      return false;
    }
  }

  async function getLiveToken() {
    const response = await fetch("/api/live-token", {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("Failed to get live token");
    }

    const data = await response.json();

    if (!data?.token) {
      throw new Error("Live token missing");
    }

    liveTokenRef.current = data.token;
    return data.token as string;
  }

  function sendInitialGreetingPrompt() {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    if (initialGreetingSentRef.current) return;

    initialGreetingSentRef.current = true;

    wsRef.current.send(
      JSON.stringify({
        clientContent: {
          turns: [
            {
              role: "user",
              parts: [
                {
                  text:
                    "Answer the phone now. Say: Hello, I am Taurus AI. How can I help you today? Then wait for the caller to speak.",
                },
              ],
            },
          ],
          turnComplete: true,
        },
      })
    );
  }

  async function connectLiveSession() {
    const token = liveTokenRef.current || (await getLiveToken());

    const wsUrl =
      "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained" +
      `?access_token=${encodeURIComponent(token)}`;

    return await new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatusText("Live session connected.");

        ws.send(
          JSON.stringify({
            setup: {
              model: LIVE_MODEL,
              generationConfig: {
                responseModalities: ["AUDIO"],
                temperature: 0.7,
              },
              systemInstruction: {
                parts: [
                  {
                    text:
                      "You are Taurus AI phone support. Speak naturally, briefly, and clearly like a premium AI phone assistant. Do not be overly verbose.",
                  },
                ],
              },
            },
          })
        );

        sendInitialGreetingPrompt();
        resolve();
      };

      ws.onmessage = async (event) => {
        try {
          const message = JSON.parse(event.data);

          const serverContent =
            message.serverContent || message.server_content;
          const modelTurn = serverContent?.modelTurn || serverContent?.model_turn;
          const inputTranscription =
            serverContent?.inputTranscription ||
            serverContent?.input_transcription;
          const outputTranscription =
            serverContent?.outputTranscription ||
            serverContent?.output_transcription;

          if (inputTranscription?.text) {
            setStatusText(`Heard: ${inputTranscription.text}`);
          }

          if (outputTranscription?.text) {
            setStatusText(`Taurus AI: ${outputTranscription.text}`);
          }

          const parts = modelTurn?.parts || [];
          let receivedAudio = false;

          for (const part of parts) {
            const inlineData = part.inlineData || part.inline_data;
            if (inlineData?.data) {
              receivedAudio = true;
              playPcm24kBase64(inlineData.data);
            }
          }

          const generationComplete =
            serverContent?.generationComplete ||
            serverContent?.generation_complete;

          if (generationComplete) {
            if (!micStreamingStartedRef.current) {
              startMicrophoneStreaming();
              micStreamingStartedRef.current = true;
            }

            if (!receivedAudio) {
              setVoiceState("listening");
              setStatusText("Listening...");
            }
          }
        } catch (error) {
          console.error("LIVE MESSAGE PARSE ERROR:", error);
        }
      };

      ws.onerror = (event) => {
        console.error("LIVE WS ERROR:", event);
        setErrorText("Live connection error.");
        reject(new Error("WebSocket connection failed"));
      };

      ws.onclose = () => {
        setVoiceState("silent");
        setStatusText("Live session closed.");
      };
    });
  }

  function startMicrophoneStreaming() {
    if (!streamRef.current || !wsRef.current) return;
    if (processorRef.current) return;

    const AudioCtx =
      window.AudioContext || (window as any).webkitAudioContext;

    const inputAudioContext = new AudioCtx({ sampleRate: 16000 });
    inputAudioContextRef.current = inputAudioContext;

    const source = inputAudioContext.createMediaStreamSource(streamRef.current);
    mediaSourceRef.current = source;

    const processor = inputAudioContext.createScriptProcessor(4096, 1, 1);
    processorRef.current = processor;

    source.connect(processor);
    processor.connect(inputAudioContext.destination);

    setVoiceState("listening");
    setStatusText("Listening...");

    processor.onaudioprocess = (event) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

      const input = event.inputBuffer.getChannelData(0);
      const pcm16 = float32To16BitPCM(input);
      const base64 = arrayBufferToBase64(pcm16.buffer);

      wsRef.current.send(
        JSON.stringify({
          realtimeInput: {
            audio: {
              data: base64,
              mimeType: "audio/pcm;rate=16000",
            },
          },
        })
      );
    };
  }

  function playPcm24kBase64(base64: string) {
    const AudioCtx =
      window.AudioContext || (window as any).webkitAudioContext;

    const outputAudioContext =
      outputAudioContextRef.current ||
      new AudioCtx({ sampleRate: 24000 });

    outputAudioContextRef.current = outputAudioContext;

    const bytes = base64ToUint8Array(base64);
    const int16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(int16.length);

    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768;
    }

outputQueueRef.current.push(Float32Array.from(float32));
    if (!outputDrainRunningRef.current) {
      drainOutputQueue();
    }
  }

  function drainOutputQueue() {
    const outputAudioContext = outputAudioContextRef.current;
    if (!outputAudioContext) {
      outputDrainRunningRef.current = false;
      return;
    }

    const next = outputQueueRef.current.shift();
    if (!next) {
      outputDrainRunningRef.current = false;
      setVoiceState("listening");
      setStatusText("Listening...");
      return;
    }

    outputDrainRunningRef.current = true;
    setVoiceState("speaking");
    setStatusText("Taurus AI is speaking...");
const buffer = outputAudioContext.createBuffer(1, next.length, 24000);
buffer.copyToChannel(Float32Array.from(next), 0);

const source = outputAudioContext.createBufferSource();
source.buffer = buffer;
source.connect(outputAudioContext.destination);
    source.onended = () => {
      drainOutputQueue();
    };
  }

  async function startCall() {
    if (!phoneNumber.trim()) {
      setErrorText("Enter number 7777777 first.");
      return;
    }

    if (phoneNumber !== REQUIRED_LOCAL_NUMBER) {
      setErrorText("Only 7777777 is allowed for this Taurus AI demo.");
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
    setStatusText(`Dialing ${AI_NUMBER_PREFIX}${phoneNumber}...`);

    requestAnimationFrame(() => {
      setCallState("ringing");
      setStatusText(`Calling ${AI_NUMBER_PREFIX}${phoneNumber}...`);
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

    setTimeout(async () => {
      if (!isMountedRef.current) return;

      try {
        setCallState("connected");
        setStatusText("Connected. Starting live voice...");
        await connectLiveSession();
        beginSessionTimer();
      } catch (error) {
        console.error(error);
        setErrorText("Failed to start live session.");
        endCall("Live session failed.");
      }
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

  function endCall(customMessage?: string) {
    stopTimers();
    stopAllAudio();
    closeLiveSession();
    stopMediaStream();
    setCallState("ended");
    setVoiceState("silent");
    setMicReady(false);
    setStatusText(customMessage || "Call ended.");
  }

  function resetCall() {
    stopTimers();
    stopAllAudio();
    closeLiveSession();
    stopMediaStream();
    setCallState("idle");
    setVoiceState("silent");
    setRingCountdown(RING_DURATION_SECONDS);
    setSessionSecondsLeft(FREE_CALL_DURATION_SECONDS);
    setStatusText("Enter 7777777 to start your Taurus AI call.");
    setErrorText("");
    setMicReady(false);
    setCurrentRingtonePath("");
    setPhoneNumber("");
    liveTokenRef.current = null;
  }

  const canStart = callState === "idle" || callState === "ended";

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.07),transparent_25%),radial-gradient(circle_at_50%_50%,rgba(0,229,255,0.08),transparent_20%),radial-gradient(circle_at_50%_60%,rgba(175,82,222,0.10),transparent_22%)]" />
      <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] [background-size:72px_72px]" />

      <audio ref={ringtoneRef} preload="auto" />

      <header className="relative z-20 flex items-center justify-between px-6 py-5 md:px-10">
        <div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-white/50">
            Taurus AI
          </p>
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
                <span>
                  {currentRingtonePath
                    ? currentRingtonePath.split("/").pop()
                    : "No ringtone yet"}
                </span>
                <span>{micReady ? "Mic ready" : "Mic off"}</span>
              </div>

              <div className="mb-6 text-center">
                <p className="text-xs uppercase tracking-[0.35em] text-white/40">
                  Taurus AI Support
                </p>
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
                  {fullAICallNumber}
                </p>
                <p className="mt-2 text-sm text-white/55">{statusText}</p>
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
                  {voiceState === "listening"
                    ? "🎙️"
                    : voiceState === "speaking"
                    ? "🔊"
                    : "•"}
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 text-center text-[11px] text-white/45">
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
                Ring: 20s
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
                No Camera
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
                Black Theme
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

function float32To16BitPCM(float32Array: Float32Array) {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);

  let offset = 0;
  for (let i = 0; i < float32Array.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Uint8Array(buffer);
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);

  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary);
}

function base64ToUint8Array(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}