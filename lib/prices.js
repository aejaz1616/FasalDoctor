import data from "@/data/prices.json";

const norm = (s) => String(s || "").toLowerCase().trim();

// Agmarknet commodity names do not always match simple crop names.
const ALIASES = {
  paddy: ["paddy", "dhan", "rice"],
  maize: ["maize", "makka"],
  cotton: ["cotton", "kapas"],
};

const NEAREST = {
  ludhiana: "Jalandhar",
  patiala: "Jalandhar",
  bathinda: "Jalandhar",
};

function matchesCrop(record, crop) {
  const c = norm(crop);
  const names = ALIASES[c] || [c];
  return names.some((n) => norm(record.crop).includes(n));
}

// Latest modal price for the crop in the district, plus a 7-day average.
// Falls back to the whole state if the district has no data.
export function getPrice({ crop, district }) {
  const forCrop = (data.records || []).filter((r) => matchesCrop(r, crop));
  if (!forCrop.length) return null;

  let rows = forCrop.filter((r) => norm(r.district) === norm(district));
  let scope = "district";
  const nearby = NEAREST[norm(district)];
  if (!rows.length && nearby) {
    rows = forCrop.filter((r) => norm(r.district) === norm(nearby));
    scope = "nearby";
  }
  if (!rows.length) {
    rows = forCrop;
    scope = "state";
  }

  rows = [...rows].sort((a, b) => (a.date < b.date ? 1 : -1));
  const latest = rows[0];
  const lastWeek = rows.slice(0, 7);
  const avg7 = Math.round(
    lastWeek.reduce((s, r) => s + Number(r.modal), 0) / lastWeek.length
  );

  return {
    crop: latest.crop,
    market: latest.market,
    district: latest.district,
    date: latest.date,
    modal: Number(latest.modal),
    min: Number(latest.min),
    max: Number(latest.max),
    avg7,
    unit: "₹ per quintal",
    scope,
    is_sample: Boolean(data.is_sample),
  };
}
