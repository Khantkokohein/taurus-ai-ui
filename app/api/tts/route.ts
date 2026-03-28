export const runtime = "nodejs";

export async function POST() {
  return Response.json(
    {
      error: "TTS moved to Cloud Run. This route is disabled.",
    },
    { status: 410 }
  );
}