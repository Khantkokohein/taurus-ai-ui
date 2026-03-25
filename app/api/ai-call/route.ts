import { NextResponse } from "next/server";

const MODEL =
  "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent";

function isMyanmar(text: string) {
  return /[\u1000-\u109F]/.test(text);
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const text = Array.isArray(messages)
      ? messages.map((m: any) => m?.content || "").join("\n")
      : "";

    const myanmar = isMyanmar(text);

    if (text.toLowerCase().includes("password")) {
      return NextResponse.json({
        reply: "Password က Taurus Calling ပါခင်ဗျ",
      });
    }

    const system = `
You are Taurus AI.
Identity: I am Taurus AI.
Rules:
- Reply in the same language as the user.
- If the user uses Burmese, reply in Burmese clearly and naturally.
- If the user uses English, reply in English.
- Be fast, helpful, and human-like.
- Do not say you are Gemini or a language model.
`;

    const res = await fetch(`${MODEL}?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${system}\n\nUser:\n${text}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topP: 0.9,
          topK: 40,
          maxOutputTokens: 512,
        },
      }),
    });

    const data = await res.json().catch(() => ({}));

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      (myanmar
        ? "စနစ်ကို အကောင်းဆုံး ပြင်ဆင်နေပါတယ်ခင်ဗျ"
        : "We are improving the system. Please try again shortly.");

    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({
      reply: "စနစ်ကို အကောင်းဆုံး ပြင်ဆင်နေပါတယ်ခင်ဗျ",
    });
  }
}