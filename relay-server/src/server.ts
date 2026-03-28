import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import speech from "@google-cloud/speech";
import textToSpeech from "@google-cloud/text-to-speech";

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// ✅ Cloud Run service account auto auth
const speechClient = new speech.SpeechClient();
const ttsClient = new textToSpeech.TextToSpeechClient();

// ✅ Cloud Run TTS endpoint
app.post("/tts", async (req, res) => {
  try {
    const text =
      typeof req.body?.text === "string" ? req.body.text.trim() : "";

    if (!text) {
      return res.status(400).json({ error: "Text is required." });
    }

    const [response] = await ttsClient.synthesizeSpeech({
      input: { text },
      voice: {
        languageCode: "en-US",
        name: "en-US-Neural2-D",
      },
      audioConfig: {
        audioEncoding: "MP3",
        speakingRate: 1,
        pitch: 0,
      },
    });

    if (!response.audioContent) {
      return res.status(500).json({ error: "Empty TTS response." });
    }

    const audioBuffer = Buffer.from(response.audioContent as Uint8Array);

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Length", String(audioBuffer.length));
    return res.status(200).send(audioBuffer);
  } catch (error: unknown) {
    console.error("TTS ERROR FULL:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "TTS failed.",
    });
  }
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws/stt" });

type ClientMessage =
  | {
      type: "start";
      languageCode?: string;
      sampleRateHertz?: number;
    }
  | {
      type: "audio";
      audio: string;
    }
  | {
      type: "stop";
    };

type SafeRecognizeStream = {
  destroyed?: boolean;
  writable?: boolean;
  writableEnded?: boolean;
  write?: (chunk: Buffer) => boolean;
  end?: () => void;
  destroy?: () => void;
  on?: (...args: any[]) => any;
};

wss.on("connection", (ws: WebSocket) => {
  let recognizeStream: SafeRecognizeStream | null = null;
  let streamSessionId = 0;

  const cleanup = () => {
    const stream = recognizeStream;
    recognizeStream = null;
    streamSessionId += 1;

    if (!stream) return;

    try {
      if (!stream.destroyed) {
        stream.end?.();
      }
    } catch {}

    try {
      if (!stream.destroyed) {
        stream.destroy?.();
      }
    } catch {}
  };

  const canWriteToStream = (stream: SafeRecognizeStream | null) => {
    if (!stream) return false;
    if (stream.destroyed) return false;
    if (stream.writableEnded) return false;
    if (stream.writable === false) return false;
    if (typeof stream.write !== "function") return false;
    return true;
  };

  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw.toString()) as ClientMessage;

      if (msg.type === "start") {
        cleanup();

        const currentSessionId = streamSessionId + 1;
        streamSessionId = currentSessionId;

        const stream = speechClient.streamingRecognize({
          config: {
            encoding: "LINEAR16",
            sampleRateHertz: msg.sampleRateHertz || 16000,
            languageCode: msg.languageCode || "en-US",
            enableAutomaticPunctuation: true,
            model: "latest_long",
          },
          interimResults: true,
        }) as unknown as SafeRecognizeStream;

        recognizeStream = stream;

        stream.on?.("error", (err: unknown) => {
          if (currentSessionId !== streamSessionId) return;

          try {
            ws.send(
              JSON.stringify({
                type: "error",
                message:
                  err instanceof Error ? err.message : "STT stream error",
              })
            );
          } catch {}

          cleanup();
        });

        stream.on?.("data", (data: any) => {
          if (currentSessionId !== streamSessionId) return;

          const result = data?.results?.[0];
          const transcript = result?.alternatives?.[0]?.transcript || "";
          const isFinal = !!result?.isFinal;

          try {
            ws.send(
              JSON.stringify({
                type: "transcript",
                transcript,
                isFinal,
              })
            );
          } catch {}
        });

        ws.send(JSON.stringify({ type: "started" }));
        return;
      }

      if (msg.type === "audio") {
        const stream = recognizeStream;
        if (!canWriteToStream(stream)) return;

        const safeStream = stream as SafeRecognizeStream;

        try {
          const buffer = Buffer.from(msg.audio, "base64");
          safeStream.write?.(buffer);
        } catch (error) {
          console.error("STREAM WRITE ERROR:", error);
          cleanup();
        }

        return;
      }

      if (msg.type === "stop") {
        cleanup();
        try {
          ws.send(JSON.stringify({ type: "stopped" }));
        } catch {}
        return;
      }
    } catch (error: unknown) {
      try {
        ws.send(
          JSON.stringify({
            type: "error",
            message:
              error instanceof Error ? error.message : "Invalid WS message",
          })
        );
      } catch {}
    }
  });

  ws.on("close", cleanup);
  ws.on("error", cleanup);
});

const PORT = Number(process.env.PORT || 8080);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Relay server running on port ${PORT}`);
});