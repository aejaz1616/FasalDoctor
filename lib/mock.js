// Returned when there is no GEMINI_API_KEY or MOCK_MODE=1.
// Lets the AAs run the site without a key, and is a stage backup if the API fails.
export function mockResult({ district, price, decision }) {
  return {
    status: "ok",
    mode: "demo",
    diagnosis: {
      photo_ok: true,
      photo_problem: null,
      crop: "Tomato",
      is_healthy: false,
      disease: "Early blight",
      confidence: 0.82,
      severity: "moderate",
      symptoms: [
        "Brown spots with ring patterns on lower leaves",
        "Yellowing around the spots",
      ],
    },
    guidance: [],
    price,
    decision,
    answer: {
      headline: "Demo answer: this looks like early blight, at a moderate stage.",
      what_it_is:
        "This is a canned demo answer, not a real diagnosis. Add a GEMINI_API_KEY to get a real answer from your photo.",
      do_this_week: [
        "Add GEMINI_API_KEY to .env.local or Vercel to switch on real checks.",
        "Run npm run embed after adding guide files, so treatment advice comes from your guides.",
      ],
      prevention: ["Replace the sample prices with a real Agmarknet download."],
      market_note: price
        ? `Sample price for ${district}: ₹${price.modal} per quintal.`
        : "No price data loaded.",
      caution: "Demo mode is on. Nothing here is real advice.",
      sources_used: [],
    },
    usage: { calls: [], input: 0, output: 0, total: 0, usd: 0, inr: 0, model: "demo" },
  };
}
