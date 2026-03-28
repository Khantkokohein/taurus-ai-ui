"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const DEMO_USERNAME = "logingatetaurus@gmail.com";
const DEMO_PASSWORD = "taurusworld";
const DEMO_COOKIE = "taurus_demo_session";

export default function LoginGatePage() {
  const router = useRouter();

  const [username, setUsername] = useState(DEMO_USERNAME);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [loading, setLoading] = useState(false);

  function handleLogin() {
    setLoading(true);

    document.cookie = `${DEMO_COOKIE}=1; path=/; max-age=86400; samesite=lax`;

    window.setTimeout(() => {
      router.push("/ai-call");
    }, 300);
  }

  return (
    <main
      className="min-h-screen bg-[#05070b] text-white"
      style={{
        backgroundImage:
          "linear-gradient(rgba(5,7,11,0.58), rgba(5,7,11,0.72)), url('/images/taurus-workspace.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="mx-auto flex min-h-screen max-w-[1600px] items-center justify-center px-4 py-8">
        <div className="relative w-full max-w-[1400px] overflow-hidden rounded-[40px] border border-cyan-200/20 bg-white/[0.06] shadow-[0_0_80px_rgba(96,232,255,0.08)] backdrop-blur-2xl">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(118,237,255,0.15),transparent_32%),radial-gradient(circle_at_bottom,rgba(63,119,255,0.12),transparent_28%)]" />

          <div className="relative flex min-h-[86vh] items-center justify-center px-6 py-10 md:px-12">
            <div className="absolute left-8 top-8 flex items-center gap-3">
              <div className="grid grid-cols-3 gap-1">
                {Array.from({ length: 9 }).map((_, i) => (
                  <span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-cyan-100/90 shadow-[0_0_10px_rgba(125,241,255,0.9)]"
                  />
                ))}
              </div>
              <div className="text-[28px] font-semibold tracking-[0.24em] text-cyan-50">
                TAURUS
              </div>
            </div>

            <div className="w-full max-w-[620px] rounded-[34px] border border-cyan-100/15 bg-white/[0.08] px-6 py-8 shadow-[0_20px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl md:px-10 md:py-10">
              <div className="mb-7 text-center">
                <h1 className="text-4xl font-semibold tracking-tight text-white">
                  Please Log In
                </h1>
                <p className="mt-2 text-base text-white/55">
                  to your Taurus workspace
                </p>
              </div>

              <div className="space-y-4">
                <Label>Username or Email</Label>
                <GlassInput
                  value={username}
                  onChange={setUsername}
                  placeholder="Email or Username"
                  icon="user"
                />

                <Label>Password</Label>
                <GlassInput
                  value={password}
                  onChange={setPassword}
                  placeholder="Password"
                  type="password"
                  icon="lock"
                />

                <button
                  type="button"
                  onClick={handleLogin}
                  disabled={loading}
                  className="mt-5 flex h-14 w-full items-center justify-center rounded-[22px] border border-cyan-200/15 bg-[linear-gradient(180deg,rgba(123,206,255,0.45),rgba(61,134,255,0.38))] text-xl font-medium text-white shadow-[0_0_30px_rgba(100,190,255,0.35)] transition hover:scale-[1.01] disabled:opacity-70"
                >
                  {loading ? "Opening..." : "Sign In"}
                </button>
              </div>

              <div className="mt-6 text-center text-sm text-white/55">
                <div>$ Demo access only</div>
                <div className="mt-2">
                  Username:{" "}
                  <span className="text-cyan-200">{DEMO_USERNAME}</span>
                </div>
                <div className="mt-1">
                  Password:{" "}
                  <span className="text-cyan-200">{DEMO_PASSWORD}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-1 text-sm font-medium tracking-wide text-white/65">
      {children}
    </div>
  );
}

function GlassInput({
  value,
  onChange,
  placeholder,
  type = "text",
  icon,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  icon: "user" | "lock";
}) {
  return (
    <div className="flex h-16 items-center gap-3 rounded-[22px] border border-cyan-200/25 bg-white/[0.08] px-4 shadow-[0_0_22px_rgba(126,241,255,0.18)]">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-cyan-100/90">
        {icon === "user" ? <UserIcon /> : <LockIcon />}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        placeholder={placeholder}
        className="w-full bg-transparent text-lg text-white outline-none placeholder:text-white/45"
      />
    </div>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2">
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="8" r="4" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 1 1 8 0v3" />
    </svg>
  );
}