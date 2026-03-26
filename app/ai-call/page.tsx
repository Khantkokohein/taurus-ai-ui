"use client";

import { useEffect, useRef, useState } from "react";

export default function AICallPage() {
  const [status, setStatus] = useState("Ready");
  const [isCalling, setIsCalling] = useState(false);

  const recognitionRef = useRef<any>(null);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).webkitSpeechRecognition ||
      (window as any).SpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech Recognition not supported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "my-MM"; // 🔥 မြန်မာ support
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = async (event: any) => {
      const text =
        event.results[event.results.length - 1][0].transcript;

      if (!text) return;

      setStatus("You: " + text);

      const res = await fetch("/api/ai-call", {
        method: "POST",
        body: JSON.stringify({ prompt: text }),
      });

      const data = await res.json();

      const reply = data.text || "No response";

      speak(reply);
    };

    recognition.onend = () => {
      if (isCalling) recognition.start();
    };

    recognitionRef.current = recognition;
  }, [isCalling]);

  function startCall() {
    setIsCalling(true);
    setStatus("Calling...");

    playRingtone();

    setTimeout(() => {
      stopRingtone();
      setStatus("Connected");

      speak("Hello, I am Taurus AI. How can I help you?");

      recognitionRef.current?.start();
    }, 3000);
  }

  function endCall() {
    setIsCalling(false);
    recognitionRef.current?.stop();
    stopRingtone();
    speechSynthesis.cancel();
    setStatus("Call ended");
  }

  function speak(text: string) {
    const utter = new SpeechSynthesisUtterance(text);

    const hasMyanmar = /[\u1000-\u109F]/.test(text);
    utter.lang = hasMyanmar ? "my-MM" : "en-US";

    speechSynthesis.cancel();
    speechSynthesis.speak(utter);

    setStatus("AI: " + text);
  }

  function playRingtone() {
    if (!ringtoneRef.current) return;
    ringtoneRef.current.src = "/ringtone-1.mp3";
    ringtoneRef.current.loop = true;
    ringtoneRef.current.play();
  }

  function stopRingtone() {
    if (!ringtoneRef.current) return;
    ringtoneRef.current.pause();
    ringtoneRef.current.currentTime = 0;
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-6">
      <audio ref={ringtoneRef} />

      <h1 className="text-2xl">Taurus AI Call</h1>

      <p>{status}</p>

      {!isCalling ? (
        <button
          onClick={startCall}
          className="bg-green-500 px-6 py-3 rounded-full text-black"
        >
          Call AI
        </button>
      ) : (
        <button
          onClick={endCall}
          className="bg-red-500 px-6 py-3 rounded-full"
        >
          End Call
        </button>
      )}
    </main>
  );
}