import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// API Key ကို .env.local ထဲကနေ ဆွဲယူမယ်
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function POST() {
  try {
    const prompt = "You are Thorr AI. Greet the user with a short, cinematic Myanmar and English mix greeting. Be professional and ready to assist.";
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ text });
  } catch (error) {
    console.error("Gemini Error:", error);
    return NextResponse.json({ error: "API connection failed" }, { status: 500 });
  }
}