"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";

type BeatItem = {
  id: number;
  title: string;
  creator: string;
  type: "Ringtone" | "Song";
  duration: string;
  likes: number;
  comments: number;
  monthlyRank?: string;
  src?: string;
};

const beats: BeatItem[] = [
  {
    id: 1,
    title: "Taurus Rise",
    creator: "Taurus Original",
    type: "Ringtone",
    duration: "00:18",
    likes: 128,
    comments: 24,
    monthlyRank: "Top 1",
    src: "/tones/taurus-rise.mp3",
  },
  {
    id: 2,
    title: "Focus Energy",
    creator: "Taurus Original",
    type: "Ringtone",
    duration: "00:22",
    likes: 102,
    comments: 19,
    src: "/tones/focus-energy.mp3",
  },
  {
    id: 3,
    title: "Morning Power",
    creator: "Taurus Original",
    type: "Ringtone",
    duration: "00:16",
    likes: 94,
    comments: 13,
    src: "/tones/morning-power.mp3",
  },
  {
    id: 4,
    title: "Success Alert",
    creator: "Taurus Original",
    type: "Ringtone",
    duration: "00:12",
    likes: 88,
    comments: 11,
    src: "/tones/success.mp3",
  },
  {
    id: 5,
    title: "Calm Flow",
    creator: "Taurus Original",
    type: "Ringtone",
    duration: "00:20",
    likes: 76,
    comments: 9,
    src: "/tones/calm-flow.mp3",
  },
];

export default function TaurusBeatsPage() {
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [selectedBeat, setSelectedBeat] = useState<BeatItem | null>(beats[0]);
  const [selectedFileName, setSelectedFileName] = useState("No file chosen");

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const sortedBeats = useMemo(
    () => [...beats].sort((a, b) => b.likes - a.likes),
    []
  );

  const handlePlay = async (beat: BeatItem) => {
    setSelectedBeat(beat);

    if (!beat.src) {
      alert("This beat file is not uploaded yet.");
      return;
    }

    try {
      if (!audioRef.current) return;

      if (currentId === beat.id) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setCurrentId(null);
        return;
      }

      audioRef.current.pause();
      audioRef.current.src = beat.src;
      audioRef.current.load();

      await audioRef.current.play();
      setCurrentId(beat.id);
    } catch {
      setCurrentId(null);
      alert(
        "Audio file not found or unsupported yet. Please add the real .mp3 file into /public/tones."
      );
    }
  };

  const handleLike = () => {
    alert("Gmail login required to like beats.");
  };

  const handleComment = () => {
    alert("Gmail login required to comment.");
  };

  const handleUpload = () => {
    alert(
      "Upload system will require Gmail login or account creation so likes, comments, and creator data can be stored in database."
    );
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#030617] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(34,211,238,0.12),transparent_24%),radial-gradient(circle_at_85%_18%,rgba(59,130,246,0.10),transparent_20%),linear-gradient(135deg,#020617_0%,#04102b_55%,#020617_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-15 [background-image:linear-gradient(rgba(59,130,246,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.10)_1px,transparent_1px)] [background-size:56px_56px]" />

      <audio ref={audioRef} onEnded={() => setCurrentId(null)} />

      <section className="relative mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <div className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-300 backdrop-blur">
              Taurus Beats
            </div>
            <h1 className="mt-4 text-4xl font-extrabold md:text-5xl">
              Taurus Beats
            </h1>
            <p className="mt-3 max-w-3xl text-white/70">
              Original ringtone and song platform for creators. Upload your own
              work, earn likes and comments, compete monthly, and grow inside the
              Taurus ecosystem.
            </p>
          </div>

          <Link
            href="/"
            className="rounded-xl border border-cyan-400/30 bg-white/5 px-5 py-3 text-sm text-cyan-200 hover:bg-cyan-400/10"
          >
            Back
          </Link>
        </div>

        <div className="mb-8 rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-5 backdrop-blur">
          <h2 className="text-xl font-bold text-cyan-200">Login Requirement</h2>
          <p className="mt-3 text-sm leading-7 text-cyan-50/85 md:text-base">
            Gmail login or account creation is required for likes, comments,
            creator upload tracking, and monthly winner ranking. Without login,
            user identity cannot be saved into the database.
          </p>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-5">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold">Featured Beats</h2>
                  <p className="mt-1 text-sm text-white/60">
                    Small preview cards for ringtone and original song samples
                  </p>
                </div>
                <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
                  Original Only
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {beats.map((beat) => (
                  <div
                    key={beat.id}
                    className="rounded-2xl border border-white/10 bg-[#0b132b]/90 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold text-cyan-300">
                          {beat.title}
                        </h3>
                        <p className="mt-1 text-sm text-white/65">
                          {beat.creator}
                        </p>
                      </div>
                      <div className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/70">
                        {beat.type}
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-white/50">
                      <span>{beat.duration}</span>
                      {beat.monthlyRank ? (
                        <span className="rounded-full bg-amber-400/10 px-2 py-1 text-amber-300">
                          {beat.monthlyRank}
                        </span>
                      ) : (
                        <span>Community</span>
                      )}
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <button
                        onClick={() => handlePlay(beat)}
                        className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-black hover:scale-[1.02]"
                      >
                        {currentId === beat.id ? "Stop" : "Play"}
                      </button>

                      <button
                        onClick={handleLike}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
                      >
                        Like
                      </button>

                      <button
                        onClick={handleComment}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
                      >
                        Comment
                      </button>
                    </div>

                    <div className="mt-4 flex items-center gap-5 text-sm text-white/55">
                      <span>👍 {beat.likes}</span>
                      <span>💬 {beat.comments}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-6 backdrop-blur">
              <h2 className="text-2xl font-bold text-cyan-200">
                Upload Your Own Beat
              </h2>
              <p className="mt-3 text-sm leading-7 text-cyan-50/80 md:text-base">
                Original ringtone, beat, or song only. No stolen content, no
                copyrighted uploads without permission.
              </p>

              <div className="mt-5 rounded-2xl border border-white/10 bg-[#071224]/70 p-4">
                <label className="block text-sm font-medium text-white/80">
                  Choose File
                </label>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) =>
                    setSelectedFileName(
                      e.target.files?.[0]?.name || "No file chosen"
                    )
                  }
                  className="mt-3 block w-full text-sm text-white/70 file:mr-4 file:rounded-xl file:border-0 file:bg-cyan-400 file:px-4 file:py-2 file:font-semibold file:text-black"
                />
                <p className="mt-3 text-sm text-white/55">{selectedFileName}</p>

                <button
                  onClick={handleUpload}
                  className="mt-5 rounded-xl bg-cyan-400 px-6 py-3 font-semibold text-black hover:scale-[1.02]"
                >
                  Upload
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <h2 className="text-2xl font-bold">Now Previewing</h2>
              <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-[#071224]/80 p-5">
                <div className="mb-2 text-xs uppercase tracking-[0.28em] text-cyan-300">
                  Selected Beat
                </div>
                <h3 className="text-2xl font-bold text-cyan-200">
                  {selectedBeat?.title || "No beat selected"}
                </h3>
                <p className="mt-2 text-sm text-white/65">
                  {selectedBeat?.creator || "Choose a beat from the left side"}
                </p>

                <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-2/5 rounded-full bg-cyan-400" />
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    onClick={() => selectedBeat && handlePlay(selectedBeat)}
                    className="rounded-xl bg-cyan-400 px-5 py-2.5 font-semibold text-black"
                  >
                    {currentId === selectedBeat?.id ? "Stop" : "Play Preview"}
                  </button>

                  <button
                    onClick={handleLike}
                    className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-white/85"
                  >
                    Like
                  </button>

                  <button
                    onClick={handleComment}
                    className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-white/85"
                  >
                    Comment
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <h2 className="text-2xl font-bold">Community Rules</h2>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-white/70">
                <li>• Gmail login or account required for likes and comments</li>
                <li>• Original content only</li>
                <li>• No free use of creator work without permission</li>
                <li>• Popular tracks can become top monthly winners</li>
                <li>• If buyers are interested, creators can sell their work</li>
              </ul>
            </div>

            <div className="rounded-3xl border border-amber-400/20 bg-amber-400/10 p-5 backdrop-blur">
              <h2 className="text-2xl font-bold text-amber-200">
                Monthly Winner System
              </h2>
              <p className="mt-4 text-sm leading-7 text-amber-50/85">
                The most liked and most commented creator each month can receive
                a reward. If a beat or song becomes popular and a buyer is
                interested, it can become a sellable creator product. Public use
                without creator permission should not be allowed.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <h2 className="text-2xl font-bold">Top Creators This Month</h2>
              <div className="mt-4 space-y-3">
                {sortedBeats.slice(0, 3).map((beat, index) => (
                  <div
                    key={beat.id}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#0b132b]/80 px-4 py-3"
                  >
                    <div>
                      <div className="text-sm text-white/50">#{index + 1}</div>
                      <div className="font-semibold text-cyan-200">
                        {beat.creator}
                      </div>
                      <div className="text-sm text-white/60">{beat.title}</div>
                    </div>
                    <div className="text-right text-sm text-white/60">
                      <div>👍 {beat.likes}</div>
                      <div>💬 {beat.comments}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 text-center text-sm text-white/40">
          Taurus Beats • Creator Platform • Monthly Reward System
        </div>
      </section>
    </main>
  );
}