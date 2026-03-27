import textToSpeech from "@google-cloud/text-to-speech";

export const runtime = "nodejs";

const client = new textToSpeech.TextToSpeechClient({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
  projectId: process.env.GOOGLE_PROJECT_ID,
});

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string") {
      return Response.json({ error: "Text is required." }, { status: 400 });
    }

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
        error: error instanceof Error ? error.message : "TTS failed.",
      },
      { status: 500 }
    );
  }
}