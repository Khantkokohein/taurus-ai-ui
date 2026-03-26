import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

export async function POST(req: Request) {
  try {
    if (!apiKey) {
      return Response.json(
        { text: "SERVER ERROR: GEMINI_API_KEY is missing." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const prompt = body?.prompt;

    if (!prompt || typeof prompt !== "string") {
      return Response.json(
        { text: "Prompt is required." },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `You are Taurus AI phone support. Answer naturally, briefly, clearly, and in a helpful call-center style. User said: ${prompt}`,
            },
          ],
        },
      ],
    });

    const text =
      (response as any)?.text ||
      (response as any)?.candidates?.[0]?.content?.parts
        ?.map((p: any) => p?.text)
        .filter(Boolean)
        .join("\n") ||
      "I am here and listening.";

    return Response.json({ text });
  } catch (error: any) {
    console.error("AI CALL ERROR:", error);

    return Response.json(
      {
        text:
          "SERVER ERROR: " +
          (error?.message || error?.toString?.() || "Unknown error"),
      },
      { status: 500 }
    );
  }
}