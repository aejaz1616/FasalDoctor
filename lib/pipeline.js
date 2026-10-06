import { isMockMode } from "./config";
import { createUsageTracker } from "./gemini";
import { diagnose } from "./diagnose";
import { getGuidance } from "./rag";
import { getPrice } from "./prices";
import { sellOrHold } from "./sellhold";
import { writeAnswer } from "./answer";
import { mockResult } from "./mock";
import { LANGUAGES } from "./options";

// The main flow: photo -> diagnosis -> guide retrieval -> mandi price
// -> sell-or-hold rule -> answer in the farmer's language.
export async function runPipeline({ imageBase64, mimeType, cropHint, district, languageCode }) {
  const language =
    LANGUAGES.find((l) => l.code === languageCode)?.name || "English";

  if (isMockMode()) {
    const price = getPrice({ crop: "Tomato", district });
    const decision = sellOrHold({
      diagnosis: { is_healthy: false, severity: "moderate" },
      price,
    });
    return mockResult({ district, price, decision });
  }

  const usage = createUsageTracker();

  // Step 1: diagnosis from the photo
  const diagnosis = await diagnose({ imageBase64, mimeType, cropHint, usage });
  if (!diagnosis.photo_ok) {
    return { status: "retake", mode: "live", diagnosis, usage: usage.summary() };
  }

  // Steps 2 and 3: guide retrieval and price lookup
  const crop = diagnosis.crop || cropHint;
  const guidance = diagnosis.is_healthy
    ? []
    : await getGuidance({ crop, disease: diagnosis.disease });
  const price = getPrice({ crop, district });

  // Step 4: fixed sell-or-hold rule
  const decision = sellOrHold({ diagnosis, price });

  // Step 5: plain-language answer grounded in the guides
  const answer = await writeAnswer({ diagnosis, guidance, price, decision, language, usage });

  const summary = usage.summary();
  // One line per session in the server logs (Vercel > Logs), for the cost slide.
  console.log("[usage]", JSON.stringify({ crop, disease: diagnosis.disease, ...summary }));

  return {
    status: "ok",
    mode: "live",
    diagnosis,
    guidance: guidance.map(({ text, ...g }) => ({ ...g, preview: text.slice(0, 220) })),
    price,
    decision,
    answer,
    usage: summary,
  };
}
