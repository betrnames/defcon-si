#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_PATH = path.join(ROOT, 'data.json');

// ============================================================
// 1. RSS FEEDS
// ============================================================

const MILITARY_FEEDS = [
  'https://news.google.com/rss/search?q=military+OR+pentagon+OR+CENTCOM+OR+NATO+OR+missile+OR+airstrike+when:1d&hl=en-US&gl=US&ceid=US:en',
  'https://news.google.com/rss/search?q=defense+OR+troops+OR+warship+OR+nuclear+OR+NORAD+when:1d&hl=en-US&gl=US&ceid=US:en',
];

const SI_FEEDS = [
  'https://news.google.com/rss/search?q=%22artificial+intelligence%22+OR+%22AI+model%22+OR+%22frontier+AI%22+OR+AGI+when:1d&hl=en-US&gl=US&ceid=US:en',
  'https://news.google.com/rss/search?q=%22AI+safety%22+OR+%22autonomous+agent%22+OR+%22superintelligence%22+OR+%22AI+regulation%22+when:1d&hl=en-US&gl=US&ceid=US:en',
];

// ============================================================
// 2. RSS PARSER (no dependencies — regex on XML)
// ============================================================

function parseRSSItems(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const tag = (name) => {
      const m = block.match(new RegExp(`<${name}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${name}>|<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`));
      return m ? (m[1] || m[2] || '').trim() : '';
    };
    const title = tag('title').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
    const link = tag('link');
    const pubDate = tag('pubDate');
    const description = tag('description').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"').slice(0, 300);
    const source = tag('source');
    if (title && link) {
      items.push({ title, link, pubDate, description, source });
    }
  }
  return items;
}

async function fetchRSS(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'DEFCON-SI-OSINT/1.0' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return parseRSSItems(await res.text());
  } catch (e) {
    console.warn(`  Feed failed: ${url} — ${e.message}`);
    return [];
  }
}

// ============================================================
// 3. FETCH & CLASSIFY REAL OSINT
// ============================================================

const MILITARY_KEYWORDS = /military|pentagon|defense|troops|nato|centcom|eucom|indopacom|norad|missile|airstrike|warship|naval|carrier|nuclear|submarine|fighter.jet|bomber|drone.strike|air.defense|artillery|tank|infantry|deploy|mobiliz|force.posture|readiness|threat.level|defcon|conflict|war\b|invasion|incursion|border.clash/i;
const SI_KEYWORDS = /artificial.intelligence|\bAI\b|machine.learning|deep.learning|neural.net|GPT|LLM|frontier.model|AGI|superintelligence|autonomous.agent|agentic|AI.safety|alignment|AI.regulation|AI.chip|compute|transformer|diffusion.model|generative|chatbot|copilot|AI.lab/i;

const HOT_MILITARY_REGIONS = /Iran|Israel|Gaza|Hezbollah|Hormuz|CENTCOM|Gulf|Syria|Yemen|Houthi|Taiwan|South.China.Sea|Indo-?Pacific|Ukraine|Russia|NATO|Korea|DPRK/i;
const HIGH_SEVERITY_KEYWORDS = /strike|attack|launch|intercept|shoot.down|missile|nuclear|invasion|escalat|mobiliz|emergency|alert|threat|casualties|shoot|bomb|explosi/i;
const SI_HIGH_SEVERITY = /breakthrough|surpass|frontier|autonomous|superhuman|deception|loss.of.control|existential|AGI|superintelligence|safety.concern|alignment.failure|ban|moratorium|emergent/i;

function classifyItem(item, category) {
  const text = `${item.title} ${item.description}`;

  let region = 'Global';
  if (/Iran|Iraq|Syria|Yemen|Hormuz|Gulf|Middle.East|Israel|Gaza|Lebanon|Hezbollah/i.test(text)) region = 'Middle East';
  else if (/Ukraine|Russia|NATO|Europe|Baltic|Poland|Romania/i.test(text)) region = 'Europe / NATO';
  else if (/Taiwan|China|Indo-?Pacific|South.China.Sea|Japan|Korea|DPRK|Philippines/i.test(text)) region = 'Indo-Pacific';
  else if (/Africa|Sahel|Somalia|Libya|Sudan/i.test(text)) region = 'Africa';
  else if (category === 'si') region = 'Global / Frontier Labs';

  let severity = 'low';
  if (category === 'military') {
    if (HIGH_SEVERITY_KEYWORDS.test(text)) severity = 'high';
    else if (/deploy|exercise|drill|posture|caution|alert|sanction/i.test(text)) severity = 'moderate';
  } else {
    if (SI_HIGH_SEVERITY.test(text)) severity = 'high';
    else if (/release|announce|partner|invest|regulat|policy|benchmark|eval/i.test(text)) severity = 'moderate';
  }

  let confidence = 'Single-source';
  if (item.source && /reuters|associated.press|bbc|nyt|washington.post|guardian|defense.gov|pentagon/i.test(item.source)) {
    confidence = 'Corroborated';
  } else if (/report|according|confirm|official/i.test(text)) {
    confidence = 'Corroborated';
  } else if (/developing|breaking|unconfirmed|alleged/i.test(text)) {
    confidence = 'Developing';
  }

  const pubMs = item.pubDate ? new Date(item.pubDate).getTime() : Date.now();
  const agoMs = Date.now() - pubMs;
  const agoH = Math.max(1, Math.round(agoMs / 3600000));
  const time = agoH < 24 ? `${agoH}h ago` : `${Math.round(agoH / 24)}d ago`;

  return {
    category,
    title: item.title.length > 120 ? item.title.slice(0, 117) + '…' : item.title,
    region,
    severity,
    confidence,
    time,
    summary: item.description.length > 250 ? item.description.slice(0, 247) + '…' : item.description || item.title,
    url: item.link,
    publishedAt: pubMs,
  };
}

function dedupeByTitle(signals) {
  const seen = new Set();
  return signals.filter(s => {
    const key = s.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fetchLatestOSINT() {
  console.log('Fetching live RSS feeds…');

  const [milResults, siResults] = await Promise.all([
    Promise.all(MILITARY_FEEDS.map(fetchRSS)),
    Promise.all(SI_FEEDS.map(fetchRSS)),
  ]);

  const milItems = milResults.flat();
  const siItems = siResults.flat();
  console.log(`  Raw items — military: ${milItems.length}, SI: ${siItems.length}`);

  const milSignals = milItems
    .filter(item => MILITARY_KEYWORDS.test(`${item.title} ${item.description}`))
    .map(item => classifyItem(item, 'military'));

  const siSignals = siItems
    .filter(item => SI_KEYWORDS.test(`${item.title} ${item.description}`))
    .map(item => classifyItem(item, 'si'));

  const all = [...milSignals, ...siSignals]
    .sort((a, b) => b.publishedAt - a.publishedAt);

  const deduped = dedupeByTitle(all);

  // Take top signals, balanced between categories
  const milTop = deduped.filter(s => s.category === 'military').slice(0, 5);
  const siTop = deduped.filter(s => s.category === 'si').slice(0, 4);
  const signals = [...milTop, ...siTop]
    .sort((a, b) => b.publishedAt - a.publishedAt)
    .map(({ publishedAt, ...rest }) => rest);

  console.log(`  Final signals: ${signals.length} (${milTop.length} mil, ${siTop.length} SI)`);
  return signals;
}

// ============================================================
// 4. ANALYSIS & DECISION ENGINE
// ============================================================

function analyzeSignals(signals) {
  let militaryTension = 0;
  let siAcceleration = 0;

  for (const s of signals) {
    const sevScore = s.severity === 'high' ? 3 : s.severity === 'moderate' ? 2 : 1;

    if (s.category === 'military') {
      const hotRegion = HOT_MILITARY_REGIONS.test(s.region + ' ' + s.title);
      militaryTension += sevScore * (hotRegion ? 1.5 : 1);
    }

    if (s.category === 'si') {
      const breakthrough = SI_HIGH_SEVERITY.test(s.title + ' ' + s.summary);
      siAcceleration += sevScore * (breakthrough ? 1.4 : 1);
    }
  }

  return { militaryTension, siAcceleration };
}

function decideNewLevels(currentDefcon, currentSi, scores) {
  const { militaryTension, siAcceleration } = scores;

  let newDefcon = currentDefcon;
  if (militaryTension > 9) newDefcon = Math.max(1, currentDefcon - 1);
  else if (militaryTension < 4) newDefcon = Math.min(5, currentDefcon + 1);

  let newSi = currentSi;
  if (siAcceleration > 7) newSi = Math.min(5, currentSi + 1);
  else if (siAcceleration < 3) newSi = Math.max(0, currentSi - 1);

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
// 5. HISTORY
// ============================================================

function updateHistory(history, newDefcon, newSi) {
  const today = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric' });

  let labels = [...history.labels];
  let defconHist = [...history.defcon];
  let siHist = [...history.si];

  if (labels[labels.length - 1] !== today) {
    labels.push(today);
    defconHist.push(newDefcon);
    siHist.push(newSi);
    if (labels.length > 16) {
      labels = labels.slice(-16);
      defconHist = defconHist.slice(-16);
      siHist = siHist.slice(-16);
    }
  } else {
    defconHist[defconHist.length - 1] = newDefcon;
    siHist[siHist.length - 1] = newSi;
  }

  return { labels, defcon: defconHist, si: siHist };
}

// ============================================================
// 6. MAIN
// ============================================================

async function main() {
  console.log('=== DEFCON.si Daily OSINT Assessment Loop ===\n');

  let data;
  try {
    data = JSON.parse(readFileSync(DATA_PATH, 'utf8'));
  } catch (e) {
    console.error('Could not read data.json');
    process.exit(1);
  }

  const prevDefcon = data.defconLevel;
  const prevSi = data.siLevel;

  const newSignals = await fetchLatestOSINT();

  if (newSignals.length === 0) {
    console.log('No signals fetched — RSS feeds may be down. Keeping existing data.');
    return;
  }

  console.log(`\nFetched ${newSignals.length} live OSINT signals.`);
  newSignals.forEach(s => console.log(`  [${s.category}] ${s.severity} — ${s.title}`));

  const scores = analyzeSignals(newSignals);
  console.log(`\nAnalysis — Military tension: ${scores.militaryTension.toFixed(1)}, SI acceleration: ${scores.siAcceleration.toFixed(1)}`);

  const decision = decideNewLevels(prevDefcon, prevSi, scores);

  data.defconLevel = decision.newDefcon;
  data.siLevel = decision.newSi;
  data.lastUpdated = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
  data.signals = newSignals.slice(0, 9);
  data.history = updateHistory(data.history, data.defconLevel, data.siLevel);

  writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');

  console.log('\n=== ASSESSMENT SUMMARY ===');
  console.log(`DEFCON: ${prevDefcon} → ${data.defconLevel}`);
  console.log(`SI Readiness: ${prevSi} → ${data.siLevel}`);
  console.log(`Last Updated: ${data.lastUpdated}`);
  console.log('\nReasoning:');
  decision.reasoning.forEach(r => console.log('  • ' + r));

  console.log('\ndata.json updated with live OSINT signals.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
