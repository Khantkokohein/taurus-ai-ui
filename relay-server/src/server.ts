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

const speechClient = new speech.SpeechClient({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
  projectId: process.env.GOOGLE_PROJECT_ID,
});

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

wss.on("connection", (ws: WebSocket) => {
  let recognizeStream: NodeJS.WritableStream | null = null;

  const cleanup = () => {
    if (recognizeStream) {
      try {
        (recognizeStream as { destroy?: () => void }).destroy?.();
      } catch {}
      recognizeStream = null;
    }
  };

  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw.toString()) as ClientMessage;

      if (msg.type === "start") {
        cleanup();

        recognizeStream = speechClient
          .streamingRecognize({
            config: {
              encoding: "LINEAR16",
              sampleRateHertz: msg.sampleRateHertz || 16000,
              languageCode: msg.languageCode || "en-US",
              enableAutomaticPunctuation: true,
              model: "latest_long",
            },
            interimResults: true,
          })
          .on("error", (err: unknown) => {
            ws.send(
              JSON.stringify({
                type: "error",
                message:
                  err instanceof Error ? err.message : "STT stream error",
              })
            );
          })
          .on("data", (data: unknown) => {
            const payload = data as {
              results?: Array<{
                isFinal?: boolean;
                alternatives?: Array<{ transcript?: string }>;
              }>;
            };

            const result = payload.results?.[0];
            const transcript = result?.alternatives?.[0]?.transcript || "";
            const isFinal = !!result?.isFinal;

            ws.send(
              JSON.stringify({
                type: "transcript",
                transcript,
                isFinal,
              })
            );
          }) as unknown as NodeJS.WritableStream;

        ws.send(JSON.stringify({ type: "started" }));
        return;
      }

      if (msg.type === "audio") {
        if (!recognizeStream) return;
        const buffer = Buffer.from(msg.audio, "base64");
        (recognizeStream as NodeJS.WritableStream).write(buffer);
        return;
      }

      if (msg.type === "stop") {
        cleanup();
        ws.send(JSON.stringify({ type: "stopped" }));
      }
    } catch (error: unknown) {
      ws.send(
        JSON.stringify({
          type: "error",
          message:
            error instanceof Error ? error.message : "Invalid WS message",
        })
      );
    }
  });

  ws.on("close", cleanup);
  ws.on("error", cleanup);
});

const PORT = Number(process.env.PORT || 8080);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Relay server running on port ${PORT}`);
});