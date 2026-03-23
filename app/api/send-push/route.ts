import { NextRequest, NextResponse } from "next/server";
import admin from "firebase-admin";

function getPrivateKey() {
  const key = process.env.FIREBASE_PRIVATE_KEY;
  if (!key) {
    throw new Error("Missing FIREBASE_PRIVATE_KEY");
  }
  return key.replace(/\\n/g, "\n");
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: getPrivateKey(),
    }),
  });
}

export async function POST(req: NextRequest) {
  try {
    const { token, title, body } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "No token" }, { status: 400 });
    }

    const response = await admin.messaging().send({
      token,
      notification: {
        title: title || "Incoming Call",
        body: body || "Taurus Calling...",
      },
    });

    return NextResponse.json({ success: true, response });
  } catch (error) {
    console.error("Push error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Push send failed",
      },
      { status: 500 }
    );
  }
}