"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const AI_NUMBER = "+70 20 7777777";

const QUICK_PROMPTS = [
  "မင်းဘယ်သူလဲ",
  "SIM ဝယ်ချင်တယ်",
  "Taurus AI service အကြောင်းပြောပြပါ",
  "password ရှိလား",
];

const FALLBACK_REPLY =
  "အတွင်းပိုင်းစနစ်ကို အကောင်းဆုံးပြင်ဆင်နေပါတယ်ခင်ဗျ။ စိတ်ဝင်စားစရာ features တွေကို အကောင်းဆုံး upgrade လုပ်နေပါတယ်ခင်ဗျ။";

export default function AICallPage() {
  const [callState, setCallState] = useState<"idle" | "connecting" | "connected">("idle");
  const [callSeconds, setCallSeconds] = useState(0);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [statusText, setStatusText] = useState("Standby");
  const [targetPointer, setTargetPointer] = useState({ x: 0, y: 0 });
  const [interactiveFocus, setInteractiveFocus] = useState<"left" | "center" | "right">("center");

  const listRef = useRef<HTMLDivElement | null>(null);
  const connectTimeoutRef = useRef<number | null>(null);
  const durationTimerRef = useRef<number | null>(null);

  const formattedDuration = useMemo(() => {
    const m = Math.floor(callSeconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (callSeconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }, [callSeconds]);

  useEffect(() => {
    if (callState !== "connected") {
      if (durationTimerRef.current) {
        window.clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
      return;
    }

    durationTimerRef.current = window.setInterval(() => {
      setCallSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (durationTimerRef.current) {
        window.clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
    };
  }, [callState]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, isSending]);

  useEffect(() => {
    return () => {
      if (connectTimeoutRef.current) window.clearTimeout(connectTimeoutRef.current);
      if (durationTimerRef.current) window.clearInterval(durationTimerRef.current);
    };
  }, []);

  const updatePointer = useCallback((clientX: number, clientY: number, rect: DOMRect) => {
    const nx = ((clientX - rect.left) / rect.width) * 2 - 1;
    const ny = -(((clientY - rect.top) / rect.height) * 2 - 1);

    setTargetPointer({
      x: THREE.MathUtils.clamp(nx, -1, 1),
      y: THREE.MathUtils.clamp(ny, -1, 1),
    });

    if (nx < -0.2) {
      setInteractiveFocus("left");
    } else if (nx > 0.2) {
      setInteractiveFocus("right");
    } else {
      setInteractiveFocus("center");
    }
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      updatePointer(e.clientX, e.clientY, rect);
    },
    [updatePointer]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const touch = e.touches[0];
      if (!touch) return;
      const rect = e.currentTarget.getBoundingClientRect();
      updatePointer(touch.clientX, touch.clientY, rect);
    },
    [updatePointer]
  );

  const resetPointer = useCallback(() => {
    setTargetPointer({ x: 0, y: 0 });
    setInteractiveFocus("center");
  }, []);

  function startCall() {
    if (connectTimeoutRef.current) window.clearTimeout(connectTimeoutRef.current);

    setCallState("connecting");
    setStatusText("Calling Taurus AI Main Support...");
    setCallSeconds(0);
    setMessages([]);
    setInput("");

    connectTimeoutRef.current = window.setTimeout(() => {
      setCallState("connected");
      setStatusText("Connected");
      setMessages([
        {
          role: "assistant",
          content:
            "မင်္ဂလာပါ Taurus AI Calling Customer Service က ကြိုဆိုပါတယ်။ ဘာများဝန်ဆောင်မှု ပေးရမလဲခင်ဗျ",
        },
      ]);
    }, 1800);
  }

  function endCall() {
    if (connectTimeoutRef.current) window.clearTimeout(connectTimeoutRef.current);
    if (durationTimerRef.current) window.clearInterval(durationTimerRef.current);

    connectTimeoutRef.current = null;
    durationTimerRef.current = null;

    setCallState("idle");
    setCallSeconds(0);
    setStatusText("Standby");
    setMessages([]);
    setInput("");
    setIsSending(false);
  }

  async function sendMessage(customText?: string) {
    const text = (customText ?? input).trim();
    if (!text || isSending || callState !== "connected") return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setIsSending(true);

    try {
      const res = await fetch("/api/ai-call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: nextMessages }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || FALLBACK_REPLY);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data?.reply || FALLBACK_REPLY,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: FALLBACK_REPLY,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div
        className="absolute inset-0"
        onMouseMove={handleMouseMove}
        onMouseLeave={resetPointer}
        onTouchMove={handleTouchMove}
        onTouchEnd={resetPointer}
      >
        <Canvas
          dpr={[1, 1.5]}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
          }}
          camera={{ position: [0, 0, 11], fov: 42 }}
        >
          <Scene3D pointer={targetPointer} focus={interactiveFocus} />
        </Canvas>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_56%,rgba(89,221,255,0.08)_0%,rgba(24,74,117,0.08)_26%,rgba(4,10,18,0.70)_62%,rgba(0,0,0,0.94)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#000000_0%,#02070f_30%,#07111d_65%,#000000_100%)] opacity-90" />

      <div className="relative z-20 flex min-h-screen flex-col">
        <header className="px-4 pt-4 sm:px-6 sm:pt-6">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between">
            <div className="rounded-full border border-cyan-200/15 bg-white/5 px-4 py-2 text-[11px] font-medium tracking-[0.28em] text-cyan-100/75 backdrop-blur-xl">
              TAURUS AI DEEP CALLING
            </div>

            <div className="hidden rounded-full border border-cyan-200/15 bg-white/5 px-4 py-2 text-[11px] font-medium tracking-[0.22em] text-cyan-100/60 backdrop-blur-xl sm:block">
              ROLE · TAURUS AI MAIN SUPPORT
            </div>
          </div>
        </header>

        <section className="relative flex flex-1 items-end justify-center px-4 pb-6 pt-4 sm:px-6 sm:pb-8">
          <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-5 lg:grid-cols-[360px_minmax(0,1fr)_360px]">
            <aside className="hidden lg:block">
              <GlassCard className="min-h-[240px]">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-[11px] tracking-[0.24em] text-cyan-100/60">SYSTEM STATUS</p>
                  <StatusDot active={callState !== "idle"} />
                </div>

                <div className="space-y-3">
                  <InfoRow label="Line" value={AI_NUMBER} />
                  <InfoRow label="Role" value="Taurus AI Main Support" />
                  <InfoRow label="State" value={statusText} />
                  <InfoRow label="Duration" value={formattedDuration} />
                </div>

                <div className="mt-5 rounded-2xl border border-cyan-200/10 bg-white/5 p-3">
                  <p className="text-xs leading-6 text-cyan-50/70">
                    Interactive nano hologram scene with production-style glow, bloom, panel depth shift, and touch or
                    mouse reactive focus.
                  </p>
                </div>
              </GlassCard>
            </aside>

            <div className="flex min-h-[760px] flex-col justify-between">
              <div className="flex items-start justify-center pt-2 sm:pt-6">
                <div className="w-full max-w-[560px] rounded-[30px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.10)_0%,rgba(139,216,255,0.05)_100%)] p-4 shadow-[0_20px_80px_rgba(31,121,194,0.16),inset_0_1px_0_rgba(255,255,255,0.15)] backdrop-blur-[24px] sm:p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] tracking-[0.26em] text-cyan-100/58">TAURUS AI CONSOLE</div>
                      <h1 className="mt-1 text-xl font-semibold text-white sm:text-2xl">Deep Calling Interface</h1>
                    </div>

                    <div className="rounded-full border border-cyan-200/15 bg-cyan-100/10 px-3 py-1 text-[11px] font-semibold text-cyan-50/80">
                      {callState === "idle" ? "Ready" : callState === "connecting" ? "Calling" : "Live"}
                    </div>
                  </div>

                  <div className="mb-4 grid grid-cols-2 gap-3">
                    <MiniMetric title="Target Line" value={AI_NUMBER} />
                    <MiniMetric title="Call Duration" value={formattedDuration} />
                  </div>

                  <div className="mb-4 flex gap-3">
                    {callState === "idle" ? (
                      <button
                        onClick={startCall}
                        className="flex-1 rounded-2xl border border-cyan-200/25 bg-[linear-gradient(180deg,rgba(95,228,255,0.30)_0%,rgba(44,122,255,0.24)_100%)] px-4 py-4 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(37,138,224,0.20)] transition hover:scale-[0.995]"
                      >
                        Call Taurus AI
                      </button>
                    ) : (
                      <button
                        onClick={endCall}
                        className="flex-1 rounded-2xl border border-red-300/20 bg-[linear-gradient(180deg,rgba(255,117,117,0.24)_0%,rgba(176,33,33,0.22)_100%)] px-4 py-4 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(180,45,45,0.18)] transition hover:scale-[0.995]"
                      >
                        End Call
                      </button>
                    )}

                    <div className="flex min-w-[132px] items-center justify-center rounded-2xl border border-cyan-200/12 bg-white/5 px-4 py-4 text-center text-sm text-cyan-50/72">
                      {statusText}
                    </div>
                  </div>

                  {callState !== "idle" && (
                    <>
                      <div
                        ref={listRef}
                        className="mb-4 h-[280px] overflow-y-auto rounded-[24px] border border-cyan-200/10 bg-black/25 p-4 shadow-[inset_0_0_30px_rgba(28,99,148,0.12)]"
                      >
                        <div className="space-y-3">
                          {messages.map((msg, idx) => (
                            <div
                              key={`${msg.role}-${idx}`}
                              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-7 ${
                                msg.role === "assistant"
                                  ? "border border-cyan-200/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.10)_0%,rgba(123,210,255,0.06)_100%)] text-cyan-50/92"
                                  : "ml-auto border border-blue-300/10 bg-[linear-gradient(180deg,rgba(79,121,255,0.16)_0%,rgba(52,95,226,0.12)_100%)] text-white/88"
                              }`}
                            >
                              {msg.content}
                            </div>
                          ))}

                          {isSending && (
                            <div className="max-w-[85%] rounded-2xl border border-cyan-200/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.10)_0%,rgba(123,210,255,0.06)_100%)] px-4 py-3 text-sm text-cyan-50/88">
                              အကောင်းဆုံး response ကို ပြင်ဆင်ပေးနေပါတယ်ခင်ဗျ...
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mb-3 flex flex-wrap gap-2">
                        {QUICK_PROMPTS.map((item) => (
                          <button
                            key={item}
                            onClick={() => sendMessage(item)}
                            className="rounded-full border border-cyan-200/15 bg-white/6 px-3 py-2 text-xs text-cyan-50/80 transition hover:bg-white/10"
                          >
                            {item}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-3">
                        <input
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") sendMessage();
                          }}
                          placeholder="Taurus AI ကို မေးမြန်းပါ..."
                          className="h-14 flex-1 rounded-2xl border border-cyan-200/12 bg-white/6 px-4 text-sm text-white outline-none placeholder:text-cyan-50/35 focus:border-cyan-200/30"
                        />
                        <button
                          onClick={() => sendMessage()}
                          disabled={isSending}
                          className="h-14 rounded-2xl border border-cyan-200/25 bg-[linear-gradient(180deg,rgba(95,228,255,0.24)_0%,rgba(44,122,255,0.20)_100%)] px-5 text-sm font-semibold text-white disabled:opacity-60"
                        >
                          Send
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <aside className="hidden lg:block">
              <GlassCard className="min-h-[240px]">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-[11px] tracking-[0.24em] text-cyan-100/60">INTERACTION FOCUS</p>
                  <div className="rounded-full border border-cyan-200/12 bg-white/6 px-3 py-1 text-[11px] text-cyan-50/72">
                    {interactiveFocus.toUpperCase()}
                  </div>
                </div>

                <div className="space-y-3">
                  <FocusPill active={interactiveFocus === "left"} label="Left Panels Active" />
                  <FocusPill active={interactiveFocus === "center"} label="Center Hologram Active" />
                  <FocusPill active={interactiveFocus === "right"} label="Right Panels Active" />
                </div>

                <div className="mt-5 rounded-2xl border border-cyan-200/10 bg-white/5 p-3">
                  <p className="text-xs leading-6 text-cyan-50/70">
                    Touch or move mouse across the scene. Panel glow, chamber tilt, glow follow, and 3D depth shift
                    react in real time.
                  </p>
                </div>
              </GlassCard>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}

function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.10)_0%,rgba(125,206,255,0.04)_100%)] p-5 shadow-[0_20px_80px_rgba(31,121,194,0.14),inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur-[24px] ${className}`}
    >
      {children}
    </div>
  );
}

function StatusDot({ active }: { active: boolean }) {
  return (
    <span
      className={`h-2.5 w-2.5 rounded-full ${
        active ? "bg-emerald-300 shadow-[0_0_18px_rgba(110,255,180,0.7)]" : "bg-cyan-50/40"
      }`}
    />
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-cyan-200/10 bg-white/5 px-4 py-3">
      <span className="text-xs tracking-[0.18em] text-cyan-50/45">{label}</span>
      <span className="text-sm text-cyan-50/85">{value}</span>
    </div>
  );
}

function MiniMetric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-cyan-200/10 bg-white/5 px-4 py-3">
      <div className="text-[11px] tracking-[0.2em] text-cyan-50/45">{title}</div>
      <div className="mt-2 text-sm font-medium text-cyan-50/88">{value}</div>
    </div>
  );
}

function FocusPill({ active, label }: { active: boolean; label: string }) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-sm transition ${
        active
          ? "border-cyan-200/18 bg-[linear-gradient(180deg,rgba(149,236,255,0.18)_0%,rgba(64,129,255,0.12)_100%)] text-cyan-50 shadow-[0_0_24px_rgba(91,224,255,0.14)]"
          : "border-cyan-200/10 bg-white/5 text-cyan-50/62"
      }`}
    >
      {label}
    </div>
  );
}

function Scene3D({
  pointer,
  focus,
}: {
  pointer: { x: number; y: number };
  focus: "left" | "center" | "right";
}) {
  const rootRef = useRef<THREE.Group | null>(null);
  const chamberRef = useRef<THREE.Group | null>(null);
  const glowFollowerRef = useRef<THREE.Mesh | null>(null);

  const target = useRef({
    rotX: 0,
    rotY: 0,
    shiftX: 0,
    shiftY: 0,
  });

  useFrame((state, delta) => {
    if (!rootRef.current || !chamberRef.current || !glowFollowerRef.current) return;

    target.current.rotY = pointer.x * 0.22;
    target.current.rotX = pointer.y * 0.12;
    target.current.shiftX = pointer.x * 0.7;
    target.current.shiftY = pointer.y * 0.35;

    rootRef.current.rotation.y = THREE.MathUtils.lerp(rootRef.current.rotation.y, target.current.rotY, 0.06);
    rootRef.current.rotation.x = THREE.MathUtils.lerp(rootRef.current.rotation.x, target.current.rotX, 0.05);

    chamberRef.current.position.x = THREE.MathUtils.lerp(chamberRef.current.position.x, target.current.shiftX, 0.05);
    chamberRef.current.position.y = THREE.MathUtils.lerp(chamberRef.current.position.y, target.current.shiftY, 0.05);

    glowFollowerRef.current.position.x = THREE.MathUtils.lerp(
      glowFollowerRef.current.position.x,
      pointer.x * 3.2,
      0.08
    );
    glowFollowerRef.current.position.y = THREE.MathUtils.lerp(
      glowFollowerRef.current.position.y,
      pointer.y * 1.8 + 0.2,
      0.08
    );

    rootRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.3) * 0.01;
    chamberRef.current.position.z = Math.sin(state.clock.elapsedTime * 0.45) * 0.1;
  });

  return (
    <>
      <AdaptivePixelRatio />
      <fog attach="fog" args={["#020814", 12, 26]} />
      <ambientLight intensity={0.35} color="#90caff" />
      <directionalLight position={[0, 6, 8]} intensity={0.8} color="#b8e7ff" />
      <pointLight position={[0, 1, 5]} intensity={1.1} color="#67e7ff" />
      <pointLight position={[-5, 1, 3]} intensity={0.7} color="#2ea8ff" />
      <pointLight position={[5, 1, 3]} intensity={0.7} color="#2ea8ff" />

      <group ref={rootRef}>
        <group ref={chamberRef} position={[0, -0.2, 0]}>
          <StageBase />
          <CenterHologram focus={focus} />
          <SidePanel side="left" focus={focus} />
          <SidePanel side="left-mid" focus={focus} />
          <SidePanel side="right-mid" focus={focus} />
          <SidePanel side="right" focus={focus} />
          <FloatingDust />
        </group>

        <mesh ref={glowFollowerRef} position={[0, 0.2, 1.4]}>
          <planeGeometry args={[1.4, 1.4]} />
          <meshBasicMaterial
            color="#7eeeff"
            transparent
            opacity={0.22}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>

      <EffectComposer multisampling={0}>
        <Bloom luminanceThreshold={0.08} luminanceSmoothing={0.45} intensity={1.25} mipmapBlur />
      </EffectComposer>
    </>
  );
}

function AdaptivePixelRatio() {
  const { gl } = useThree();

  useEffect(() => {
    const setDpr = () => {
      const mobile = window.innerWidth < 768;
      const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.5);
      gl.setPixelRatio(dpr);
    };

    setDpr();
    window.addEventListener("resize", setDpr);
    return () => window.removeEventListener("resize", setDpr);
  }, [gl]);

  return null;
}

function StageBase() {
  const ringRef = useRef<THREE.Group | null>(null);

  useFrame((state) => {
    if (!ringRef.current) return;
    ringRef.current.rotation.z = state.clock.elapsedTime * 0.1;
  });

  return (
    <group position={[0, -2.2, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.38, 0]}>
        <circleGeometry args={[5.6, 96]} />
        <meshBasicMaterial color="#0c2033" transparent opacity={0.7} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.34, 0]}>
        <ringGeometry args={[3.7, 4.85, 96]} />
        <meshBasicMaterial
          color="#7cefff"
          transparent
          opacity={0.18}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <group ref={ringRef} position={[0, -0.28, 0]}>
        <HoloRing scale={1.25} y={0.0} opacity={0.28} />
        <HoloRing scale={1.0} y={0.04} opacity={0.18} />
        <HoloRing scale={0.78} y={0.08} opacity={0.14} />
      </group>

      <mesh position={[0, 0.56, -1.55]}>
        <boxGeometry args={[8.7, 2.65, 0.2]} />
        <meshPhysicalMaterial
          color="#89caff"
          transmission={0.7}
          roughness={0.18}
          thickness={0.6}
          transparent
          opacity={0.08}
          metalness={0.1}
          reflectivity={0.4}
        />
      </mesh>

      <mesh position={[0, 1.36, -1.48]}>
        <boxGeometry args={[9.8, 0.08, 0.05]} />
        <meshBasicMaterial
          color="#b9f6ff"
          transparent
          opacity={0.45}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function HoloRing({ scale, y, opacity }: { scale: number; y: number; opacity: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]} scale={scale}>
      <ringGeometry args={[3.0, 3.12, 128]} />
      <meshBasicMaterial
        color="#7eeeff"
        transparent
        opacity={opacity}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

function CenterHologram({ focus }: { focus: "left" | "center" | "right" }) {
  const centerRef = useRef<THREE.Group | null>(null);
  const auraRef = useRef<THREE.Mesh | null>(null);
  const intensity = focus === "center" ? 1 : 0.72;

  useFrame((state) => {
    if (!centerRef.current || !auraRef.current) return;

    centerRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.4) * 0.05 + 0.15;
    centerRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.7) * 0.08;

    const pulse = 0.26 + Math.sin(state.clock.elapsedTime * 2.0) * 0.05 + (focus === "center" ? 0.08 : 0);
    (auraRef.current.material as THREE.MeshBasicMaterial).opacity = pulse;
  });

  return (
    <group ref={centerRef} position={[0, -0.45, 0.2]}>
      <mesh ref={auraRef} position={[0, 1.2, -0.18]}>
        <planeGeometry args={[2.3, 3.8]} />
        <meshBasicMaterial
          color="#8ef4ff"
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh position={[0, 1.12, 0]}>
        <sphereGeometry args={[0.35, 28, 28]} />
        <meshBasicMaterial
          color="#eaffff"
          transparent
          opacity={0.95}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh position={[0, 0.28, 0]} scale={[1, 1.25 * intensity, 1]}>
        <capsuleGeometry args={[0.46, 1.4, 8, 18]} />
        <meshBasicMaterial
          color="#f4ffff"
          transparent
          opacity={0.82}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh position={[-0.78, 0.52, 0]} rotation={[0, 0, 0.48]}>
        <capsuleGeometry args={[0.08, 0.96, 6, 12]} />
        <meshBasicMaterial
          color="#f2ffff"
          transparent
          opacity={0.62}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh position={[0.78, 0.52, 0]} rotation={[0, 0, -0.48]}>
        <capsuleGeometry args={[0.08, 0.96, 6, 12]} />
        <meshBasicMaterial
          color="#f2ffff"
          transparent
          opacity={0.62}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh position={[-0.34, -0.8, 0]} rotation={[0, 0, 0.14]}>
        <capsuleGeometry args={[0.08, 1.05, 6, 12]} />
        <meshBasicMaterial
          color="#f2ffff"
          transparent
          opacity={0.62}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh position={[0.34, -0.8, 0]} rotation={[0, 0, -0.14]}>
        <capsuleGeometry args={[0.08, 1.05, 6, 12]} />
        <meshBasicMaterial
          color="#f2ffff"
          transparent
          opacity={0.62}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <OrbitBand radius={1.15} y={1.45} speed={0.8} opacity={focus === "center" ? 0.4 : 0.24} />
      <OrbitBand radius={1.45} y={0.92} speed={-0.65} opacity={focus === "center" ? 0.32 : 0.2} />
      <OrbitBand radius={1.1} y={0.15} speed={1.1} opacity={focus === "center" ? 0.28 : 0.18} />
    </group>
  );
}

function OrbitBand({
  radius,
  y,
  speed,
  opacity,
}: {
  radius: number;
  y: number;
  speed: number;
  opacity: number;
}) {
  const bandRef = useRef<THREE.Group | null>(null);

  useFrame((state) => {
    if (!bandRef.current) return;
    bandRef.current.rotation.z = state.clock.elapsedTime * speed;
  });

  return (
    <group ref={bandRef} position={[0, y, 0]}>
      <mesh rotation={[Math.PI / 2.4, 0, 0]}>
        <torusGeometry args={[radius, 0.018, 12, 100]} />
        <meshBasicMaterial
          color="#9af8ff"
          transparent
          opacity={opacity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function SidePanel({
  side,
  focus,
}: {
  side: "left" | "left-mid" | "right-mid" | "right";
  focus: "left" | "center" | "right";
}) {
  const ref = useRef<THREE.Group | null>(null);

  const config = useMemo(() => {
    switch (side) {
      case "left":
        return { x: -4.05, y: -0.2, z: -0.35, rotY: 0.26, scale: 1.06, group: "left" as const };
      case "left-mid":
        return { x: -2.5, y: -0.4, z: 0.2, rotY: 0.13, scale: 0.86, group: "left" as const };
      case "right-mid":
        return { x: 2.5, y: -0.38, z: 0.18, rotY: -0.13, scale: 0.92, group: "right" as const };
      default:
        return { x: 4.05, y: -0.18, z: -0.35, rotY: -0.26, scale: 1.08, group: "right" as const };
    }
  }, [side]);

  const active = focus === config.group;

  useFrame((state) => {
    if (!ref.current) return;

    const lift = Math.sin(state.clock.elapsedTime * 0.8 + config.x) * 0.08;
    ref.current.position.x = THREE.MathUtils.lerp(ref.current.position.x, config.x + (active ? config.x * 0.02 : 0), 0.06);
    ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, config.y + lift, 0.06);
    ref.current.position.z = THREE.MathUtils.lerp(ref.current.position.z, config.z + (active ? 0.24 : 0), 0.06);
    ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, config.rotY, 0.06);
  });

  return (
    <group ref={ref} position={[config.x, config.y, config.z]} rotation={[0, config.rotY, 0]} scale={config.scale}>
      <PanelCard width={1.7} height={2.25} active={active} />
      <PanelBars active={active} />
    </group>
  );
}

function PanelCard({ width, height, active }: { width: number; height: number; active: boolean }) {
  return (
    <group>
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshPhysicalMaterial
          color="#8bd9ff"
          transparent
          opacity={0.08}
          transmission={0.75}
          roughness={0.18}
          thickness={0.25}
          metalness={0.05}
          reflectivity={0.45}
        />
      </mesh>

      <mesh position={[0, 0, 0.02]}>
        <planeGeometry args={[width * 0.98, height * 0.98]} />
        <meshBasicMaterial
          color={active ? "#9df5ff" : "#7ccfff"}
          transparent
          opacity={active ? 0.16 : 0.1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <LinePlane position={[0, height / 2 - 0.06, 0.03]} size={[width * 0.82, 0.03]} opacity={active ? 0.7 : 0.4} />
      <LinePlane position={[0, -height / 2 + 0.06, 0.03]} size={[width * 0.82, 0.03]} opacity={active ? 0.4 : 0.22} />
      <LinePlane position={[-width / 2 + 0.04, 0, 0.03]} size={[0.03, height * 0.82]} opacity={active ? 0.5 : 0.25} />
      <LinePlane position={[width / 2 - 0.04, 0, 0.03]} size={[0.03, height * 0.82]} opacity={active ? 0.5 : 0.25} />
    </group>
  );
}

function LinePlane({
  position,
  size,
  opacity,
}: {
  position: [number, number, number];
  size: [number, number];
  opacity: number;
}) {
  return (
    <mesh position={position}>
      <planeGeometry args={size} />
      <meshBasicMaterial
        color="#b8f8ff"
        transparent
        opacity={opacity}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

function PanelBars({ active }: { active: boolean }) {
  const bars = useMemo(
    () => [
      { x: -0.35, w: 0.12, h: 0.48, y: -0.48 },
      { x: -0.15, w: 0.12, h: 0.82, y: -0.3 },
      { x: 0.05, w: 0.12, h: 0.62, y: -0.4 },
      { x: 0.25, w: 0.12, h: 1.05, y: -0.18 },
    ],
    []
  );

  return (
    <group position={[0, 0, 0.05]}>
      {bars.map((bar, i) => (
        <mesh key={`${bar.x}-${i}`} position={[bar.x, bar.y, 0]}>
          <planeGeometry args={[bar.w, bar.h]} />
          <meshBasicMaterial
            color={active ? "#b4fbff" : "#8cd6ff"}
            transparent
            opacity={active ? 0.65 : 0.4}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}

      <mesh position={[0, 0.72, 0]}>
        <planeGeometry args={[0.92, 0.08]} />
        <meshBasicMaterial
          color="#c4fdff"
          transparent
          opacity={active ? 0.7 : 0.4}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh position={[0, 0.42, 0]}>
        <planeGeometry args={[0.74, 0.05]} />
        <meshBasicMaterial
          color="#b4efff"
          transparent
          opacity={active ? 0.5 : 0.28}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function FloatingDust() {
  const pointsRef = useRef<THREE.Points | null>(null);

  const { positions, colors, sizes } = useMemo(() => {
    const count = 180;
    const pos = new Float32Array(count * 3);
    const color = new Float32Array(count * 3);
    const size = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      pos[i3 + 0] = (Math.random() - 0.5) * 11;
      pos[i3 + 1] = Math.random() * 5 - 1.5;
      pos[i3 + 2] = (Math.random() - 0.5) * 4;
      color[i3 + 0] = 0.55;
      color[i3 + 1] = 0.95;
      color[i3 + 2] = 1.0;
      size[i] = Math.random() * 0.055 + 0.02;
    }

    return { positions: pos, colors: color, sizes: size };
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y = state.clock.elapsedTime * 0.03;
    pointsRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.08) * 0.08;
  });

  return (
    <points ref={pointsRef} position={[0, 0.45, -0.6]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
<bufferAttribute attach="attributes-color" args={[colors, 3]} />
<bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        vertexColors
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}