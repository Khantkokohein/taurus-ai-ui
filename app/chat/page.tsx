"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type FriendStatus = "friend" | "request" | "not_connected" | "blocked";
type PrivacyMode = "everyone" | "friends" | "request_only";

type ChatUser = {
  id: number;
  name: string;
  preview: string;
  online: boolean;
  friendStatus: FriendStatus;
  privacy: PrivacyMode;
};

type Message = {
  id: number;
  sender: "me" | "other";
  text: string;
  time: string;
  status?: "pending" | "sent" | "seen";
};

const chatUsers: ChatUser[] = [
  {
    id: 1,
    name: "Taurus User 01",
    preview: "Hello, how are you?",
    online: true,
    friendStatus: "friend",
    privacy: "friends",
  },
  {
    id: 2,
    name: "Taurus User 02",
    preview: "Can we chat later?",
    online: false,
    friendStatus: "request",
    privacy: "request_only",
  },
  {
    id: 3,
    name: "Taurus User 03",
    preview: "I want to know more.",
    online: true,
    friendStatus: "not_connected",
    privacy: "request_only",
  },
];

const initialMessages: Record<number, Message[]> = {
  1: [
    {
      id: 1,
      sender: "other",
      text: "Hello, welcome to Taurus Chat.",
      time: "09:10",
    },
    {
      id: 2,
      sender: "me",
      text: "Hi, nice to meet you.",
      time: "09:12",
      status: "seen",
    },
  ],
  2: [
    {
      id: 1,
      sender: "other",
      text: "Can we chat later?",
      time: "08:32",
    },
  ],
  3: [
    {
      id: 1,
      sender: "other",
      text: "I want to know more about Taurus.",
      time: "10:02",
    },
  ],
};

function getStatusLabel(status?: "pending" | "sent" | "seen") {
  if (status === "pending") return "Pending";
  if (status === "sent") return "Sent";
  if (status === "seen") return "Seen";
  return "";
}

function getPrivacyLabel(mode: PrivacyMode) {
  if (mode === "everyone") return "Everyone can message";
  if (mode === "friends") return "Friends only";
  return "Request first";
}

function getFriendButtonLabel(status: FriendStatus) {
  if (status === "friend") return "Friends";
  if (status === "request") return "Requested";
  if (status === "blocked") return "Blocked";
  return "Add Friend";
}

export default function ChatPage() {
  const [selectedChatId, setSelectedChatId] = useState<number>(1);
  const [messageText, setMessageText] = useState("");
  const [messagesByChat, setMessagesByChat] =
    useState<Record<number, Message[]>>(initialMessages);
  const [users, setUsers] = useState<ChatUser[]>(chatUsers);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedChatId) || users[0],
    [selectedChatId, users]
  );

  const currentMessages = messagesByChat[selectedChatId] || [];

  const handleLoginNotice = () => {
    alert(
      "Gmail login required for real user identity, friend list, privacy control, message history, likes, comments, and database sync."
    );
  };

  const handleSend = () => {
    if (
      selectedUser.friendStatus !== "friend" &&
      selectedUser.privacy !== "everyone"
    ) {
      alert("This user requires friend approval or message request first.");
      return;
    }

    const text = messageText.trim();
    if (!text) return;

    const nextMessage: Message = {
      id: Date.now(),
      sender: "me",
      text,
      time: "Now",
      status: "pending",
    };

    setMessagesByChat((prev) => ({
      ...prev,
      [selectedChatId]: [...(prev[selectedChatId] || []), nextMessage],
    }));

    setMessageText("");

    setTimeout(() => {
      setMessagesByChat((prev) => ({
        ...prev,
        [selectedChatId]: (prev[selectedChatId] || []).map((msg) =>
          msg.id === nextMessage.id ? { ...msg, status: "sent" } : msg
        ),
      }));
    }, 700);

    setTimeout(() => {
      setMessagesByChat((prev) => ({
        ...prev,
        [selectedChatId]: (prev[selectedChatId] || []).map((msg) =>
          msg.id === nextMessage.id ? { ...msg, status: "seen" } : msg
        ),
      }));
    }, 1500);
  };

  const handleFriendAction = () => {
    setUsers((prev) =>
      prev.map((user) => {
        if (user.id !== selectedChatId) return user;

        if (user.friendStatus === "not_connected") {
          alert("Friend request sent.");
          return { ...user, friendStatus: "request" };
        }

        if (user.friendStatus === "request") {
          alert("Friend request pending.");
          return user;
        }

        if (user.friendStatus === "friend") {
          alert("Already in friend list.");
          return user;
        }

        return user;
      })
    );
  };

  const handlePrivacyInfo = () => {
    alert(
      `Privacy: ${getPrivacyLabel(
        selectedUser.privacy
      )}. Friend system controls who can message this user.`
    );
  };

  const handleBlock = () => {
    alert("Block system will stop direct messages and future friend actions.");
  };

  const canMessage =
    selectedUser.friendStatus === "friend" || selectedUser.privacy === "everyone";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#030617] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(34,211,238,0.11),transparent_23%),radial-gradient(circle_at_84%_14%,rgba(99,102,241,0.10),transparent_22%),linear-gradient(135deg,#020617_0%,#050f2b_58%,#020617_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-15 [background-image:linear-gradient(rgba(59,130,246,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.08)_1px,transparent_1px)] [background-size:60px_60px]" />

      <section className="relative mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-300">
              Taurus Chat
            </div>
            <h1 className="mt-4 text-4xl font-extrabold md:text-5xl">
              Friend & Privacy Chat UI
            </h1>
            <p className="mt-3 max-w-3xl text-white/68">
              Premium text-only chat layout with friend request control, privacy
              settings, and Gmail-based identity flow.
            </p>
          </div>

          <Link
            href="/"
            className="rounded-xl border border-cyan-400/30 bg-white/5 px-5 py-3 text-sm text-cyan-200 hover:bg-cyan-400/10"
          >
            Back
          </Link>
        </div>

        <div className="mb-6 rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-5 backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-cyan-200">
                Gmail Login Needed
              </h2>
              <p className="mt-2 text-sm leading-7 text-cyan-50/85 md:text-base">
                Gmail login is required for friend requests, privacy control,
                identity tracking, message history, and future database sync.
              </p>
            </div>

            <button
              onClick={handleLoginNotice}
              className="rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-black hover:scale-[1.02]"
            >
              Login Info
            </button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.86fr_1.14fr]">
          <div className="rounded-[30px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold">People</h2>
              <button
                onClick={handleLoginNotice}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
              >
                Discover
              </button>
            </div>

            <div className="space-y-3">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => setSelectedChatId(user.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    selectedChatId === user.id
                      ? "border-cyan-400/35 bg-cyan-400/10"
                      : "border-white/10 bg-[#0b132b]/70 hover:border-cyan-400/25 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white">{user.name}</h3>
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            user.online ? "bg-emerald-400" : "bg-white/20"
                          }`}
                        />
                      </div>
                      <p className="mt-1 text-sm text-white/55">{user.preview}</p>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-white/35">
                        {user.online ? "Online" : "Offline"}
                      </div>
                      <div className="mt-2 text-[11px] text-cyan-300/80">
                        {getFriendButtonLabel(user.friendStatus)}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-white/5 backdrop-blur-xl">
            <div className="border-b border-white/10 px-5 py-4">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold">{selectedUser.name}</h2>
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        selectedUser.online ? "bg-emerald-400" : "bg-white/20"
                      }`}
                    />
                  </div>
                  <p className="mt-1 text-sm text-white/55">
                    {selectedUser.online ? "Online now" : "Offline"} •{" "}
                    {getPrivacyLabel(selectedUser.privacy)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleFriendAction}
                    className="rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-black hover:scale-[1.02]"
                  >
                    {getFriendButtonLabel(selectedUser.friendStatus)}
                  </button>

                  <button
                    onClick={handlePrivacyInfo}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/80 hover:bg-white/10"
                  >
                    Privacy
                  </button>

                  <button
                    onClick={handleBlock}
                    className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-2.5 text-sm text-red-200 hover:bg-red-400/15"
                  >
                    Block
                  </button>
                </div>
              </div>
            </div>

            <div className="h-[470px] overflow-y-auto px-5 py-5">
              {!canMessage && (
                <div className="mb-5 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm leading-7 text-amber-50/85">
                  This user cannot be messaged directly right now. Send a friend
                  request first or wait for approval based on privacy settings.
                </div>
              )}

              <div className="space-y-4">
                {currentMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.sender === "me" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[72%] rounded-2xl px-4 py-3 ${
                        msg.sender === "me"
                          ? "bg-cyan-400 text-black shadow-[0_0_18px_rgba(34,211,238,0.14)]"
                          : "border border-white/10 bg-[#0b132b]/85 text-white"
                      }`}
                    >
                      <p className="text-sm leading-7">{msg.text}</p>
                      <div
                        className={`mt-2 flex items-center justify-end gap-2 text-[11px] ${
                          msg.sender === "me" ? "text-black/70" : "text-white/40"
                        }`}
                      >
                        <span>{msg.time}</span>
                        {msg.sender === "me" && (
                          <span>{getStatusLabel(msg.status)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-white/10 px-5 py-4">
              <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-white/40">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  Friend System
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  Privacy Control
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  Text Only
                </span>
              </div>

              <div className="flex items-center gap-3">
                <input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={
                    canMessage
                      ? "Write a message..."
                      : "Friend approval required before messaging..."
                  }
                  disabled={!canMessage}
                  className="h-12 flex-1 rounded-xl border border-white/10 bg-[#0b132b]/80 px-4 text-white outline-none placeholder:text-white/35 disabled:cursor-not-allowed disabled:opacity-50"
                />

                <button
                  onClick={handleSend}
                  disabled={!canMessage}
                  className="rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-black hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Send
                </button>
              </div>

              <div className="mt-3 text-xs text-white/35">
                Premium simple messenger style • Gmail identity recommended •
                Friend request and privacy ready
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}