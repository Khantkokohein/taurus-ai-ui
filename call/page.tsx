"use client";

import { ChangeEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Noto_Sans_Myanmar } from "next/font/google";

const mmFont = Noto_Sans_Myanmar({
  subsets: ["myanmar"],
  weight: ["400", "500", "600", "700"],
});

type MainTab = "recents" | "contacts" | "keypad" | "voicemail";
type Screen =
  | "tabs"
  | "callInfo"
  | "contactDetail"
  | "message"
  | "calling"
  | "inCall";

type CallType = "incoming" | "outgoing" | "missed";
type RecentFilter = "all" | "missed";

type RecentItem = {
  id: number;
  name: string;
  number: string;
  type: CallType;
  line: string;
  dateLabel: string;
  timeLabel: string;
  duration: string;
};

type ContactItem = {
  id: number;
  name: string;
  number: string;
  subtitle?: string;
};

type MessageItem = {
  id: number;
  sender: "me" | "them";
  text?: string;
  image?: string;
  time: string;
};

type RingtoneItem = {
  id: string;
  label: string;
  file: string;
};

const STORAGE_RECENTS = "taurus_phone_recents_v5";
const STORAGE_CONTACTS = "taurus_phone_contacts_v5";
const STORAGE_MESSAGES = "taurus_phone_messages_v5";
const STORAGE_LAST_DIAL = "taurus_phone_last_dial_v5";
const STORAGE_RINGTONE = "taurus_phone_ringtone_v5";

const ringtoneOptions: RingtoneItem[] = [
  { id: "taurus-classic", label: "Taurus Classic", file: "/ringtones/taurus-classic.wav" },
  { id: "taurus-glow", label: "Taurus Glow", file: "/ringtones/taurus-glow.wav" },
  { id: "taurus-sky", label: "Taurus Sky", file: "/ringtones/taurus-sky.wav" },
  { id: "taurus-prime", label: "Taurus Prime", file: "/ringtones/taurus-prime.wav" },
  { id: "taurus-spark", label: "Taurus Spark", file: "/ringtones/taurus-spark.wav" },
  { id: "taurus-wave", label: "Taurus Wave", file: "/ringtones/taurus-wave.wav" },
  { id: "taurus-night", label: "Taurus Night", file: "/ringtones/taurus-night.wav" },
  { id: "taurus-rise", label: "Taurus Rise", file: "/ringtones/taurus-rise.wav" },
  { id: "taurus-soft", label: "Taurus Soft", file: "/ringtones/taurus-soft.wav" },
  { id: "taurus-alert", label: "Taurus Alert", file: "/ringtones/taurus-alert.wav" },
];

const commonEmoji = [
  "😀", "😁", "😂", "🤣", "😊", "😍", "😘", "😎",
  "🙂", "😉", "🥰", "😇", "😌", "🤔", "😴", "😭",
  "😡", "👍", "👎", "🙏", "👏", "💯", "❤️", "🔥",
  "✨", "🎉", "🎁", "📞", "💬", "📷", "🎵", "🚀",
  "🌙", "⭐", "☀️", "🍎", "⚽", "🚗", "💡", "🤍",
];

const keypadRows = [
  [
    { key: "1", sub: "" },
    { key: "2", sub: "ABC" },
    { key: "3", sub: "DEF" },
  ],
  [
    { key: "4", sub: "GHI" },
    { key: "5", sub: "JKL" },
    { key: "6", sub: "MNO" },
  ],
  [
    { key: "7", sub: "PQRS" },
    { key: "8", sub: "TUV" },
    { key: "9", sub: "WXYZ" },
  ],
  [
    { key: "*", sub: "" },
    { key: "0", sub: "+" },
    { key: "#", sub: "" },
  ],
];

const keyboardRowsEn = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["⇧", "z", "x", "c", "v", "b", "n", "m", "⌫"],
];

const keyboardRowsMm = [
  ["ဆ", "တ", "န", "မ", "အ", "ပ", "က", "သ", "စ", "ဟ"],
  ["ေ", "ျ", "ိ", "ီ", "ာ", "ု", "ူ", "့", "း", "လ"],
  ["⇧", "ဝ", "၈", "၁", "၂", "၃", "၄", "င", "ဉ", "⌫"],
];

function cn(...items: Array<string | false | null | undefined>) {
  return items.filter(Boolean).join(" ");
}

function getNowTime() {
  return new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function getNowDay() {
  return new Date().toLocaleDateString([], { weekday: "long" });
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWrite(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function IconWrap({
  children,
  active = false,
}: {
  children: ReactNode;
  active?: boolean;
}) {
  return (
    <div className={cn("w-7 h-7 flex items-center justify-center", active ? "text-[#0A84FF]" : "text-[#111827]")}>
      {children}
    </div>
  );
}

function RecentsIcon({ active = false }: { active?: boolean }) {
  return (
    <IconWrap active={active}>
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 7v5l3 2" />
        <circle cx="12" cy="12" r="8" />
      </svg>
    </IconWrap>
  );
}

function ContactsIcon({ active = false }: { active?: boolean }) {
  return (
    <IconWrap active={active}>
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 19c1.5-3 4.3-4.5 7-4.5s5.5 1.5 7 4.5" />
      </svg>
    </IconWrap>
  );
}

function KeypadIcon({ active = false }: { active?: boolean }) {
  return (
    <IconWrap active={active}>
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
        <circle cx="6" cy="6" r="1.8" />
        <circle cx="12" cy="6" r="1.8" />
        <circle cx="18" cy="6" r="1.8" />
        <circle cx="6" cy="12" r="1.8" />
        <circle cx="12" cy="12" r="1.8" />
        <circle cx="18" cy="12" r="1.8" />
        <circle cx="6" cy="18" r="1.8" />
        <circle cx="12" cy="18" r="1.8" />
        <circle cx="18" cy="18" r="1.8" />
      </svg>
    </IconWrap>
  );
}

function VoicemailIcon({ active = false }: { active?: boolean }) {
  return (
    <IconWrap active={active}>
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="7.5" cy="12" r="3.5" />
        <circle cx="16.5" cy="12" r="3.5" />
        <path d="M11 15.5h2" />
      </svg>
    </IconWrap>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="6" />
      <path d="M20 20l-4-4" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10v6" />
      <circle cx="12" cy="7" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function PhoneGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
      <path d="M6.6 2.8c.6-.6 1.5-.8 2.2-.5l2 1c.8.4 1.2 1.3 1 2.2l-.5 2.2c-.1.6 0 1.1.4 1.5l3.1 3.1c.4.4 1 .6 1.5.4l2.2-.5c.8-.2 1.8.2 2.2 1l1 2c.4.7.2 1.6-.5 2.2l-1.5 1.5c-.9.9-2.2 1.2-3.4.9-2.8-.8-5.5-2.6-8.1-5.2C6.9 13.6 5.2 10.9 4.4 8.1c-.3-1.2 0-2.5.9-3.4l1.3-1.9z" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 18l-2 2V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6z" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="6" width="12" height="12" rx="2" />
      <path d="M15 10l6-3v10l-6-3z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M4 7l8 6 8-6" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="4" width="6" height="10" rx="3" />
      <path d="M6 11a6 6 0 0 0 12 0M12 17v3M9 20h6" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 8h3l2-2h6l2 2h3v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

export default function Home() {
  const [mainTab, setMainTab] = useState<MainTab>("keypad");
  const [screen, setScreen] = useState<Screen>("tabs");
  const [recentFilter, setRecentFilter] = useState<RecentFilter>("all");

  const [recents, setRecents] = useState<RecentItem[]>([]);
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [messagesMap, setMessagesMap] = useState<Record<string, MessageItem[]>>({});

  const [selectedRecent, setSelectedRecent] = useState<RecentItem | null>(null);
  const [selectedContact, setSelectedContact] = useState<ContactItem | null>(null);
  const [selectedChatName, setSelectedChatName] = useState("");

  const [dialNumber, setDialNumber] = useState("");
  const [searchText, setSearchText] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [showKeyboard, setShowKeyboard] = useState(true);
  const [showEmoji, setShowEmoji] = useState(false);
  const [keyboardLang, setKeyboardLang] = useState<"en" | "mm">("en");

  const [editingRecents, setEditingRecents] = useState(false);

  const [showAddContact, setShowAddContact] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [newContactNumber, setNewContactNumber] = useState("");

  const [callSeconds, setCallSeconds] = useState(0);

  const [rowOffsets, setRowOffsets] = useState<Record<number, number>>({});
  const dragRef = useRef<{ id: number | null; startX: number; startOffset: number }>({
    id: null,
    startX: 0,
    startOffset: 0,
  });

  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [isHold, setIsHold] = useState(false);
  const [showInCallKeypad, setShowInCallKeypad] = useState(false);
  const [showAddCallState, setShowAddCallState] = useState(false);
  const [showInCallContacts, setShowInCallContacts] = useState(false);

  const [selectedRingtone, setSelectedRingtone] = useState<string>("taurus-classic");
  const ringtoneAudioRef = useRef<HTMLAudioElement | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setRecents(safeRead<RecentItem[]>(STORAGE_RECENTS, []));
    setContacts(safeRead<ContactItem[]>(STORAGE_CONTACTS, []));
    setMessagesMap(safeRead<Record<string, MessageItem[]>>(STORAGE_MESSAGES, {}));
    setDialNumber(safeRead<string>(STORAGE_LAST_DIAL, ""));
    setSelectedRingtone(safeRead<string>(STORAGE_RINGTONE, "taurus-classic"));
  }, []);

  useEffect(() => {
    safeWrite(STORAGE_RECENTS, recents);
  }, [recents]);

  useEffect(() => {
    safeWrite(STORAGE_CONTACTS, contacts);
  }, [contacts]);

  useEffect(() => {
    const textOnlyMessages: Record<string, MessageItem[]> = {};
    Object.entries(messagesMap).forEach(([key, list]) => {
      textOnlyMessages[key] = list.filter((item) => !item.image);
    });
    safeWrite(STORAGE_MESSAGES, textOnlyMessages);
  }, [messagesMap]);

  useEffect(() => {
    safeWrite(STORAGE_LAST_DIAL, dialNumber);
  }, [dialNumber]);

  useEffect(() => {
    safeWrite(STORAGE_RINGTONE, selectedRingtone);
  }, [selectedRingtone]);

  useEffect(() => {
    if (screen !== "inCall") return;
    const timer = setInterval(() => {
      setCallSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [screen]);

  useEffect(() => {
    if (!editingRecents) {
      setRowOffsets({});
    }
  }, [editingRecents]);

  useEffect(() => {
    return () => {
      if (ringtoneAudioRef.current) {
        ringtoneAudioRef.current.pause();
        ringtoneAudioRef.current.currentTime = 0;
      }
    };
  }, []);

  const filteredRecents = useMemo(() => {
    if (recentFilter === "missed") {
      return recents.filter((item) => item.type === "missed");
    }
    return recents;
  }, [recents, recentFilter]);

  const selectedMessages = messagesMap[selectedChatName] ?? [];

  const filteredContacts = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter(
      (c) => c.name.toLowerCase().includes(q) || c.number.toLowerCase().includes(q)
    );
  }, [contacts, searchText]);

  const groupedContacts = useMemo(() => {
    const grouped: Record<string, ContactItem[]> = {};
    filteredContacts.forEach((item) => {
      const first = item.name.trim().charAt(0).toUpperCase() || "#";
      const letter = /[A-Z]/.test(first) ? first : "#";
      if (!grouped[letter]) grouped[letter] = [];
      grouped[letter].push(item);
    });
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredContacts]);

  const selectedInitial = useMemo(() => {
    const target = selectedContact?.name || selectedRecent?.name || selectedChatName || "T";
    return target.charAt(0).toUpperCase();
  }, [selectedContact, selectedRecent, selectedChatName]);

  const currentRingtoneFile =
    ringtoneOptions.find((r) => r.id === selectedRingtone)?.file ?? ringtoneOptions[0].file;

  const findContactByNumber = (number: string) => {
    return contacts.find((c) => c.number === number) || null;
  };

  const findContactName = (number: string) => {
    return findContactByNumber(number)?.name ?? number;
  };

  const stopRingtone = () => {
    if (ringtoneAudioRef.current) {
      ringtoneAudioRef.current.pause();
      ringtoneAudioRef.current.currentTime = 0;
    }
  };

  const playRingtone = () => {
    stopRingtone();
    try {
      const audio = new Audio(currentRingtoneFile);
      audio.loop = true;
      audio.volume = 0.7;
      ringtoneAudioRef.current = audio;
      audio.play().catch(() => {});
    } catch {}
  };

  const startCallFromNumber = (number: string, explicitName?: string, type: CallType = "outgoing") => {
    const realName = explicitName || findContactName(number);
    const newRecent: RecentItem = {
      id: Date.now(),
      name: realName,
      number,
      type,
      line: "phone",
      dateLabel: getNowDay(),
      timeLabel: getNowTime(),
      duration: "00:00",
    };

    setSelectedRecent(newRecent);
    setRecents((prev) => [newRecent, ...prev]);
    setCallSeconds(0);
    setIsMuted(false);
    setIsSpeaker(false);
    setIsHold(false);
    setShowInCallKeypad(false);
    setShowAddCallState(false);
    setShowInCallContacts(false);
    setScreen("calling");

    playRingtone();

    setTimeout(() => {
      stopRingtone();
      setScreen("inCall");
    }, 1100);
  };

  const openContactDetail = (contact: ContactItem) => {
    setSelectedContact(contact);
    setScreen("contactDetail");
  };

  const openRecentInfo = (item: RecentItem) => {
    setSelectedRecent(item);
    const linkedContact = findContactByNumber(item.number);
    setSelectedContact(linkedContact);
    setScreen("callInfo");
  };

  const openMessage = (name: string) => {
    setSelectedChatName(name);
    setScreen("message");
    setShowKeyboard(true);
    setShowEmoji(false);
  };

  const appendDial = (digit: string) => {
    if (dialNumber.length >= 18) return;
    setDialNumber((prev) => prev + digit);
  };

  const deleteDial = () => {
    setDialNumber((prev) => prev.slice(0, -1));
  };

  const deleteRecent = (id: number) => {
    setRecents((prev) => prev.filter((item) => item.id !== id));
    if (selectedRecent?.id === id) setSelectedRecent(null);
    setRowOffsets((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const sendTextMessage = () => {
    if (!messageInput.trim()) return;
    const newMsg: MessageItem = {
      id: Date.now(),
      sender: "me",
      text: messageInput,
      time: getNowTime(),
    };
    setMessagesMap((prev) => ({
      ...prev,
      [selectedChatName]: [...(prev[selectedChatName] ?? []), newMsg],
    }));
    setMessageInput("");
  };

  const addKeyboardChar = (char: string) => {
    if (char === "⇧") return;
    if (char === "⌫") {
      setMessageInput((prev) => prev.slice(0, -1));
      return;
    }
    setMessageInput((prev) => prev + char);
  };

  const addEmoji = (emoji: string) => {
    setMessageInput((prev) => prev + emoji);
  };

  const openImagePicker = () => {
    fileInputRef.current?.click();
  };

  const handleImagePick = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Image file is too large. Please choose an image under 2MB.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const newMsg: MessageItem = {
        id: Date.now(),
        sender: "me",
        image: String(reader.result),
        time: getNowTime(),
      };
      setMessagesMap((prev) => ({
        ...prev,
        [selectedChatName]: [...(prev[selectedChatName] ?? []), newMsg],
      }));
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const addContact = () => {
    if (!newContactName.trim() || !newContactNumber.trim()) return;

    const contact: ContactItem = {
      id: Date.now(),
      name: newContactName.trim(),
      number: newContactNumber.trim(),
    };

    setContacts((prev) => [contact, ...prev]);
    setNewContactName("");
    setNewContactNumber("");
    setShowAddContact(false);
  };

  const startSwipe = (id: number, clientX: number) => {
    if (!editingRecents) return;
    dragRef.current = {
      id,
      startX: clientX,
      startOffset: rowOffsets[id] ?? 0,
    };
  };

  const moveSwipe = (clientX: number) => {
    const { id, startX, startOffset } = dragRef.current;
    if (id === null) return;

    const dx = clientX - startX;
    const next = Math.max(-96, Math.min(0, startOffset + dx));

    setRowOffsets((prev) => ({
      ...prev,
      [id]: next,
    }));
  };

  const endSwipe = () => {
    const { id } = dragRef.current;
    if (id === null) return;

    const current = rowOffsets[id] ?? 0;
    const snapped = current <= -56 ? -96 : 0;

    setRowOffsets((prev) => ({
      ...prev,
      [id]: snapped,
    }));

    dragRef.current = { id: null, startX: 0, startOffset: 0 };
  };

  const controlButtonClass = (active: boolean) =>
    cn(
      "w-16 h-16 rounded-full border shadow-sm flex items-center justify-center text-[28px] transition",
      active
        ? "bg-[#0A84FF] text-white border-[#0A84FF]"
        : "bg-white text-[#111827] border-black/10"
    );

  return (
 <main
  className="w-screen h-[100dvh] bg-[#EEF2F6] overflow-hidden"
  style={{
    fontFamily:
      '"Noto Sans Myanmar", Inter, system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Segoe UI", sans-serif',
  }}
>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImagePick}
      />

   <div className="relative w-full h-full overflow-hidden bg-white max-w-full sm:max-w-[430px] sm:h-[932px] sm:mx-auto sm:rounded-[42px] sm:shadow-[0_30px_80px_rgba(15,23,42,0.14)] sm:border sm:border-black/5">
        <div className="hidden sm:block absolute top-3 left-1/2 -translate-x-1/2 w-[126px] h-[34px] rounded-full bg-black z-30" />

        <div className="h-full">
          {(screen === "tabs" || screen === "callInfo" || screen === "contactDetail") && (
            <div className="h-full flex flex-col bg-[#FAFBFD] text-[#111827]">
              <div className="px-4 sm:px-5 pt-[max(env(safe-area-inset-top),18px)] sm:pt-14 pb-3 flex items-center justify-between">
                {screen === "callInfo" || screen === "contactDetail" ? (
                  <>
                    <button
                      onClick={() => setScreen("tabs")}
                      className="w-11 h-11 rounded-full bg-white border border-black/10 shadow-sm flex items-center justify-center"
                    >
                      <BackIcon />
                    </button>
                    <div className="text-[18px] font-semibold">
                      {screen === "callInfo" ? "Call Info" : "Contact"}
                    </div>
                    <button className="h-11 px-4 rounded-full bg-white border border-black/10 text-[16px] font-semibold shadow-sm">
                      Edit
                    </button>
                  </>
                ) : (
                  <>
                    <div className="text-[22px] sm:text-[24px] font-semibold">
                      {mainTab === "recents"
                        ? "Phone"
                        : mainTab === "contacts"
                        ? "Contacts"
                        : mainTab === "keypad"
                        ? ""
                        : "Contact Us"}
                    </div>

                    {mainTab === "recents" && (
                      <button
                        onClick={() => setEditingRecents((prev) => !prev)}
                        className="h-11 px-4 rounded-full bg-white border border-black/10 text-[16px] font-semibold shadow-sm"
                      >
                        {editingRecents ? "Done" : "Edit"}
                      </button>
                    )}

                    {mainTab === "contacts" && (
                      <button
                        onClick={() => setShowAddContact(true)}
                        className="w-11 h-11 rounded-full bg-white border border-black/10 shadow-sm flex items-center justify-center"
                      >
                        <PlusIcon />
                      </button>
                    )}

                    {mainTab === "keypad" && (
                      <select
                        value={selectedRingtone}
                        onChange={(e) => setSelectedRingtone(e.target.value)}
                        className="h-11 max-w-[170px] rounded-full bg-white border border-black/10 text-[14px] px-3 shadow-sm outline-none"
                      >
                        {ringtoneOptions.map((tone) => (
                          <option key={tone.id} value={tone.id}>
                            {tone.label}
                          </option>
                        ))}
                      </select>
                    )}

                    {mainTab === "voicemail" && <div className="w-11" />}
                  </>
                )}
              </div>

              {screen === "tabs" && mainTab === "recents" && (
                <>
                  <div className="px-4 sm:px-5">
                    <div className="w-full h-14 rounded-full bg-white border border-black/10 p-1 shadow-sm flex items-center">
                      <button
                        onClick={() => setRecentFilter("all")}
                        className={cn(
                          "flex-1 h-full rounded-full text-[17px] font-semibold",
                          recentFilter === "all" ? "bg-[#111827] text-white" : "text-[#6B7280]"
                        )}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setRecentFilter("missed")}
                        className={cn(
                          "flex-1 h-full rounded-full text-[17px] font-semibold",
                          recentFilter === "missed" ? "bg-[#111827] text-white" : "text-[#6B7280]"
                        )}
                      >
                        Missed
                      </button>
                    </div>
                  </div>

                  <div
                    className="flex-1 overflow-y-auto px-4 sm:px-5 pt-4"
                    style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 104px)" }}
                  >
                    {filteredRecents.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-center">
                        <div>
                          <div className="text-[22px] font-semibold text-[#111827]">
                            {recentFilter === "missed" ? "No Missed Calls" : "No Recent Calls"}
                          </div>
                          <div className="text-[16px] text-[#6B7280] mt-2">
                            {recentFilter === "missed"
                              ? "Missed calls will appear here."
                              : "New call logs will appear here."}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {filteredRecents.map((item) => {
                          const offset = rowOffsets[item.id] ?? 0;
                          return (
                            <div key={item.id} className="relative overflow-hidden rounded-[24px]">
                              {editingRecents && (
                                <div className="absolute inset-y-0 right-0 w-24 flex items-center justify-center">
                                  <button
                                    onClick={() => deleteRecent(item.id)}
                                    className="h-[52px] px-5 rounded-full bg-[#FF3B30] text-white text-[15px] font-semibold shadow-sm"
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}

                              <div
                                style={{ transform: `translateX(${offset}px)` }}
                                className="bg-transparent transition-transform duration-200"
                                onPointerDown={(e) => startSwipe(item.id, e.clientX)}
                                onPointerMove={(e) => moveSwipe(e.clientX)}
                                onPointerUp={endSwipe}
                                onPointerCancel={endSwipe}
                              >
                                <div
                                  onClick={() => {
                                    if (editingRecents) return;
                                    startCallFromNumber(item.number, item.name, item.type);
                                  }}
                                  className="cursor-pointer px-1 py-3 border-b border-black/8 flex items-center gap-4 active:opacity-80 bg-[#FAFBFD]"
                                >
                                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#8B7AB8] to-[#5F4B91] text-white flex items-center justify-center text-[26px] font-semibold shrink-0">
                                    {item.name.charAt(0).toUpperCase()}
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <div className={cn("text-[18px] font-semibold truncate", item.type === "missed" && "text-red-500")}>
                                      {item.name}
                                    </div>
                                    <div className="text-[14px] text-[#6B7280] mt-1 flex items-center gap-1">
                                      <span>{item.type === "outgoing" ? "↗" : "↙"}</span>
                                      <span>{item.line}</span>
                                    </div>
                                  </div>

                                  <div className="shrink-0 flex items-center gap-3">
                                    <div className="text-[14px] sm:text-[16px] text-[#6B7280]">{item.dateLabel}</div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openRecentInfo(item);
                                      }}
                                      className="w-11 h-11 rounded-full border border-[#CFE0FF] text-[#0A84FF] bg-white flex items-center justify-center"
                                    >
                                      <InfoIcon />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}

              {screen === "tabs" && mainTab === "keypad" && (
  <div
    className="flex-1 flex flex-col overflow-y-auto"
    style={{ paddingBottom: "120px" }}
  >
                  <div className="px-6 sm:px-8 pt-2 text-center text-[13px] text-[#6B7280]">
                    {ringtoneOptions.find((r) => r.id === selectedRingtone)?.label}
                  </div>

                  <div className="px-5 sm:px-8 pt-3 text-center min-h-[88px] flex items-end justify-center">
                    <div className="text-[32px] sm:text-[36px] font-light tracking-[0.08em] text-[#111827] break-all">
                      {dialNumber}
                    </div>
                  </div>

                  <div className="px-5 sm:px-8 pt-6">
                    <div className="space-y-4 sm:space-y-6">
                      {keypadRows.map((row, rowIndex) => (
                        <div key={rowIndex} className="grid grid-cols-3 gap-4 sm:gap-6">
                          {row.map((item) => (
                            <button
                              key={item.key}
                              onClick={() => appendDial(item.key)}
                              className="group aspect-square rounded-full bg-white border border-black/10 shadow-sm active:scale-[1.05] active:bg-[#F3F4F6] transition-all duration-100 flex flex-col items-center justify-center"
                            >
                              <span className="text-[38px] sm:text-[42px] leading-none font-medium text-[#111827] group-active:scale-110 transition-transform">
                                {item.key}
                              </span>
                              <span className="text-[11px] sm:text-[12px] mt-1 tracking-[0.18em] text-[#6B7280]">
                                {item.sub}
                              </span>
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div
                    className="mt-auto px-5 sm:px-8"
                    style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 24px)" }}
                  >
                    <div className="flex items-center justify-center gap-6 sm:gap-8">
                      <button
                        onClick={playRingtone}
                        className="w-14 h-14 rounded-full bg-white border border-black/10 shadow-sm active:scale-95 transition text-[12px] font-semibold"
                      >
                        Test
                      </button>
                      <button
                        onClick={() => {
                          if (!dialNumber) return;
                          startCallFromNumber(dialNumber, findContactName(dialNumber), "outgoing");
                        }}
                        className="w-24 h-24 rounded-full bg-[#34C759] shadow-[0_10px_25px_rgba(52,199,89,0.35)] text-white flex items-center justify-center active:scale-95 transition"
                      >
                        <PhoneGlyph />
                      </button>
                      <button
                        onClick={deleteDial}
                        className="w-14 h-14 rounded-full bg-white border border-black/10 shadow-sm active:scale-95 transition flex items-center justify-center text-[22px]"
                      >
                        ⌫
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {screen === "tabs" && mainTab === "contacts" && (
                <>
                  <div className="px-4 sm:px-5 pt-1">
                    <div className="h-14 rounded-full bg-white border border-black/10 shadow-sm flex items-center px-5 text-[#6B7280]">
                      <SearchIcon />
                      <input
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        placeholder="Search"
                        className="flex-1 ml-3 bg-transparent outline-none text-[19px] text-[#111827] placeholder:text-[#9CA3AF]"
                      />
                      <div className="text-[#6B7280]">
                        <MicIcon />
                      </div>
                    </div>
                  </div>

                  <div
                    className="flex-1 overflow-y-auto px-4 sm:px-5 pt-4"
                    style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 104px)" }}
                  >
                    {contacts.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-center">
                        <div>
                          <div className="text-[22px] font-semibold text-[#111827]">No Contacts</div>
                          <div className="text-[16px] text-[#6B7280] mt-2">
                            Tap the + button to add a new contact.
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <div className="flex-1">
                          {groupedContacts.map(([letter, list]) => (
                            <div key={letter} className="pb-5">
                              <div className="text-[17px] text-[#6B7280] pb-3">{letter}</div>
                              <div className="border-t border-black/8">
                                {list.map((item) => (
                                  <div
                                    key={item.id}
                                    onClick={() => openContactDetail(item)}
                                    className="cursor-pointer flex items-center gap-4 py-4 border-b border-black/8 active:bg-black/[0.02]"
                                  >
                                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#8B7AB8] to-[#5F4B91] text-white flex items-center justify-center text-[24px] font-semibold shrink-0">
                                      {item.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <div className="text-[18px] font-semibold text-[#111827]">{item.name}</div>
                                      <div className="text-[15px] text-[#6B7280]">{item.number}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="w-6 flex flex-col items-center text-[#0A84FF] text-[11px] font-semibold leading-5 pt-1">
                          {"ABCDEFGHIJKLMNOPQRSTUVWXYZ#".split("").map((x) => (
                            <span key={x}>{x}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {screen === "tabs" && mainTab === "voicemail" && (
                <div
                  className="flex-1 px-4 sm:px-5 pt-6"
                  style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 104px)" }}
                >
                  <div className="rounded-[28px] bg-white border border-black/10 shadow-sm p-6">
                    <div className="text-[22px] font-semibold">Contact Us</div>
                    <div className="text-[16px] text-[#6B7280] mt-4">support@taurus.site</div>
                    <div className="text-[16px] text-[#6B7280] mt-2">For help, support, and service inquiries.</div>
                  </div>
                </div>
              )}

              {screen === "callInfo" && selectedRecent && (
                <div
                  className="flex-1 overflow-y-auto bg-[linear-gradient(180deg,#EEF2F6_0%,#DDE2EA_35%,#F6F8FB_100%)]"
                  style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 104px)" }}
                >
                  <div className="px-4 sm:px-5 pt-3">
                    <div className="pt-8 flex flex-col items-center text-center">
                      <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-[linear-gradient(180deg,#D7DCE6_0%,#BDC5D4_100%)] border border-white/60 shadow-[inset_0_0_20px_rgba(255,255,255,0.7),0_10px_30px_rgba(0,0,0,0.08)] flex items-center justify-center text-[72px] sm:text-[94px] text-white font-semibold">
                        {selectedInitial}
                      </div>

                      <div className="mt-8 text-[32px] sm:text-[38px] font-semibold text-white drop-shadow-sm">
                        {selectedRecent.name}
                      </div>

                      <div className="mt-7 flex items-center gap-3 sm:gap-4">
                        <button
                          onClick={() => openMessage(selectedRecent.name)}
                          className="w-14 h-14 rounded-full bg-white/70 border border-white/80 shadow-sm text-[#111827] flex items-center justify-center"
                        >
                          <MessageIcon />
                        </button>
                        <button
                          onClick={() => startCallFromNumber(selectedRecent.number, selectedRecent.name, "outgoing")}
                          className="w-14 h-14 rounded-full bg-white/70 border border-white/80 shadow-sm text-[#111827] flex items-center justify-center"
                        >
                          <PhoneGlyph />
                        </button>
                        <button className="w-14 h-14 rounded-full bg-white/60 border border-white/80 shadow-sm text-[#111827] flex items-center justify-center">
                          <VideoIcon />
                        </button>
                        <button className="w-14 h-14 rounded-full bg-white/50 border border-white/80 shadow-sm text-[#111827] flex items-center justify-center">
                          <MailIcon />
                        </button>
                      </div>
                    </div>

                    <div className="mt-8 space-y-4 pb-10">
                      <div className="rounded-[28px] bg-white/80 backdrop-blur border border-white/70 shadow-sm px-5 py-5">
                        <div className="flex items-center justify-between text-[18px]">
                          <span>{selectedRecent.type === "missed" ? "Missed Call" : "Call"}</span>
                          <span className="text-[#6B7280]">
                            {selectedRecent.dateLabel} · {selectedRecent.timeLabel}
                          </span>
                        </div>
                        <div className="mt-4 border-t border-black/8 pt-4 flex items-center justify-between text-[18px]">
                          <span>Call History</span>
                          <span className="text-[24px]">›</span>
                        </div>
                      </div>

                      <div className="rounded-[28px] bg-white/80 backdrop-blur border border-white/70 shadow-sm px-5 py-5">
                        <div className="text-[18px] font-semibold">Name</div>
                        <div className="mt-3 text-[18px]">{selectedRecent.name}</div>
                        <div className="mt-4 border-t border-black/8 pt-4 text-[18px]">
                          phone
                          <span className="ml-2 text-[#6B7280]">{selectedRecent.number}</span>
                        </div>
                      </div>

                      <div className="rounded-[28px] bg-white/80 backdrop-blur border border-white/70 shadow-sm px-5 py-5">
                        <div className="text-[18px] font-semibold">Talked Minutes</div>
                        <div className="mt-3 text-[18px] text-[#6B7280]">{selectedRecent.duration}</div>
                        <div className="mt-4 border-t border-black/8 pt-4 flex items-center justify-between">
                          <button
                            onClick={() => openMessage(selectedRecent.name)}
                            className="text-[18px] text-[#0A84FF]"
                          >
                            Message
                          </button>
                          <button
                            onClick={() => startCallFromNumber(selectedRecent.number, selectedRecent.name, "outgoing")}
                            className="text-[18px] text-[#16A34A]"
                          >
                            Call
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {screen === "contactDetail" && selectedContact && (
                <div
                  className="flex-1 overflow-y-auto bg-[linear-gradient(180deg,#EEF2F6_0%,#DDE2EA_35%,#F6F8FB_100%)]"
                  style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 104px)" }}
                >
                  <div className="px-4 sm:px-5 pt-3">
                    <div className="pt-8 flex flex-col items-center text-center">
                      <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-[linear-gradient(180deg,#D7DCE6_0%,#BDC5D4_100%)] border border-white/60 shadow-[inset_0_0_20px_rgba(255,255,255,0.7),0_10px_30px_rgba(0,0,0,0.08)] flex items-center justify-center text-[72px] sm:text-[94px] text-white font-semibold">
                        {selectedInitial}
                      </div>

                      <div className="mt-8 text-[32px] sm:text-[38px] font-semibold text-white drop-shadow-sm">
                        {selectedContact.name}
                      </div>

                      <div className="mt-7 flex items-center gap-3 sm:gap-4">
                        <button
                          onClick={() => openMessage(selectedContact.name)}
                          className="w-14 h-14 rounded-full bg-white/70 border border-white/80 shadow-sm text-[#111827] flex items-center justify-center"
                        >
                          <MessageIcon />
                        </button>
                        <button
                          onClick={() => startCallFromNumber(selectedContact.number, selectedContact.name, "outgoing")}
                          className="w-14 h-14 rounded-full bg-white/70 border border-white/80 shadow-sm text-[#111827] flex items-center justify-center"
                        >
                          <PhoneGlyph />
                        </button>
                        <button className="w-14 h-14 rounded-full bg-white/60 border border-white/80 shadow-sm text-[#111827] flex items-center justify-center">
                          <VideoIcon />
                        </button>
                        <button className="w-14 h-14 rounded-full bg-white/50 border border-white/80 shadow-sm text-[#111827] flex items-center justify-center">
                          <MailIcon />
                        </button>
                      </div>
                    </div>

                    <div className="mt-8 space-y-4 pb-10">
                      <div className="rounded-[28px] bg-white/80 backdrop-blur border border-white/70 shadow-sm px-5 py-5">
                        <div className="text-[18px] font-semibold">Name</div>
                        <div className="mt-3 text-[18px]">{selectedContact.name}</div>
                      </div>

                      <div className="rounded-[28px] bg-white/80 backdrop-blur border border-white/70 shadow-sm px-5 py-5">
                        <div className="text-[18px] font-semibold">phone</div>
                        <div className="mt-3 text-[18px] text-[#6B7280]">{selectedContact.number}</div>
                      </div>

                      <div className="rounded-[28px] bg-white/80 backdrop-blur border border-white/70 shadow-sm px-5 py-5">
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => openMessage(selectedContact.name)}
                            className="text-[18px] text-[#0A84FF]"
                          >
                            Message
                          </button>
                          <button
                            onClick={() => startCallFromNumber(selectedContact.number, selectedContact.name, "outgoing")}
                            className="text-[18px] text-[#16A34A]"
                          >
                            Call
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {screen === "tabs" && (
                <div
                  className="absolute left-4 right-4 sm:left-5 sm:right-5 h-[88px] rounded-[30px] bg-white/92 backdrop-blur border border-black/10 shadow-[0_10px_35px_rgba(0,0,0,0.08)] px-2 flex items-center justify-between"
                  style={{ bottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
                >
                  {[
                    { key: "recents", label: "Recents", icon: <RecentsIcon active={mainTab === "recents"} /> },
                    { key: "contacts", label: "Contacts", icon: <ContactsIcon active={mainTab === "contacts"} /> },
                    { key: "keypad", label: "Keypad", icon: <KeypadIcon active={mainTab === "keypad"} /> },
                    { key: "voicemail", label: "Contact Us", icon: <VoicemailIcon active={mainTab === "voicemail"} /> },
                  ].map((item) => {
                    const active = mainTab === item.key;
                    return (
                      <button
                        key={item.key}
                        onClick={() => {
                          setScreen("tabs");
                          setMainTab(item.key as MainTab);
                        }}
                        className={cn(
                          "flex-1 h-[70px] rounded-[24px] flex flex-col items-center justify-center transition",
                          active && "bg-[#F1F5FF]"
                        )}
                      >
                        {item.icon}
                        <div className={cn("text-[13px] font-semibold mt-1", active ? "text-[#0A84FF]" : "text-[#111827]")}>
                          {item.label}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {screen === "message" && (
            <div className="h-full bg-[#F7F8FB] flex flex-col text-[#111827]">
              <div className="px-4 sm:px-5 pt-[max(env(safe-area-inset-top),18px)] sm:pt-14 pb-4 bg-white border-b border-black/5">
                <div className="flex items-center justify-between">
                  <div className="w-10" />
                  <div className="text-[22px] sm:text-[24px] font-semibold">New Message</div>
                  <button
                    onClick={() => setScreen("tabs")}
                    className="w-11 h-11 rounded-full bg-[#F3F4F6] border border-black/10 text-[28px]"
                  >
                    ×
                  </button>
                </div>

                <div className="mt-5 min-h-[56px] rounded-[20px] border border-black/10 bg-white flex items-center px-4 py-2">
                  <span className="text-[18px] text-[#6B7280] mr-3">To:</span>
                  <div className="px-4 py-1 rounded-full bg-[#EEF7EC] text-[#16A34A] text-[17px] sm:text-[18px] font-semibold">
                    {selectedChatName}
                  </div>
                  <div className="w-[2px] h-7 bg-[#0A84FF] ml-4" />
                  <button className="ml-auto w-10 h-10 rounded-full bg-[#F3F4F6] flex items-center justify-center">
                    <PlusIcon />
                  </button>
                </div>
              </div>

              <div
                className="flex-1 overflow-y-auto px-4 py-4"
                style={{ paddingBottom: showKeyboard || showEmoji ? 16 : 100 }}
              >
                <div className="space-y-4">
                  {selectedMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn("flex", msg.sender === "me" ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "max-w-[78%] rounded-[22px] px-4 py-3 shadow-sm",
                          msg.sender === "me"
                            ? "bg-[#0A84FF] text-white rounded-br-md"
                            : "bg-white text-[#111827] rounded-bl-md border border-black/5"
                        )}
                      >
                        {msg.image && (
                          <img
                            src={msg.image}
                            alt="sent"
                            className="w-full max-w-[220px] rounded-[16px] object-cover"
                          />
                        )}
                        {msg.text && (
                          <div className="text-[17px] leading-7 whitespace-pre-wrap">{msg.text}</div>
                        )}
                        <div className="text-[12px] opacity-70 mt-2">{msg.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div
                className="px-3 bg-white border-t border-black/5"
                style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 8px)" }}
              >
                <div className="flex items-end gap-2 pt-3">
                  <button
                    onClick={openImagePicker}
                    className="w-12 h-12 rounded-full bg-[#F3F4F6] border border-black/10 flex items-center justify-center shrink-0"
                  >
                    <CameraIcon />
                  </button>

                  <div className="flex-1 min-h-[52px] rounded-[24px] border border-black/10 bg-white flex items-center px-4 py-3">
                    <input
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Text Message"
                      className="flex-1 bg-transparent outline-none text-[18px] text-[#111827] placeholder:text-[#9CA3AF]"
                    />
                  </div>

                  <button
                    onClick={sendTextMessage}
                    className="h-[52px] px-5 rounded-full bg-[#0A84FF] text-white text-[17px] font-semibold shadow-md active:scale-95 shrink-0"
                  >
                    Send
                  </button>
                </div>

                <div className="mt-3 flex items-center gap-4 px-2 text-[#111827]">
                  <button
                    onClick={() => {
                      setShowKeyboard(true);
                      setShowEmoji(false);
                    }}
                  >
                    <GlobeIcon />
                  </button>

                  <button
                    onClick={() => {
                      setShowEmoji((prev) => !prev);
                      setShowKeyboard(false);
                    }}
                    className="text-[24px]"
                    style={{ fontFamily: '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif' }}
                  >
                    😀
                  </button>
                </div>

                {showKeyboard && (
                  <div className="mt-3 rounded-[26px] bg-[#E9ECF2] p-4 pb-6">
                    <div className="space-y-3">
                      {(keyboardLang === "en" ? keyboardRowsEn : keyboardRowsMm).map((row, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "flex gap-2 justify-center",
                            idx === 1 && "px-2 sm:px-4",
                            idx === 2 && "px-0 sm:px-1"
                          )}
                        >
                          {row.map((key) => (
                            <button
                              key={key}
                              onClick={() => addKeyboardChar(key)}
                              className={cn(
                                "h-14 rounded-[14px] bg-white shadow-sm text-[#111827] text-[22px] font-medium px-3 min-w-[34px] active:scale-95 transition",
                                key === "⇧" && "px-4",
                                key === "⌫" && "px-4"
                              )}
                            >
                              {key}
                            </button>
                          ))}
                        </div>
                      ))}

                      <div className="flex gap-2 mt-1">
                        <button
                          onClick={() => setKeyboardLang((prev) => (prev === "en" ? "mm" : "en"))}
                          className="h-14 px-4 rounded-[14px] bg-white shadow-sm text-[#111827] text-[18px] font-semibold"
                        >
                          {keyboardLang === "en" ? "123" : "ဗြ"}
                        </button>

                        <button
                          onClick={() => {
                            setShowEmoji(true);
                            setShowKeyboard(false);
                          }}
                          className="h-14 px-4 rounded-[14px] bg-white shadow-sm text-[20px]"
                          style={{ fontFamily: '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif' }}
                        >
                          😀
                        </button>

                        <button
                          onClick={() => addKeyboardChar(" ")}
                          className="flex-1 h-14 rounded-[14px] bg-white shadow-sm text-[#111827] text-[20px] font-medium"
                        >
                          {keyboardLang === "en" ? "English (US)" : "မြန်မာ"}
                        </button>

                        <button
                          onClick={() => addKeyboardChar("\n")}
                          className="h-14 px-5 rounded-[14px] bg-white shadow-sm text-[#111827] text-[22px]"
                        >
                          ↩
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {showEmoji && (
                  <div className="mt-3 rounded-[26px] bg-[#E9ECF2] p-4 pb-6">
                    <div className="h-11 rounded-full bg-white shadow-sm flex items-center px-4 text-[#6B7280] text-[18px]">
                      <SearchIcon />
                      <span className="ml-3">Search Emoji</span>
                    </div>

                    <div
                      className="grid grid-cols-8 gap-3 mt-4 text-[28px] max-h-[260px] overflow-y-auto"
                      style={{ fontFamily: '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif' }}
                    >
                      {commonEmoji.map((emoji, index) => (
                        <button
                          key={`${emoji}-${index}`}
                          onClick={() => addEmoji(emoji)}
                          className="leading-none"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>

                    <div
                      className="flex items-center justify-between mt-4 text-[22px] text-[#111827]"
                      style={{ fontFamily: '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif' }}
                    >
                      <button
                        onClick={() => {
                          setShowEmoji(false);
                          setShowKeyboard(true);
                        }}
                      >
                        ABC
                      </button>
                      <span>😀</span>
                      <span>❤️</span>
                      <span>🎉</span>
                      <span>📞</span>
                      <span>🚗</span>
                      <span>🌙</span>
                      <span>⭐</span>
                      <span>⚽</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {screen === "calling" && (
            <div className="h-full bg-[linear-gradient(180deg,#F8FAFC_0%,#E7EBF3_100%)] text-[#111827] flex flex-col justify-between px-6 pt-[max(env(safe-area-inset-top),32px)] sm:pt-20 pb-[calc(env(safe-area-inset-bottom)+24px)] sm:pb-12 text-center">
              <div>
                <div className="text-[18px] text-[#6B7280]">calling...</div>
                <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-gradient-to-br from-[#8B7AB8] to-[#5F4B91] text-white mx-auto mt-12 flex items-center justify-center text-[60px] sm:text-[72px] font-semibold shadow-[0_20px_50px_rgba(95,75,145,0.25)]">
                  {selectedInitial}
                </div>
                <div className="mt-10 text-[34px] sm:text-[44px] font-semibold">{selectedRecent?.name}</div>
                <div className="mt-3 text-[20px] sm:text-[22px] text-[#6B7280]">{selectedRecent?.number}</div>
              </div>

              <div className="flex items-center justify-center">
                <button
                  onClick={() => {
                    stopRingtone();
                    setScreen("tabs");
                  }}
                  className="w-24 h-24 rounded-full bg-[#FF3B30] text-white text-[38px] shadow-[0_20px_40px_rgba(255,59,48,0.28)]"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {screen === "inCall" && (
            <div className="h-full bg-[linear-gradient(180deg,#F8FAFC_0%,#E7EBF3_100%)] text-[#111827] flex flex-col justify-between px-6 pt-[max(env(safe-area-inset-top),32px)] sm:pt-20 pb-[calc(env(safe-area-inset-bottom)+24px)] sm:pb-12 text-center">
              <div>
                <div className="text-[18px] text-[#6B7280]">{formatDuration(callSeconds)}</div>
                <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-gradient-to-br from-[#8B7AB8] to-[#5F4B91] text-white mx-auto mt-12 flex items-center justify-center text-[60px] sm:text-[72px] font-semibold shadow-[0_20px_50px_rgba(95,75,145,0.25)]">
                  {selectedInitial}
                </div>
                <div className="mt-10 text-[34px] sm:text-[44px] font-semibold">{selectedRecent?.name}</div>
                <div className="mt-3 text-[20px] sm:text-[22px] text-[#6B7280]">{selectedRecent?.number}</div>
              </div>

              <div>
                {showInCallKeypad ? (
                  <div className="px-4 mb-8">
                    <div className="flex justify-start mb-4">
                      <button
                        onClick={() => setShowInCallKeypad(false)}
                        className="h-10 px-4 rounded-full bg-white border border-black/10 shadow-sm text-[15px] font-semibold"
                      >
                        Back
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {keypadRows.flat().map((item) => (
                        <button
                          key={`incall-${item.key}`}
                          onClick={() => appendDial(item.key)}
                          className="aspect-square rounded-full bg-white border border-black/10 shadow-sm flex flex-col items-center justify-center"
                        >
                          <span className="text-[34px]">{item.key}</span>
                          <span className="text-[11px] text-[#6B7280] tracking-[0.18em]">{item.sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : showInCallContacts ? (
                  <div className="mb-8 max-h-[250px] overflow-y-auto px-2">
                    <div className="flex justify-start mb-4">
                      <button
                        onClick={() => setShowInCallContacts(false)}
                        className="h-10 px-4 rounded-full bg-white border border-black/10 shadow-sm text-[15px] font-semibold"
                      >
                        Back
                      </button>
                    </div>
                    {contacts.length === 0 ? (
                      <div className="text-[#6B7280] text-[16px]">No contacts</div>
                    ) : (
                      <div className="space-y-2">
                        {contacts.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => startCallFromNumber(item.number, item.name, "outgoing")}
                            className="w-full rounded-2xl bg-white border border-black/10 shadow-sm px-4 py-3 text-left"
                          >
                            <div className="font-semibold text-[17px]">{item.name}</div>
                            <div className="text-[14px] text-[#6B7280] mt-1">{item.number}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-5 mb-10">
                    <div className="flex flex-col items-center gap-2">
                      <button onClick={() => setIsMuted((v) => !v)} className={controlButtonClass(isMuted)}>
                        🔇
                      </button>
                      <div className="text-[14px] text-[#6B7280]">mute</div>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <button onClick={() => setShowInCallKeypad(true)} className={controlButtonClass(showInCallKeypad)}>
                        ⠿
                      </button>
                      <div className="text-[14px] text-[#6B7280]">keypad</div>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <button onClick={() => setIsSpeaker((v) => !v)} className={controlButtonClass(isSpeaker)}>
                        🔊
                      </button>
                      <div className="text-[14px] text-[#6B7280]">audio</div>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <button onClick={() => setShowAddCallState((v) => !v)} className={controlButtonClass(showAddCallState)}>
                        ➕
                      </button>
                      <div className="text-[14px] text-[#6B7280]">add call</div>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <button onClick={() => setIsHold((v) => !v)} className={controlButtonClass(isHold)}>
                        ⏸
                      </button>
                      <div className="text-[14px] text-[#6B7280]">hold</div>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <button onClick={() => setShowInCallContacts(true)} className={controlButtonClass(showInCallContacts)}>
                        👤
                      </button>
                      <div className="text-[14px] text-[#6B7280]">contacts</div>
                    </div>
                  </div>
                )}

                {showAddCallState && !showInCallKeypad && !showInCallContacts && (
                  <div className="mb-6 text-[15px] text-[#6B7280]">Add call mode selected.</div>
                )}

                <button
                  onClick={() => {
                    stopRingtone();
                    setScreen("tabs");
                  }}
                  className="w-24 h-24 rounded-full bg-[#FF3B30] text-white text-[38px] shadow-[0_20px_40px_rgba(255,59,48,0.28)]"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>

        {showAddContact && (
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center z-40 p-6">
            <div className="w-full rounded-[28px] bg-white p-5 shadow-2xl border border-black/5">
              <div className="text-[24px] font-semibold text-[#111827]">Add Contact</div>

              <div className="mt-4 space-y-3">
                <input
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  placeholder="အမည် / Name"
                  className="w-full h-14 rounded-2xl border border-black/10 px-4 outline-none text-[#111827] placeholder:text-[#9CA3AF] bg-white"
                />
                <input
                  value={newContactNumber}
                  onChange={(e) => setNewContactNumber(e.target.value)}
                  placeholder="ဖုန်းနံပါတ် / Phone Number"
                  className="w-full h-14 rounded-2xl border border-black/10 px-4 outline-none text-[#111827] placeholder:text-[#9CA3AF] bg-white"
                />
              </div>

              <div className="mt-5 flex justify-end gap-3">
                <button
                  onClick={() => setShowAddContact(false)}
                  className="h-12 px-5 rounded-full bg-[#F3F4F6] text-[#111827] font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={addContact}
                  className="h-12 px-5 rounded-full bg-[#0A84FF] text-white font-semibold"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}