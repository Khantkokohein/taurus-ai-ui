import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST() {
  try {
    const expireTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const newSessionExpireTime = new Date(
      Date.now() + 60 * 1000
    ).toISOString();

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