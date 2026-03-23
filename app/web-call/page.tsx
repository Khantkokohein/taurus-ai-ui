"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { requestFCMToken, onForegroundMessage } from "../../lib/firebase";
import { supabase } from "../../lib/client";

type TabKey = "favorites" | "recents" | "contacts" | "keypad" | "voicemail";
type CallPhase =
  | "idle"
  | "requesting-media"
  | "calling"
  | "incoming"
  | "connecting"
  | "in-call"
  | "ended"
  | "failed";

type RecentItem = {
  id: number;
  name: string;
  number: string;
  type: "incoming" | "outgoing" | "missed";
  time: string;
};

type ContactItem = {
  id: number;
  name: string;
  number: string;
  avatar: string;
  isFavorite?: boolean;
};

type IncomingOffer = {
  from: string;
  to: string;
  sdp: RTCSessionDescriptionInit;
};

type OwnershipBoundRow = {
  id: string;
  number_id: string | null;
  device_id: string | null;
  active: boolean | null;
  fcm_token?: string | null;
  numbers?:
    | {
        id: string;
        number: string | null;
        suffix_7: string | null;
      }
    | {
        id: string;
        number: string | null;
        suffix_7: string | null;
      }[]
    | null;
};

type OwnershipTokenRow = {
  id: string;
  fcm_token: string | null;
  numbers:
    | {
        id: string;
        number: string | null;
        suffix_7: string | null;
      }
    | {
        id: string;
        number: string | null;
        suffix_7: string | null;
      }[];
};

const PHONE_PREFIX = "+70 20 ";
const MAX_SUFFIX_DIGITS = 7;

const TURN_SERVER_IP = "64.176.85.59";
const TURN_SECRET = "taurus123";
const SIGNAL_CHANNEL = "taurus-calls";

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    {
      urls: `turn:${TURN_SERVER_IP}:3478`,
      username: "user",
      credential: TURN_SECRET,
    },
  ],
};

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

const defaultContacts: ContactItem[] = [];
const defaultRecents: RecentItem[] = [];

function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function getNowTimeLabel() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getSuffix(value: string) {
  if (!value.startsWith(PHONE_PREFIX)) return "";
  return value.slice(PHONE_PREFIX.length);
}

function normalizeNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(-7);
  return `${PHONE_PREFIX}${digits}`;
}

function isValidTaurusNumber(value: string) {
  return /^\+70 20 \d{7}$/.test(value);
}

function buildAvatar(name: string) {
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "T";
}

export default function CallPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("keypad");

  const [myNumber, setMyNumber] = useState(PHONE_PREFIX);
  const [ownedSuffix, setOwnedSuffix] = useState("");
  const [targetNumber, setTargetNumber] = useState(PHONE_PREFIX);

  const [contacts, setContacts] = useState<ContactItem[]>(defaultContacts);
  const [recents, setRecents] = useState<RecentItem[]>(defaultRecents);
  const [contactSearch, setContactSearch] = useState("");

  const [callPhase, setCallPhase] = useState<CallPhase>("idle");
  const [callStatus, setCallStatus] = useState("Checking owned number...");
  const [showCallScreen, setShowCallScreen] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(false);
  const [muted, setMuted] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);

  const [incomingOffer, setIncomingOffer] = useState<IncomingOffer | null>(null);
  const [incomingFrom, setIncomingFrom] = useState("");
  const [showIncomingModal, setShowIncomingModal] = useState(false);

  const [contactName, setContactName] = useState("");
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [activeRemoteNumber, setActiveRemoteNumber] = useState("");

  const localAudioRef = useRef<HTMLAudioElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  const peerRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const callTimeoutRef = useRef<number | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const callConnectedRef = useRef(false);
  const myNumberRef = useRef(PHONE_PREFIX);
  const callPhaseRef = useRef<CallPhase>("idle");
  const activeRemoteNumberRef = useRef("");
  const showIncomingModalRef = useRef(false);
  const incomingOfferRef = useRef<IncomingOffer | null>(null);
  const sessionIdRef = useRef(0);

  const ringtoneContextRef = useRef<AudioContext | null>(null);
  const ringtoneIntervalRef = useRef<number | null>(null);
  const ringtoneTimeoutsRef = useRef<number[]>([]);

  useEffect(() => {
    myNumberRef.current = myNumber;
  }, [myNumber]);

  useEffect(() => {
    callPhaseRef.current = callPhase;
  }, [callPhase]);

  useEffect(() => {
    activeRemoteNumberRef.current = activeRemoteNumber;
  }, [activeRemoteNumber]);

  useEffect(() => {
    showIncomingModalRef.current = showIncomingModal;
  }, [showIncomingModal]);

  useEffect(() => {
    incomingOfferRef.current = incomingOffer;
  }, [incomingOffer]);

  useEffect(() => {
    const storedContacts = safeJsonParse<ContactItem[]>(
      localStorage.getItem("taurus_contacts"),
      defaultContacts
    );
    const storedRecents = safeJsonParse<RecentItem[]>(
      localStorage.getItem("taurus_recents"),
      defaultRecents
    );
    const storedTarget = localStorage.getItem("taurus_target_number");

    setContacts(storedContacts);
    setRecents(storedRecents);
    if (storedTarget) setTargetNumber(storedTarget);

    void bindOwnedNumber();
  }, []);

  useEffect(() => {
    const initFCM = async () => {
      const token = await requestFCMToken();
      if (!token) return;

      console.log("🔥 Saved FCM token:", token);

      const deviceId = getOrCreateDeviceId();

      const { error } = await supabase
        .from("ownership")
        .update({ fcm_token: token })
        .eq("device_id", deviceId)
        .eq("active", true);

      if (error) {
        console.error("save fcm token error", error.message);
      }
    };

    void initFCM();

    onForegroundMessage((payload) => {
      console.log("📩 Foreground Notification:", payload);
    });
  }, []);

  useEffect(() => {
    localStorage.setItem("taurus_contacts", JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    localStorage.setItem("taurus_recents", JSON.stringify(recents));
  }, [recents]);

  useEffect(() => {
    localStorage.setItem("taurus_target_number", targetNumber);
  }, [targetNumber]);

  useEffect(() => {
    const channel = supabase.channel(SIGNAL_CHANNEL);

    channel
      .on("broadcast", { event: "offer" }, async ({ payload }) => {
        const mine = myNumberRef.current;
        if (!payload?.to || payload.to !== mine) return;
        if (!payload?.from || !payload?.sdp) return;
        if (!isValidTaurusNumber(mine)) return;

        const busy =
          callPhaseRef.current === "in-call" ||
          callPhaseRef.current === "connecting" ||
          callPhaseRef.current === "calling" ||
          callPhaseRef.current === "requesting-media" ||
          showIncomingModalRef.current;

        if (busy) {
          await sendSignal("end-call", {
            from: mine,
            to: payload.from,
          });
          return;
        }

        cleanupCall();

        const offer: IncomingOffer = {
          from: payload.from,
          to: payload.to,
          sdp: payload.sdp,
        };

        pendingCandidatesRef.current = [];
        setIncomingOffer(offer);
        setIncomingFrom(payload.from);
        setActiveRemoteNumber(payload.from);
        setCallPhase("incoming");
        setCallStatus(`Incoming call from ${payload.from}`);
        setShowIncomingModal(true);
        startRingtone("incoming");
      })
      .on("broadcast", { event: "answer" }, async ({ payload }) => {
        const mine = myNumberRef.current;
        const peer = peerRef.current;

        if (!payload?.to || payload.to !== mine) return;
        if (!payload?.sdp) return;
        if (!peer) return;
        if (peer.connectionState === "closed") return;

        try {
          if (peer.signalingState !== "have-local-offer") return;

          await peer.setRemoteDescription(new RTCSessionDescription(payload.sdp));

          for (const candidate of pendingCandidatesRef.current) {
            try {
              await peer.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (error) {
              console.error("pending ice add failed", error);
            }
          }
          pendingCandidatesRef.current = [];

          stopRingtone();
          setCallPhase("connecting");
          setCallStatus("Answer received. Connecting...");
        } catch (error) {
          console.error("answer error", error);
          stopRingtone();
          setCallPhase("failed");
          setCallStatus("Answer failed");
          cleanupCall();
          setShowCallScreen(false);
          setActiveRemoteNumber("");
        }
      })
      .on("broadcast", { event: "ice-candidate" }, async ({ payload }) => {
        const mine = myNumberRef.current;
        const peer = peerRef.current;

        if (!payload?.to || payload.to !== mine) return;
        if (!payload?.candidate) return;
        if (!peer) return;
        if (peer.connectionState === "closed") return;

        try {
          if (peer.remoteDescription) {
            await peer.addIceCandidate(new RTCIceCandidate(payload.candidate));
          } else {
            pendingCandidatesRef.current.push(payload.candidate);
          }
        } catch (error) {
          console.error("ice error", error);
        }
      })
      .on("broadcast", { event: "end-call" }, ({ payload }) => {
        const mine = myNumberRef.current;
        if (!payload?.to || payload.to !== mine) return;

        stopRingtone();

        if (!callConnectedRef.current && activeRemoteNumberRef.current) {
          addRecent(activeRemoteNumberRef.current, "missed");
        }

        cleanupCall();
        setIncomingOffer(null);
        setIncomingFrom("");
        setShowIncomingModal(false);
        setShowCallScreen(false);
        setCallPhase("ended");
        setCallStatus("Remote user ended the call");
        setActiveRemoteNumber("");
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("Realtime signaling ready");
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      stopRingtone();
      cleanupCall();
    };
  }, []);

  useEffect(() => {
    if (!showCallScreen || callPhase !== "in-call") return;

    timerRef.current = window.setInterval(() => {
      setCallSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      timerRef.current = null;
    };
  }, [showCallScreen, callPhase]);

  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((audioTrack) => {
        audioTrack.enabled = !muted;
      });
    }
  }, [muted]);

  useEffect(() => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.volume = speakerOn ? 1 : 0.75;
    }
  }, [speakerOn]);

  async function bindOwnedNumber() {
    const deviceId = getOrCreateDeviceId();

    const { data, error } = await supabase
      .from("ownership")
      .select(
        `
        id,
        number_id,
        device_id,
        active,
        fcm_token,
        numbers:number_id (
          id,
          number,
          suffix_7
        )
      `
      )
      .eq("device_id", deviceId)
      .eq("active", true)
      .limit(1);

    if (error) {
      console.error("bind owned number error", error.message);
      setCallStatus("Failed to load owned number");
      return;
    }

    const owned = (data || []) as OwnershipBoundRow[];

    const linkedNumber = owned.length
      ? Array.isArray(owned[0].numbers)
        ? owned[0].numbers[0]
        : owned[0].numbers
      : null;

    const suffix = linkedNumber?.number || linkedNumber?.suffix_7 || "";

    if (suffix) {
      const cleanSuffix = String(suffix).replace(/\D/g, "").slice(-7);
      setOwnedSuffix(cleanSuffix);
      setMyNumber(`${PHONE_PREFIX}${cleanSuffix}`);
      setCallStatus("Owned number bound successfully");
    } else {
      setOwnedSuffix("");
      setMyNumber(PHONE_PREFIX);
      setCallStatus("No owned number found for this device");
    }
  }

  function getOrCreateDeviceId() {
    let id = localStorage.getItem("device_id");

    if (!id) {
      id = "DEV-" + Math.random().toString(36).substring(2, 12).toUpperCase();
      localStorage.setItem("device_id", id);
    }

    return id;
  }

  function addRecent(number: string, type: "incoming" | "outgoing" | "missed") {
    const matched = contacts.find((c) => c.number === number);
    const item: RecentItem = {
      id: Date.now(),
      name: matched?.name || "Unknown",
      number,
      type,
      time: getNowTimeLabel(),
    };
    setRecents((prev) => [item, ...prev]);
  }

  function clearCallTimeout() {
    if (callTimeoutRef.current) {
      window.clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }
  }

  function cleanupCall() {
    clearCallTimeout();

    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const currentPeer = peerRef.current;
    if (currentPeer) {
      currentPeer.onicecandidate = null;
      currentPeer.ontrack = null;
      currentPeer.onconnectionstatechange = null;
      currentPeer.oniceconnectionstatechange = null;
      try {
        currentPeer.close();
      } catch {}
      peerRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((mediaTrack) => mediaTrack.stop());
      localStreamRef.current = null;
    }

    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((mediaTrack) => mediaTrack.stop());
      remoteStreamRef.current = null;
    }

    if (localAudioRef.current) {
      localAudioRef.current.srcObject = null;
    }

    if (remoteAudioRef.current) {
      remoteAudioRef.current.pause();
      remoteAudioRef.current.srcObject = null;
    }

    pendingCandidatesRef.current = [];
    callConnectedRef.current = false;
    setCallSeconds(0);
    setMuted(false);
  }

  function getAudioContext() {
    const AudioContextCtor =
      window.AudioContext ||
      (window as typeof window & {
        webkitAudioContext?: typeof AudioContext;
      }).webkitAudioContext;

    if (!AudioContextCtor) return null;

    if (!ringtoneContextRef.current) {
      ringtoneContextRef.current = new AudioContextCtor();
    }

    return ringtoneContextRef.current;
  }

  function scheduleBeep(
    ctx: AudioContext,
    frequency: number,
    durationMs: number,
    delayMs = 0,
    gainValue = 0.05
  ) {
    const timeoutId = window.setTimeout(() => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.value = gainValue;

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      oscillator.start();
      window.setTimeout(() => {
        try {
          oscillator.stop();
        } catch {}
        oscillator.disconnect();
        gain.disconnect();
      }, durationMs);
    }, delayMs);

    ringtoneTimeoutsRef.current.push(timeoutId);
  }

  function stopRingtone() {
    if (ringtoneIntervalRef.current) {
      window.clearInterval(ringtoneIntervalRef.current);
      ringtoneIntervalRef.current = null;
    }

    ringtoneTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
    ringtoneTimeoutsRef.current = [];
  }

  function startRingtone(kind: "incoming" | "outgoing") {
    stopRingtone();

    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      void ctx.resume().catch(() => {});
    }

    const playPattern = () => {
      if (kind === "incoming") {
        scheduleBeep(ctx, 880, 180, 0, 0.055);
        scheduleBeep(ctx, 660, 180, 260, 0.055);
        scheduleBeep(ctx, 880, 220, 620, 0.05);
      } else {
        scheduleBeep(ctx, 520, 220, 0, 0.045);
        scheduleBeep(ctx, 520, 220, 340, 0.045);
      }
    };

    playPattern();
    ringtoneIntervalRef.current = window.setInterval(
      playPattern,
      kind === "incoming" ? 1800 : 1500
    );
  }

  async function sendSignal(
    event: "offer" | "answer" | "ice-candidate" | "end-call",
    payload: Record<string, unknown>
  ) {
    if (!channelRef.current) return;

    const result = await channelRef.current.send({
      type: "broadcast",
      event,
      payload,
    });

    if (result !== "ok") {
      console.error("signal send failed", event, result);
    }
  }

  async function ensureMediaStream() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    localStreamRef.current = stream;

    if (localAudioRef.current) {
      localAudioRef.current.srcObject = stream;
      localAudioRef.current.muted = true;
    }

    return stream;
  }

  async function attachRemoteAudio(stream: MediaStream) {
    if (!remoteAudioRef.current) return;
    remoteAudioRef.current.srcObject = stream;
    remoteAudioRef.current.autoplay = true;
    try {
      await remoteAudioRef.current.play();
    } catch (error) {
      console.error("remote audio play blocked", error);
    }
  }

  async function buildPeerConnection(remoteNumber: string) {
    const peer = new RTCPeerConnection(RTC_CONFIG);
    const remoteStream = new MediaStream();

    peerRef.current = peer;
    remoteStreamRef.current = remoteStream;
    pendingCandidatesRef.current = [];

    const stream = await ensureMediaStream();

    stream.getTracks().forEach((mediaTrack) => {
      try {
        peer.addTrack(mediaTrack, stream);
      } catch (error) {
        console.error("addTrack failed", error);
      }
    });

    peer.ontrack = (event) => {
      const incomingStream = event.streams?.[0];
      if (incomingStream) {
        incomingStream.getTracks().forEach((mediaTrack) => {
          const exists = remoteStream
            .getTracks()
            .some((existingTrack) => existingTrack.id === mediaTrack.id);

          if (!exists) {
            remoteStream.addTrack(mediaTrack);
          }
        });
      } else {
        if (event.track) {
          remoteStream.addTrack(event.track);
        }
      }

      void attachRemoteAudio(remoteStream);
    };

    peer.onicecandidate = async (event) => {
      if (!event.candidate) return;
      if (!peerRef.current || peerRef.current !== peer) return;
      if (peer.connectionState === "closed") return;

      await sendSignal("ice-candidate", {
        from: myNumberRef.current,
        to: remoteNumber,
        candidate: event.candidate.toJSON(),
      });
    };

    peer.onconnectionstatechange = () => {
      const state = peer.connectionState;

      if (state === "connected") {
        callConnectedRef.current = true;
        stopRingtone();
        clearCallTimeout();
        setCallPhase("in-call");
        setCallStatus("Connected");
      } else if (state === "connecting") {
        setCallPhase("connecting");
        setCallStatus("Connecting...");
      } else if (state === "failed") {
        stopRingtone();
        clearCallTimeout();
        setCallPhase("failed");
        setCallStatus("Call failed");
      } else if (state === "disconnected") {
        stopRingtone();
        clearCallTimeout();
        setCallPhase("failed");
        setCallStatus("Call disconnected");
      } else if (state === "closed") {
        stopRingtone();
      }
    };

    peer.oniceconnectionstatechange = () => {
      if (peer.iceConnectionState === "failed") {
        stopRingtone();
        clearCallTimeout();
        setCallPhase("failed");
        setCallStatus("ICE connection failed");
      }
    };

    return peer;
  }

  async function validateTargetOwnership(numberWithPrefix: string) {
    const suffix = getSuffix(numberWithPrefix);

    const { data, error } = await supabase
      .from("numbers")
      .select("id, number, status")
      .eq("number", suffix)
      .eq("status", "sold")
      .limit(1);

    if (error) {
      throw new Error(error.message);
    }

    return (data || []).length > 0;
  }

  async function getTargetFcmToken(numberWithPrefix: string) {
    const suffix = getSuffix(numberWithPrefix);

    if (!suffix) return null;

    const { data, error } = await supabase
      .from("ownership")
      .select(
        `
        id,
        fcm_token,
        numbers!inner (
          id,
          number,
          suffix_7
        )
      `
      )
      .eq("active", true)
      .eq("numbers.number", suffix)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("target token lookup error", error.message);
      return null;
    }

    const row = data as OwnershipTokenRow | null;
    return row?.fcm_token || null;
  }

  async function sendIncomingPush(receiverToken: string, callerNumber: string) {
    try {
      const response = await fetch("/api/send-push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: receiverToken,
          title: "Incoming Call",
          body: `${callerNumber} is calling you`,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error("push send failed", response.status, errorBody);
      }
    } catch (error) {
      console.error("push request failed", error);
    }
  }

  async function placeCall() {
    if (!ownedSuffix || !isValidTaurusNumber(myNumber)) {
      setCallStatus("No owned number is bound to this device");
      return;
    }

    if (!isValidTaurusNumber(targetNumber)) {
      setCallStatus("Enter valid target number");
      return;
    }

    if (myNumber === targetNumber) {
      setCallStatus("My Number and Target cannot be the same");
      return;
    }

    try {
      const targetExists = await validateTargetOwnership(targetNumber);

      if (!targetExists) {
        setCallStatus("Target number is not registered yet");
        return;
      }

      const receiverToken = await getTargetFcmToken(targetNumber);
      if (receiverToken) {
        await sendIncomingPush(receiverToken, myNumberRef.current);
      }

      sessionIdRef.current += 1;
      const currentSessionId = sessionIdRef.current;

      stopRingtone();
      cleanupCall();

      setIncomingOffer(null);
      setIncomingFrom("");
      setShowIncomingModal(false);
      setActiveRemoteNumber(targetNumber);
      setShowCallScreen(true);
      setCallPhase("requesting-media");
      setCallStatus("Requesting microphone...");

      const peer = await buildPeerConnection(targetNumber);
      if (sessionIdRef.current !== currentSessionId) return;
      if (!peerRef.current || peerRef.current !== peer) return;
      if (peer.connectionState === "closed") {
        throw new Error("Peer connection already closed");
      }

      setCallPhase("calling");
      setCallStatus("Creating offer...");

      const offer = await peer.createOffer({
        offerToReceiveAudio: true,
      });

      if (sessionIdRef.current !== currentSessionId) return;
      if (!peerRef.current || peerRef.current !== peer) {
        throw new Error("Peer connection already closed");
      }

      await peer.setLocalDescription(offer);

      addRecent(targetNumber, "outgoing");

      await sendSignal("offer", {
        from: myNumberRef.current,
        to: targetNumber,
        sdp: offer,
      });

      setCallStatus("Calling...");
      startRingtone("outgoing");

      callTimeoutRef.current = window.setTimeout(async () => {
        if (!callConnectedRef.current) {
          stopRingtone();
          cleanupCall();
          setShowCallScreen(false);
          setCallPhase("ended");
          setCallStatus("No answer (timeout)");
          addRecent(targetNumber, "missed");

          await sendSignal("end-call", {
            from: myNumberRef.current,
            to: targetNumber,
          });

          setActiveRemoteNumber("");
        }
      }, 20000);
    } catch (error) {
      console.error("place call failed", error);
      stopRingtone();
      cleanupCall();
      setShowCallScreen(false);
      setCallPhase("failed");
      setCallStatus(
        error instanceof Error ? error.message : "Failed to start call"
      );
      setActiveRemoteNumber("");
    }
  }

  async function acceptIncomingCall() {
    const currentIncomingOffer = incomingOfferRef.current;
    if (!currentIncomingOffer) return;

    try {
      sessionIdRef.current += 1;
      const currentSessionId = sessionIdRef.current;

      clearCallTimeout();
      stopRingtone();
      cleanupCall();

      setShowIncomingModal(false);
      setShowCallScreen(true);
      setActiveRemoteNumber(currentIncomingOffer.from);
      setCallPhase("requesting-media");
      setCallStatus("Requesting microphone...");

      const peer = await buildPeerConnection(currentIncomingOffer.from);
      if (sessionIdRef.current !== currentSessionId) return;
      if (!peerRef.current || peerRef.current !== peer) return;
      if (peer.connectionState === "closed") {
        throw new Error("Peer connection already closed");
      }

      await peer.setRemoteDescription(
        new RTCSessionDescription(currentIncomingOffer.sdp)
      );

      for (const candidate of pendingCandidatesRef.current) {
        try {
          await peer.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
          console.error("pending ice add failed", error);
        }
      }
      pendingCandidatesRef.current = [];

      const answer = await peer.createAnswer();
      if (!peerRef.current || peerRef.current !== peer) {
        throw new Error("Peer connection already closed");
      }

      await peer.setLocalDescription(answer);

      addRecent(currentIncomingOffer.from, "incoming");

      await sendSignal("answer", {
        from: myNumberRef.current,
        to: currentIncomingOffer.from,
        sdp: answer,
      });

      setCallPhase("connecting");
      setCallStatus("Answer sent. Connecting...");
      setIncomingOffer(null);
      setIncomingFrom("");
    } catch (error) {
      console.error("accept call failed", error);
      stopRingtone();
      cleanupCall();
      setShowCallScreen(false);
      setCallPhase("failed");
      setCallStatus(
        error instanceof Error ? error.message : "Failed to answer"
      );
      setActiveRemoteNumber("");
      setIncomingOffer(null);
      setIncomingFrom("");
    }
  }

  async function rejectIncomingCall() {
    stopRingtone();
    clearCallTimeout();

    const currentIncomingOffer = incomingOfferRef.current;
    if (currentIncomingOffer) {
      addRecent(currentIncomingOffer.from, "missed");
      await sendSignal("end-call", {
        from: myNumberRef.current,
        to: currentIncomingOffer.from,
      });
    }

    cleanupCall();
    setIncomingOffer(null);
    setIncomingFrom("");
    setShowIncomingModal(false);
    setCallPhase("idle");
    setCallStatus("Call rejected");
    setActiveRemoteNumber("");
  }

  async function endCall() {
    stopRingtone();
    clearCallTimeout();

    const remote =
      activeRemoteNumberRef.current || incomingOfferRef.current?.from || "";

    cleanupCall();
    setShowCallScreen(false);
    setShowIncomingModal(false);
    setIncomingOffer(null);
    setIncomingFrom("");
    setCallPhase("ended");
    setCallStatus("Call ended");
    setActiveRemoteNumber("");

    if (remote) {
      await sendSignal("end-call", {
        from: myNumberRef.current,
        to: remote,
      });
    }
  }

  function appendToTarget(value: string) {
    const suffix = getSuffix(targetNumber);

    if (/^\d$/.test(value)) {
      if (suffix.length >= MAX_SUFFIX_DIGITS) return;
      setTargetNumber(`${PHONE_PREFIX}${suffix}${value}`);
    }
  }

  function deleteTarget() {
    const suffix = getSuffix(targetNumber);
    if (!suffix.length) return;
    setTargetNumber(`${PHONE_PREFIX}${suffix.slice(0, -1)}`);
  }

  function clearTarget() {
    setTargetNumber(PHONE_PREFIX);
  }

  function saveContact() {
    const cleanName = contactName.trim();
    const cleanNumber = normalizeNumber(targetNumber);

    if (!cleanName || !isValidTaurusNumber(cleanNumber)) {
      alert("Add valid contact name and target number");
      return;
    }

    const newContact: ContactItem = {
      id: Date.now(),
      name: cleanName,
      number: cleanNumber,
      avatar: buildAvatar(cleanName),
      isFavorite: false,
    };

    setContacts((prev) => [newContact, ...prev]);
    setContactName("");
    setShowAddContactModal(false);
  }

  function deleteContact(contactId: number) {
    setContacts((prev) => prev.filter((item) => item.id !== contactId));
  }

  function toggleFavorite(contactId: number) {
    setContacts((prev) =>
      prev.map((item) =>
        item.id === contactId ? { ...item, isFavorite: !item.isFavorite } : item
      )
    );
  }

  const filteredContacts = useMemo(() => {
    const q = contactSearch.trim().toLowerCase();
    if (!q) return contacts;

    return contacts.filter(
      (c) => c.name.toLowerCase().includes(q) || c.number.toLowerCase().includes(q)
    );
  }, [contacts, contactSearch]);

  const favoriteContacts = useMemo(
    () => contacts.filter((c) => c.isFavorite),
    [contacts]
  );

  const activeCallName = useMemo(() => {
    const found = contacts.find((c) => c.number === activeRemoteNumber);
    return found?.name || activeRemoteNumber || "Unknown";
  }, [contacts, activeRemoteNumber]);

  const formattedDuration = useMemo(() => {
    const mins = Math.floor(callSeconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (callSeconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  }, [callSeconds]);

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
            onClick={() => setTargetNumber(contact.number)}
            className="flex w-full items-center gap-4 rounded-3xl bg-white px-4 py-4 text-left shadow-sm"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0a84ff] text-sm font-bold text-white">
              {contact.avatar}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-base font-semibold text-[#111111]">
                {contact.name}
              </div>
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
            <button
              onClick={() => setTargetNumber(item.number)}
              className="rounded-full bg-[#0a84ff] px-3 py-2 text-xs font-semibold text-white"
            >
              Dial
            </button>
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
          onClick={() => setShowAddContactModal(true)}
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
            <div key={contact.id} className="rounded-3xl bg-white px-4 py-4 shadow-sm">
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
                  onClick={() => setTargetNumber(contact.number)}
                  className="rounded-full bg-[#34c759] px-3 py-2 text-xs font-semibold text-white"
                >
                  Call
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => toggleFavorite(contact.id)}
                  className="rounded-full bg-[#f2f2f7] px-3 py-2 text-xs font-semibold text-[#111111]"
                >
                  {contact.isFavorite ? "Unfavorite" : "Favorite"}
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
        <div className="text-center">
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#8e8e93]">
            My Number
          </div>
          <input
            value={myNumber}
            readOnly={Boolean(ownedSuffix)}
            onChange={(e) => setMyNumber(normalizeNumber(e.target.value))}
            className="w-full rounded-2xl border border-[#e5e5ea] bg-[#f7f7fa] px-4 py-3 text-center text-lg font-semibold text-[#111111] outline-none read-only:cursor-not-allowed read-only:opacity-80"
            placeholder="+70 20 0000001"
          />
          <div className="mt-2 text-xs text-[#8e8e93]">
            {ownedSuffix
              ? "Auto-bound from this device ownership"
              : "No owned number bound yet"}
          </div>
        </div>

        <div className="mt-4 text-center">
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#8e8e93]">
            Target Number
          </div>
          <div className="break-all text-[34px] font-semibold tracking-[0.04em] text-[#111111]">
            {targetNumber}
          </div>
        </div>

        <div className="mt-3 text-center text-sm text-[#8e8e93]">{callStatus}</div>
      </div>

      <div className="mt-4 flex justify-center gap-2">
        <button
          onClick={() => setShowAddContactModal(true)}
          className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#111111] shadow-sm"
        >
          Save Contact
        </button>
        <button
          onClick={clearTarget}
          className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#111111] shadow-sm"
        >
          Clear All
        </button>
      </div>

      <div className="mt-6 grid gap-y-5">
        {keypadRows.map((row, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-3 justify-items-center gap-4">
            {row.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => appendToTarget(item.key)}
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
          onClick={clearTarget}
          className="flex h-14 min-w-[82px] items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-[#111111] shadow-sm"
        >
          Clear
        </button>

        <button
          type="button"
          onClick={placeCall}
          disabled={
            !ownedSuffix ||
            !isValidTaurusNumber(myNumber) ||
            !isValidTaurusNumber(targetNumber) ||
            callPhase === "calling" ||
            callPhase === "connecting" ||
            callPhase === "in-call"
          }
          className="flex h-20 w-20 items-center justify-center rounded-full bg-[#34c759] text-3xl text-white shadow-[0_12px_30px_rgba(52,199,89,0.35)] transition active:scale-95 disabled:opacity-60"
        >
          📞
        </button>

        <button
          type="button"
          onClick={deleteTarget}
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
        <div className="mt-2 text-sm text-[#8e8e93]">No voicemail yet.</div>
      </div>
      <div className="rounded-3xl bg-white px-4 py-4 shadow-sm">
        <div className="text-sm text-[#8e8e93]">
          Web call stage complete. Voicemail can be added later.
        </div>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#dfe3e8] px-3 py-4">
      <audio ref={localAudioRef} autoPlay muted className="hidden" />
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

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

            <div className="mt-3 px-2">
              <div className="text-[28px] font-bold tracking-[-0.03em] text-[#111111]">
                Taurus Call
              </div>
            </div>

            <div className="mt-4 min-h-[520px] rounded-[34px] bg-[#f2f2f7]">
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
          </div>
        </div>
      </div>

      {showAddContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-[28px] bg-white p-5 shadow-2xl">
            <div className="text-lg font-bold text-[#111111]">Add Contact</div>

            <div className="mt-4 space-y-3">
              <input
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Name"
                className="w-full rounded-2xl border border-[#e5e5ea] px-4 py-3 text-sm text-[#111111] outline-none"
              />
              <input
                value={targetNumber}
                onChange={(e) => setTargetNumber(normalizeNumber(e.target.value))}
                placeholder="+70 20 0000001"
                className="w-full rounded-2xl border border-[#e5e5ea] px-4 py-3 text-sm text-[#111111] outline-none"
              />
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setShowAddContactModal(false)}
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

      {showIncomingModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-sm rounded-[28px] bg-white p-6 text-center shadow-2xl">
            <div className="text-sm text-[#8e8e93]">Incoming Call</div>
            <div className="mt-2 text-2xl font-bold text-[#111111]">{incomingFrom}</div>
            <div className="mt-1 text-sm text-[#8e8e93]">to {myNumber}</div>

            <div className="mt-6 flex justify-center gap-4">
              <button
                onClick={rejectIncomingCall}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-[#ff3b30] text-2xl text-white"
              >
                ✕
              </button>
              <button
                onClick={acceptIncomingCall}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-[#34c759] text-2xl text-white"
              >
                📞
              </button>
            </div>
          </div>
        </div>
      )}

      {showCallScreen && (
        <div className="fixed inset-0 z-[60] bg-[radial-gradient(circle_at_top,rgba(65,79,255,0.32),transparent_28%),linear-gradient(180deg,#0b1228_0%,#111827_100%)] px-6 py-8 text-white">
          <div className="mx-auto flex min-h-full max-w-[460px] flex-col">
            <div className="flex justify-center pt-2">
              <div className="h-7 w-32 rounded-full bg-black/80" />
            </div>

            <div className="mt-10 text-center">
              <div className="text-sm text-white/60">
                {callPhase === "requesting-media" && "Requesting microphone..."}
                {callPhase === "calling" && "Calling..."}
                {callPhase === "incoming" && "Incoming..."}
                {callPhase === "connecting" && "Connecting..."}
                {callPhase === "in-call" && "In Call"}
                {callPhase === "failed" && "Failed"}
                {callPhase === "ended" && "Ended"}
                {callPhase === "idle" && "Idle"}
              </div>

              <div className="mt-3 text-[34px] font-bold tracking-[-0.03em]">
                {activeCallName || "Unknown"}
              </div>
              <div className="mt-2 text-base text-white/75">
                {activeRemoteNumber || targetNumber}
              </div>
              <div className="mt-3 text-sm text-[#9cc3ff]">
                {callPhase === "in-call" ? formattedDuration : callStatus}
              </div>
            </div>

            <div className="mt-12 flex justify-center">
              <div className="flex h-32 w-32 items-center justify-center rounded-full bg-white/10 text-6xl shadow-[0_0_40px_rgba(255,255,255,0.08)]">
                📞
              </div>
            </div>

            <div className="mt-auto pb-8">
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => setMuted((prev) => !prev)}
                  className={`flex h-20 flex-col items-center justify-center rounded-full ${
                    muted ? "bg-[#0a84ff]" : "bg-white/10"
                  } backdrop-blur`}
                >
                  <span className="text-2xl">🎙️</span>
                  <span className="mt-1 text-xs">{muted ? "Muted" : "Mute"}</span>
                </button>

                <button
                  onClick={() => setSpeakerOn((prev) => !prev)}
                  className={`flex h-20 flex-col items-center justify-center rounded-full ${
                    speakerOn ? "bg-[#0a84ff]" : "bg-white/10"
                  } backdrop-blur`}
                >
                  <span className="text-2xl">🔊</span>
                  <span className="mt-1 text-xs">
                    {speakerOn ? "Speaker On" : "Speaker"}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab("keypad")}
                  className="flex h-20 flex-col items-center justify-center rounded-full bg-white/10 backdrop-blur"
                >
                  <span className="text-2xl">⌨️</span>
                  <span className="mt-1 text-xs">Keypad</span>
                </button>
              </div>

              <div className="mt-6 flex justify-center">
                <button
                  onClick={endCall}
                  className="flex h-20 w-20 items-center justify-center rounded-full bg-[#ff3b30] text-3xl text-white shadow-[0_12px_30px_rgba(255,59,48,0.35)]"
                >
                  📞
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}