import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt || "Hello",
    });

    return Response.json({
      text: response.text,
    });
  } catch (error) {
    console.error("AI CALL ERROR:", error);

    return Response.json(
      { text: "Sorry, Taurus AI is temporarily unavailable." },
      { status: 200 }
    );
  }
}