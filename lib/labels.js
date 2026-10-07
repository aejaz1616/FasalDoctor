// Ported from Person 3's labels.py. These are the disease labels the guide
// chunks are tagged with. Keep the two files in step if a label is added.
export const LABELS = {
  tomato_early_blight: {
    crop: "tomato", name: "early blight",
    aliases: ["early blight", "alternaria solani", "alternaria blight", "Tomato___Early_blight"],
  },
  tomato_late_blight: {
    crop: "tomato", name: "late blight",
    aliases: ["late blight", "phytophthora infestans", "Tomato___Late_blight"],
  },
  tomato_leaf_curl_virus: {
    crop: "tomato", name: "leaf curl virus",
    aliases: ["leaf curl", "leaf curl virus", "tomato leaf curl virus", "yellow leaf curl virus",
      "tomato yellow leaf curl virus", "tylcv", "tolcv", "Tomato___Tomato_Yellow_Leaf_Curl_Virus"],
  },
  tomato_bacterial_spot: {
    crop: "tomato", name: "bacterial spot",
    aliases: ["bacterial spot", "bacterial leaf spot", "xanthomonas", "Tomato___Bacterial_spot"],
  },
  potato_early_blight: {
    crop: "potato", name: "early blight",
    aliases: ["early blight", "alternaria solani", "Potato___Early_blight"],
  },
  potato_late_blight: {
    crop: "potato", name: "late blight",
    aliases: ["late blight", "phytophthora infestans", "Potato___Late_blight"],
  },
  maize_common_rust: {
    crop: "maize", name: "common rust",
    aliases: ["common rust", "puccinia sorghi", "rust", "Corn_(maize)___Common_rust_"],
  },
  maize_northern_leaf_blight: {
    crop: "maize", name: "northern leaf blight",
    aliases: ["northern leaf blight", "northern corn leaf blight", "turcicum leaf blight", "turcicum",
      "exserohilum turcicum", "tlb", "nclb", "Corn_(maize)___Northern_Leaf_Blight"],
  },
};

const CROP_ALIASES = { tomato: "tomato", potato: "potato", maize: "maize", corn: "maize" };

const key = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export function normalizeCrop(crop) {
  const k = key(crop);
  return CROP_ALIASES[k] || CROP_ALIASES[k.split(" ")[0]] || k;
}

// Returns a label like "tomato_late_blight", or null for healthy, unknown
// or a disease the guides do not cover.
export function normalizeLabel(disease, crop) {
  if (!disease) return null;
  if (LABELS[disease]) return disease;
  const k = key(disease);
  const c = crop ? normalizeCrop(crop) : null;
  const candidates = Object.entries(LABELS).filter(([, v]) => !c || v.crop === c);

  // 1) exact match on the label or an alias
  for (const [label, v] of candidates) {
    if (k === key(label) || v.aliases.some((a) => key(a) === k)) return label;
  }
  // 2) the longest alias contained in the name, e.g. "Tomato yellow leaf curl virus"
  let best = null;
  for (const [label, v] of candidates) {
    for (const a of v.aliases) {
      const ak = key(a);
      if (ak.length >= 4 && new RegExp(`\\b${ak}\\b`).test(k) && (!best || ak.length > best.len)) {
        best = { label, len: ak.length };
      }
    }
  }
  return best ? best.label : null;
}
