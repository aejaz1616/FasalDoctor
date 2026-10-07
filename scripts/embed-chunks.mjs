// Optional: adds Gemini embeddings for every chunk in data/chunks.json,
// so retrieval can rank chunks by meaning within each disease.
// Run with: npm run embed   (needs GEMINI_API_KEY in .env.local)
import fs from "node:fs";
import { GoogleGenAI } from "@google/genai";
import { loadEnv } from "./load-env.mjs";

loadEnv();
const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.EMBED_MODEL || "gemini-embedding-001";
if (!KEY) {
  console.error("GEMINI_API_KEY is missing. Add it to .env.local first.");
  process.exit(1);
}

const { chunks } = JSON.parse(fs.readFileSync("data/chunks.json", "utf8"));
const ai = new GoogleGenAI({ apiKey: KEY });
const vectors = {};
const BATCH = 50;
for (let i = 0; i < chunks.length; i += BATCH) {
  const batch = chunks.slice(i, i + BATCH);
  // Same "[crop | disease]" prefix Person 3 used, so the embedding knows the topic.
  const texts = batch.map((c) => `[${c.crop}${c.disease.length ? " | " + c.disease.join(" + ") : ""}] ${c.text}`);
  const res = await ai.models.embedContent({ model: MODEL, contents: texts });
  res.embeddings.forEach((e, j) => (vectors[batch[j].id] = e.values));
  console.log(`  ${Math.min(i + BATCH, chunks.length)}/${chunks.length}`);
}
fs.writeFileSync(
  "data/embeddings.json",
  JSON.stringify({ model: MODEL, built_at: new Date().toISOString(), vectors })
);
console.log(`Wrote embeddings for ${chunks.length} chunks to data/embeddings.json`);
