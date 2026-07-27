# DEFCON.si

Real-time Super Intelligence threat level monitor. Tracks global AI capability signals and maps them to a DEFCON-style readiness scale.

## What it does

DEFCON.si aggregates open-source intelligence (OSINT) on AI development milestones and presents a live threat assessment dashboard — from routine (DEFCON 5) to critical (DEFCON 1).

- **Dual-scale tracking** — Separate DEFCON level (1–5) and SI capability level (0–5)
- - **Signal cards** — Individual intelligence signals with source attribution
  - - **Historical chart** — Timeline of level changes via Chart.js
    - - **Auto-updating** — Agent script fetches and scores new signals, writes to data.json
      - - **Zero dependencies** — Single index.html file, Tailwind CDN + Chart.js CDN + vanilla JS
       
        - ## How it works
       
        - All data lives in a CONFIG object at the top of the script block. The agent update script (scripts/agent-update.mjs) fetches OSINT, reasons about threat levels, and writes a fresh data.json that the site loads on refresh.
       
        - ## Deploy
       
        - Drag index.html onto [Netlify Drop](https://app.netlify.com/drop). Done in 60 seconds.
       
        - For continuous deployment, connect the repo to Netlify — every push auto-deploys.
