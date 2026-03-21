"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

type TabKey = "favorites" | "recents" | "contacts" | "keypad" | "voicemail";
type MessageView = "list" | "thread";
type FontMode = "english" | "myanmar";

type ContactItem = {
  id: number;
  name: string;
  number: string;
  avatar: string;
  isFavorite?: boolean;
};

type RecentItem = {
  id: number;
  name: string;
  number: string;
  type: "incoming" | "outgoing" | "missed";
  time: string;
};

type MessageItem = {
  id: number;
  contactId: number;
  text?: string;
  image?: string;
  sender: "me" | "them";
  time: string;
};

type ContactForm = {
  name: string;
  number: string;
  avatar: string;
};

const PHONE_PREFIX = "+70 20 ";
const PHONE_MAX_LENGTH = 14;

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

const mmKeyboardRows = [
  ["က", "ခ", "ဂ", "ဃ", "င", "စ", "ဆ"],
  ["ဇ", "ည", "တ", "ထ", "ဒ", "န", "ပ"],
  ["ဖ", "ဗ", "ဘ", "မ", "ယ", "ရ", "လ"],
  ["ဝ", "သ", "ဟ", "အ", "ါ", "ိ", "ု"],
  ["ေ", "့", "း", "ျ", "ြ", "ွ", "်"],
];

const emojis = ["😀", "😂", "🥰", "❤️", "🔥", "👍", "🙏", "🎉", "🤝", "📞", "💬", "🇲🇲"];

const defaultContacts: ContactItem[] = [];
const defaultMessages: MessageItem[] = [];
const defaultRecents: RecentItem[] = [];

const initialContactForm: ContactForm = {
  name: "",
  number: "",
  avatar: "",
};

function getNowTimeLabel() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function buildAvatar(name: string) {
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "T";
}

function formatNumberForDisplay(input: string) {
  if (!input.startsWith(PHONE_PREFIX)) return input;
  const suffix = input.slice(PHONE_PREFIX.length);
  return `${PHONE_PREFIX}${suffix}`;
}

export default function WebCallPage() {
  const [hydrated, setHydrated] = useState(false);

  const [activeTab, setActiveTab] = useState<TabKey>("keypad");
  const [phone, setPhone] = useState(PHONE_PREFIX);
  const [isCalling, setIsCalling] = useState(false);
  const [callStatus, setCallStatus] = useState("Enter number");
  const [speakerOn, setSpeakerOn] = useState(false);
  const [fontMode, setFontMode] = useState<FontMode>("english");

  const [contacts, setContacts] = useState<ContactItem[]>(defaultContacts);
  const [recents, setRecents] = useState<RecentItem[]>(defaultRecents);
  const [messages, setMessages] = useState<MessageItem[]>(defaultMessages);

  const [messageView, setMessageView] = useState<MessageView>("list");
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [showMyanmarKeyboard, setShowMyanmarKeyboard] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [editingContactId, setEditingContactId] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState<ContactForm>(initialContactForm);

  const imageInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const storedContacts = safeJsonParse<ContactItem[]>(
      localStorage.getItem("iphone_contacts"),
      defaultContacts
    );
    const storedRecents = safeJsonParse<RecentItem[]>(
      localStorage.getItem("iphone_recents"),
      defaultRecents
    );
    const storedMessages = safeJsonParse<MessageItem[]>(
      localStorage.getItem("iphone_messages"),
      defaultMessages
    );
    const storedFont = safeJsonParse<FontMode>(
      localStorage.getItem("iphone_font_mode"),
      "english"
    );

    setContacts(storedContacts);
    setRecents(storedRecents);
    setMessages(storedMessages);
    setFontMode(storedFont);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("iphone_contacts", JSON.stringify(contacts));
  }, [contacts, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("iphone_recents", JSON.stringify(recents));
  }, [recents, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("iphone_messages", JSON.stringify(messages));
  }, [messages, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("iphone_font_mode", JSON.stringify(fontMode));
  }, [fontMode, hydrated]);

  const fontClass =
    fontMode === "myanmar"
      ? "font-['Noto_Sans_Myanmar','Pyidaungsu','Myanmar_Text',system-ui,sans-serif]"
      : "font-['Inter','SF_Pro_Display',system-ui,sans-serif]";

  const cleanedNumber = useMemo(() => phone.replace(/\s+/g, ""), [phone]);

  const filteredContacts = useMemo(() => {
    const q = contactSearch.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter(
      (c) => c.name.toLowerCase().includes(q) || c.number.toLowerCase().includes(q)
    );
  }, [contacts, contactSearch]);

  const selectedContact = useMemo(
    () => contacts.find((c) => c.id === selectedChatId) || null,
    [contacts, selectedChatId]
  );

  const selectedMessages = useMemo(
    () => messages.filter((m) => m.contactId === selectedChatId),
    [messages, selectedChatId]
  );

  const favoriteContacts = useMemo(
    () => contacts.filter((contact) => contact.isFavorite),
    [contacts]
  );

  const messageThreads = useMemo(() => {
    return contacts
      .filter((contact) => messages.some((m) => m.contactId === contact.id))
      .map((contact) => {
        const threadMessages = messages.filter((m) => m.contactId === contact.id);
        const last = threadMessages[threadMessages.length - 1];
        return {
          contact,
          preview: last?.text || (last?.image ? "Photo" : ""),
          time: last?.time || "",
        };
      });
  }, [contacts, messages]);

  const appendDial = (value: string) => {
    if (isCalling) return;
    const next = `${phone}${value}`;
    if (next.replace(/\s+/g, "").length > PHONE_MAX_LENGTH) return;
    setPhone(next);
    setCallStatus("Ready to call");
  };

  const deleteDial = () => {
    if (isCalling) return;
    if (phone.length <= PHONE_PREFIX.length) return;
    const next = phone.slice(0, -1);
    setPhone(next);
    setCallStatus(next.replace(/\s+/g, "").length > PHONE_PREFIX.replace(/\s+/g, "").length ? "Ready to call" : "Enter number");
  };

  const clearDial = () => {
    if (isCalling) return;
    setPhone(PHONE_PREFIX);
    setCallStatus("Enter number");
  };

  const addRecentCall = (number: string, type: "incoming" | "outgoing" | "missed") => {
    const matched = contacts.find((c) => c.number === number);
    const entry: RecentItem = {
      id: Date.now(),
      name: matched?.name || "Unknown",
      number,
      type,
      time: getNowTimeLabel(),
    };
    setRecents((prev) => [entry, ...prev]);
  };

  const placeCall = () => {
    if (cleanedNumber.length < 8) return;
    setIsCalling(true);
    setCallStatus(speakerOn ? "Calling on speaker..." : "Calling...");
    addRecentCall(phone, "outgoing");

    window.setTimeout(() => {
      setIsCalling(false);
      setCallStatus("Call ended");
    }, 1800);
  };

  const openThread = (contactId: number) => {
    setSelectedChatId(contactId);
    setMessageView("thread");
  };

  const appendMessageText = (value: string) => {
    setMessageText((prev) => prev + value);
  };

  const deleteMessageChar = () => {
    setMessageText((prev) => prev.slice(0, -1));
  };

  const sendMessage = () => {
    if (!selectedChatId) return;
    const trimmed = messageText.trim();

    if (!trimmed && !selectedImage) return;

    const now = getNowTimeLabel();

    const nextMessage: MessageItem = {
      id: Date.now(),
      contactId: selectedChatId,
      text: trimmed || undefined,
      image: selectedImage || undefined,
      sender: "me",
      time: now,
    };

    setMessages((prev) => [...prev, nextMessage]);
    setMessageText("");
    setSelectedImage(null);
    setShowEmoji(false);
    setShowMyanmarKeyboard(false);
  };

  const triggerImagePicker = () => {
    imageInputRef.current?.click();
  };

  const onSelectImage = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setSelectedImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const resetContactModal = () => {
    setShowAddContactModal(false);
    setEditingContactId(null);
    setContactForm(initialContactForm);
  };

  const openAddContactModal = (prefillNumber?: string) => {
    setEditingContactId(null);
    setContactForm({
      name: "",
      number: prefillNumber || phone,
      avatar: "",
    });
    setShowAddContactModal(true);
  };

  const openEditContactModal = (contact: ContactItem) => {
    setEditingContactId(contact.id);
    setContactForm({
      name: contact.name,
      number: contact.number,
      avatar: contact.avatar,
    });
    setShowAddContactModal(true);
  };

  const saveContact = () => {
    const name = contactForm.name.trim();
    const number = contactForm.number.trim();

    if (!name || !number) {
      alert("Name and number are required.");
      return;
    }

    if (editingContactId) {
      setContacts((prev) =>
        prev.map((item) =>
          item.id === editingContactId
            ? {
                ...item,
                name,
                number,
                avatar: contactForm.avatar.trim() || buildAvatar(name),
              }
            : item
        )
      );
    } else {
      const newContact: ContactItem = {
        id: Date.now(),
        name,
        number,
        avatar: contactForm.avatar.trim() || buildAvatar(name),
        isFavorite: false,
      };
      setContacts((prev) => [newContact, ...prev]);
    }

    resetContactModal();
  };

  const deleteContact = (contactId: number) => {
    setContacts((prev) => prev.filter((item) => item.id !== contactId));
    if (selectedChatId === contactId) {
      setSelectedChatId(null);
      setMessageView("list");
    }
  };

  const toggleFavorite = (contactId: number) => {
    setContacts((prev) =>
      prev.map((item) =>
        item.id === contactId ? { ...item, isFavorite: !item.isFavorite } : item
      )
    );
  };

  const createUnknownThreadFromNumber = () => {
    const number = phone.trim();
    if (!number || number === PHONE_PREFIX.trim()) {
      alert("Enter number first.");
      return;
    }

    let existing = contacts.find((c) => c.number === number);

    if (!existing) {
      existing = {
        id: Date.now(),
        name: number,
        number,
        avatar: "N",
        isFavorite: false,
      };
      setContacts((prev) => [existing!, ...prev]);
    }

    setSelectedChatId(existing.id);
    setMessageView("thread");
  };

  const tabButton = (key: TabKey, label: string) => {
    const active = activeTab === key;
    return (
      <button
        type="button"
        onClick={() => setActiveTab(key)}
        className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition ${
          active ? "text-[#0a84ff]" : "text-[#8e8e93]"
        }`}
      >
        <span className="text-lg">
          {key === "favorites" && "★"}
          {key === "recents" && "🕘"}
          {key === "contacts" && "👤"}
          {key === "keypad" && "⌨"}
          {key === "voicemail" && "◉"}
        </span>
        <span>{label}</span>
      </button>
    );
  };

  const renderFavorites = () => (
    <div className="space-y-3">
      {favoriteContacts.length === 0 ? (
        <div className="rounded-3xl bg-white px-4 py-6 text-center text-sm text-[#8e8e93] shadow-sm">
          No favorite contacts yet.
        </div>
      ) : (
        favoriteContacts.map((contact) => (
          <button
            key={contact.id}
            onClick={() => setPhone(contact.number)}
            className="flex w-full items-center gap-4 rounded-3xl bg-white px-4 py-4 text-left shadow-sm transition active:scale-[0.99]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0a84ff] text-sm font-bold text-white">
              {contact.avatar}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-base font-semibold text-[#111111]">{contact.name}</div>
              <div className="truncate text-sm text-[#8e8e93]">{contact.number}</div>
            </div>
            <div className="text-xl text-[#34c759]">📞</div>
          </button>
        ))
      )}
    </div>
  );

  const renderRecents = () => (
    <div className="space-y-3">
      {recents.length === 0 ? (
        <div className="rounded-3xl bg-white px-4 py-6 text-center text-sm text-[#8e8e93] shadow-sm">
          No recent calls yet.
        </div>
      ) : (
        recents.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 rounded-3xl bg-white px-4 py-4 shadow-sm"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f2f2f7] text-lg">
              {item.type === "missed" ? "❗" : "📞"}
            </div>
            <div className="min-w-0 flex-1">
              <div
                className={`truncate text-base font-semibold ${
                  item.type === "missed" ? "text-[#ff3b30]" : "text-[#111111]"
                }`}
              >
                {item.name}
              </div>
              <div className="truncate text-sm text-[#8e8e93]">{item.number}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-[#8e8e93]">{item.time}</div>
              <button
                type="button"
                onClick={() => setPhone(item.number)}
                className="mt-1 text-sm font-medium text-[#0a84ff]"
              >
                Dial
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderContacts = () => (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          value={contactSearch}
          onChange={(e) => setContactSearch(e.target.value)}
          placeholder="Search contacts"
          className="w-full rounded-2xl border border-[#e5e5ea] bg-white px-4 py-3 text-sm text-[#111111] outline-none"
        />
        <button
          onClick={() => openAddContactModal()}
          className="rounded-2xl bg-[#0a84ff] px-4 py-3 text-sm font-semibold text-white"
        >
          Add
        </button>
      </div>

      <div className="space-y-3">
        {filteredContacts.length === 0 ? (
          <div className="rounded-3xl bg-white px-4 py-6 text-center text-sm text-[#8e8e93] shadow-sm">
            No contacts yet.
          </div>
        ) : (
          filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className="rounded-3xl bg-white px-4 py-4 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0a84ff] text-sm font-bold text-white">
                  {contact.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-base font-semibold text-[#111111]">
                    {contact.name}
                  </div>
                  <div className="truncate text-sm text-[#8e8e93]">{contact.number}</div>
                </div>
                <button
                  onClick={() => openThread(contact.id)}
                  className="rounded-full bg-[#0a84ff] px-3 py-2 text-xs font-semibold text-white"
                >
                  SMS
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => setPhone(contact.number)}
                  className="rounded-full bg-[#34c759] px-3 py-2 text-xs font-semibold text-white"
                >
                  Call
                </button>
                <button
                  onClick={() => toggleFavorite(contact.id)}
                  className="rounded-full bg-[#f2f2f7] px-3 py-2 text-xs font-semibold text-[#111111]"
                >
                  {contact.isFavorite ? "Unfavorite" : "Favorite"}
                </button>
                <button
                  onClick={() => openEditContactModal(contact)}
                  className="rounded-full bg-[#f2f2f7] px-3 py-2 text-xs font-semibold text-[#111111]"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteContact(contact.id)}
                  className="rounded-full bg-[#ff3b30] px-3 py-2 text-xs font-semibold text-white"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderKeypad = () => (
    <div>
      <div className="rounded-[30px] bg-white px-5 py-6 shadow-sm">
        <div className="min-h-[64px] text-center">
          <div className="break-all text-[34px] font-semibold tracking-[0.04em] text-[#111111]">
            {formatNumberForDisplay(phone)}
          </div>
        </div>

        <div className="mt-2 text-center text-sm text-[#8e8e93]">{callStatus}</div>
      </div>

      <div className="mt-4 flex justify-center gap-2">
        <button
          onClick={() => openAddContactModal(phone)}
          className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#111111] shadow-sm"
        >
          Save Contact
        </button>
        <button
          onClick={createUnknownThreadFromNumber}
          className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#111111] shadow-sm"
        >
          SMS
        </button>
      </div>

      <div className="mt-6 grid gap-y-5">
        {keypadRows.map((row, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-3 justify-items-center gap-4">
            {row.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => appendDial(item.key)}
                className="flex h-[82px] w-[82px] flex-col items-center justify-center rounded-full bg-white text-[#111111] shadow-sm transition active:scale-95"
              >
                <span className="text-[30px] font-medium leading-none">{item.key}</span>
                <span className="mt-1 text-[10px] font-medium tracking-[0.22em] text-[#8e8e93]">
                  {item.sub}
                </span>
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={clearDial}
          className="flex h-14 min-w-[82px] items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-[#111111] shadow-sm"
        >
          Clear
        </button>

        <button
          type="button"
          onClick={placeCall}
          disabled={cleanedNumber.length < 8 || isCalling}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-[#34c759] text-3xl text-white shadow-[0_12px_30px_rgba(52,199,89,0.35)] transition active:scale-95 disabled:opacity-60"
        >
          📞
        </button>

        <button
          type="button"
          onClick={deleteDial}
          className="flex h-14 min-w-[82px] items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-[#111111] shadow-sm"
        >
          Delete
        </button>
      </div>

      <div className="mt-4 flex items-center justify-center">
        <button
          type="button"
          onClick={() => setSpeakerOn((prev) => !prev)}
          className={`rounded-full px-4 py-2 text-xs font-semibold ${
            speakerOn ? "bg-[#0a84ff] text-white" : "bg-white text-[#111111]"
          } shadow-sm`}
        >
          Speaker {speakerOn ? "On" : "Off"}
        </button>
      </div>
    </div>
  );

  const renderVoicemail = () => (
    <div className="space-y-3">
      <div className="rounded-3xl bg-white px-4 py-4 shadow-sm">
        <div className="text-base font-semibold text-[#111111]">Voicemail</div>
        <div className="mt-2 text-sm text-[#8e8e93]">
          No new voicemail messages.
        </div>
      </div>
      <div className="rounded-3xl bg-white px-4 py-4 shadow-sm">
        <div className="text-sm text-[#8e8e93]">
          Voicemail UI ready for future backend integration.
        </div>
      </div>
    </div>
  );

  const renderMessagesPanel = () => {
    if (messageView === "thread" && selectedContact) {
      return (
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-3 border-b border-white/70 px-4 py-4">
            <button
              onClick={() => setMessageView("list")}
              className="text-sm font-semibold text-[#0a84ff]"
            >
              Back
            </button>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0a84ff] text-sm font-bold text-white">
              {selectedContact.avatar}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-[#111111]">
                {selectedContact.name}
              </div>
              <div className="truncate text-xs text-[#8e8e93]">{selectedContact.number}</div>
            </div>
            <button
              onClick={() => setPhone(selectedContact.number)}
              className="ml-auto rounded-full bg-[#34c759] px-3 py-2 text-xs font-semibold text-white"
            >
              Call
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {selectedMessages.length === 0 ? (
              <div className="rounded-3xl bg-white px-4 py-6 text-center text-sm text-[#8e8e93]">
                No messages yet.
              </div>
            ) : (
              selectedMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-[22px] px-4 py-3 text-sm leading-6 ${
                      msg.sender === "me"
                        ? "bg-[#0a84ff] text-white"
                        : "bg-white text-[#111111]"
                    }`}
                  >
                    {msg.image && (
                      <img
                        src={msg.image}
                        alt="sent"
                        className="mb-2 max-h-44 w-full rounded-2xl object-cover"
                      />
                    )}
                    {msg.text && <div>{msg.text}</div>}
                    <div
                      className={`mt-1 text-[10px] ${
                        msg.sender === "me" ? "text-white/75" : "text-[#8e8e93]"
                      }`}
                    >
                      {msg.time}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-white/70 bg-[#f2f2f7] px-3 py-3">
            <div className="rounded-[24px] bg-white p-3 shadow-sm">
              {selectedImage && (
                <div className="mb-3">
                  <img
                    src={selectedImage}
                    alt="preview"
                    className="max-h-44 rounded-2xl object-cover"
                  />
                </div>
              )}

              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                rows={3}
                placeholder="iMessage"
                className="w-full resize-none border-none bg-transparent text-sm text-[#111111] outline-none placeholder:text-[#8e8e93]"
              />

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setShowEmoji((prev) => !prev)}
                  className="rounded-full bg-[#f2f2f7] px-3 py-2 text-xs font-semibold text-[#111111]"
                >
                  Emoji
                </button>

                <button
                  onClick={() => setShowMyanmarKeyboard((prev) => !prev)}
                  className="rounded-full bg-[#f2f2f7] px-3 py-2 text-xs font-semibold text-[#111111]"
                >
                  Myanmar
                </button>

                <button
                  onClick={triggerImagePicker}
                  className="rounded-full bg-[#f2f2f7] px-3 py-2 text-xs font-semibold text-[#111111]"
                >
                  Photo
                </button>

                <button
                  onClick={deleteMessageChar}
                  className="rounded-full bg-[#f2f2f7] px-3 py-2 text-xs font-semibold text-[#111111]"
                >
                  Delete
                </button>

                <button
                  onClick={() => {
                    setMessageText("");
                    setSelectedImage(null);
                  }}
                  className="rounded-full bg-[#f2f2f7] px-3 py-2 text-xs font-semibold text-[#111111]"
                >
                  Clear
                </button>

                <button
                  onClick={sendMessage}
                  className="ml-auto rounded-full bg-[#34c759] px-4 py-2 text-xs font-semibold text-white"
                >
                  Send
                </button>
              </div>

              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={onSelectImage}
                className="hidden"
              />

              {showEmoji && (
                <div className="mt-3 flex flex-wrap gap-2 rounded-2xl bg-[#f7f7fa] p-3">
                  {emojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => appendMessageText(emoji)}
                      className="rounded-xl bg-white px-3 py-2 text-lg shadow-sm"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {showMyanmarKeyboard && (
                <div className="mt-3 rounded-2xl bg-[#f7f7fa] p-3">
                  <div className="space-y-2">
                    {mmKeyboardRows.map((row, idx) => (
                      <div key={idx} className="flex flex-wrap gap-2">
                        {row.map((char) => (
                          <button
                            key={char}
                            onClick={() => appendMessageText(char)}
                            className="rounded-xl bg-white px-3 py-2 text-sm font-medium text-[#111111] shadow-sm"
                          >
                            {char}
                          </button>
                        ))}
                      </div>
                    ))}
                    <div className="pt-1">
                      <button
                        onClick={() => appendMessageText(" ")}
                        className="w-full rounded-xl bg-white px-3 py-2 text-sm font-medium text-[#111111] shadow-sm"
                      >
                        Space
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full overflow-y-auto px-4 py-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="text-lg font-bold text-[#111111]">Messages</div>
          <button
            onClick={createUnknownThreadFromNumber}
            className="rounded-full bg-[#0a84ff] px-3 py-2 text-xs font-semibold text-white"
          >
            New SMS
          </button>
        </div>

        <div className="space-y-3">
          {messageThreads.length === 0 ? (
            <div className="rounded-3xl bg-white px-4 py-6 text-center text-sm text-[#8e8e93] shadow-sm">
              No message threads yet.
            </div>
          ) : (
            messageThreads.map((thread) => (
              <button
                key={thread.contact.id}
                onClick={() => openThread(thread.contact.id)}
                className="flex w-full items-center gap-3 rounded-3xl bg-white px-4 py-4 text-left shadow-sm"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0a84ff] text-sm font-bold text-white">
                  {thread.contact.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-base font-semibold text-[#111111]">
                    {thread.contact.name}
                  </div>
                  <div className="truncate text-sm text-[#8e8e93]">{thread.preview}</div>
                </div>
                <div className="text-xs text-[#8e8e93]">{thread.time}</div>
              </button>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <main className={`min-h-screen bg-[#dfe3e8] px-3 py-4 ${fontClass}`}>
      <div className="mx-auto max-w-[460px]">
        <div className="overflow-hidden rounded-[42px] border border-black/10 bg-[#f2f2f7] shadow-[0_30px_80px_rgba(0,0,0,0.22)]">
          <div className="flex justify-center pt-3">
            <div className="h-7 w-32 rounded-full bg-black" />
          </div>

          <div className="px-3 pb-4 pt-2">
            <div className="flex items-center justify-between px-2">
              <div className="text-sm font-semibold text-[#111111]">9:41</div>
              <div className="text-xs text-[#111111]">Taurus Signal ▮▮▮</div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-2 px-2">
              <div className="text-[28px] font-bold tracking-[-0.03em] text-[#111111]">
                Phone
              </div>

              <button
                onClick={() =>
                  setFontMode((prev) => (prev === "english" ? "myanmar" : "english"))
                }
                className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-[#111111] shadow-sm"
              >
                {fontMode === "english" ? "MM Font" : "EN Font"}
              </button>
            </div>

            <div className="mt-4 min-h-[430px] rounded-[34px] bg-[#f2f2f7]">
              <div className="px-1">
                {activeTab === "favorites" && renderFavorites()}
                {activeTab === "recents" && renderRecents()}
                {activeTab === "contacts" && renderContacts()}
                {activeTab === "keypad" && renderKeypad()}
                {activeTab === "voicemail" && renderVoicemail()}
              </div>
            </div>

            <div className="mt-4 rounded-[28px] bg-white/80 px-2 py-2 shadow-sm">
              <div className="flex items-center justify-between gap-1">
                {tabButton("favorites", "Favorites")}
                {tabButton("recents", "Recents")}
                {tabButton("contacts", "Contacts")}
                {tabButton("keypad", "Keypad")}
                {tabButton("voicemail", "Voicemail")}
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-[28px] border border-white/50 bg-[#e9edf2] shadow-[0_24px_60px_rgba(0,0,0,0.12)]">
              <div className="border-b border-white/50 bg-white/50 px-4 py-4">
                <div className="text-xl font-bold text-[#111111]">SMS / Messages</div>
                <div className="mt-1 text-xs text-[#8e8e93]">
                  Mobile browser messaging UI
                </div>
              </div>
              <div className="min-h-[360px]">{renderMessagesPanel()}</div>
            </div>
          </div>
        </div>
      </div>

      {showAddContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-[28px] bg-white p-5 shadow-2xl">
            <div className="text-lg font-bold text-[#111111]">
              {editingContactId ? "Edit Contact" : "Add Contact"}
            </div>

            <div className="mt-4 space-y-3">
              <input
                value={contactForm.name}
                onChange={(e) =>
                  setContactForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Name"
                className="w-full rounded-2xl border border-[#e5e5ea] px-4 py-3 text-sm text-[#111111] outline-none"
              />
              <input
                value={contactForm.number}
                onChange={(e) =>
                  setContactForm((prev) => ({ ...prev, number: e.target.value }))
                }
                placeholder="Number"
                className="w-full rounded-2xl border border-[#e5e5ea] px-4 py-3 text-sm text-[#111111] outline-none"
              />
              <input
                value={contactForm.avatar}
                onChange={(e) =>
                  setContactForm((prev) => ({ ...prev, avatar: e.target.value }))
                }
                placeholder="Avatar letter (optional)"
                className="w-full rounded-2xl border border-[#e5e5ea] px-4 py-3 text-sm text-[#111111] outline-none"
              />
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={resetContactModal}
                className="w-full rounded-2xl bg-[#f2f2f7] px-4 py-3 text-sm font-semibold text-[#111111]"
              >
                Cancel
              </button>
              <button
                onClick={saveContact}
                className="w-full rounded-2xl bg-[#0a84ff] px-4 py-3 text-sm font-semibold text-white"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}