"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

const ACCESS_CODE = "TAURUS2026";

export default function LoginGatePage() {
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [pointer, setPointer] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const access = localStorage.getItem("taurus_access");
    if (access === "granted") {
      window.location.href = "/ai-call";
    }
  }, []);

  function handleEnterGate() {
    if (code.trim() === ACCESS_CODE) {
      localStorage.setItem("taurus_access", "granted");
      window.location.href = "/ai-call";
      return;
    }
    setError("Invalid Access Code");
  }

  function goDirectCall() {
    localStorage.setItem("taurus_access", "granted");
    window.location.href = "/ai-call";
  }

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-black text-white"
      onMouseMove={(e) => {
        const x = (e.clientX / window.innerWidth) * 2 - 1;
        const y = -((e.clientY / window.innerHeight) * 2 - 1);
        setPointer({ x, y });
      }}
      onMouseLeave={() => setPointer({ x: 0, y: 0 })}
      onTouchMove={(e) => {
        const touch = e.touches[0];
        if (!touch) return;
        const x = (touch.clientX / window.innerWidth) * 2 - 1;
        const y = -((touch.clientY / window.innerHeight) * 2 - 1);
        setPointer({ x, y });
      }}
      onTouchEnd={() => setPointer({ x: 0, y: 0 })}
    >
      <div className="absolute inset-0">
        <Canvas
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          camera={{ position: [0, 0, 8.6], fov: 42 }}
        >
          <GateScene pointer={pointer} />
        </Canvas>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_72%,rgba(148,126,255,0.10)_0%,rgba(96,166,255,0.08)_18%,rgba(0,0,0,0.0)_34%),linear-gradient(180deg,rgba(0,0,0,0.15)_0%,rgba(0,0,0,0.38)_52%,rgba(0,0,0,0.74)_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.25)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.25)_1px,transparent_1px)] [background-size:48px_48px]" />

      <div className="relative z-10 flex min-h-screen flex-col justify-between px-5 py-5 sm:px-8 sm:py-7">
        <div className="grid grid-cols-3 items-start text-[10px] uppercase tracking-[0.28em] text-white/52 sm:text-[11px]">
          <div className="self-start font-semibold leading-5">
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
            Role
            <br />
            Taurus AI Main Support
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-[42%] flex justify-center">
          <div className="h-[1px] w-[88%] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="relative w-full max-w-[1380px]">
            <div className="absolute left-[2%] top-[14%] hidden xl:block">
              <div className="text-[76px] italic leading-none text-white/94 [font-family:Georgia,serif]">
                Creative
              </div>
              <div className="mt-1 text-[68px] font-black uppercase leading-none tracking-tight text-white">
                Gate.
              </div>
            </div>

            <div className="absolute right-[4%] top-[24%] hidden max-w-[250px] xl:block">
              <p className="text-[12px] leading-7 text-white/60">
                Login gate access for Taurus AI Calling system. Secure entry
                before support call interface, dial pad, SMS overlay, and AI
                telecom workflow.
              </p>
            </div>

            <div className="mx-auto flex min-h-[72vh] items-end justify-center">
              <div className="w-full max-w-[380px] rounded-[30px] border border-white/12 bg-white/[0.04] p-4 shadow-[0_18px_80px_rgba(255,255,255,0.06)] backdrop-blur-xl sm:max-w-[420px] sm:p-5">
                <div className="mb-4 text-center">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/55">
                    Secure Entry
                  </div>
                  <h1 className="mt-3 text-[28px] font-semibold tracking-tight text-white sm:text-[34px]">
                    Login AI Call
                    <span className="block">Support Gate</span>
                  </h1>
                  <p className="mt-3 text-sm leading-7 text-white/60">
                    Premium access layer before Taurus AI telecom support
                    interface.
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setShowPassword(true);
                      setError("");
                    }}
                    className="w-full rounded-2xl border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.10)_0%,rgba(255,255,255,0.04)_100%)] px-5 py-4 text-sm font-semibold text-white shadow-[0_14px_40px_rgba(255,255,255,0.05)] transition hover:translate-y-[-1px] hover:bg-white/[0.10]"
                  >
                    Enter Password Gate
                  </button>

                  <button
                    onClick={goDirectCall}
                    className="w-full rounded-2xl border border-white/12 bg-white/[0.03] px-5 py-4 text-sm font-semibold text-white/80 transition hover:bg-white/[0.08]"
                  >
                    Continue To AI Call
                  </button>
                </div>

                <div className="mt-5 text-center text-[11px] uppercase tracking-[0.24em] text-white/35">
                  Nano 3D Access Layer
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 items-end text-[10px] uppercase tracking-[0.26em] text-white/42 sm:text-[11px]">
          <div className="leading-5">
            Local Gate
            <br />
            Not Live Call
          </div>

          <div className="justify-self-center text-center leading-5">
            Secure
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

      {showPassword && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/55 px-4 backdrop-blur-md">
          <div className="w-full max-w-[390px] rounded-[28px] border border-white/12 bg-[linear-gradient(180deg,rgba(18,18,20,0.92)_0%,rgba(10,10,12,0.95)_100%)] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.55)]">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.26em] text-white/45">
                  Password Entry
                </div>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Gate Access
                </h2>
              </div>

              <button
                onClick={() => {
                  setShowPassword(false);
                  setError("");
                  setCode("");
                }}
                className="rounded-full border border-white/12 bg-white/[0.05] px-3 py-2 text-sm text-white/70"
              >
                ✕
              </button>
            </div>

            <label className="mb-2 block text-[11px] uppercase tracking-[0.24em] text-white/48">
              Access Password
            </label>

            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError("");
              }}
              placeholder="Enter Password"
              className="w-full rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-4 text-sm text-white outline-none placeholder:text-white/28 focus:border-white/20"
            />

            <div className="min-h-[24px] pt-3 text-sm text-red-400">{error}</div>

            <button
              onClick={handleEnterGate}
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

function GateScene({ pointer }: { pointer: { x: number; y: number } }) {
  const groupRef = useRef<THREE.Group | null>(null);
  const towerRef = useRef<THREE.Group | null>(null);
  const floorGlowRef = useRef<THREE.Mesh | null>(null);

  useFrame((state) => {
    if (!groupRef.current || !towerRef.current || !floorGlowRef.current) return;

    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      pointer.x * 0.18,
      0.045
    );
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      pointer.y * 0.08,
      0.045
    );

    towerRef.current.rotation.y += 0.0025;
    towerRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.1) * 0.08;

    floorGlowRef.current.position.x = THREE.MathUtils.lerp(
      floorGlowRef.current.position.x,
      pointer.x * 1.1,
      0.06
    );
  });

  return (
    <>
      <AdaptivePixelRatio />
      <fog attach="fog" args={["#000000", 8, 22]} />
      <ambientLight intensity={0.45} color="#ffffff" />
      <directionalLight position={[2, 6, 3]} intensity={0.8} color="#fff5dd" />
      <pointLight position={[0, 1.4, 2.2]} intensity={1.3} color="#d2c1ff" />
      <pointLight position={[-3, 0.5, 1.5]} intensity={0.7} color="#ffffff" />
      <pointLight position={[3, 0.5, 1.5]} intensity={0.7} color="#ffffff" />

      <group ref={groupRef} position={[0, -1.15, 0]}>
        <Floor />
        <group ref={towerRef}>
          <CoreStructure />
        </group>

        <mesh ref={floorGlowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.18, 0]}>
          <circleGeometry args={[1.65, 60]} />
          <meshBasicMaterial
            color="#d8c7ff"
            transparent
            opacity={0.16}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>

      <EffectComposer multisampling={0}>
        <Bloom
          intensity={1.1}
          luminanceThreshold={0.08}
          luminanceSmoothing={0.45}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

function AdaptivePixelRatio() {
  const { gl } = useThree();

  useEffect(() => {
    const apply = () => {
      const mobile = window.innerWidth < 768;
      gl.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.5));
    };

    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, [gl]);

  return null;
}

function Floor() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, 0]}>
        <planeGeometry args={[16, 16]} />
        <meshStandardMaterial color="#050505" roughness={0.9} metalness={0.18} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.19, 0]}>
        <ringGeometry args={[1.1, 2.55, 100]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.08}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.18, 0]}>
        <ringGeometry args={[0.7, 1.02, 80]} />
        <meshBasicMaterial
          color="#cfc5ff"
          transparent
          opacity={0.18}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function CoreStructure() {
  const wiresRef = useRef<THREE.Group | null>(null);

  useFrame((state) => {
    if (!wiresRef.current) return;
    wiresRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.6) * 0.08;
  });

  return (
    <group position={[0, 0, 0]}>
      <Block pos={[-0.8, -0.1, 0.2]} size={[0.38, 1.45, 0.38]} color="#1a1a1d" metal />
      <Block pos={[-0.38, -0.35, -0.15]} size={[0.34, 0.95, 0.34]} color="#d6ccb7" />
      <Block pos={[0.0, 0.18, 0.0]} size={[0.44, 1.95, 0.44]} color="#2e2f33" metal />
      <Block pos={[0.48, -0.38, 0.14]} size={[0.34, 1.05, 0.34]} color="#0f1012" metal />
      <Block pos={[0.92, -0.02, -0.18]} size={[0.42, 1.55, 0.42]} color="#d6ccb7" />

      <GlassBlock pos={[-0.56, 0.1, 0.44]} size={[0.4, 1.2, 0.24]} />
      <GlassBlock pos={[0.62, -0.2, 0.42]} size={[0.36, 1.08, 0.24]} />
      <GlassBlock pos={[0.08, -0.08, 0.65]} size={[0.24, 1.42, 0.22]} />

      <group ref={wiresRef}>
        <WireFrame />
      </group>
    </group>
  );
}

function Block({
  pos,
  size,
  color,
  metal,
}: {
  pos: [number, number, number];
  size: [number, number, number];
  color: string;
  metal?: boolean;
}) {
  return (
    <mesh position={pos}>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        roughness={metal ? 0.28 : 0.6}
        metalness={metal ? 0.72 : 0.15}
      />
    </mesh>
  );
}

function GlassBlock({
  pos,
  size,
}: {
  pos: [number, number, number];
  size: [number, number, number];
}) {
  return (
    <mesh position={pos}>
      <boxGeometry args={size} />
      <meshPhysicalMaterial
        color="#ffffff"
        transparent
        opacity={0.2}
        transmission={0.92}
        roughness={0.1}
        thickness={0.5}
        metalness={0.02}
        reflectivity={0.55}
      />
    </mesh>
  );
}

function WireFrame() {
  const points = useMemo(
    () => [
      new THREE.Vector3(-0.9, -0.25, 0.52),
      new THREE.Vector3(-0.2, -0.25, 0.52),
      new THREE.Vector3(0.05, 0.18, 0.52),
      new THREE.Vector3(0.85, 0.18, 0.52),
      new THREE.Vector3(1.1, -0.1, 0.52),
    ],
    []
  );

  const curve = useMemo(() => new THREE.CatmullRomCurve3(points), [points]);
  const tubeGeom = useMemo(() => new THREE.TubeGeometry(curve, 64, 0.02, 8, false), [curve]);

  return (
    <group>
      <mesh geometry={tubeGeom}>
        <meshBasicMaterial
          color="#d8cbff"
          transparent
          opacity={0.65}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh position={[0.95, 0.48, 0.5]}>
        <sphereGeometry args={[0.06, 18, 18]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh position={[0.55, 0.2, 0.5]}>
        <sphereGeometry args={[0.05, 18, 18]} />
        <meshBasicMaterial
          color="#d8cbff"
          transparent
          opacity={0.76}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}