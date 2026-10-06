// Reads data/guides/*.txt, splits them into chunks, embeds each chunk with Gemini,
// and writes data/embeddings.json. Run with: npm run embed
import fs from "node:fs";
import path from "node:path";
import { GoogleGenAI } from "@google/genai";
import { loadEnv } from "./load-env.mjs";

loadEnv();
const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.EMBED_MODEL || "gemini-embedding-001";
if (!KEY) {
  console.error("GEMINI_API_KEY is missing. Add it to .env.local first.");
  process.exit(1);
}

const DIR = "data/guides";
const CHUNK = 900;
const OVERLAP = 150;

function readGuide(file) {
  const raw = fs.readFileSync(path.join(DIR, file), "utf8");
  const lines = raw.split(/\r?\n/);
  let source = file.replace(/\.txt$/, "");
  let url = null;
  while (lines.length && /^(source|url):/i.test(lines[0])) {
    const [k, ...v] = lines.shift().split(":");
    if (k.toLowerCase() === "source") source = v.join(":").trim();
    else url = v.join(":").trim();
  }
  return { source, url, text: lines.join("\n").replace(/\n{3,}/g, "\n\n").trim() };
}

function chunk(text) {
  const out = [];
  for (let i = 0; i < text.length; i += CHUNK - OVERLAP) {
    const piece = text.slice(i, i + CHUNK).trim();
    if (piece.length > 80) out.push(piece);
  }
  return out;
}

const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".txt"));
if (!files.length) {
  console.error(`No .txt files in ${DIR}. See ${DIR}/README.md.`);
  process.exit(1);
}

const items = [];
for (const f of files) {
  const g = readGuide(f);
  chunk(g.text).forEach((text, i) =>
    items.push({ id: `${f}#${i}`, source: g.source, url: g.url, text })
  );
}
console.log(`${files.length} files, ${items.length} chunks. Embedding with ${MODEL}...`);

const ai = new GoogleGenAI({ apiKey: KEY });
const BATCH = 50;
for (let i = 0; i < items.length; i += BATCH) {
  const batch = items.slice(i, i + BATCH);
  const res = await ai.models.embedContent({ model: MODEL, contents: batch.map((b) => b.text) });
  res.embeddings.forEach((e, j) => (batch[j].embedding = e.values));
  console.log(`  ${Math.min(i + BATCH, items.length)}/${items.length}`);
}

fs.writeFileSync(
  "data/embeddings.json",
  JSON.stringify({ model: MODEL, built_at: new Date().toISOString(), chunks: items })
);
console.log("Wrote data/embeddings.json");
