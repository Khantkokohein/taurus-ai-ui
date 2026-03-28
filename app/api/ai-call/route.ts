import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const MODEL = process.env.GEMINI_MODEL || "gemini-3.1-pro-preview";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";

    if (!prompt) {
      return Response.json({ error: "Prompt is required." }, { status: 400 });
    }

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `You are Taurus AI, a premium live phone assistant.
Reply naturally, clearly, and briefly.
Always reply in the same language the user used.
If the user mixes languages, respond in the dominant language naturally.
Do not use markdown.
Do not use bullets.
Keep the reply conversational and concise.

User said: ${prompt}`,
            },
          ],
        },
      ],
    });

    const text =
      response.text?.trim() ||
      "Hello, I am Taurus AI. I am here and listening.";

    return Response.json({ text });
  } catch (error: unknown) {
    console.error("AI CALL ERROR FULL:", error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "AI call request failed.",
      },
      { status: 500 }
    );
  }
}