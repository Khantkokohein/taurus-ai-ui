// app/api/send-push/route.ts

import { NextRequest, NextResponse } from "next/server";
import admin from "firebase-admin";
import fs from "fs";
import path from "path";

// 🔐 Load service account
const serviceAccountPath = path.join(process.cwd(), "firebase-key.json");
const serviceAccount = JSON.parse(
  fs.readFileSync(serviceAccountPath, "utf8")
);

// 🔁 Init Firebase Admin (avoid duplicate)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export async function POST(req: NextRequest) {
  try {
    const { token, title, body } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "No token" }, { status: 400 });
    }

    const message = {
      token,
      notification: {
        title: title || "Incoming Call",
        body: body || "Taurus Calling...",
      },
    };

    const response = await admin.messaging().send(message);

    return NextResponse.json({ success: true, response });
  } catch (error: any) {
    console.error("Push error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}