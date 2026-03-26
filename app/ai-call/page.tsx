"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type CallState = "idle" | "ringing" | "connected" | "ended";
type VoiceState = "silent" | "listening" | "speaking" | "thinking";

const RING_DURATION_SECONDS = 20;
const AI_NUMBER_PREFIX = "+70 20 ";
const REQUIRED_LOCAL_NUMBER = "7777777";
const RELAY_WS_URL =
  process.env.NEXT_PUBLIC_RELAY_WS_URL || "ws://localhost:8081/ws/stt";

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

  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
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

  useEffect(() => {
    return () => {
      stopRingtone();
      stopRelay();
      stopMic();
      if (ringTimerRef.current) clearInterval(ringTimerRef.current);
    };
  }, []);

  function formatPhoneNumber(value: string) {
    return value.replace(/\D/g, "").slice(0, 7);
  }

  function getRandomRingtone() {
    return ringtones[Math.floor(Math.random() * ringtones.length)];
  }

  async function requestMic() {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
      },
      video: false,
    });

    streamRef.current = stream;
    return stream;
  }

  function stopMic() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();

    processorRef.current = null;
    sourceRef.current = null;

    audioContextRef.current?.close().catch(() => {});
    audioContextRef.current = null;
  }

  function startRelay(languageCode = "en-US") {
    return new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(RELAY_WS_URL);
      wsRef.current = ws;

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
          setHeardText(msg.transcript || "");

          if (msg.isFinal && msg.transcript && !aiSpeakingRef.current) {
            setVoiceState("thinking");
            setStatusText(`You: ${msg.transcript}`);
            await askAI(msg.transcript);
          }
          return;
        }

        if (msg.type === "error") {
          setErrorText(msg.message || "Relay error");
        }
      };

      ws.onerror = () => {
        reject(new Error("WebSocket relay failed"));
      };

      ws.onclose = () => {
        if (callActiveRef.current) {
          setStatusText("Relay disconnected.");
        }
      };
    });
  }

  function stopRelay() {
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {}
      wsRef.current = null;
    }
  }

  async function startMicStreaming() {
    const stream = await requestMic();

    const AudioCtx =
      window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioCtx({ sampleRate: 16000 });
    audioContextRef.current = audioContext;

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
      const text = data?.text || "I am here and listening.";

      setReplyText(text);
      await speakReply(text);
    } catch (error) {
      console.error(error);
      setErrorText("AI request failed.");
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
      const audio = new Audio(url);

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
          connectCall();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function connectCall() {
    try {
      stopRingtone();
      setCallState("connected");
      setStatusText("Connecting relay...");
      await startRelay("en-US");
      await startMicStreaming();
      await speakReply("Hello, I am Taurus AI. How can I help you today?");
    } catch (error) {
      console.error(error);
      setErrorText("Call connection failed.");
      endCall();
    }
  }

  async function startCall() {
    if (phoneNumber !== REQUIRED_LOCAL_NUMBER) {
      setErrorText("Only 7777777 is allowed.");
      return;
    }

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

  return (
    <main className="min-h-screen bg-black px-4 py-10 text-white">
      <audio ref={ringtoneRef} preload="auto" />

      <div className="mx-auto max-w-xl space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">
            Taurus AI
          </p>
          <h1 className="mt-2 text-3xl font-semibold">AI Call</h1>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 space-y-4">
          <p className="text-center text-2xl font-semibold">
            {AI_NUMBER_PREFIX}
            {phoneNumber || "•••••••"}
          </p>

          <input
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
            inputMode="numeric"
            placeholder="7777777"
            className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-center text-white outline-none"
          />

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={startCall}
              className="rounded-xl bg-emerald-500 px-4 py-3 font-medium text-black"
            >
              Start Call
            </button>

            <button
              onClick={endCall}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white"
            >
              End Call
            </button>
          </div>

          <div className="text-sm text-white/60">
            State: {callState} | Voice: {voiceState}
          </div>
          <div className="text-sm text-white/60">Ring: {ringCountdown}s</div>
          <div className="text-sm text-white/60">Ringtone: {currentRingtone || "-"}</div>
          <div className="text-sm text-white/60">Status: {statusText}</div>

          {errorText ? <div className="text-sm text-rose-300">{errorText}</div> : null}

          <div className="rounded-xl border border-white/10 bg-black p-4">
            <p className="text-sm text-white/50">You said</p>
            <p className="mt-2 whitespace-pre-wrap text-white/90">
              {heardText || "Waiting..."}
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-black p-4">
            <p className="text-sm text-white/50">Taurus AI reply</p>
            <p className="mt-2 whitespace-pre-wrap text-white/90">
              {replyText || "No reply yet."}
            </p>
          </div>
        </div>
      </div>
    </main>
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