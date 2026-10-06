"use client";

import { useState } from "react";
import { APP_NAME, CROPS, DISTRICTS, LANGUAGES } from "@/lib/options";

// Shrinks the photo before upload: faster on rural networks, fewer image tokens.
async function resizeImage(file, maxSide = 1024) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
  return { dataUrl, base64: dataUrl.split(",")[1], mimeType: "image/jpeg" };
}

const CALL_LABELS = {
  sell_soon: "Treat now, consider selling soon",
  treat_then_decide: "Treat first, then decide",
  treat_and_hold: "Treat and hold",
  no_action: "No need to sell early",
  no_price: "No price signal",
};

function LeafMark() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M5 27C5 14 13 5 27 5c0 14-9 22-22 22Z" fill="#2E6B3C" />
      <path d="M7 25 21 11" stroke="#F2C230" strokeWidth="2" strokeLinecap="round" />
      <circle cx="17" cy="13" r="2.2" fill="#8A4B1C" />
    </svg>
  );
}

function Report({ result }) {
  const { diagnosis: d, answer: a, price: p, decision, usage, mode } = result;
  const healthy = d.is_healthy;
  const pct = Math.round(d.confidence * 100);
  const sev = ["mild", "moderate", "severe"];

  return (
    <article className="report" aria-live="polite">
      <header className="report-head">
        <p className="crop">{d.crop}{mode === "demo" ? ", demo mode" : ""}</p>
        <h2 className={healthy ? "is-healthy" : ""}>{healthy ? "Looks healthy" : d.disease}</h2>
        {a.headline && <p className="headline">{a.headline}</p>}

        <div className="gauges">
          <div>
            <div className="gauge-label"><span>How sure</span><span>{pct}%</span></div>
            <div className="meter" role="img" aria-label={`Confidence ${pct} percent`}>
              <span style={{ width: `${pct}%` }} />
            </div>
          </div>
          {!healthy && (
            <div>
              <div className="gauge-label"><span>How serious</span></div>
              <div className="severity" role="img" aria-label={`Severity ${d.severity}`}>
                {sev.map((s) => (
                  <span key={s} className={sev.indexOf(s) <= sev.indexOf(d.severity) ? "on" : ""}>{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="report-body">
        <div className="report-main">
          {a.what_it_is && (<><h3>What it is</h3><p>{a.what_it_is}</p></>)}

          {a.do_this_week.length > 0 && (
            <>
              <h3>Do this week</h3>
              <ol className="steps">{a.do_this_week.map((s, i) => <li key={i}>{s}</li>)}</ol>
            </>
          )}

          {a.prevention.length > 0 && (
            <>
              <h3>Next season</h3>
              <ul className="plain">{a.prevention.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </>
          )}

          {a.caution && <p className="caution">{a.caution}</p>}

          <div className="sources">
            <h3>Where this advice comes from</h3>
            {a.sources_used.length > 0 ? (
              <ul>{a.sources_used.map((s, i) => <li key={i}>{s}</li>)}</ul>
            ) : (
              <p>No guide matched this problem. Confirm with your local Krishi Vigyan Kendra.</p>
            )}
          </div>
        </div>

        <aside className="report-side">
          <h3>Mandi price today</h3>
          {p ? (
            <>
              <p className="price-big">₹{p.modal.toLocaleString("en-IN")}</p>
              <p className="price-meta">per quintal, {p.market}, {p.date}</p>
              <div className="price-row"><span>7-day range</span><span>₹{p.min.toLocaleString("en-IN")} to ₹{p.max.toLocaleString("en-IN")}</span></div>
              <div className="price-row"><span>7-day average</span><span>₹{p.avg7.toLocaleString("en-IN")}</span></div>
              {p.is_sample && <span className="sample-flag">Sample prices, not real market data</span>}
            </>
          ) : (
            <p>No price on file for this crop yet.</p>
          )}

          {decision && (
            <div className="call">
              <strong>{CALL_LABELS[decision.call] || decision.call}</strong>
              <p>{a.market_note || decision.reason}</p>
            </div>
          )}
        </aside>
      </div>

      <p className="usage">
        {mode === "demo"
          ? "Demo mode: no AI call was made. Add a Gemini API key for real checks."
          : `This check used ${usage.total.toLocaleString("en-IN")} tokens (${usage.input.toLocaleString("en-IN")} in, ${usage.output.toLocaleString("en-IN")} out) on ${usage.model}, about ₹${usage.inr.toFixed(3)}.`}
      </p>
    </article>
  );
}

export default function Home() {
  const [photo, setPhoto] = useState(null);
  const [crop, setCrop] = useState("");
  const [district, setDistrict] = useState(DISTRICTS[0]);
  const [language, setLanguage] = useState("en");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [over, setOver] = useState(false);

  async function pick(file) {
    setError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("That file isn't a photo. Choose a JPG or PNG image.");
      return;
    }
    try {
      setPhoto(await resizeImage(file));
    } catch {
      setError("This photo couldn't be opened. Try another one.");
    }
  }

  async function check(e) {
    e.preventDefault();
    if (!photo) {
      setError("Add a photo of the leaf first.");
      return;
    }
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: photo.base64,
          mimeType: photo.mimeType,
          cropHint: crop,
          district,
          language,
        }),
      });
      const data = await res.json();
      if (data.status === "error") throw new Error(data.message);
      setResult(data);
      setTimeout(() => document.getElementById("report")?.scrollIntoView(), 50);
    } catch (err) {
      setError(err.message || "The check didn't finish. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="masthead">
        <div className="wrap">
          <a className="brand" href="#top"><LeafMark />{APP_NAME}</a>
          <nav aria-label="Sections">
            <a href="#how">How it works</a>
            <a href="#sources">Sources and limits</a>
          </nav>
        </div>
      </div>

      <main id="top">
        <section className="hero">
          <div className="wrap">
            <div>
              <h1>Show us the leaf.</h1>
              <p className="hindi" lang="hi">पत्ता दिखाइए, इलाज जानिए।</p>
              <p className="lede">
                Upload one photo of a sick leaf. You get the likely disease, what to do this
                week from Punjab and ICAR crop guides, and what your crop is fetching at the mandi today.
              </p>
            </div>

            <form className="panel" onSubmit={check}>
              <h2>Check your crop</h2>

              <label className={`drop${over ? " is-over" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setOver(true); }}
                onDragLeave={() => setOver(false)}
                onDrop={(e) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files?.[0]); }}>
                <input type="file" accept="image/*" capture="environment" aria-label="Leaf photo"
                  onChange={(e) => pick(e.target.files?.[0])} />
                {photo ? (
                  <img src={photo.dataUrl} alt="Your leaf photo" />
                ) : (
                  <span>
                    <strong>Take or choose a photo</strong>
                    <span className="hint">One leaf filling the frame, in daylight</span>
                  </span>
                )}
              </label>

              <div className="fields">
                <div className="field">
                  <label htmlFor="crop">Crop</label>
                  <select id="crop" value={crop} onChange={(e) => setCrop(e.target.value)}>
                    <option value="">Not sure</option>
                    {CROPS.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="district">Your district</label>
                  <select id="district" value={district} onChange={(e) => setDistrict(e.target.value)}>
                    {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <fieldset className="field">
                  <legend>Answer in</legend>
                  <div className="langs">
                    {LANGUAGES.map((l) => (
                      <label key={l.code}>
                        <input type="radio" name="lang" value={l.code}
                          checked={language === l.code} onChange={() => setLanguage(l.code)} />
                        <span>{l.label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>

              <button className="btn" type="submit" disabled={busy}>
                {busy ? (
                  <span className="working"><span className="dot" />Checking the leaf, guides and prices</span>
                ) : "Check my crop"}
              </button>
              {error && <p className="form-error" role="alert">{error}</p>}
              <p className="form-note">Takes about 10 seconds. Your photo is not stored.</p>
            </form>
          </div>
        </section>

        {result && (
          <section className="report-section" id="report">
            <div className="wrap">
              {result.status === "retake" ? (
                <div className="retake" role="alert">
                  <h2>Retake the photo</h2>
                  <p>
                    {result.diagnosis.photo_problem || "The leaf isn't clear enough to check."}{" "}
                    Try again in daylight, with one affected leaf filling most of the frame.
                  </p>
                </div>
              ) : (
                <Report result={result} />
              )}
            </div>
          </section>
        )}

        <section className="how" id="how">
          <div className="wrap">
            <h2 className="section-title">What happens after you upload</h2>
            <p className="section-intro">Five steps, each one doing a separate job, so every part of the answer can be traced back.</p>
            <ol className="flow">
              <li><h3>Read the photo</h3><p>A vision model names the crop and the likely disease, and says how sure it is.</p></li>
              <li><h3>Find the guidance</h3><p>We search Punjab and ICAR extension guides for that exact crop and disease.</p></li>
              <li><h3>Check the mandi</h3><p>We look up today's price in your district and the 7-day average.</p></li>
              <li><h3>Weigh sell or hold</h3><p>A fixed rule compares disease severity with the price trend.</p></li>
              <li><h3>Explain it simply</h3><p>The answer is written in your language, citing the guide it used.</p></li>
            </ol>
          </div>
        </section>

        <section className="trust" id="sources">
          <div className="wrap">
            <h2 className="section-title">Sources and limits</h2>
            <p className="section-intro">A photo check is a first opinion, not a lab test. Here is what it relies on and where it can go wrong.</p>
            <div className="trust-grid">
              <div>
                <h3>What the advice is based on</h3>
                <ul>
                  <li>Treatment steps come only from the crop guides we have loaded. If no guide covers the problem, the answer says so.</li>
                  <li>Mandi prices come from Agmarknet data published by the Government of India.</li>
                  <li>The sell-or-hold signal is a simple, fixed rule, not a price forecast.</li>
                </ul>
              </div>
              <div>
                <h3>Where it can go wrong</h3>
                <ul>
                  <li>Blurry, dark or crowded photos lower accuracy. The check will ask you to retake them.</li>
                  <li>Some diseases look alike. When confidence is low, confirm with an expert before spraying.</li>
                  <li>For a second opinion, call the Kisan Call Centre at 1800-180-1551 or visit your local Krishi Vigyan Kendra.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap">
          <p>{APP_NAME} is a student project built for the GenAI Startup Sprint. It gives general guidance only. Always read pesticide labels and follow local expert advice.</p>
        </div>
      </footer>
    </>
  );
}
