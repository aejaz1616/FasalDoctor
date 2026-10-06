# FasalDoc: photo-based crop disease check (GitHub Pages version)

The whole site is one file, `index.html`. It runs entirely in the browser:
photo, then Gemini diagnosis, then retrieval from `data/embeddings.json`,
then price from `data/prices.json`, then a sell-or-hold rule, then an answer
in English, Hindi or Punjabi.

## Host it on GitHub Pages

1. Create a new public repo and upload everything in this folder
   (`index.html` must be at the top level, next to the `data` folder).
2. Go to Settings, then Pages. Under "Build and deployment", choose
   "Deploy from a branch", pick `main` and `/ (root)`, and save.
3. After a minute or two, the site is live at
   `https://<your-username>.github.io/<repo-name>/`.

Opening `index.html` by double-clicking will not load the data files.
To test on your laptop, run `python3 -m http.server` in this folder and open
http://localhost:8000.

## The API key

**Never put an API key in `index.html`.** GitHub Pages is public, so anyone
could copy it.

Instead, open "Gemini API key" in the form and paste a key from
https://aistudio.google.com/apikey. It stays in that browser tab only.
Without a key, the site runs in demo mode with a canned answer.

For extra safety, restrict the key in Google AI Studio or Google Cloud
to your GitHub Pages address, and delete it after the presentation.

## Settings

The top of the `<script>` in `index.html` holds the app name, models,
token rates for the cost display, crops, districts and languages.

## Updating the data

You need Node.js 18 or later for these two scripts. They run on your laptop;
then you commit the updated JSON files.

```bash
npm install
cp .env.example .env.local   # paste your key here (this file is git-ignored)
npm run embed                # guides in data/guides/*.txt  ->  data/embeddings.json
npm run prices               # data/raw/prices.csv          ->  data/prices.json
```

`data/prices.json` currently holds **made-up sample prices**, and the site
labels them as samples. Replace them with a real Agmarknet download before
the demo.

## Cost logging

After each live check, the page shows its tokens and rupee cost, and logs a
`[usage]` line in the browser console (right-click, Inspect, Console).
