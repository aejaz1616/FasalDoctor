// A simple, explainable rule. The LLM explains it in plain words;
// it never makes this call itself, so the logic stays auditable.
export function sellOrHold({ diagnosis, price }) {
  if (!price) {
    return { call: "no_price", reason: "No mandi price found for this crop." };
  }
  if (diagnosis.is_healthy || diagnosis.severity === "none") {
    return {
      call: "no_action",
      reason: "The crop looks healthy, so there is no disease pressure to sell early.",
    };
  }

  const ratio = price.modal / price.avg7;
  const priceTrend =
    ratio >= 1.02 ? "above" : ratio <= 0.98 ? "below" : "close to";

  if (diagnosis.severity === "severe") {
    if (priceTrend !== "below") {
      return {
        call: "sell_soon",
        reason: `Disease is severe and today's price is ${priceTrend} the 7-day average. Treat now, and consider selling what is ready before quality drops.`,
      };
    }
    return {
      call: "treat_then_decide",
      reason: "Disease is severe but today's price is below the 7-day average. Treat first and watch prices for a few days.",
    };
  }

  return {
    call: "treat_and_hold",
    reason: `Disease is ${diagnosis.severity} and can usually be managed. Treat it and hold; today's price is ${priceTrend} the 7-day average.`,
  };
}
