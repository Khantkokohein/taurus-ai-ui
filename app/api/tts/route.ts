import textToSpeech from "@google-cloud/text-to-speech";

export const runtime = "nodejs";

function normalizePrivateKey(value: string) {
  return value.replace(/\\n/g, "\n").replace(/\r?\n/g, "\n");
}

function createTtsClient() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.trim();
  const projectId = process.env.GOOGLE_PROJECT_ID?.trim();

  if (!clientEmail) {
    throw new Error("Missing GOOGLE_CLIENT_EMAIL in Vercel environment variables.");
  }

  if (!privateKey) {
    throw new Error("Missing GOOGLE_PRIVATE_KEY in Vercel environment variables.");
  }

  if (!projectId) {
    throw new Error("Missing GOOGLE_PROJECT_ID in Vercel environment variables.");
  }

  return new textToSpeech.TextToSpeechClient({
    credentials: {
      client_email: clientEmail,
      private_key: normalizePrivateKey(privateKey),
    },
    projectId,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const text = typeof body?.text === "string" ? body.text.trim() : "";

    if (!text) {
      return Response.json({ error: "Text is required." }, { status: 400 });
    }

    const client = createTtsClient();

    const [response] = await client.synthesizeSpeech({
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
      return Response.json({ error: "Empty TTS response." }, { status: 500 });
    }

    const audioBuffer = Buffer.from(response.audioContent as Uint8Array);

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
        "Content-Length": String(audioBuffer.length),
      },
    });
  } catch (error: unknown) {
    console.error("TTS ERROR FULL:", error);

    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Text-to-Speech failed.",
      },
      { status: 500 }
    );
  }
}