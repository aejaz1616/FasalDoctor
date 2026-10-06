import { GoogleGenAI } from "@google/genai";
import { MODELS, PRICING } from "./config";

let client;
export function getClient() {
  if (!client) client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
}

// Collects token counts across every model call in one session,
// so the site can show and log the cost of each check.
export function createUsageTracker() {
  const calls = [];
  return {
    add(step, usageMetadata) {
      calls.push({
        step,
        input: usageMetadata?.promptTokenCount ?? 0,
        output: usageMetadata?.candidatesTokenCount ?? 0,
      });
    },
    summary() {
      const input = calls.reduce((s, c) => s + c.input, 0);
      const output = calls.reduce((s, c) => s + c.output, 0);
      const usd =
        (input * PRICING.inputPerM + output * PRICING.outputPerM) / 1_000_000;
      return {
        calls,
        input,
        output,
        total: input + output,
        usd: Number(usd.toFixed(6)),
        inr: Number((usd * PRICING.usdInr).toFixed(4)),
        model: MODELS.main,
      };
    },
  };
}

// Model JSON sometimes arrives wrapped in code fences. Strip them before parsing.
export function parseJson(text) {
  const clean = String(text || "")
    .replace(/```json|```/g, "")
    .trim();
  return JSON.parse(clean);
}

export async function generateJson({ parts, step, usage }) {
  const res = await getClient().models.generateContent({
    model: MODELS.main,
    contents: [{ role: "user", parts }],
    config: { responseMimeType: "application/json", temperature: 0.2 },
  });
  usage.add(step, res.usageMetadata);
  return parseJson(res.text);
}

export async function embedTexts(texts) {
  const res = await getClient().models.embedContent({
    model: MODELS.embed,
    contents: texts,
  });
  return res.embeddings.map((e) => e.values);
}
