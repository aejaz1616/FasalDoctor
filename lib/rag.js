import kb from "@/data/chunks.json";
import index from "@/data/embeddings.json";
import { LABELS, normalizeCrop, normalizeLabel } from "./labels";
import { embedTexts } from "./gemini";

// Retrieval ported from Person 3's guidance.py:
//   1) chunks for this crop that are tagged with this disease come first,
//   2) then the rest of the crop's chunks top up the list (shared spray schedules).
// Within each group, chunks are ranked by Gemini embeddings when data/embeddings.json
// has vectors (npm run embed), otherwise by how often the disease is named.

const vectors = index?.vectors || {};
const hasVectors = Object.keys(vectors).length > 0;

function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

function mentions(text, label) {
  const t = text.toLowerCase();
  return LABELS[label].aliases
    .filter((a) => !a.includes("___") && a.length > 4)
    .reduce((n, a) => n + (t.split(a.toLowerCase()).length - 1), 0);
}

export function hasGuides() {
  return Array.isArray(kb.chunks) && kb.chunks.length > 0;
}

export async function getGuidance({ crop, disease, k = 3 }) {
  if (!hasGuides()) return [];
  const c = normalizeCrop(crop);
  const label = normalizeLabel(disease, c);
  if (!label) return []; // healthy, unknown, or a disease our guides do not cover

  const forCrop = kb.chunks.filter((ch) => ch.crop === c);

  let score;
  if (hasVectors) {
    const [q] = await embedTexts([`${LABELS[label].name} symptoms management treatment`]);
    score = (ch) => (vectors[ch.id] ? cosine(q, vectors[ch.id]) : 0);
  } else {
    score = (ch) => mentions(ch.text, label);
  }
  const rank = (list) =>
    list.map((ch) => ({ ...ch, score: score(ch) })).sort((a, b) => b.score - a.score);

  const tagged = rank(forCrop.filter((ch) => ch.disease.includes(label)));
  const rest = rank(forCrop.filter((ch) => !ch.disease.includes(label)));
  const picked = [...tagged, ...rest].slice(0, k);

  return picked.map((ch) => ({
    id: ch.id,
    label,
    text: ch.text,
    source: ch.source,
    publisher: ch.publisher,
    url: ch.url,
    year: ch.year,
    page: ch.page,
    page_end: ch.page_end,
    tagged: ch.disease.includes(label),
    score: Number(ch.score.toFixed(3)),
  }));
}
