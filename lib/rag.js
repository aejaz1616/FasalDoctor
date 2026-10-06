import index from "@/data/embeddings.json";
import { embedTexts } from "./gemini";

function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

export function hasGuides() {
  return Array.isArray(index.chunks) && index.chunks.length > 0;
}

// Returns the top-k guide chunks for this crop and disease.
// Chunks below minScore are dropped so the answer step is not fed weak matches.
export async function getGuidance({ crop, disease, k = 3, minScore = 0.5 }) {
  if (!hasGuides()) return [];
  const query = `${crop} ${disease || "general crop care"} symptoms control treatment management`;
  const [q] = await embedTexts([query]);
  return index.chunks
    .map((c) => ({ ...c, score: cosine(q, c.embedding) }))
    .filter((c) => c.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map(({ embedding, ...rest }) => ({
      ...rest,
      score: Number(rest.score.toFixed(3)),
    }));
}
