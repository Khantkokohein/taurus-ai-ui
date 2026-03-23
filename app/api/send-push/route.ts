import { NextRequest, NextResponse } from "next/server";
import admin from "firebase-admin";

export const runtime = "nodejs";

function getFirebaseAdminApp() {
  if (admin.apps.length) {
    return admin.app();
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

export async function POST(req: NextRequest) {
  try {
    const app = getFirebaseAdminApp();

    if (!app) {
      return NextResponse.json(
        {
          error:
            "Firebase Admin env vars are missing. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.",
        },
        { status: 500 }
      );
    }

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