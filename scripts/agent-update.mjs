#!/usr/bin/env node

/**
 * DEFCON.si Autonomous Daily OSINT Assessment Loop (Option 1)
 *
 * This script simulates an autonomous agent that:
 * 1. "Fetches" latest OSINT signals (mock data for now — replace with real news APIs, RSS, or LLM summarizer later)
 * 2. Analyzes signals using deterministic reasoning (easy to swap for Grok/Claude API call)
 * 3. Decides updated defconLevel (1-5) and siLevel (0-5)
 * 4. Persists changes to data.json (preferred over editing index.html)
 * 5. Logs a clear, human-readable summary of the decision + reasoning
 *
 * Run locally:
 *   node scripts/agent-update.js
 *
 * Future evolution:
 * - Replace fetchLatestOSINT() with real HTTP calls + LLM prompt for scoring
 * - Add confidence scoring, source weighting
 * - Cron / GitHub Action / Cloudflare Cron / Netlify Scheduled Function
 * - Commit + push data.json automatically
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_PATH = path.join(ROOT, 'data.json');

// ============================================================
// 1. DATA MODEL (matches CONFIG in index.html + README upgrade path)
// ============================================================

/**
 * @typedef {Object} Signal
 * @property {string} category - 'military' | 'si'
 * @property {string} title
 * @property {string} region
 * @property {'low'|'moderate'|'high'} severity
 * @property {string} confidence
 * @property {string} time
 * @property {string} summary
 */

/**
 * @typedef {Object} NewsItem
 * @property {string} category
 * @property {string} title
 * @property {string} summary
 * @property {string} time
 * @property {string} command
 * @property {number} commandLevel
 * @property {string} url
 */

/**
 * @typedef {Object} History
 * @property {string[]} labels
 * @property {number[]} defcon
 * @property {number[]} si
 */

/**
 * @typedef {Object} AssessmentData
 * @property {number} defconLevel - 1 (highest readiness) to 5 (peacetime)
 * @property {number} siLevel - 0 (dormant) to 5 (critical SI risk)
 * @property {string} lastUpdated
 * @property {Signal[]} signals
 * @property {NewsItem[]} newsTracker
 * @property {History} history
 */

// ============================================================
// 2. MOCK OSINT FETCH (replace this module later)
// ============================================================

/**
 * Simulates fetching fresh OSINT.
 * In production this would:
 *   - Hit news APIs (NewsAPI, GDELT, etc.)
 *   - Scrape open sources
 *   - Or call an LLM: "Summarize the top 8 most important signals from the last 24h for military DEFCON and AGI risk. Return structured JSON."
 */
function fetchLatestOSINT() {
  const now = new Date();
  const hours = now.getUTCHours();

  // Base on real-ish current events + some daily variation for demo
  const mockSignals = [
    {
      category: "military",
      title: hours % 2 === 0 
        ? "IRGC increases naval drills in Strait of Hormuz" 
        : "Additional U.S. destroyers arrive in CENTCOM AOR",
      region: "Middle East / Strait of Hormuz",
      severity: "high",
      confidence: "Corroborated",
      time: "3h ago",
      summary: "Multiple independent sources confirm increased activity and force posture adjustments in a key chokepoint."
    },
    {
      category: "si",
      title: "Major lab releases new agentic scaffolding with long-horizon planning",
      region: "Global / Frontier Labs",
      severity: "high",
      confidence: "Developing",
      time: "9h ago",
      summary: "New framework shows reliable 72-hour autonomous operation on complex software engineering tasks."
    },
    {
      category: "military",
      title: "Unusual pattern of strategic airlift into forward operating locations",
      region: "Indo-Pacific",
      severity: "moderate",
      confidence: "Single-source",
      time: "14h ago",
      summary: "Open-source tracking shows elevated tempo of heavy-lift flights consistent with contingency movement."
    },
    {
      category: "si",
      title: "Open model matches proprietary frontier on multi-step deception evals",
      region: "Global / Open Source",
      severity: "high",
      confidence: "Corroborated",
      time: "22h ago",
      summary: "Significant narrowing of the gap on safety-relevant benchmarks — accelerates capability diffusion risk."
    }
  ];

  // Occasionally surface a breaking military event for demo drama
  if (hours % 6 === 0) {
    mockSignals.unshift({
      category: "military",
      title: "Regional air defenses engaged after reported missile launches",
      region: "Middle East",
      severity: "high",
      confidence: "Developing",
      time: "47m ago",
      summary: "Multiple reports of intercepts and increased alert status across several partner nations."
    });
  }

  return mockSignals;
}

// ============================================================
// 3. ANALYSIS & DECISION ENGINE (simulated reasoning — easy to LLM-ify)
// ============================================================

/**
 * Scores the current signal set.
 * Returns numbers that influence level deltas.
 */
function analyzeSignals(signals) {
  let militaryTension = 0;   // higher = more readiness needed (lower defcon number)
  let siAcceleration = 0;    // higher = higher siLevel

  for (const s of signals) {
    const sev = s.severity;
    const sevScore = sev === 'high' ? 3 : sev === 'moderate' ? 2 : 1;

    if (s.category === 'military') {
      // Hot regions + high severity = stronger signal
      const hotRegion = /Iran|Middle East|Hormuz|CENTCOM|Gulf|Israel|Gaza/i.test(s.region + ' ' + s.title);
      militaryTension += sevScore * (hotRegion ? 1.5 : 1);
    }

    if (s.category === 'si') {
      // Breakthrough language = acceleration
      const breakthrough = /autonomous|agentic|frontier|matches|narrows|deception|long-horizon/i.test(s.title + ' ' + s.summary);
      siAcceleration += sevScore * (breakthrough ? 1.4 : 1);
    }
  }

  return { militaryTension, siAcceleration };
}

/**
 * Decides new levels from current + analysis.
 * Keeps changes conservative (max ±1 per day) for credibility.
 */
function decideNewLevels(currentDefcon, currentSi, scores) {
  const { militaryTension, siAcceleration } = scores;

  // Military: more tension = lower number (higher readiness)
  // Baseline around 3-4. High tension pushes toward 2 or 1.
  let newDefcon = currentDefcon;
  if (militaryTension > 9) newDefcon = Math.max(1, currentDefcon - 1);
  else if (militaryTension < 4) newDefcon = Math.min(5, currentDefcon + 1);

  // SI: more acceleration = higher number (higher risk)
  let newSi = currentSi;
  if (siAcceleration > 7) newSi = Math.min(5, currentSi + 1);
  else if (siAcceleration < 3) newSi = Math.max(0, currentSi - 1);

  // Clamp and return
  newDefcon = Math.max(1, Math.min(5, Math.round(newDefcon)));
  newSi = Math.max(0, Math.min(5, Math.round(newSi)));

  const reasoning = [];
  if (newDefcon !== currentDefcon) {
    reasoning.push(`Military tension score ${militaryTension.toFixed(1)} drove DEFCON ${currentDefcon} → ${newDefcon}`);
  } else {
    reasoning.push(`Military tension (${militaryTension.toFixed(1)}) not sufficient for DEFCON change`);
  }

  if (newSi !== currentSi) {
    reasoning.push(`SI acceleration score ${siAcceleration.toFixed(1)} drove SI Readiness ${currentSi} → ${newSi}`);
  } else {
    reasoning.push(`SI acceleration (${siAcceleration.toFixed(1)}) insufficient for level change`);
  }

  return { newDefcon, newSi, reasoning };
}

// ============================================================
// 4. HISTORY & SIGNAL MAINTENANCE
// ============================================================

function updateHistory(history, newDefcon, newSi) {
  const today = new Date().toLocaleString('en-US', { 
    month: 'short', day: 'numeric' 
  });

  // Avoid duplicate day labels
  let labels = [...history.labels];
  let defconHist = [...history.defcon];
  let siHist = [...history.si];

  if (labels[labels.length - 1] !== today) {
    labels.push(today);
    defconHist.push(newDefcon);
    siHist.push(newSi);

    // Keep last 16 points
    if (labels.length > 16) {
      labels = labels.slice(-16);
      defconHist = defconHist.slice(-16);
      siHist = siHist.slice(-16);
    }
  } else {
    // Same day — overwrite latest point
    defconHist[defconHist.length - 1] = newDefcon;
    siHist[siHist.length - 1] = newSi;
  }

  return { labels, defcon: defconHist, si: siHist };
}

function pruneSignals(signals, max = 9) {
  // Keep newest first (they are already roughly chronological in mock)
  return signals.slice(0, max);
}

// ============================================================
// 5. MAIN
// ============================================================

async function main() {
  console.log('=== DEFCON.si Daily OSINT Assessment Loop ===\n');

  // Load current state
  let data;
  try {
    data = JSON.parse(readFileSync(DATA_PATH, 'utf8'));
  } catch (e) {
    console.error('Could not read data.json — run with seed first or create it.');
    process.exit(1);
  }

  const prevDefcon = data.defconLevel;
  const prevSi = data.siLevel;

  // 1. Fetch
  const newSignals = fetchLatestOSINT();
  console.log(`Fetched ${newSignals.length} fresh OSINT signals.`);

  // 2. Analyze
  const scores = analyzeSignals(newSignals);
  console.log(`Analysis — Military tension: ${scores.militaryTension.toFixed(1)}, SI acceleration: ${scores.siAcceleration.toFixed(1)}`);

  // 3. Decide
  const decision = decideNewLevels(prevDefcon, prevSi, scores);

  // 4. Update data
  data.defconLevel = decision.newDefcon;
  data.siLevel = decision.newSi;
  data.lastUpdated = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';

  // Merge & prune signals (keep most recent credible ones)
  data.signals = pruneSignals([...newSignals, ...data.signals]);

  // Update history
  data.history = updateHistory(data.history, data.defconLevel, data.siLevel);

  // Write back
  writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');

  // 5. Human-readable summary
  console.log('\n=== ASSESSMENT SUMMARY ===');
  console.log(`DEFCON: ${prevDefcon} → ${data.defconLevel}`);
  console.log(`SI Readiness: ${prevSi} → ${data.siLevel}`);
  console.log(`Last Updated: ${data.lastUpdated}`);
  console.log('\nReasoning:');
  decision.reasoning.forEach(r => console.log('  • ' + r));

  if (data.defconLevel < prevDefcon) {
    console.log('\n→ Elevated military posture detected. Recommend increased monitoring.');
  }
  if (data.siLevel > prevSi) {
    console.log('\n→ Significant SI capability signal. Monitor for follow-through developments.');
  }

  console.log('\ndata.json updated. Redeploy or let your scheduled process handle the rest.');
  console.log('Next step (manual for now): node scripts/agent-update.mjs');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});