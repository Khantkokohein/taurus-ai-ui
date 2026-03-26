import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prompt = body?.prompt;

    if (!prompt || typeof prompt !== "string") {
      return Response.json(
        { error: "Prompt is required." },
        { status: 400 }
      );
    }

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    });

    const text = response?.text || "I am here and listening.";

    return Response.json({
      text,
    });
  } catch (error) {
    console.error("AI CALL ERROR:", error);

    return Response.json(
      { text: "Sorry, Taurus AI is temporarily unavailable." },
      { status: 200 }
    );
  }
}