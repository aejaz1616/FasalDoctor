// Converts an Agmarknet / data.gov.in CSV download into data/prices.json.
// Put the CSV at data/raw/prices.csv, then run: npm run prices
import fs from "node:fs";

const IN = process.argv[2] || "data/raw/prices.csv";
if (!fs.existsSync(IN)) {
  console.error(`No CSV at ${IN}. Download one from data.gov.in or agmarknet.gov.in first.`);
  process.exit(1);
}

function parseLine(line) {
  const out = [];
  let cur = "", q = false;
  for (const ch of line) {
    if (ch === '"') q = !q;
    else if (ch === "," && !q) { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function isoDate(s) {
  const m = s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/); // dd/mm/yyyy
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  const d = new Date(s);
  return isNaN(d) ? s : d.toISOString().slice(0, 10);
}

const lines = fs.readFileSync(IN, "utf8").split(/\r?\n/).filter(Boolean);
const head = parseLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z]+/g, "_").replace(/^_|_$/g, ""));
const col = (row, ...names) => {
  for (const n of names) {
    const i = head.indexOf(n);
    if (i >= 0) return row[i];
  }
  return "";
};

const records = lines.slice(1).map(parseLine).map((r) => ({
  crop: col(r, "commodity"),
  district: col(r, "district", "district_name"),
  market: col(r, "market", "market_name"),
  date: isoDate(col(r, "arrival_date", "price_date", "date")),
  min: Number(col(r, "min_price", "min_x0020_price", "minimum_price")),
  max: Number(col(r, "max_price", "max_x0020_price", "maximum_price")),
  modal: Number(col(r, "modal_price", "modal_x0020_price")),
})).filter((r) => r.crop && r.modal > 0);

fs.writeFileSync(
  "data/prices.json",
  JSON.stringify({ is_sample: false, source: IN, records }, null, 1)
);
console.log(`Wrote ${records.length} price rows to data/prices.json`);
