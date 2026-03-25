"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

const ACCESS_CODE = "TAURUS2026";

export default function LoginGatePage() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [pointer, setPointer] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const access = localStorage.getItem("taurus_access");
    if (access === "granted") {
      window.location.href = "/ai-call";
    }
  }, []);

  function enterGate() {
    if (code.trim() === ACCESS_CODE) {
      localStorage.setItem("taurus_access", "granted");
      window.location.href = "/ai-call";
      return;
    }
    setError("Invalid Access Code");
  }

  function updatePointer(clientX: number, clientY: number) {
    const x = (clientX / window.innerWidth) * 2 - 1;
    const y = -((clientY / window.innerHeight) * 2 - 1);
    setPointer({ x, y });
  }

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-black text-white"
      onMouseMove={(e) => updatePointer(e.clientX, e.clientY)}
      onMouseLeave={() => setPointer({ x: 0, y: 0 })}
      onTouchMove={(e) => {
        const touch = e.touches[0];
        if (!touch) return;
        updatePointer(touch.clientX, touch.clientY);
      }}
      onTouchEnd={() => setPointer({ x: 0, y: 0 })}
    >
      <div className="absolute inset-0">
        <Canvas
          camera={{ position: [0, 0.1, 7.2], fov: 42 }}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          dpr={[1, 1.6]}
        >
          <AdaptiveDpr />
          <CinemaScene pointer={pointer} />
        </Canvas>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_58%,rgba(76,180,255,0.10)_0%,rgba(106,80,255,0.08)_18%,rgba(0,0,0,0.0)_34%),linear-gradient(180deg,rgba(0,0,0,0.02)_0%,rgba(0,0,0,0.28)_48%,rgba(0,0,0,0.78)_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:48px_48px]" />

      <div className="relative z-10 flex min-h-screen flex-col justify-between px-5 py-6 sm:px-8 sm:py-8">
        <div className="grid grid-cols-3 items-start text-[10px] uppercase tracking-[0.28em] text-white/48 sm:text-[11px]">
          <div className="font-semibold leading-5">
            Taurus
            <br />
            Gate
          </div>

          <div className="justify-self-center text-center leading-5">
            Login AI Call
            <br />
            Support Gate
          </div>

          <div className="justify-self-end text-right leading-5">
            Nano
            <br />
            Cinema
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="relative w-full max-w-[1480px]">
            <div className="absolute left-[2%] top-[14%] hidden xl:block">
              <div className="text-[88px] italic leading-none text-white/92 [font-family:Georgia,serif]">
                Creative
              </div>
              <div className="mt-1 text-[74px] font-black uppercase leading-none tracking-tight text-white">
                Gate.
              </div>
            </div>

            <div className="absolute right-[4%] top-[20%] hidden max-w-[270px] xl:block">
              <p className="text-[12px] leading-7 text-white/62">
                Taurus AI system is evolving for faster conversation, stronger
                Myanmar understanding, and premium cinematic support experience.
              </p>

              <p className="mt-5 text-[11px] uppercase tracking-[0.24em] text-white/34">
                Ultra Nano Access Layer
              </p>
            </div>

            <div className="mx-auto flex min-h-[70vh] items-end justify-center">
              <div className="w-full max-w-[400px] rounded-[30px] border border-white/12 bg-white/[0.05] p-4 shadow-[0_22px_90px_rgba(255,255,255,0.05)] backdrop-blur-xl sm:max-w-[430px] sm:p-5">
                <div className="mb-4 text-center">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/52">
                    Secure Entry
                  </div>
                  <h1 className="mt-3 text-[30px] font-semibold tracking-tight text-white sm:text-[36px]">
                    Login AI Call
                    <span className="block">Support Gate</span>
                  </h1>
                  <p className="mt-3 text-sm leading-7 text-white/60">
                    Cinematic nano gateway before Taurus AI world-class support
                    calling experience.
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setOpen(true);
                      setError("");
                    }}
                    className="w-full rounded-2xl border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.10)_0%,rgba(255,255,255,0.04)_100%)] px-5 py-4 text-sm font-semibold text-white shadow-[0_14px_40px_rgba(255,255,255,0.05)] transition hover:translate-y-[-1px] hover:bg-white/[0.10]"
                  >
                    Enter Password Gate
                  </button>

                  <button
                    onClick={() => {
                      setOpen(true);
                      setError("");
                    }}
                    className="w-full rounded-2xl border border-white/12 bg-white/[0.03] px-5 py-4 text-sm font-semibold text-white/84 transition hover:bg-white/[0.08]"
                  >
                    Continue
                  </button>
                </div>

                <div className="mt-5 text-center text-[11px] uppercase tracking-[0.24em] text-white/34">
                  🌎 Myanmar · Speed · Voice
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 items-end text-[10px] uppercase tracking-[0.26em] text-white/38 sm:text-[11px]">
          <div className="leading-5">
            Live
            <br />
            Cinematic UI
          </div>

          <div className="justify-self-center text-center leading-5">
            Gate
            <br />
            Overlay
          </div>

          <div className="justify-self-end text-right leading-5">
            Taurus
            <br />
            Ecosystem
          </div>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 px-4 backdrop-blur-2xl">
          <div className="w-full max-w-[400px] rounded-[28px] border border-white/14 bg-[linear-gradient(180deg,rgba(22,22,26,0.92)_0%,rgba(10,10,12,0.96)_100%)] p-5 shadow-[0_30px_100px_rgba(0,0,0,0.6)]">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.26em] text-white/42">
                  Password Entry
                </div>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Gate Access
                </h2>
              </div>

              <button
                onClick={() => {
                  setOpen(false);
                  setCode("");
                  setError("");
                }}
                className="rounded-full border border-white/12 bg-white/[0.05] px-3 py-2 text-sm text-white/70"
              >
                ✕
              </button>
            </div>

            <label className="mb-2 block text-[11px] uppercase tracking-[0.24em] text-white/44">
              Access Password
            </label>

            <input
              type="password"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError("");
              }}
              placeholder="Enter Password"
              className="w-full rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-4 text-sm text-white outline-none placeholder:text-white/26 focus:border-cyan-300/30"
            />

            <div className="min-h-[24px] pt-3 text-sm text-red-400">{error}</div>

            <button
              onClick={enterGate}
              className="mt-1 w-full rounded-2xl border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0.08)_100%)] px-4 py-4 text-sm font-semibold text-white transition hover:bg-white/[0.12]"
            >
              Enter Gate
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function AdaptiveDpr() {
  const { gl } = useThree();

  useEffect(() => {
    const apply = () => {
      const mobile = window.innerWidth < 768;
      gl.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.6));
    };
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, [gl]);

  return null;
}

function CinemaScene({ pointer }: { pointer: { x: number; y: number } }) {
  const rootRef = useRef<THREE.Group | null>(null);
  const coreRef = useRef<THREE.Group | null>(null);
  const glowRef = useRef<THREE.Mesh | null>(null);

  useFrame((state) => {
    if (!rootRef.current || !coreRef.current || !glowRef.current) return;

    rootRef.current.rotation.y = THREE.MathUtils.lerp(
      rootRef.current.rotation.y,
      pointer.x * 0.16,
      0.05
    );
    rootRef.current.rotation.x = THREE.MathUtils.lerp(
      rootRef.current.rotation.x,
      pointer.y * 0.08,
      0.05
    );

    coreRef.current.rotation.y += 0.0032;
    coreRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.06;

    const scale = 1 + Math.sin(state.clock.elapsedTime * 2.2) * 0.035;
    coreRef.current.scale.setScalar(scale);

    glowRef.current.position.x = THREE.MathUtils.lerp(
      glowRef.current.position.x,
      pointer.x * 1.2,
      0.06
    );
  });

  return (
    <>
      <fog attach="fog" args={["#000000", 7, 20]} />
      <ambientLight intensity={0.45} color="#ffffff" />
      <directionalLight position={[2, 5, 3]} intensity={0.9} color="#ffffff" />
      <pointLight position={[0, 2.6, 2.4]} intensity={2.6} color="#46dfff" />
      <pointLight position={[-3.5, 0.6, 1.8]} intensity={0.8} color="#ffffff" />
      <pointLight position={[3.5, 0.6, 1.8]} intensity={0.8} color="#66bfff" />

      <group ref={rootRef} position={[0, -0.85, 0]}>
        <ReflectionFloor />
        <group ref={coreRef}>
          <WorldCore />
          <CoreRings />
        </group>

        <SmokeField />

        <mesh
          ref={glowRef}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -1.17, 0]}
        >
          <circleGeometry args={[1.8, 64]} />
          <meshBasicMaterial
            color="#8ef7ff"
            transparent
            opacity={0.15}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>

      <EffectComposer multisampling={0}>
        <Bloom intensity={1.9} luminanceThreshold={0.08} luminanceSmoothing={0.42} mipmapBlur />
      </EffectComposer>
    </>
  );
}

function ReflectionFloor() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, 0]}>
        <planeGeometry args={[18, 18]} />
        <meshStandardMaterial color="#030405" roughness={0.92} metalness={0.22} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.18, 0]}>
        <ringGeometry args={[0.82, 1.1, 80]} />
        <meshBasicMaterial
          color="#d0faff"
          transparent
          opacity={0.22}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.185, 0]}>
        <ringGeometry args={[1.25, 2.5, 120]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.07}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function WorldCore() {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[1.42, 128, 128]} />
        <meshStandardMaterial
          color="#1cc8ff"
          emissive="#27ffd9"
          emissiveIntensity={1.2}
          roughness={0.08}
          metalness={0.65}
        />
      </mesh>

      <mesh scale={1.12}>
        <sphereGeometry args={[1.42, 128, 128]} />
        <meshBasicMaterial
          color="#b8faff"
          transparent
          opacity={0.08}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function CoreRings() {
  const ringRef = useRef<THREE.Group | null>(null);

  useFrame((state) => {
    if (!ringRef.current) return;
    ringRef.current.rotation.y = state.clock.elapsedTime * 0.45;
    ringRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.22;
  });

  return (
    <group ref={ringRef}>
      <mesh rotation={[Math.PI / 2.5, 0, 0]}>
        <torusGeometry args={[1.9, 0.018, 16, 120]} />
        <meshBasicMaterial
          color="#d8faff"
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh rotation={[Math.PI / 2.2, 0, Math.PI / 2]}>
        <torusGeometry args={[1.65, 0.015, 16, 120]} />
        <meshBasicMaterial
          color="#9ef8ff"
          transparent
          opacity={0.26}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function SmokeField() {
  const ref = useRef<THREE.Points | null>(null);

  const positions = useMemo(() => {
    const count = 240;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      pos[i3 + 0] = (Math.random() - 0.5) * 9;
      pos[i3 + 1] = Math.random() * 4 - 1.6;
      pos[i3 + 2] = (Math.random() - 0.5) * 5;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y += 0.0009;
    ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.15) * 0.05;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#ffffff" transparent opacity={0.55} />
    </points>
  );
}