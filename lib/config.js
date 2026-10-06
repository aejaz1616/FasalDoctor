export const MODELS = {
  main: process.env.GEMINI_MODEL || "gemini-2.5-flash-lite",
  embed: process.env.EMBED_MODEL || "gemini-embedding-001",
};

export const PRICING = {
  inputPerM: Number(process.env.PRICE_INPUT_PER_M_USD ?? 0.1),
  outputPerM: Number(process.env.PRICE_OUTPUT_PER_M_USD ?? 0.4),
  usdInr: Number(process.env.USD_INR ?? 88),
};

export function isMockMode() {
  return !process.env.GEMINI_API_KEY || process.env.MOCK_MODE === "1";
}
