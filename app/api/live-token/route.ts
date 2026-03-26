import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST() {
  try {
    const token = await ai.authTokens.create({
      config: {
        uses: 1,
        liveConnectConstraints: {
          model: "gemini-2.0-flash-exp",
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
    });
  } catch (error) {
    console.error("LIVE TOKEN ERROR:", error);

    return Response.json(
      { error: "Failed to create live token." },
      { status: 500 }
    );
  }
}