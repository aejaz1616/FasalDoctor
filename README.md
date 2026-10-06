# FasalDoc: photo-based crop disease check

A farmer uploads a photo of a sick leaf and gets:

1. the likely disease, with a confidence level and severity, from a Gemini vision model,
2. what to do this week, taken only from crop guides we loaded (RAG),
3. today's mandi price in their district and the 7-day average,
4. a sell-or-hold signal from a fixed, explainable rule,
5. all of it explained in English, Hindi or Punjabi.

Each check also shows its token count and rupee cost, which feeds the cost slide.

## Run it locally (about 5 minutes)

You need Node.js 18.18 or later.

```bash
npm install
cp .env.example .env.local     # then open .env.local and paste your key
npm run dev                    # open http://localhost:3000
```

**Where to put the API key:** in `.env.local`, set `GEMINI_API_KEY=` to a key from
https://aistudio.google.com/apikey. That is the only key the site needs.
No key is included in this zip.

**Without a key**, the site runs in demo mode and returns a canned answer, so you
can still see the full flow. Set `MOCK_MODE=1` to force demo mode on purpose,
for example as a backup on stage.

## Rebuild the knowledge base

1. Put guide text files in `data/guides/` (see `data/guides/README.md` for the format).
2. Run `npm run embed`. This writes `data/embeddings.json`.

`data/embeddings.json` is committed, so the site works without rebuilding it.
If it is empty, answers say that no guide matched and point to the KVK.

## Replace the sample prices

`data/prices.json` currently holds **made-up sample prices**, and the site labels
them as samples. To use real data:

1. Download a CSV of daily mandi prices for your crops from data.gov.in or agmarknet.gov.in.
2. Save it as `data/raw/prices.csv`.
3. Run `npm run prices`. This writes a new `data/prices.json` and removes the sample label.

## Deploy to Vercel

1. Push this folder to a GitHub repo.
2. Import the repo at vercel.com.
3. Under Project Settings, then Environment Variables, add `GEMINI_API_KEY`.
4. Deploy. After each check, a line starting with `[usage]` appears in Vercel's logs
   with that session's tokens and cost.

## How the code is organised

| File | What it does |
|---|---|
| `app/page.js` | The website: hero, upload form, report, how it works, sources and limits |
| `app/api/diagnose/route.js` | The single API route the form calls |
| `lib/pipeline.js` | Runs the steps in order |
| `lib/diagnose.js` | Step 1: vision diagnosis prompt, returns strict JSON |
| `lib/rag.js` | Step 2: embeds the query and finds the closest guide chunks |
| `lib/prices.js` | Step 3: latest price and 7-day average |
| `lib/sellhold.js` | Step 4: the fixed sell-or-hold rule |
| `lib/answer.js` | Step 5: plain-language answer grounded in the guides |
| `lib/gemini.js` | Gemini client, JSON parsing and token and cost tracking |
| `lib/mock.js` | Demo-mode answer |
| `lib/options.js` | App name, crops, districts and languages |
| `scripts/build-embeddings.mjs` | Builds `data/embeddings.json` from the guides |
| `scripts/csv-to-prices.mjs` | Converts a mandi CSV into `data/prices.json` |

## Models

- `gemini-2.5-flash-lite` for diagnosis and the answer (change with `GEMINI_MODEL`)
- `gemini-embedding-001` for retrieval (change with `EMBED_MODEL`)

The cost shown after each check uses the rates in `.env.local`
(`PRICE_INPUT_PER_M_USD`, `PRICE_OUTPUT_PER_M_USD`, `USD_INR`).
Check current rates at https://ai.google.dev/gemini-api/docs/pricing.

## Known limits

- Photo diagnosis is less accurate on messy field photos than on clean ones.
- Treatment advice is only as complete as the guides loaded in `data/guides/`.
- The sell-or-hold signal is a simple rule, not a price forecast.
