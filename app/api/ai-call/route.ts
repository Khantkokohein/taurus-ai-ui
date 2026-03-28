export const runtime = "nodejs";

export async function POST() {
  return Response.json(
    {
      error: "Disabled. Taurus now uses Gemini Live directly.",
    },
    { status: 410 }
  );
}