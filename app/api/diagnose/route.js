import { runPipeline } from "@/lib/pipeline";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_BASE64 = 4_000_000; // about 3 MB of image, under Vercel's request limit

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ status: "error", message: "The request was not valid JSON." }, { status: 400 });
  }

  const { imageBase64, mimeType, cropHint, district, language } = body || {};
  if (!imageBase64 || !mimeType) {
    return Response.json({ status: "error", message: "Add a photo before checking." }, { status: 400 });
  }
  if (imageBase64.length > MAX_BASE64) {
    return Response.json({ status: "error", message: "The photo is too large. Use one under 3 MB." }, { status: 413 });
  }

  try {
    const result = await runPipeline({
      imageBase64,
      mimeType,
      cropHint,
      district,
      languageCode: language,
    });
    return Response.json(result);
  } catch (err) {
    console.error("[diagnose] failed:", err);
    return Response.json(
      { status: "error", message: "The AI check did not finish. Try again in a moment." },
      { status: 500 }
    );
  }
}
