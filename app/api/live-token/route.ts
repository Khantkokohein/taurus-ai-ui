import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";

export async function POST() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    console.log("LIVE TOKEN API KEY EXISTS:", Boolean(apiKey));
    console.log("LIVE TOKEN API KEY PREFIX:", apiKey?.slice(0, 8));

    if (!apiKey) {
      return Response.json(
        { error: "GEMINI_API_KEY is missing." },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const expireTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const newSessionExpireTime = new Date(Date.now() + 60 * 1000).toISOString();

    console.log("LIVE TOKEN REQUEST START");

    const token = await ai.authTokens.create({
      config: {
        uses: 1,
        expireTime,
        newSessionExpireTime,
        liveConnectConstraints: {
          model: "gemini-3.1-flash-live-preview",
          config: {
            temperature: 0.7,
            responseModalities: ["audio"] as never,
          },
        },
        httpOptions: {
          apiVersion: "v1alpha",
        },
      },
    });

    console.log("LIVE TOKEN CREATED:", token?.name);

    return Response.json({
      token: token.name,
    });
  } catch (error: unknown) {
    console.error("LIVE TOKEN ERROR:", error);

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create ephemeral token.",
      },
      { status: 500 }
    );
  }
}