"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type CallState = "idle" | "ringing" | "connecting" | "connected" | "ended";
type VoiceState = "silent" | "listening" | "thinking" | "speaking";

const AI_NUMBER_PREFIX = "+70 20 ";
const RING_DURATION_SECONDS = 20;
const REQUIRED_LOCAL_NUMBER = "7777777";
const RELAY_WS_URL = process.env.NEXT_PUBLIC_RELAY_WS_URL!;

function getRelayHttpUrl(wsUrl: string) {
  if (wsUrl.startsWith("wss://")) {
    return wsUrl.replace("wss://", "https://").replace(/\/ws\/stt$/, "");
  }
  if (wsUrl.startsWith("ws://")) {
    return wsUrl.replace("ws://", "http://").replace(/\/ws\/stt$/, "");
  }
  return wsUrl.replace(/\/ws\/stt$/, "");
}

const RELAY_HTTP_URL = getRelayHttpUrl(RELAY_WS_URL);

export default function AICallPage() {
  const [phoneNumber, setPhoneNumber] = useState(REQUIRED_LOCAL_NUMBER);
  const [callState, setCallState] = useState<CallState>("idle");
  const [voiceState, setVoiceState] = useState<VoiceState>("silent");
  const [ringCountdown, setRingCountdown] = useState(RING_DURATION_SECONDS);
  const [statusText, setStatusText] = useState("Enter 7777777 to start.");
  const [heardText, setHeardText] = useState("");
  const [replyText, setReplyText] = useState("");
  const [errorText, setErrorText] = useState("");
  const [currentRingtone, setCurrentRingtone] = useState("");
  const [speakerEnabled, setSpeakerEnabled] = useState(true);

  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const ringTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const aiSpeakingRef = useRef(false);
  const callActiveRef = useRef(false);
  const selectedRingtoneRef = useRef<string>("");
  const replyAudioUrlRef = useRef<string | null>(null);

  const ringtones = useMemo(() => ["/ringtone-1.mp3", "/ringtone-2.mp3"], []);

  useEffect(() => {
    return () => {
      cleanupAll();
    };
  }, []);

  function cleanupAll() {
    stopRingtone();
    stopRelay();
    stopMic();

    if (ringTimerRef.current) {
      clearInterval(ringTimerRef.current);
      ringTimerRef.current = null;
    }

    if (remoteAudioRef.current) {
      remoteAudioRef.current.pause();
      remoteAudioRef.current.src = "";
    }

    if (replyAudioUrlRef.current) {
      URL.revokeObjectURL(replyAudioUrlRef.current);
      replyAudioUrlRef.current = null;
    }
  }

  function formatPhoneNumber(value: string) {
    return value.replace(/\D/g, "").slice(0, 7);
  }

  function pickRingtone() {
    const tone = ringtones[Math.floor(Math.random() * ringtones.length)];
    selectedRingtoneRef.current = tone;
    setCurrentRingtone(tone.split("/").pop() || "");
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
    } catch {}

    try {
      sourceRef.current?.disconnect();
    } catch {}

    processorRef.current = null;
    sourceRef.current = null;

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  }

  function stopRelay() {
    if (!wsRef.current) return;

    try {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "stop" }));
      }
    } catch {}

    try {
      wsRef.current.close();
    } catch {}

    wsRef.current = null;
  }

  function playRingtone() {
    const audio = ringtoneRef.current;
    if (!audio) return;

    const tone = selectedRingtoneRef.current || pickRingtone();

    audio.pause();
    audio.currentTime = 0;
    audio.src = tone;
    audio.loop = true;
    audio.volume = speakerEnabled ? 1 : 0.8;

    audio.play().catch(() => {
      setErrorText("Ringtone could not play.");
    });
  }

  function stopRingtone() {
    const audio = ringtoneRef.current;
    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;
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

  function startRelay(languageCode = "en-US") {
    return new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(RELAY_WS_URL);
      wsRef.current = ws;

      const fail = (message: string) => {
        reject(new Error(message));
      };

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
            await askAI(transcript);
          }
          return;
        }

        if (msg.type === "error") {
          const message = msg.message || "Relay error";
          setErrorText(message);
          stopRelay();
          stopMic();
          fail(message);
          return;
        }
      };

      ws.onerror = () => {
        fail("WebSocket relay failed.");
      };

      ws.onclose = () => {
        if (callActiveRef.current && callState !== "ended") {
          setStatusText("Relay disconnected.");
        }
      };
    });
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
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
      if (aiSpeakingRef.current) return;

      const input = event.inputBuffer.getChannelData(0);
      const pcm16 = float32To16BitPCM(input);
      const base64 = arrayBufferToBase64(pcm16.buffer);

      try {
        wsRef.current.send(
          JSON.stringify({
            type: "audio",
            audio: base64,
          })
        );
      } catch {}
    };
  }

  async function askAI(prompt: string) {
    try {
      const res = await fetch("/api/ai-call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "AI request failed.");
      }

      const text =
        typeof data?.text === "string" && data.text.trim()
          ? data.text.trim()
          : "I am here and listening.";

      setReplyText(text);
      await speakReply(text);
    } catch (error) {
      console.error(error);
      setErrorText(
        error instanceof Error ? error.message : "AI request failed."
      );
      setVoiceState("listening");
      setStatusText("Listening...");
    }
  }

  async function speakReply(text: string) {
    try {
      aiSpeakingRef.current = true;
      setVoiceState("speaking");
      setStatusText("Taurus AI is speaking...");

      const res = await fetch(`${RELAY_HTTP_URL}/tts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      const contentType = res.headers.get("content-type") || "";

      if (!res.ok || !contentType.includes("audio/mpeg")) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "TTS failed.");
      }

      const blob = await res.blob();

      if (replyAudioUrlRef.current) {
        URL.revokeObjectURL(replyAudioUrlRef.current);
      }

      const url = URL.createObjectURL(blob);
      replyAudioUrlRef.current = url;

      if (!remoteAudioRef.current) {
        remoteAudioRef.current = new Audio();
      }

      const audio = remoteAudioRef.current;
      audio.pause();
      audio.src = url;
      audio.preload = "auto";
      audio.volume = speakerEnabled ? 1 : 0;

      await audio.play();

      await new Promise<void>((resolve) => {
        audio.onended = () => resolve();
        audio.onerror = () => resolve();
      });
    } catch (error) {
      console.error(error);
      setErrorText(
        error instanceof Error ? error.message : "Speech playback failed."
      );
    } finally {
      aiSpeakingRef.current = false;

      if (callActiveRef.current) {
        setVoiceState("listening");
        setStatusText("Listening...");
      }
    }
  }

  async function connectCall() {
    try {
      stopRingtone();
      setCallState("connecting");
      setStatusText("Requesting microphone...");

      const micStream = await requestMic();

      setStatusText("Connecting relay...");
      await startRelay("en-US");
      await startMicStreaming(micStream);

      setCallState("connected");
      setVoiceState("listening");
      setStatusText("Listening...");

      setReplyText("Hello, I am Taurus AI. How can I help you today?");
      void speakReply("Hello, I am Taurus AI. How can I help you today?");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Call connection failed.";

      console.error(error);
      setErrorText(message);
      endCall();
    }
  }

  async function startCall() {
    if (phoneNumber !== REQUIRED_LOCAL_NUMBER) {
      setErrorText("Only 7777777 is allowed.");
      return;
    }

    setErrorText("");
    setHeardText("");
    setReplyText("");
    setRingCountdown(RING_DURATION_SECONDS);
    setCallState("ringing");
    setVoiceState("silent");
    setStatusText(`Calling ${AI_NUMBER_PREFIX}${phoneNumber}...`);
    callActiveRef.current = true;

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

  const isIdle = callState === "idle" || callState === "ended";

  const liveLabel =
    voiceState === "speaking"
      ? "SPEAKING"
      : voiceState === "listening"
      ? "LISTENING"
      : voiceState === "thinking"
      ? "THINKING"
      : callState === "ringing"
      ? "RINGING"
      : callState === "connecting"
      ? "JOINING"
      : "READY";

  return (
    <main className="min-h-screen bg-black text-white">
      <audio ref={ringtoneRef} preload="auto" />

      <div className="mx-auto w-full max-w-[390px] px-2.5 pt-2.5 pb-[max(16px,env(safe-area-inset-bottom))]">
        <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-black shadow-[0_0_50px_rgba(0,180,255,0.08)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,123,255,0.12),transparent_48%)]" />

          <div className="relative z-10 px-4 py-4">
            <div className="mx-auto mb-3 h-1.5 w-20 rounded-full bg-white/15" />

            <div className="mb-3 flex items-center justify-between text-[13px] text-white/60">
              <div className="truncate">{currentRingtone || "ringtone-random"}</div>
              <div>{isIdle ? "Ready" : "Connected"}</div>
            </div>

            <p className="mb-3 text-center text-[11px] tracking-[0.32em] text-white/40">
              TAURUS AI SUPPORT
            </p>

            <div className="mb-4 flex justify-center">
              <div className="relative flex h-28 w-28 items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-cyan-400/10" />
                <div className="absolute inset-2 rounded-full border border-cyan-400/10" />
                <div className="absolute inset-4 rounded-full border border-cyan-400/10" />
                <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,rgba(0,123,255,0.20),transparent_58%)]" />
                <div className="relative flex h-20 w-20 flex-col items-center justify-center rounded-full border border-white/10 bg-white/[0.08] backdrop-blur">
                  <div className="text-[34px] font-semibold leading-none">LIVE</div>
                  <div className="mt-1.5 text-[10px] tracking-[0.28em] text-white/45">
                    {liveLabel}
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-1 text-center text-[30px] font-semibold leading-none">
              {AI_NUMBER_PREFIX}
              {phoneNumber || "•••••••"}
            </div>

            <div className="mb-4 text-center text-sm text-white/60">
              {statusText}
            </div>

            <p className="mb-2 text-[11px] tracking-[0.32em] text-white/35">
              DIAL TAURUS NUMBER
            </p>

            <input
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
              inputMode="numeric"
              placeholder="7777777"
              className="mb-3 w-full rounded-[20px] border border-white/10 bg-black px-4 py-3.5 text-center text-[34px] tracking-[0.15em] text-white outline-none"
            />

            <div className="mb-3 grid grid-cols-3 gap-2.5">
              <InfoCard title="Mode" value="Voice Call" />
              <InfoCard
                title="Mic"
                value={
                  voiceState === "listening"
                    ? "Listening"
                    : voiceState === "thinking"
                    ? "Thinking"
                    : voiceState === "speaking"
                    ? "Standby"
                    : "Standby"
                }
              />
              <InfoCard
                title="Call"
                value={
                  callState === "connected"
                    ? "Live"
                    : callState === "connecting"
                    ? "Join"
                    : callState === "ringing"
                    ? "Ringing"
                    : "Ready"
                }
              />
            </div>

            <div className="mb-3 rounded-[20px] border border-white/10 bg-black/80 p-3.5">
              <p className="text-[11px] tracking-[0.3em] text-white/35">YOU SAID</p>
              <div className="mt-2.5 h-[64px] overflow-y-auto">
                <p className="text-[16px] leading-7 text-white/90">
                  {heardText || "Waiting for your voice..."}
                </p>
              </div>
            </div>

            <div className="mb-3 rounded-[20px] border border-white/10 bg-black/80 p-3.5">
              <p className="text-[11px] tracking-[0.3em] text-white/35">
                TAURUS AI REPLY
              </p>
              <div className="mt-2.5 h-[64px] overflow-y-auto">
                <p className="text-[16px] leading-7 text-white/90">
                  {replyText || "AI reply will appear here..."}
                </p>
              </div>
            </div>

            {errorText ? (
              <div className="mb-3 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
                {errorText}
              </div>
            ) : null}

            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setPhoneNumber(REQUIRED_LOCAL_NUMBER);
                  setErrorText("");
                  setReplyText("");
                  setHeardText("");
                  setCallState("idle");
                  setVoiceState("silent");
                  setStatusText("Enter 7777777 to start.");
                  cleanupAll();
                }}
                className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xl text-white/80"
              >
                ↺
              </button>

              <button
                type="button"
                onClick={() => void (isIdle ? startCall() : endCall())}
                className={`flex h-[72px] w-[72px] items-center justify-center rounded-full text-[34px] text-white ${
                  isIdle
                    ? "bg-emerald-500 shadow-[0_0_38px_rgba(16,185,129,0.35)]"
                    : "bg-[#ff2d55] shadow-[0_0_38px_rgba(255,45,85,0.35)]"
                }`}
              >
                {isIdle ? "☎" : "×"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setSpeakerEnabled((prev) => {
                    const next = !prev;

                    if (ringtoneRef.current) {
                      ringtoneRef.current.volume = next ? 1 : 0;
                    }

                    if (remoteAudioRef.current) {
                      remoteAudioRef.current.volume = next ? 1 : 0;
                    }

                    return next;
                  });
                }}
                className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xl text-white/80"
              >
                {speakerEnabled ? "🔊" : "🔇"}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-full border border-white/10 px-3 py-2.5 text-center text-xs text-white/50">
                Ring: {ringCountdown}s
              </div>
              <div className="rounded-full border border-white/10 px-3 py-2.5 text-center text-xs text-white/50">
                2 Ringtones
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-white/[0.03] px-2.5 py-3.5 text-center">
      <div className="text-[13px] text-white/40">{title}</div>
      <div className="mt-2 text-[17px] text-white">{value}</div>
    </div>
  );
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