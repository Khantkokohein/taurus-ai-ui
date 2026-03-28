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

// ✅ Cloud Run auto auth
const speechClient = new speech.SpeechClient();

wss.on("connection", (ws: WebSocket) => {
  let stream: any = null;

  const cleanup = () => {
    if (stream) {
      try { stream.end(); } catch {}
      try { stream.destroy(); } catch {}
      stream = null;
    }
  };

  ws.on("message", (raw) => {
    const msg = JSON.parse(raw.toString());

    if (msg.type === "start") {
      cleanup();

      stream = speechClient
        .streamingRecognize({
          config: {
            encoding: "LINEAR16",
            sampleRateHertz: 16000,
            languageCode: "en-US",
            enableAutomaticPunctuation: true,
          },
          interimResults: true,
        })
        .on("data", (data: any) => {
          const result = data?.results?.[0];
          const transcript = result?.alternatives?.[0]?.transcript || "";

          ws.send(JSON.stringify({
            type: "transcript",
            transcript,
            isFinal: result?.isFinal || false,
          }));
        })
        .on("error", (err: any) => {
          ws.send(JSON.stringify({
            type: "error",
            message: err.message,
          }));
          cleanup();
        });

      ws.send(JSON.stringify({ type: "started" }));
      return;
    }

    if (msg.type === "audio") {
      if (!stream) return;

      try {
        const buffer = Buffer.from(msg.audio, "base64");
        stream.write(buffer);
      } catch {
        cleanup();
      }
      return;
    }

    if (msg.type === "stop") {
      cleanup();
      ws.send(JSON.stringify({ type: "stopped" }));
    }
  });

  ws.on("close", cleanup);
  ws.on("error", cleanup);
});

const PORT = Number(process.env.PORT || 8080);

server.listen(PORT, () => {
  console.log("Relay running on", PORT);
});