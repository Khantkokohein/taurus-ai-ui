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
      audio: string; // base64 PCM16 mono
    }
  | {
      type: "stop";
    };

wss.on("connection", (ws: WebSocket) => {
  let recognizeStream: any = null;

  const cleanup = () => {
    if (recognizeStream) {
      try {
        recognizeStream.destroy();
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
          .on("error", (err: any) => {
            ws.send(
              JSON.stringify({
                type: "error",
                message: err?.message || "STT stream error",
              })
            );
          })
          .on("data", (data: any) => {
            const result = data.results?.[0];
            const transcript =
              result?.alternatives?.[0]?.transcript || "";
            const isFinal = !!result?.isFinal;

            ws.send(
              JSON.stringify({
                type: "transcript",
                transcript,
                isFinal,
              })
            );
          });

        ws.send(JSON.stringify({ type: "started" }));
        return;
      }

      if (msg.type === "audio") {
        if (!recognizeStream) return;
        const buffer = Buffer.from(msg.audio, "base64");
        recognizeStream.write(buffer);
        return;
      }

      if (msg.type === "stop") {
        cleanup();
        ws.send(JSON.stringify({ type: "stopped" }));
      }
    } catch (error: any) {
      ws.send(
        JSON.stringify({
          type: "error",
          message: error?.message || "Invalid WS message",
        })
      );
    }
  });

  ws.on("close", cleanup);
  ws.on("error", cleanup);
});

const PORT = Number(process.env.RELAY_PORT || 8081);

server.listen(PORT, () => {
  console.log(`Relay server listening on http://localhost:${PORT}`);
});