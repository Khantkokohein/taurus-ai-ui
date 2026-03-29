"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type ChatRole = "user" | "assistant";
type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
};

type CallState = "idle" | "connecting" | "connected" | "ended";

type LiveIncomingMessage = {
  setupComplete?: boolean | Record<string, never>;
  error?: { message?: string };
  serverContent?: {
    modelTurn?: {
      parts?: Array<{
        text?: string;
        inlineData?: {
          mimeType?: string;
          data?: string;
        };
      }>;
    };
    turnComplete?: boolean;
  };
};

const RELAY_WS_URL = process.env.NEXT_PUBLIC_RELAY_WS_URL!;
const DEMO_COOKIE = "taurus_demo_session";

const AI_LOCAL_NUMBER = "+70 20 7777777";
const RINGTONE_TRACKS = ["/ringtone-1.mp3", "/ringtone-2.mp3"];
const RINGTONE_EACH_MS = 20_000;
const BG_IMAGE_URL = "/ai-call-bg.jpg";

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function base64ToUint8Array(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
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

export default function AICallPage() {
  const router = useRouter();

  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: uid(), role: "assistant", text: "Taurus ready." },
  ]);
  const [input, setInput] = useState("");
  const [callState, setCallState] = useState<CallState>("idle");
  const [dialOpen, setDialOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [statusText, setStatusText] = useState("Workspace ready");
  const [errorText, setErrorText] = useState("");

  const liveWsRef = useRef<WebSocket | null>(null);
  const sttWsRef = useRef<WebSocket | null>(null);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const inputProcessorRef = useRef<ScriptProcessorNode | null>(null);

  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextPlayTimeRef = useRef(0);

  const activeAssistantMessageIdRef = useRef<string | null>(null);
  const isLiveReadyRef = useRef(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const ringtoneAudioRef = useRef<HTMLAudioElement | null>(null);
  const ringtoneTimeoutRef = useRef<number | null>(null);

  const callConnected = useMemo(() => callState === "connected", [callState]);

  useEffect(() => {
    scrollerRef.current?.scrollTo({
      top: scrollerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  useEffect(() => {
    return () => {
      cleanupAll();
    };
  }, []);

  function cleanupAll() {
    stopCall();
    closeLiveSocket();

    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close().catch(() => {});
      outputAudioContextRef.current = null;
    }
  }

  function addMessage(role: ChatRole, text: string) {
    const id = uid();
    setMessages((prev) => [...prev, { id, role, text }]);
    return id;
  }

  function updateMessage(id: string, nextText: string) {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, text: nextText } : msg))
    );
  }

  async function ensureOutputContext() {
    if (!outputAudioContextRef.current) {
      const AudioCtx =
        window.AudioContext ||
        (window as typeof window & {
          webkitAudioContext?: typeof AudioContext;
        }).webkitAudioContext;

      if (!AudioCtx) {
        throw new Error("Audio output is not supported.");
      }

      outputAudioContextRef.current = new AudioCtx({ sampleRate: 24000 });
      nextPlayTimeRef.current = outputAudioContextRef.current.currentTime;
    }

    if (outputAudioContextRef.current.state === "suspended") {
      await outputAudioContextRef.current.resume();
    }

    return outputAudioContextRef.current;
  }

  async function ensureLiveSocket() {
    if (
      liveWsRef.current &&
      liveWsRef.current.readyState === WebSocket.OPEN &&
      isLiveReadyRef.current
    ) {
      return;
    }

    setStatusText("Connecting Taurus...");
    setErrorText("");

    const tokenRes = await fetch("/api/live-token", { method: "POST" });
    const tokenJson = await tokenRes.json().catch(() => null);

    if (!tokenRes.ok) {
      throw new Error(tokenJson?.error || "Failed to create live token.");
    }

    const token = tokenJson?.token;
    if (!token || typeof token !== "string") {
      throw new Error("Missing Gemini Live token.");
    }

    await ensureOutputContext();

    await new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(
        `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?access_token=${encodeURIComponent(
          token
        )}`
      );

      liveWsRef.current = ws;
      isLiveReadyRef.current = false;

      let setupResolved = false;

      ws.onopen = () => {
        const setupPayload = {
          setup: {
            model: "models/gemini-3.1-flash-live-preview",
            generationConfig: {
              responseModalities: ["audio"],
            },
          },
        };

        console.log("LIVE SETUP SENT:", setupPayload);
        ws.send(JSON.stringify(setupPayload));
      };

      ws.onmessage = async (event) => {
        try {
          console.log("LIVE RAW MESSAGE:", event.data);

          const msg = JSON.parse(event.data) as LiveIncomingMessage;

          if (msg.setupComplete !== undefined) {
            isLiveReadyRef.current = true;
            setupResolved = true;
            setStatusText(callConnected ? "Call live" : "Chat ready");
            resolve();
            return;
          }

          if (msg.error?.message) {
            if (!setupResolved) {
              reject(new Error(msg.error.message));
            }
            setErrorText(msg.error.message);
            return;
          }

          const parts = msg.serverContent?.modelTurn?.parts || [];

          for (const part of parts) {
            if (part.text?.trim()) {
              if (!activeAssistantMessageIdRef.current) {
                activeAssistantMessageIdRef.current = addMessage("assistant", "");
              }

              const currentId = activeAssistantMessageIdRef.current;
              setMessages((prev) =>
                prev.map((msgItem) =>
                  msgItem.id === currentId
                    ? { ...msgItem, text: `${msgItem.text}${part.text}` }
                    : msgItem
                )
              );
            }

            if (
              speakerOn &&
              part.inlineData?.mimeType?.startsWith("audio/pcm") &&
              part.inlineData.data
            ) {
              await schedulePcmPlayback(part.inlineData.data);
            }
          }

          if (msg.serverContent?.turnComplete) {
            activeAssistantMessageIdRef.current = null;
          }
        } catch (error) {
          console.error("LIVE SOCKET MESSAGE ERROR:", error);
        }
      };

      ws.onerror = () => {
        if (!setupResolved) {
          reject(new Error("Gemini Live socket failed."));
        }
      };

      ws.onclose = (event) => {
        console.warn("LIVE SOCKET CLOSED", {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        });

        liveWsRef.current = null;
        isLiveReadyRef.current = false;

        if (!setupResolved) {
          reject(
            new Error(
              `Live setup failed. Socket closed (${event.code}${
                event.reason ? `: ${event.reason}` : ""
              })`
            )
          );
          return;
        }

        setStatusText("Disconnected");
        setErrorText("Connection lost. Please retry.");
      };
    });
  }

  async function schedulePcmPlayback(base64Pcm: string) {
    const ctx = await ensureOutputContext();

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
    gain.gain.value = speakerOn ? 1 : 0;

    source.buffer = audioBuffer;
    source.connect(gain);
    gain.connect(ctx.destination);

    const startAt = Math.max(ctx.currentTime, nextPlayTimeRef.current);
    source.start(startAt);
    nextPlayTimeRef.current = startAt + audioBuffer.duration;
  }

  async function sendTextToLive(text: string) {
    await ensureLiveSocket();

    if (!liveWsRef.current || liveWsRef.current.readyState !== WebSocket.OPEN) {
      throw new Error("Gemini Live is not connected.");
    }

    const assistantId = addMessage("assistant", "");
    activeAssistantMessageIdRef.current = assistantId;

    const payload = {
      clientContent: {
        turns: [
          {
            role: "user",
            parts: [{ text }],
          },
        ],
        turnComplete: true,
      },
    };

    console.log("SEND CLIENT CONTENT:", payload);
    liveWsRef.current.send(JSON.stringify(payload));
  }

  async function handleSendMessage() {
    const text = input.trim();
    if (!text) return;

    setInput("");
    setErrorText("");
    addMessage("user", text);

    try {
      await sendTextToLive(text);
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : "Send failed.");
    }
  }

  function stopRingtone() {
    if (ringtoneTimeoutRef.current) {
      window.clearTimeout(ringtoneTimeoutRef.current);
      ringtoneTimeoutRef.current = null;
    }

    if (ringtoneAudioRef.current) {
      ringtoneAudioRef.current.pause();
      ringtoneAudioRef.current.currentTime = 0;
      ringtoneAudioRef.current = null;
    }
  }

  async function playSingleRingtone(src: string, durationMs: number) {
    return new Promise<void>((resolve) => {
      stopRingtone();

      const audio = new Audio(src);
      audio.loop = true;
      ringtoneAudioRef.current = audio;

      const done = () => {
        if (ringtoneTimeoutRef.current) {
          window.clearTimeout(ringtoneTimeoutRef.current);
          ringtoneTimeoutRef.current = null;
        }

        audio.pause();
        audio.currentTime = 0;

        if (ringtoneAudioRef.current === audio) {
          ringtoneAudioRef.current = null;
        }

        resolve();
      };

      ringtoneTimeoutRef.current = window.setTimeout(done, durationMs);

      audio.play().catch(() => {
        done();
      });
    });
  }

  async function startCall() {
    setDialOpen(false);
    setErrorText("");
    setCallState("connecting");
    setStatusText(`Dialing ${AI_LOCAL_NUMBER}...`);

    try {
      await ensureLiveSocket();

      addMessage("assistant", `Calling ${AI_LOCAL_NUMBER}...`);

      const selectedRingtone =
        RINGTONE_TRACKS[Math.floor(Math.random() * RINGTONE_TRACKS.length)];

      addMessage(
        "assistant",
        `Playing ringtone: ${selectedRingtone.split("/").pop()}...`
      );
      await playSingleRingtone(selectedRingtone, RINGTONE_EACH_MS);

      await startSttRelay();
      await startMic();

      setCallState("connected");
      setStatusText(`Connected to ${AI_LOCAL_NUMBER}`);
      addMessage("assistant", `${AI_LOCAL_NUMBER} answered.`);

      await sendTextToLive(
        "မင်္ဂလာပါ၊ ကျွန်တော် Taurus AI ပါ။ ဘာကူညီပေးရမလဲ? မြန်မာလိုသာ ပြောပါ။"
      );
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : "Call start failed.");
      stopRingtone();
      stopCall();
    }
  }

  async function startSttRelay() {
    if (sttWsRef.current && sttWsRef.current.readyState === WebSocket.OPEN) {
      return;
    }

    await new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(RELAY_WS_URL);
      sttWsRef.current = ws;

      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            type: "start",
            languageCode: "en-US",
            sampleRateHertz: 16000,
          })
        );
      };

      ws.onmessage = async (event) => {
        const msg = JSON.parse(event.data);

        if (msg.type === "started") {
          resolve();
          return;
        }

        if (msg.type === "transcript") {
          const transcript = (msg.transcript || "").trim();

          if (msg.isFinal && transcript) {
            addMessage("user", transcript);

            try {
              await sendTextToLive(transcript);
            } catch (error) {
              setErrorText(error instanceof Error ? error.message : "Live send failed.");
            }
          }
          return;
        }

        if (msg.type === "error") {
          reject(new Error(msg.message || "STT relay error"));
        }
      };

      ws.onerror = () => reject(new Error("STT socket failed."));
      ws.onclose = () => {
        setStatusText((prev) => (prev === "Call ended" ? prev : "Disconnected"));
      };
    });
  }

  async function startMic() {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    });

    mediaStreamRef.current = stream;

    const AudioCtx =
      window.AudioContext ||
      (window as typeof window & {
        webkitAudioContext?: typeof AudioContext;
      }).webkitAudioContext;

    if (!AudioCtx) {
      throw new Error("Microphone audio context is not supported.");
    }

    const ctx = new AudioCtx({ sampleRate: 16000 });
    inputAudioContextRef.current = ctx;

    if (ctx.state === "suspended") {
      await ctx.resume();
    }

    const source = ctx.createMediaStreamSource(stream);
    inputSourceRef.current = source;

    const processor = ctx.createScriptProcessor(4096, 1, 1);
    inputProcessorRef.current = processor;

    const silentGain = ctx.createGain();
    silentGain.gain.value = 0;

    source.connect(processor);
    processor.connect(silentGain);
    silentGain.connect(ctx.destination);

    processor.onaudioprocess = (event) => {
      if (isMuted) return;
      if (!sttWsRef.current || sttWsRef.current.readyState !== WebSocket.OPEN) return;

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

  function stopCall() {
    stopRingtone();

    setCallState("ended");
    setStatusText("Call ended");

    if (sttWsRef.current) {
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

    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;

    try {
      inputProcessorRef.current?.disconnect();
      inputSourceRef.current?.disconnect();
    } catch {}

    inputProcessorRef.current = null;
    inputSourceRef.current = null;

    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close().catch(() => {});
      inputAudioContextRef.current = null;
    }
  }

  function closeLiveSocket() {
    if (liveWsRef.current) {
      try {
        liveWsRef.current.close();
      } catch {}
      liveWsRef.current = null;
    }

    isLiveReadyRef.current = false;
    activeAssistantMessageIdRef.current = null;
  }

  function handleLogout() {
    document.cookie = `${DEMO_COOKIE}=; path=/; max-age=0; samesite=lax`;
    cleanupAll();
    router.push("/login-gate");
  }

  const sidebarItems = [
    "Dashboard",
    "Analytics",
    "Projects",
    "Team",
    "Reports",
    "Messages",
    "Settings",
  ];

  return (
    <main
      className="min-h-screen bg-[#05070b] text-white"
      style={{
        backgroundImage: `linear-gradient(rgba(5,7,11,0.66), rgba(5,7,11,0.72)), url('${BG_IMAGE_URL}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="mx-auto flex min-h-screen max-w-[1600px] items-center justify-center px-4 py-6">
        <div className="relative flex min-h-[92vh] w-full overflow-hidden rounded-[40px] border border-cyan-200/20 bg-white/[0.06] shadow-[0_0_90px_rgba(96,232,255,0.08)] backdrop-blur-2xl">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(118,237,255,0.12),transparent_30%),radial-gradient(circle_at_bottom,rgba(63,119,255,0.10),transparent_28%)]" />

          <aside className="relative z-10 hidden w-[290px] border-r border-white/10 bg-white/[0.05] p-6 lg:block">
            <div className="mb-8 flex items-center gap-3">
              <div className="grid grid-cols-3 gap-1">
                {Array.from({ length: 9 }).map((_, i) => (
                  <span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-cyan-100/90 shadow-[0_0_10px_rgba(125,241,255,0.9)]"
                  />
                ))}
              </div>
              <div className="text-[26px] font-semibold tracking-[0.22em] text-cyan-50">
                TAURUS
              </div>
            </div>

            <div className="space-y-3">
              {sidebarItems.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`flex w-full items-center rounded-[20px] px-4 py-4 text-left text-lg ${
                    item === "Messages"
                      ? "border border-cyan-300/15 bg-[linear-gradient(180deg,rgba(96,182,255,0.30),rgba(61,134,255,0.22))] shadow-[0_0_20px_rgba(97,172,255,0.22)]"
                      : "border border-white/10 bg-white/[0.05]"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-6 flex w-full items-center rounded-[20px] border border-white/10 bg-white/[0.05] px-4 py-4 text-left text-lg"
            >
              Logout
            </button>
          </aside>

          <section className="relative z-10 flex min-w-0 flex-1 flex-col">
            <header className="border-b border-white/10 px-4 py-4 md:px-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-[18px] font-semibold md:text-[22px]">
                    Hi, Taurus.
                  </div>
                  <div className="text-sm text-white/50">{statusText}</div>
                </div>

                <div className="flex items-center gap-2 md:gap-3">
                  <button
                    type="button"
                    onClick={() => setDialOpen(true)}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-xl"
                    aria-label="Open phone dialer"
                  >
                    ☎
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsMuted((prev) => !prev)}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-xl"
                    aria-label="Toggle microphone"
                  >
                    {isMuted ? "🔇" : "🎤"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSpeakerOn((prev) => !prev)}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-xl"
                    aria-label="Toggle speaker"
                  >
                    {speakerOn ? "🔊" : "🔈"}
                  </button>

                  {callConnected ? (
                    <button
                      type="button"
                      onClick={stopCall}
                      className="flex h-11 w-11 items-center justify-center rounded-full bg-[#ff2d55] text-xl"
                      aria-label="End call"
                    >
                      ×
                    </button>
                  ) : null}
                </div>
              </div>
            </header>

            <div className="grid min-h-0 flex-1 gap-4 p-4 md:grid-cols-[1.25fr_340px] md:p-6">
              <div className="flex min-h-0 flex-col overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.06]">
                <div className="border-b border-white/10 px-5 py-4">
                  <div className="text-3xl font-semibold">Messages</div>
                </div>

                <div ref={scrollerRef} className="flex-1 overflow-y-auto px-4 py-4 md:px-5">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.role === "assistant" ? "justify-start" : "justify-end"
                        }`}
                      >
                        <div
                          className={`max-w-[85%] rounded-[24px] px-4 py-3 ${
                            message.role === "assistant"
                              ? "rounded-bl-md border border-white/10 bg-white/[0.08]"
                              : "rounded-br-md border border-cyan-300/10 bg-[linear-gradient(180deg,rgba(61,134,255,0.20),rgba(61,134,255,0.10))]"
                          }`}
                        >
                          <div className="mb-1 text-xs text-white/45">
                            {message.role === "assistant" ? "Taurus" : "You"}
                          </div>
                          <div className="whitespace-pre-wrap text-[15px] leading-7">
                            {message.text}
                          </div>
                        </div>
                      </div>
                    ))}

                    {errorText ? (
                      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                        {errorText}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="border-t border-white/10 p-3 md:p-4">
                  <div className="flex items-end gap-2 rounded-[24px] border border-white/10 bg-[#101010]/90 px-3 py-2">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Message Taurus..."
                      rows={1}
                      className="max-h-40 min-h-[46px] flex-1 resize-none bg-transparent px-2 py-2 text-[15px] outline-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          void handleSendMessage();
                        }
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => void handleSendMessage()}
                      className="mb-1 flex h-11 w-11 items-center justify-center rounded-full bg-white text-black"
                      aria-label="Send message"
                    >
                      ➤
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5">
                  <div className="text-2xl font-semibold">Workspace</div>
                  <div className="mt-3 space-y-2 text-white/60">
                    <div>Call state: {callState}</div>
                    <div>AI number: {AI_LOCAL_NUMBER}</div>
                    <div>Mic: {isMuted ? "Muted" : "Active"}</div>
                    <div>Speaker: {speakerOn ? "On" : "Off"}</div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5">
                  <div className="text-2xl font-semibold">Quick Actions</div>
                  <div className="mt-4 grid gap-3">
                    <button
                      type="button"
                      onClick={() => setDialOpen(true)}
                      className="rounded-[20px] border border-white/10 bg-white/[0.05] px-4 py-3 text-left"
                    >
                      Open Dialer
                    </button>
                    <button
                      type="button"
                      onClick={() => setInput("Hello Taurus")}
                      className="rounded-[20px] border border-white/10 bg-white/[0.05] px-4 py-3 text-left"
                    >
                      Quick Message
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="rounded-[20px] border border-white/10 bg-white/[0.05] px-4 py-3 text-left"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {dialOpen ? (
            <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm">
              <div className="absolute inset-x-0 bottom-0 mx-auto max-w-md rounded-t-[36px] border border-white/10 bg-[#090909] px-5 pb-8 pt-4 shadow-2xl">
                <div className="mx-auto mb-5 h-1.5 w-16 rounded-full bg-white/20" />
                <div className="mb-2 text-center text-sm text-white/45">AI Number</div>
                <div className="mb-6 min-h-[40px] text-center text-[34px] font-semibold tracking-[0.08em]">
                  {AI_LOCAL_NUMBER}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setDialOpen(false)}
                    className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
                  >
                    Close
                  </button>

                  <button
                    type="button"
                    onClick={() => void startCall()}
                    className="flex-1 rounded-2xl bg-[#30d158] px-4 py-4 font-semibold text-black"
                  >
                    Call
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}