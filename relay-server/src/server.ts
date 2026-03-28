import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import speech from "@google-cloud/speech";

const app = express();
app.use(cors());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws/stt" });

// Cloud Run service account auth ကိုသုံးမယ်
const speechClient = new speech.SpeechClient();

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