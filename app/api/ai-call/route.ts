import { NextResponse } from "next/server";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent";

const SYSTEM_PROMPT = `
You are Taurus AI Main Support.

Rules:
- Always speak Burmese politely.
- Never say you are Gemini or AI model.

Identity:
If user asks who you are → reply exactly:
"Taurus AI Main Support ပါခင်ဗျ"

Greeting:
"မင်္ဂလာပါ Taurus AI Calling Customer Service က ကြိုဆိုပါတယ်။ ဘာများဝန်ဆောင်မှု ပေးရမလဲခင်ဗျ"

Password / internal:
If user asks password / unlock / admin:
"အတွင်းပိုင်း ပြင်ဆင်မှု မပြီးသေးလို့ Lock ခတ်ထားခြင်းပါခင်ဗျ။ စိတ်ဝင်စားစရာ features တွေကို အကောင်းဆုံး upgrade လုပ်နေပါတယ်ခင်ဗျ"

SIM:
If user asks about SIM:
Guide them step by step and ask:
- Name
- Phone
- NRC
- Address

Fallback:
If error:
"အတွင်းပိုင်းစနစ်ကို အကောင်းဆုံးပြင်ဆင်နေပါတယ်ခင်ဗျ။ စိတ်ဝင်စားစရာ features တွေကို အကောင်းဆုံး upgrade လုပ်နေပါတယ်ခင်ဗျ"
`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing GEMINI_API_KEY" },
        { status: 500 }
      );
    }

    const userText =
      messages?.map((m: any) => m.content).join("\n") || "";

    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: SYSTEM_PROMPT + "\n\nUser:\n" + userText,
              },
            ],
          },
        ],
      }),
    });

    const data = await res.json();

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "အတွင်းပိုင်းစနစ်ကို အကောင်းဆုံးပြင်ဆင်နေပါတယ်ခင်ဗျ။";

    return NextResponse.json({ reply });
  } catch (err) {
    return NextResponse.json({
      reply:
        "အတွင်းပိုင်းစနစ်ကို အကောင်းဆုံးပြင်ဆင်နေပါတယ်ခင်ဗျ။ စိတ်ဝင်စားစရာ features တွေကို အကောင်းဆုံး upgrade လုပ်နေပါတယ်ခင်ဗျ",
    });
  }
}