# DEFCON.si — Super Intelligence DEFCON Monitor

Single-file static site. No build step, no framework. `index.html` is the entire app
(Tailwind CDN + Chart.js CDN + vanilla JS).

---

## Deploy to Netlify

**Option A — Drag & drop (fastest, ~60 seconds)**
1. Go to https://app.netlify.com/drop
2. Drag the folder containing `index.html` onto the page.
3. Done. Netlify gives you a `*.netlify.app` URL immediately.

**Option B — Git-based (recommended for ongoing edits)**
1. Push this folder to a GitHub repo (e.g. `betrnames/defcon-si`).
2. Netlify → **Add new site → Import an existing project** → pick the repo.
3. Build settings:
   - Build command: *(leave empty)*
   - Publish directory: `/` (or the folder containing `index.html`)
4. Every `git push` redeploys automatically.

**Custom domain (defcon.si)**
1. Netlify → Site → **Domain management → Add custom domain** → `defcon.si`.
2. At your registrar, point DNS:
   - Apex `defcon.si` → Netlify load balancer IP `75.2.60.5` (A record), or use Netlify DNS.
   - `www` → CNAME to `your-site.netlify.app`.
3. Enable HTTPS (Netlify provisions Let's Encrypt automatically once DNS resolves).

---

## Editing current data (today)

All displayed data lives in one place — the `CONFIG` object at the top of the
`<script>` block in `index.html`:

```js
const CONFIG = {
  defconLevel: 3,      // 1–5
  siLevel: 2,          // 0–5
  lastUpdated: "2026-06-10 14:00 UTC",
  signals: [ ... ],    // cards
  history: { ... }     // chart data
};
```

Change values, save, redeploy. Nothing else needs touching.

---

## Upgrading to dynamic data with `data.json` (later)

When you want to update levels without redeploying HTML:

**1. Create `data.json` next to `index.html`** with the same shape as `CONFIG`.

**2. Replace the init block** at the bottom of the script with:

```js
document.addEventListener("DOMContentLoaded", async () => {
  let data = CONFIG;
  try {
    const res = await fetch("/data.json", { cache: "no-store" });
    if (res.ok) data = await res.json();
  } catch (_) { /* fall back to inline CONFIG */ }

  renderDefcon(Math.min(5, Math.max(1, data.defconLevel)));
  renderSI(Math.min(5, Math.max(0, data.siLevel)));
  renderSignals(data.signals);
  renderChart(data.history);
  document.getElementById("last-updated").textContent = data.lastUpdated;
  document.getElementById("year").textContent = new Date().getFullYear();
  tickClock();
  setInterval(tickClock, 1000);
});
```

**3. Automate (Loop Option 1 implemented):**
- Run `node scripts/agent-update.mjs` (or `node scripts/agent-update.js` if you prefer .js)
- It fetches/simulates OSINT, reasons about levels, writes `data.json`
- The site (`index.html`) now automatically prefers `/data.json` on load (see the DOMContentLoaded block)
- "Refresh Signals" button also re-fetches the latest data.json without full reload

Next: turn this into a real cron / GitHub Action / Cloudflare Worker that runs daily (or on significant signals) and commits the updated `data.json`.
