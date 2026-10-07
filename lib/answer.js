import { generateJson } from "./gemini";

const KISAN_CALL_CENTRE = "1800-180-1551";

export function buildAnswerPrompt({ diagnosis, guidance, price, decision, language }) {
  const excerpts = guidance.length
    ? guidance
        .map((g, i) => `[${i + 1}] Source: ${g.source}, p. ${g.page}${g.page_end && g.page_end !== g.page ? `-${g.page_end}` : ""} (${g.publisher})\n${g.text}`)
        .join("\n\n")
    : "NONE. No guide excerpt matched this crop and disease.";

  const priceText = price
    ? `${price.crop} at ${price.market} (${price.district}) on ${price.date}: modal ₹${price.modal} per quintal, range ₹${price.min}–₹${price.max}, 7-day average ₹${price.avg7}.${price.scope !== "district" ? ` This is the price at the nearest mandi, in ${price.district}.` : ""}${price.is_sample ? " These are SAMPLE prices for testing, not real market data." : ""}`
    : "No price available.";

  return `You are helping a farmer in Punjab, India, understand a crop problem and what to do next.

DIAGNOSIS (from a photo, may be wrong):
${JSON.stringify(diagnosis)}

GUIDE EXCERPTS (from agricultural extension guides):
${excerpts}

MANDI PRICE:
${priceText}

SELL OR HOLD SIGNAL (already decided by a fixed rule, do not change it):
${decision.call}: ${decision.reason}

Write the answer in ${language}, in simple words and short sentences that a farmer can follow. Use the native script for Hindi or Punjabi.

Return ONLY a JSON object with exactly these keys:
{
  "headline": one sentence naming the problem and how serious it is,
  "what_it_is": 2 to 3 sentences explaining the disease and why it spreads,
  "do_this_week": array of 2 to 5 short action steps,
  "prevention": array of 1 to 3 short steps for the next season,
  "market_note": 1 to 2 sentences explaining the sell or hold signal and today's price,
  "caution": one sentence, or null,
  "sources_used": array of the sources you relied on, each written as "Source title, p. N"
}

Rules:
- Base every treatment step ONLY on the guide excerpts. Never invent chemical names or doses that are not in the excerpts.
- Copy every pesticide name and dose EXACTLY as written in the excerpts: product name, %, amount, per acre or per litre, and spray interval. Never convert, round or merge doses. Keep product names and numbers exactly as written even when answering in Hindi or Punjabi.
- If a dose or unit looks unusual (for example kg per litre of water), still quote it exactly, and add to the caution that the farmer should confirm the dose with the local agriculture officer or KVK.
- An excerpt may say to spray "as recommended under" another disease. If that other section is also in the excerpts, use its doses and say so.
- If the excerpts are NONE or do not cover this disease, say so in do_this_week and advise contacting the local Krishi Vigyan Kendra or the Kisan Call Centre at ${KISAN_CALL_CENTRE}.
- If confidence is below 0.6, the caution must say the diagnosis is uncertain and should be confirmed by an expert before spraying anything.
- If any chemical is mentioned, the caution must remind the farmer to follow the label and wear protection.
- If the prices are SAMPLE prices, say so in market_note.
- If the crop is healthy, say so clearly and keep do_this_week to simple monitoring steps.`;
}

export async function writeAnswer({ diagnosis, guidance, price, decision, language, usage }) {
  const prompt = buildAnswerPrompt({ diagnosis, guidance, price, decision, language });
  const a = await generateJson({ parts: [{ text: prompt }], step: "answer", usage });
  return {
    headline: a.headline || "",
    what_it_is: a.what_it_is || "",
    do_this_week: Array.isArray(a.do_this_week) ? a.do_this_week : [],
    prevention: Array.isArray(a.prevention) ? a.prevention : [],
    market_note: a.market_note || "",
    caution: a.caution || null,
    sources_used: Array.isArray(a.sources_used) ? a.sources_used : [],
  };
}
