import { generateJson } from "./gemini";

export function buildDiagnosisPrompt(cropHint) {
  return `You are a plant disease assistant for farmers in Punjab, India.
Look carefully at the attached photo of a crop leaf or plant.
The farmer says the crop is: ${cropHint || "not specified"}.

Return ONLY a JSON object with exactly these keys:
{
  "photo_ok": true or false,
  "photo_problem": string or null,
  "crop": string,
  "is_healthy": true or false,
  "disease": string or null,
  "confidence": number between 0 and 1,
  "severity": "none" | "mild" | "moderate" | "severe",
  "symptoms": array of up to 4 short strings describing what you can see
}

Rules:
- Set photo_ok to false if the photo is blurry, too dark, not a plant, or the affected part is not visible. Explain why in photo_problem in one short sentence.
- Use common English disease names, for example "Late blight" or "Leaf rust".
- If the plant looks healthy, set is_healthy to true, disease to null and severity to "none".
- If you are unsure between two diseases, choose the more likely one and keep confidence below 0.6.
- Severity: "mild" means a few spots on a few leaves, "moderate" means spreading across the plant, "severe" means most leaves or fruit affected.
- Never invent symptoms you cannot see.`;
}

export async function diagnose({ imageBase64, mimeType, cropHint, usage }) {
  const parts = [
    { inlineData: { mimeType, data: imageBase64 } },
    { text: buildDiagnosisPrompt(cropHint) },
  ];
  const d = await generateJson({ parts, step: "diagnosis", usage });
  return {
    photo_ok: Boolean(d.photo_ok),
    photo_problem: d.photo_problem || null,
    crop: d.crop || cropHint || "Unknown",
    is_healthy: Boolean(d.is_healthy),
    disease: d.disease || null,
    confidence: Math.max(0, Math.min(1, Number(d.confidence) || 0)),
    severity: ["none", "mild", "moderate", "severe"].includes(d.severity)
      ? d.severity
      : "mild",
    symptoms: Array.isArray(d.symptoms) ? d.symptoms.slice(0, 4) : [],
  };
}
