"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type CallState = "idle" | "dialing" | "connecting" | "connected" | "ended";
type VoiceState = "silent" | "listening" | "thinking" | "speaking";

const REQUIRED_LOCAL_NUMBER = "70207777777";
const DISPLAY_SUPPORT_NUMBER = "+7020 7777777";
const AI_NUMBER_PREFIX = "+";
const RING_DURATION_SECONDS = 20;
const CALL_LOGS_KEY = "taurus-call-logs-v1";

type CallLog = {
  id: string;
  number: string;
  createdAt: number;
};

type LiveWsMessage =
  | {
      serverContent?: {
        modelTurn?: {
          parts?: Array<{
            inlineData?: {
              mimeType?: string;
              data?: string;
            };
            text?: string;
          }>;
        };
      };
    }
  | {
      setupComplete?: boolean;
    }
  | {
      toolCall?: unknown;
    }
  | {
      error?: {
        message?: string;
      };
    };

export default function AICallPage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [callState, setCallState] = useState<CallState>("idle");
  const [voiceState, setVoiceState] = useState<VoiceState>("silent");
  const [ringCountdown, setRingCountdown] = useState(RING_DURATION_SECONDS);
  const [statusText, setStatusText] = useState("Tap the phone icon to call Taurus AI.");
  const [heardText, setHeardText] = useState("");
  const [replyText, setReplyText] = useState("");
  const [errorText, setErrorText] = useState("");
  const [isDialPadOpen, setIsDialPadOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [speakerEnabled, setSpeakerEnabled] = useState(true);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);

  const ringTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const selectedRingtoneRef = useRef<string>("");
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);

  const sttWsRef = useRef<WebSocket | null>(null);
  const liveWsRef = useRef<WebSocket | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  const playbackContextRef = useRef<AudioContext | null>(null);
  const aiSpeakingRef = useRef(false);
  const callActiveRef = useRef(false);

  const ringtones = useMemo(
    () => ["/ringtone-1.mp3", "/ringtone-2.mp3"],
    []
  );

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CALL_LOGS_KEY);
      if (raw) {
        setCallLogs(JSON.parse(raw));
      }
    } catch {}
  }, []);

  useEffect(() => {
    return () => {
      cleanupAll();
    };
  }, []);

  function persistCallLogs(nextLogs: CallLog[]) {
    setCallLogs(nextLogs);
    try {
      localStorage.setItem(CALL_LOGS_KEY, JSON.stringify(nextLogs));
    } catch {}
  }

  function addCallLog(number: string) {
    const clean = formatPhoneNumber(number);
    if (!clean) return;

    const log: CallLog = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      number: `${AI_NUMBER_PREFIX}${clean}`,
      createdAt: Date.now(),
    };

    const next = [log, ...callLogs].slice(0, 12);
    persistCallLogs(next);
  }

  function cleanupAll() {
    stopRingtone();

    if (ringTimerRef.current) {
      clearInterval(ringTimerRef.current);
      ringTimerRef.current = null;
    }

    stopSttRelay();
    stopLiveSocket();
    stopMic();

    if (playbackContextRef.current) {
      playbackContextRef.current.close().catch(() => {});
      playbackContextRef.current = null;
    }
  }

  function formatPhoneNumber(value: string) {
    return value.replace(/\D/g, "").slice(0, 11);
  }

  function formatDisplayNumber(value: string) {
    const digits = formatPhoneNumber(value);

    if (!digits) return "";
    if (digits.length <= 4) return `+${digits}`;
    if (digits.length <= 8) return `+${digits.slice(0, 4)} ${digits.slice(4)}`;
    return `+${digits.slice(0, 4)} ${digits.slice(4)}`;
  }

  function pickRingtone() {
    const tone = ringtones[Math.floor(Math.random() * ringtones.length)];
    selectedRingtoneRef.current = tone;
    return tone;
  }

  async function unlockAudio() {
    const silentWav =
      "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";

    try {
      const audio = new Audio(silentWav);
      audio.volume = 0;
      await audio.play();
      audio.pause();
    } catch {}

    try {
      const ctx = new (window.AudioContext ||
        (window as typeof window & {
          webkitAudioContext?: typeof AudioContext;
        }).webkitAudioContext)();

      playbackContextRef.current = ctx;

      if (ctx.state === "suspended") {
        await ctx.resume();
      }
    } catch {}
  }

  function playRingtone() {
    const tone = selectedRingtoneRef.current || pickRingtone();

    if (!ringtoneRef.current) {
      ringtoneRef.current = new Audio();
    }

    ringtoneRef.current.pause();
    ringtoneRef.current.currentTime = 0;
    ringtoneRef.current.src = tone;
    ringtoneRef.current.loop = true;
    ringtoneRef.current.volume = speakerEnabled ? 1 : 0;

    ringtoneRef.current.play().catch(() => {
      setErrorText("Ringtone could not play.");
    });
  }

  function stopRingtone() {
    if (!ringtoneRef.current) return;
    ringtoneRef.current.pause();
    ringtoneRef.current.currentTime = 0;
  }

  async function requestMic() {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    });

    streamRef.current = stream;
    return stream;
  }

  function stopMic() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    try {
      processorRef.current?.disconnect();
      sourceRef.current?.disconnect();
    } catch {}

    processorRef.current = null;
    sourceRef.current = null;

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  }

  function stopSttRelay() {
    if (!sttWsRef.current) return;

    try {
      if (sttWsRef.current.readyState === WebSocket.OPEN) {
        sttWsRef.current.send(JSON.stringify({ type: "stop" }));
      }
    } catch {}

    try {
      sttWsRef.current.close();
    } catch {}

    sttWsRef.current = null;
  }

  function stopLiveSocket() {
    if (!liveWsRef.current) return;

    try {
      liveWsRef.current.close();
    } catch {}

    liveWsRef.current = null;
  }

  function beginRingCountdown() {
    if (ringTimerRef.current) {
      clearInterval(ringTimerRef.current);
    }

    ringTimerRef.current = setInterval(() => {
      setRingCountdown((prev) => {
        if (prev <= 1) {
          if (ringTimerRef.current) {
            clearInterval(ringTimerRef.current);
            ringTimerRef.current = null;
          }
          void connectCall();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function startSttRelay(languageCode = "en-US") {
    return new Promise<void>((resolve, reject) => {
      const relayWsUrl = process.env.NEXT_PUBLIC_RELAY_WS_URL!;
      const ws = new WebSocket(relayWsUrl);
      sttWsRef.current = ws;

      const fail = (message: string) => reject(new Error(message));

      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            type: "start",
            languageCode,
            sampleRateHertz: 16000,
          })
        );
      };

      ws.onmessage = async (event) => {
        const msg = JSON.parse(event.data);

        if (msg.type === "started") {
          setVoiceState("listening");
          setStatusText("Listening...");
          resolve();
          return;
        }

        if (msg.type === "transcript") {
          const transcript = msg.transcript || "";
          setHeardText(transcript);

          if (msg.isFinal && transcript && !aiSpeakingRef.current) {
            setVoiceState("thinking");
            setStatusText(`You: ${transcript}`);
            await sendTextToLive(transcript);
          }
          return;
        }

        if (msg.type === "error") {
          const message = msg.message || "Speech-to-Text relay error";
          setErrorText(message);
          fail(message);
        }
      };

      ws.onerror = () => {
        fail("WebSocket relay failed.");
      };
    });
  }

  async function createLiveSocket() {
    const tokenRes = await fetch("/api/live-token", {
      method: "POST",
    });

    const tokenJson = await tokenRes.json().catch(() => null);

    if (!tokenRes.ok) {
      throw new Error(tokenJson?.error || "Failed to get Live API token.");
    }

    const ephemeralToken =
      tokenJson?.ephemeralToken ||
      tokenJson?.token ||
      tokenJson?.accessToken ||
      tokenJson?.access_token;

    if (!ephemeralToken) {
      throw new Error("Ephemeral token missing.");
    }

    const liveUrl =
      "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained" +
      `?access_token=${encodeURIComponent(ephemeralToken)}`;

    return await new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(liveUrl);
      liveWsRef.current = ws;

      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            setup: {
              model: "models/gemini-3.1-flash-live-preview",
              generationConfig: {
                responseModalities: ["AUDIO"],
              },
              systemInstruction: {
                parts: [
                  {
                    text:
                      "You are Taurus AI, a premium live call assistant. " +
                      "Reply naturally and briefly. " +
                      "Always answer in the same language the user uses. " +
                      "If the user speaks Burmese, reply naturally in Burmese. " +
                      "If the user speaks English, reply in English.",
                  },
                ],
              },
            },
          })
        );
      };

      ws.onmessage = async (event) => {
        const msg = JSON.parse(event.data) as LiveWsMessage;

        if ("setupComplete" in msg && msg.setupComplete) {
          resolve();
          return;
        }

        if ("error" in msg && msg.error?.message) {
  reject(new Error(msg.error.message));
  return;
}

       const parts =
  "serverContent" in msg
    ? msg.serverContent?.modelTurn?.parts || []
    : [];

        for (const part of parts) {
          if (typeof part.text === "string" && part.text.trim()) {
            setReplyText(part.text.trim());
          }

          if (
            part.inlineData?.mimeType?.startsWith("audio/pcm") &&
            part.inlineData.data
          ) {
            await playLivePcmAudio(part.inlineData.data);
          }
        }
      };

      ws.onerror = () => {
        reject(new Error("Gemini Live connection failed."));
      };

      ws.onclose = () => {
        if (callActiveRef.current) {
          setStatusText("Live AI disconnected.");
        }
      };
    });
  }

  async function playLivePcmAudio(base64Pcm: string) {
    try {
      aiSpeakingRef.current = true;
      setVoiceState("speaking");
      setStatusText("Taurus AI is speaking...");

      if (!playbackContextRef.current) {
        playbackContextRef.current = new (window.AudioContext ||
          (window as typeof window & {
            webkitAudioContext?: typeof AudioContext;
          }).webkitAudioContext)({
          sampleRate: 24000,
        });
      }

      const ctx = playbackContextRef.current;

      if (ctx.state === "suspended") {
        await ctx.resume();
      }

      const pcmBytes = base64ToUint8Array(base64Pcm);
      const int16 = new Int16Array(
        pcmBytes.buffer,
        pcmBytes.byteOffset,
        pcmBytes.byteLength / 2
      );

      const audioBuffer = ctx.createBuffer(1, int16.length, 24000);
      const channel = audioBuffer.getChannelData(0);

      for (let i = 0; i < int16.length; i++) {
        channel[i] = int16[i] / 32768;
      }

      const source = ctx.createBufferSource();
      const gain = ctx.createGain();
      gain.gain.value = speakerEnabled ? 1 : 0;

      source.buffer = audioBuffer;
      source.connect(gain);
      gain.connect(ctx.destination);

      await new Promise<void>((resolve) => {
        source.onended = () => resolve();
        source.start();
      });
    } finally {
      aiSpeakingRef.current = false;
      if (callActiveRef.current) {
        setVoiceState("listening");
        setStatusText("Listening...");
      }
    }
  }

  async function sendTextToLive(text: string) {
    if (!liveWsRef.current || liveWsRef.current.readyState !== WebSocket.OPEN) {
      throw new Error("Gemini Live socket is not ready.");
    }

    liveWsRef.current.send(
      JSON.stringify({
        clientContent: {
          turns: [
            {
              role: "user",
              parts: [{ text }],
            },
          ],
          turnComplete: true,
        },
      })
    );
  }

  async function startMicStreaming(stream: MediaStream) {
    const AudioCtx =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;

    if (!AudioCtx) {
      throw new Error("AudioContext is not supported on this device.");
    }

    const audioContext = new AudioCtx({ sampleRate: 16000 });
    audioContextRef.current = audioContext;

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    const source = audioContext.createMediaStreamSource(stream);
    sourceRef.current = source;

    const processor = audioContext.createScriptProcessor(4096, 1, 1);
    processorRef.current = processor;

    const silentGain = audioContext.createGain();
    silentGain.gain.value = 0;

    source.connect(processor);
    processor.connect(silentGain);
    silentGain.connect(audioContext.destination);

    processor.onaudioprocess = (event) => {
      if (!sttWsRef.current || sttWsRef.current.readyState !== WebSocket.OPEN) {
        return;
      }

      if (aiSpeakingRef.current || isMuted) return;

      const input = event.inputBuffer.getChannelData(0);
      const pcm16 = float32To16BitPCM(input);
      const base64 = arrayBufferToBase64(pcm16.buffer);

      try {
        sttWsRef.current.send(
          JSON.stringify({
            type: "audio",
            audio: base64,
          })
        );
      } catch {}
    };
  }

  async function connectCall() {
    try {
      stopRingtone();
      setCallState("connecting");
      setStatusText("Requesting microphone...");

      const micStream = await requestMic();

      setStatusText("Connecting live AI...");
      await createLiveSocket();

      setStatusText("Connecting speech recognition...");
      await startSttRelay("en-US");
      await startMicStreaming(micStream);

      setCallState("connected");
      setVoiceState("listening");
      setStatusText("Listening...");
      setReplyText("Hello, I am Taurus AI. How can I help you today?");
      await sendTextToLive("Please greet the caller briefly and warmly.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Call connection failed.";
      setErrorText(message);
      endCall();
    }
  }

  async function startCall() {
    const cleanedNumber = formatPhoneNumber(phoneNumber);

    if (cleanedNumber !== REQUIRED_LOCAL_NUMBER) {
      setErrorText(`Only ${DISPLAY_SUPPORT_NUMBER} is allowed.`);
      return;
    }

    setErrorText("");
    setHeardText("");
    setReplyText("");
    setRingCountdown(RING_DURATION_SECONDS);
    setCallState("dialing");
    setVoiceState("silent");
    setStatusText(`Calling ${DISPLAY_SUPPORT_NUMBER}...`);
    callActiveRef.current = true;

    addCallLog(cleanedNumber);

    pickRingtone();
    await unlockAudio();
    playRingtone();
    beginRingCountdown();
  }

  function endCall() {
    callActiveRef.current = false;
    setCallState("ended");
    setVoiceState("silent");
    setStatusText("Call ended.");

    if (ringTimerRef.current) {
      clearInterval(ringTimerRef.current);
      ringTimerRef.current = null;
    }

    cleanupAll();
  }

  const liveLabel =
    voiceState === "speaking"
      ? "SPEAKING"
      : voiceState === "listening"
      ? "LISTENING"
      : voiceState === "thinking"
      ? "THINKING"
      : callState === "dialing"
      ? "DIALING"
      : callState === "connecting"
      ? "JOINING"
      : "READY";

  return (
    <main
      className="min-h-screen text-white"
      style={{
        backgroundColor: "#0f172a",
        backgroundImage:
          "linear-gradient(rgba(15,23,42,0.68), rgba(15,23,42,0.82)), url('/taurus-workspace.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <audio ref={ringtoneRef} preload="auto" />

      <div className="mx-auto flex min-h-screen max-w-4xl flex-col">
        <div className="flex-1 overflow-y-auto px-3 pb-28 pt-4">
          <div className="mx-auto max-w-2xl space-y-3">
            <div className="sticky top-0 z-10 rounded-2xl border border-white/10 bg-[#111827]/90 px-4 py-3 backdrop-blur">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-white/60">Taurus AI</div>
                  <div className="text-lg font-semibold">{statusText}</div>
                </div>
                <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs tracking-[0.2em] text-cyan-200">
                  {liveLabel}
                </div>
              </div>
            </div>

            <ChatBubble
              side="left"
              title="Taurus AI"
              text={replyText || "Start a call to begin the conversation."}
            />

            <ChatBubble
              side="right"
              title="You"
              text={heardText || "Your speech will appear here."}
            />

            {callLogs.length > 0 ? (
              <div className="rounded-2xl border border-white/10 bg-[#0b1220]/80 p-4 backdrop-blur">
                <div className="mb-3 text-sm font-semibold text-white/70">
                  Recent Calls
                </div>
                <div className="space-y-2">
                  {callLogs.map((log) => (
                    <button
                      key={log.id}
                      type="button"
                      onClick={() => setPhoneNumber(log.number)}
                      className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-left"
                    >
                      <div>
                        <div className="text-sm text-white">{formatDisplayNumber(log.number)}</div>
                        <div className="text-xs text-white/50">
                          {new Date(log.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <span className="text-xs text-cyan-300">Call again</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {errorText ? (
              <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
                {errorText}
              </div>
            ) : null}
          </div>
        </div>

        <div className="sticky bottom-0 border-t border-white/10 bg-[#111827]/95 px-3 pb-[max(14px,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
          <div className="mx-auto max-w-2xl">
            {isDialPadOpen ? (
              <div className="mb-3 rounded-[28px] border border-white/10 bg-[#0b1220] p-4 shadow-2xl">
                <div className="mb-3 text-center text-sm text-white/50">
                  Enter number to call
                </div>

                <div className="mb-4 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-center text-3xl font-semibold tracking-[0.12em]">
                  {formatDisplayNumber(phoneNumber) || " "}
                </div>

                <input
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                  inputMode="numeric"
                  placeholder="+7020 7777777"
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-center text-2xl tracking-[0.12em] text-white outline-none"
                />

                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[
                    ["1", ""],
                    ["2", "ABC"],
                    ["3", "DEF"],
                    ["4", "GHI"],
                    ["5", "JKL"],
                    ["6", "MNO"],
                    ["7", "PQRS"],
                    ["8", "TUV"],
                    ["9", "WXYZ"],
                    ["*", ""],
                    ["0", "+"],
                    ["#", ""],
                  ].map(([digit, letters]) => (
                    <button
                      key={digit}
                      type="button"
                      onClick={() =>
                        setPhoneNumber((prev) =>
                          formatPhoneNumber(
                            digit === "0" && letters === "+" && prev.length === 0
                              ? `+${prev}`
                              : `${prev}${digit}`
                          )
                        )
                      }
                      className="flex h-20 flex-col items-center justify-center rounded-full border border-white/10 bg-[#151c28] text-white shadow-inner"
                    >
                      <span className="text-3xl leading-none">{digit}</span>
                      {letters ? (
                        <span className="mt-1 text-[10px] tracking-[0.2em] text-white/45">
                          {letters}
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>

                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setPhoneNumber((prev) => prev.slice(0, -1))}
                    className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-medium"
                  >
                    Delete
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsDialPadOpen(false)}
                    className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-medium"
                  >
                    Close
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsDialPadOpen(false);
                      void startCall();
                    }}
                    className="flex-1 rounded-2xl bg-emerald-500 px-4 py-3 font-medium text-black"
                  >
                    Call
                  </button>
                </div>
              </div>
            ) : null}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsDialPadOpen((prev) => !prev)}
                className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5 text-2xl"
              >
                ☎
              </button>

              <button
                type="button"
                onClick={() => setIsMuted((prev) => !prev)}
                className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5 text-2xl"
              >
                {isMuted ? "🎙️" : "🎤"}
              </button>

              <button
                type="button"
                onClick={() =>
                  setSpeakerEnabled((prev) => {
                    const next = !prev;
                    if (ringtoneRef.current) ringtoneRef.current.volume = next ? 1 : 0;
                    return next;
                  })
                }
                className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5 text-2xl"
              >
                {speakerEnabled ? "🔊" : "🔇"}
              </button>

              <div className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                {formatDisplayNumber(phoneNumber) || DISPLAY_SUPPORT_NUMBER}
              </div>

              <button
                type="button"
                onClick={endCall}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-[#ff2d55] text-3xl text-white"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function ChatBubble({
  side,
  title,
  text,
}: {
  side: "left" | "right";
  title: string;
  text: string;
}) {
  const isLeft = side === "left";

  return (
    <div className={`flex ${isLeft ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[85%] rounded-3xl px-4 py-3 ${
          isLeft
            ? "rounded-bl-md bg-[#1f2937]"
            : "rounded-br-md bg-[#2563eb]"
        }`}
      >
        <div className="mb-1 text-xs text-white/60">{title}</div>
        <div className="whitespace-pre-wrap text-[15px] leading-6">{text}</div>
      </div>
    </div>
  );
}

function base64ToUint8Array(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

function float32To16BitPCM(float32Array: Float32Array) {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);

  let offset = 0;
  for (let i = 0; i < float32Array.length; i++, offset += 2) {
    const sample = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
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