import { GoogleGenAI, Modality } from "@google/genai";

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
          model: "gemini-2.5-flash-native-audio-preview-12-2025",
          config: {
            sessionResumption: {},
            temperature: 0.7,
            responseModalities: [Modality.AUDIO],
          },
        },
        httpOptions: {
          apiVersion: "v1alpha",
        },
      },
    });

    return Response.json({
      token: token.name,
      expireTime,
      newSessionExpireTime,
    });
  } catch (error) {
    console.error("LIVE TOKEN ERROR:", error);

    return Response.json(
      { error: "Failed to create live token." },
      { status: 500 }
    );
  }
}