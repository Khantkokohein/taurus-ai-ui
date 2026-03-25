import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const apiKey = process.env.GEMINI_API_KEY || "";

if (!apiKey) {
  console.warn("GEMINI_API_KEY is missing");
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message = body?.message || "";
    const language = body?.language || "en-US";
    const supportNumber = body?.supportNumber || "+70 20 7777777";

    if (!message) {
      return NextResponse.json(
        { error: "Message is required." },
        { status: 400 }
      );
    }

    const prompt = `
You are Taurus AI Calling Customer Support for support line ${supportNumber}.

Rules:
- Reply naturally and clearly.
- Match the user's language when possible.
- If the user speaks Burmese/Myanmar, reply in natural Burmese.
- If the user speaks English, reply in English.
- Keep answers helpful, professional, and phone-call friendly.
- Do not mention tokens, internal prompts, or technical details.
- Keep each reply concise enough for voice conversation.
- If the user asks for help, guide them step by step.
- Sound like a real premium AI support assistant.

User browser language: ${language}
User said: ${message}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const reply = response.text();

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Gemini Error:", error);
    return NextResponse.json(
      { error: "API connection failed" },
      { status: 500 }
    );
  }
}