"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type CallState = "idle" | "ringing" | "connecting" | "connected" | "ended";
type VoiceState = "silent" | "listening" | "thinking" | "speaking";

const RING_DURATION_SECONDS = 20;
const REQUIRED_LOCAL_NUMBER = "7777777";
const AI_NUMBER_PREFIX = "+70 20 ";
const RELAY_WS_URL = process.env.NEXT_PUBLIC_RELAY_WS_URL!;

export default function AICallPage() {
  const [phoneNumber, setPhoneNumber] = useState("");
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

  const ringtones = useMemo(
    () => ["/ringtone-1.mp3", "/ringtone-2.mp3"],
    []
  );

  console.log("RELAY =", RELAY_WS_URL);

  useEffect(() => {
    return () => {
      stopRingtone();
      stopRelay();
      stopMic();
      if (ringTimerRef.current) clearInterval(ringTimerRef.current);
      if (remoteAudioRef.current) {
        remoteAudioRef.current.pause();
        remoteAudioRef.current.src = "";
      }
    };
  }, []);

  function formatPhoneNumber(value: string) {
    return value.replace(/\D/g, "").slice(0, 7);
  }

  function getRandomRingtone() {
    return ringtones[Math.floor(Math.random() * ringtones.length)];
  }

  async function unlockAudio() {
    const audio = new Audio(getRandomRingtone());
    audio.volume = 0.001;
    try {
      await audio.play();
      audio.pause();
      audio.currentTime = 0;
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
      sourceRef.current?.disconnect();
    } catch {}

    processorRef.current = null;
    sourceRef.current = null;

    audioContextRef.current?.close().catch(() => {});
    audioContextRef.current = null;
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
          setErrorText(msg.message || "Relay error");
          fail(msg.message || "Relay error");
        }
      };

      ws.onerror = () => {
        fail("WebSocket relay failed");
      };

      ws.onclose = () => {
        if (callActiveRef.current) {
          setStatusText("Relay disconnected.");
        }
      };
    });
  }

  function stopRelay() {
    if (!wsRef.current) return;

    try {
      wsRef.current.send(JSON.stringify({ type: "stop" }));
    } catch {}

    try {
      wsRef.current.close();
    } catch {}

    wsRef.current = null;
  }

  async function startMicStreaming() {
    const stream = await requestMic();

    const AudioCtx =
      window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioCtx) {
      throw new Error("AudioContext is not supported on this device");
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

      wsRef.current.send(
        JSON.stringify({
          type: "audio",
          audio: base64,
        })
      );
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

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "AI request failed");
      }

      const text = data?.text || "I am here and listening.";
      setReplyText(text);
      await speakReply(text);
    } catch (error) {
      console.error(error);
      setErrorText(error instanceof Error ? error.message : "AI request failed.");
    }
  }

  async function speakReply(text: string) {
    try {
      aiSpeakingRef.current = true;
      setVoiceState("speaking");
      setStatusText("Taurus AI is speaking...");

      const res = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "TTS failed");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      if (!remoteAudioRef.current) {
        remoteAudioRef.current = new Audio();
      }

      const audio = remoteAudioRef.current;
      audio.src = url;
      audio.preload = "auto";
      audio.volume = speakerEnabled ? 1 : 0;

      await audio.play();

      await new Promise<void>((resolve) => {
        audio.onended = () => {
          URL.revokeObjectURL(url);
          resolve();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          resolve();
        };
      });
    } finally {
      aiSpeakingRef.current = false;
      if (callActiveRef.current) {
        setVoiceState("listening");
        setStatusText("Listening...");
      }
    }
  }

  function playRingtone() {
    if (!ringtoneRef.current) return;

    const randomTone = getRandomRingtone();
    ringtoneRef.current.src = randomTone;
    ringtoneRef.current.loop = true;
    ringtoneRef.current.volume = 1;
    setCurrentRingtone(randomTone.split("/").pop() || "");

    ringtoneRef.current.play().catch(() => {
      setErrorText("Ringtone could not play.");
    });
  }

  function stopRingtone() {
    if (!ringtoneRef.current) return;
    ringtoneRef.current.pause();
    ringtoneRef.current.currentTime = 0;
  }

  function beginRingCountdown() {
    if (ringTimerRef.current) clearInterval(ringTimerRef.current);

    ringTimerRef.current = setInterval(() => {
      setRingCountdown((prev) => {
        if (prev <= 1) {
          if (ringTimerRef.current) clearInterval(ringTimerRef.current);
          void connectCall();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function connectCall() {
    try {
      stopRingtone();
      setCallState("connecting");
      setStatusText("Connecting relay...");
      await startRelay("en-US");
      await startMicStreaming();
      setCallState("connected");
      await speakReply("Hello, I am Taurus AI. How can I help you today?");
    } catch (error) {
      console.error(error);
      setErrorText(error instanceof Error ? error.message : "Call connection failed.");
      endCall();
    }
  }

  async function startCall() {
    if (phoneNumber !== REQUIRED_LOCAL_NUMBER) {
      setErrorText("Only 7777777 is allowed.");
      return;
    }

    await unlockAudio();

    setErrorText("");
    setReplyText("");
    setHeardText("");
    setRingCountdown(RING_DURATION_SECONDS);
    setCallState("ringing");
    setVoiceState("silent");
    setStatusText(`Calling ${AI_NUMBER_PREFIX}${phoneNumber}...`);
    callActiveRef.current = true;

    playRingtone();
    beginRingCountdown();
  }

  function endCall() {
    callActiveRef.current = false;
    setCallState("ended");
    setVoiceState("silent");
    setStatusText("Call ended.");
    stopRingtone();
    stopRelay();
    stopMic();
    if (ringTimerRef.current) clearInterval(ringTimerRef.current);
  }

  const liveLabel =
    voiceState === "speaking"
      ? "SPEAKING"
      : voiceState === "listening"
      ? "LISTENING"
      : voiceState === "thinking"
      ? "THINKING"
      : callState === "ringing"
      ? "RINGING"
      : "IDLE";

  return (
    <main className="min-h-screen bg-black text-white">
      <audio ref={ringtoneRef} preload="auto" />

      <div className="mx-auto flex min-h-screen max-w-md items-center justify-center px-4 py-6">
        <div className="relative w-full overflow-hidden rounded-[42px] border border-white/10 bg-black shadow-[0_0_80px_rgba(0,180,255,0.08)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,123,255,0.15),transparent_45%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.04),transparent_20%,transparent_80%,rgba(255,255,255,0.03))]" />

          <div className="relative z-10 px-6 py-7">
            <div className="mx-auto mb-6 h-1.5 w-24 rounded-full bg-white/15" />

            <div className="mb-8 flex items-center justify-between text-sm text-white/60">
              <div>{currentRingtone || "ringtone-random"}</div>
              <div>{callState === "connected" || callState === "connecting" ? "Connected" : "Standby"}</div>
            </div>

            <p className="mb-6 text-center text-[13px] tracking-[0.45em] text-white/45">
              TAURUS AI SUPPORT
            </p>

            <div className="mb-10 flex justify-center">
              <div className="relative flex h-56 w-56 items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-cyan-400/10" />
                <div className="absolute inset-4 rounded-full border border-cyan-400/10" />
                <div className="absolute inset-8 rounded-full border border-cyan-400/10" />
                <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,rgba(0,123,255,0.22),transparent_55%)]" />
                <div className="relative flex h-36 w-36 flex-col items-center justify-center rounded-full border border-white/10 bg-white/[0.08] backdrop-blur">
                  <div className="text-5xl font-semibold leading-none">LIVE</div>
                  <div className="mt-3 text-sm tracking-[0.35em] text-white/45">
                    {liveLabel}
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-2 text-center text-4xl font-semibold">
              {AI_NUMBER_PREFIX}
              {phoneNumber || "•••••••"}
            </div>

            <div className="mb-8 text-center text-white/60">{statusText}</div>

            <p className="mb-3 text-[13px] tracking-[0.4em] text-white/35">
              DIAL TAURUS NUMBER
            </p>

            <input
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
              inputMode="numeric"
              placeholder="7777777"
              className="mb-6 w-full rounded-[24px] border border-white/10 bg-black px-5 py-5 text-center text-4xl tracking-[0.25em] text-white outline-none"
            />

            <div className="mb-6 grid grid-cols-3 gap-4">
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

            <div className="mb-4 rounded-[24px] border border-white/10 bg-black/80 p-5">
              <p className="text-[13px] tracking-[0.35em] text-white/35">YOU SAID</p>
              <p className="mt-3 min-h-[34px] text-[18px] text-white/90">
                {heardText || "Waiting for your voice..."}
              </p>
            </div>

            <div className="mb-8 rounded-[24px] border border-white/10 bg-black/80 p-5">
              <p className="text-[13px] tracking-[0.35em] text-white/35">TAURUS AI REPLY</p>
              <p className="mt-3 min-h-[34px] text-[18px] text-white/90">
                {replyText || "AI reply will appear here..."}
              </p>
            </div>

            {errorText ? (
              <div className="mb-5 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
                {errorText}
              </div>
            ) : null}

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setPhoneNumber("");
                  setErrorText("");
                  setReplyText("");
                  setHeardText("");
                  setCallState("idle");
                  setVoiceState("silent");
                  setStatusText("Enter 7777777 to start.");
                }}
                className="flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/5 text-3xl text-white/80"
              >
                ↺
              </button>

              <button
                type="button"
                onClick={() => void (callState === "idle" || callState === "ended" ? startCall() : endCall())}
                className="flex h-28 w-28 items-center justify-center rounded-full bg-[#ff2d55] text-5xl text-white shadow-[0_0_55px_rgba(255,45,85,0.35)]"
              >
                {callState === "idle" || callState === "ended" ? "☎" : "×"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setSpeakerEnabled((prev) => !prev);
                  if (remoteAudioRef.current) {
                    remoteAudioRef.current.volume = !speakerEnabled ? 1 : 0;
                  }
                }}
                className="flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/5 text-3xl text-white/80"
              >
                {speakerEnabled ? "🔊" : "🔇"}
              </button>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-3 text-center text-sm text-white/50">
              <div className="rounded-full border border-white/10 px-4 py-3">
                Ring: {ringCountdown}s
              </div>
              <div className="rounded-full border border-white/10 px-4 py-3">
                2 Ringtones
              </div>
              <div className="rounded-full border border-white/10 px-4 py-3">
                Phone UI
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
    <div className="rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-5 text-center">
      <div className="text-sm text-white/40">{title}</div>
      <div className="mt-2 text-xl text-white">{value}</div>
    </div>
  );
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