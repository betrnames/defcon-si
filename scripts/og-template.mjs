export const OG_VARIANTS = [
  {
    id: 1,
    eyebrow: "Unofficial • Independent OSINT",
    title1: "Super Intelligence",
    title2: "DEFCON Monitor",
    subtitle: "Military readiness and the race to Super Intelligence — tracked in parallel.",
    riskLabel: "Global Risk Outlook",
    riskLevel: "ELEVATED",
    riskDetail: "DEFCON 3 · SI Readiness 3/5 · Combined risk elevated",
    mode: "both",
    cta: "View Live Monitor",
    ctaUrl: "defcon.si",
    visual: "globe",
    visualCaption: "AI / AGI Hubs · OSINT Map"
  },
  {
    id: 2,
    eyebrow: "SI Track · Capability OSINT",
    title1: "Race to AGI",
    title2: "Threat Monitor",
    subtitle: "Tracking capability jumps, autonomous agents, and Super Intelligence readiness.",
    riskLabel: "SI Risk Outlook",
    riskLevel: "ELEVATED",
    riskDetail: "SI Readiness 3/5 · Frontier model acceleration detected",
    mode: "si",
    cta: "Monitor AGI Threats",
    ctaUrl: "defcon.si",
    visual: "globe",
    visualCaption: "AGI Frontier Labs · Live Map"
  },
  {
    id: 3,
    eyebrow: "Military Track · Force Posture",
    title1: "Military DEFCON",
    title2: "Risk Monitor",
    subtitle: "Regional alerts, command posture, and geopolitical readiness signals.",
    riskLabel: "Military Risk Outlook",
    riskLevel: "ELEVATED",
    riskDetail: "DEFCON 3 · CENTCOM at heightened alert · Theater active",
    mode: "military",
    cta: "Track DEFCON Risk",
    ctaUrl: "defcon.si",
    visual: "radar",
    visualCaption: "Theater Posture · Command Map"
  },
  {
    id: 4,
    eyebrow: "Breaking · OSINT Alert",
    title1: "Threat Level",
    title2: "Elevated",
    subtitle: "CENTCOM: U.S. strikes Iran for second day — regional air defenses engaged.",
    riskLabel: "Highest Active Alert",
    riskLevel: "DEFCON 2",
    riskDetail: "CENTCOM · Strait of Hormuz · Live military OSINT feed",
    mode: "alert",
    cta: "See Live Alerts",
    ctaUrl: "defcon.si",
    visual: "radar",
    visualCaption: "Active Theater · CENTCOM"
  },
  {
    id: 5,
    eyebrow: "Dual-Signal Monitor",
    title1: "DEFCON + SI",
    title2: "Live Dashboard",
    subtitle: "Two existential tracks. One monitor. Military DEFCON and AGI risk in real time.",
    riskLabel: "Live Status",
    riskLevel: "3 / 3",
    riskDetail: "DEFCON estimate 3 · SI Readiness 3/5 · Updated daily",
    mode: "both",
    cta: "Open Live Dashboard",
    ctaUrl: "defcon.si",
    visual: "globe",
    visualCaption: "Global Threat Picture"
  }
];

function gaugeSegs(mode, activeIndex, total) {
  const colors = ["#2ECC71", "#2ECC71", "#F1C40F", "#E67E22", "#E74C3C", "#FF3B30"];
  return Array.from({ length: total }, (_, i) => {
    const color = colors[Math.min(i, colors.length - 1)];
    const active = i === activeIndex;
    const filled = mode === "si" ? i <= activeIndex : i === activeIndex;
    const bg = active
      ? `linear-gradient(145deg,${color},${color}88)`
      : filled
        ? `${color}55`
        : `${color}22`;
    const shadow = active ? `box-shadow:0 0 16px ${color}99;` : "";
    const border = active ? color : `${color}66`;
    return `<div class="seg" style="background:${bg};border-color:${border};${shadow}"></div>`;
  }).join("");
}

function panelsHtml(v) {
  if (v.mode === "alert") {
    return `
      <div class="alert-panel">
        <p class="alert-tag">CENTCOM · DEFCON 2</p>
        <p class="alert-headline">U.S. Strikes Iran for Second Day</p>
        <p class="alert-body">Air defenses engaged in Kuwait, Bahrain, and Jordan. Regional force posture elevated.</p>
      </div>`;
  }

  const siPanel = v.mode !== "military" ? `
    <div class="panel si">
      <div class="panel-head">
        <div>
          <p class="panel-tag">Primary Focus</p>
          <p class="panel-title">SI Readiness</p>
        </div>
        <p class="panel-num">3</p>
      </div>
      <div class="gauge si">${gaugeSegs("si", 3, 6)}</div>
      <p class="panel-label">SI-3 — ELEVATED</p>
    </div>` : "";

  const milPanel = v.mode !== "si" ? `
    <div class="panel mil">
      <div class="panel-head">
        <div>
          <p class="panel-tag">Military Context</p>
          <p class="panel-title">DEFCON Level</p>
        </div>
        <p class="panel-num">3</p>
      </div>
      <div class="gauge mil">${gaugeSegs("mil", 2, 5)}</div>
      <p class="panel-label">DEFCON 3 — ROUND HOUSE</p>
    </div>` : "";

  const gridClass = v.mode === "both" ? "panels" : "panels single";
  return `<div class="${gridClass}">${siPanel}${milPanel}</div>`;
}

function visualHtml(v) {
  if (v.visual === "radar") {
    return `
      <div class="radar">
        <div class="ring r1"></div>
        <div class="ring r2"></div>
        <div class="ring r3"></div>
        <div class="sweep"></div>
        <span class="blip b1"></span>
        <span class="blip b2"></span>
        <span class="blip b3"></span>
      </div>`;
  }
  return `
    <div class="globe">
      <span class="marker m1"></span>
      <span class="marker m2"></span>
      <span class="marker m3"></span>
      <span class="marker m4"></span>
      <span class="marker m5"></span>
    </div>`;
}

export function buildOgHtml(v) {
  const riskLevelStyle = v.mode === "alert" ? "color:#E74C3C;text-shadow:0 0 24px rgba(231,76,60,0.5)" : "";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { width: 1200px; height: 630px; overflow: hidden; background: #0A0E12; color: #C9D4DE; font-family: "IBM Plex Sans", sans-serif; position: relative; }
    .scanlines::before { content: ''; position: absolute; inset: 0; pointer-events: none; background: repeating-linear-gradient(to bottom, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 4px); z-index: 2; }
    .wrap { position: relative; z-index: 1; width: 1200px; height: 630px; padding: 44px 56px 88px; display: grid; grid-template-columns: 1fr 280px; gap: 32px; }
    .eyebrow { font-family: "IBM Plex Mono", monospace; font-size: 13px; letter-spacing: 0.3em; text-transform: uppercase; color: #FFB000; }
    h1 { font-family: "Big Shoulders Display", sans-serif; font-weight: 800; font-size: ${v.mode === "alert" ? "84px" : "72px"}; line-height: 0.95; text-transform: uppercase; letter-spacing: 0.02em; margin-top: 14px; }
    .subtitle { margin-top: 18px; max-width: 620px; font-size: 20px; line-height: 1.45; color: #6B7A8A; }
    .risk { margin-top: 28px; padding: 22px 28px; border: 1px solid rgba(255, 176, 0, 0.3); background: rgba(17, 22, 29, 0.7); border-radius: 2px; text-align: center; max-width: 680px; }
    .risk.alert { border-color: rgba(231, 76, 60, 0.45); background: rgba(231, 76, 60, 0.06); }
    .risk-label { font-family: "IBM Plex Mono", monospace; font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; color: #FFB000; }
    .risk.alert .risk-label { color: #E74C3C; }
    .risk-level { font-family: "Big Shoulders Display", sans-serif; font-weight: 800; font-size: 52px; color: #FFB000; margin-top: 6px; ${riskLevelStyle} }
    .risk-detail { margin-top: 8px; font-size: 15px; color: #6B7A8A; }
    .panels { margin-top: 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; max-width: 720px; }
    .panels.single { grid-template-columns: 1fr; max-width: 360px; }
    .panel { background: #11161D; border-radius: 2px; padding: 18px 20px; }
    .panel.si { border: 1px solid rgba(255, 176, 0, 0.5); box-shadow: 0 0 0 1px rgba(255, 176, 0, 0.12); }
    .panel.mil { border: 1px solid #1E2630; }
    .panel-head { display: flex; justify-content: space-between; align-items: flex-start; }
    .panel-tag { font-family: "IBM Plex Mono", monospace; font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; }
    .panel.si .panel-tag { color: #FFB000; }
    .panel.mil .panel-tag { color: #6B7A8A; }
    .panel-title { font-family: "Big Shoulders Display", sans-serif; font-weight: 700; font-size: 22px; text-transform: uppercase; margin-top: 4px; }
    .panel-num { font-family: "Big Shoulders Display", sans-serif; font-weight: 800; font-size: 56px; line-height: 1; color: #E67E22; text-shadow: 0 0 20px rgba(230,126,34,0.5); }
    .gauge { display: grid; gap: 5px; margin-top: 14px; }
    .gauge.si { grid-template-columns: repeat(6, 1fr); }
    .gauge.mil { grid-template-columns: repeat(5, 1fr); }
    .seg { height: 22px; border-radius: 2px; border: 1px solid rgba(255,255,255,0.08); }
    .panel-label { font-family: "IBM Plex Mono", monospace; font-size: 11px; margin-top: 12px; color: #E67E22; }
    .alert-panel { margin-top: 24px; max-width: 720px; padding: 22px 24px; border: 1px solid rgba(231, 76, 60, 0.45); background: rgba(231, 76, 60, 0.08); border-radius: 2px; }
    .alert-tag { font-family: "IBM Plex Mono", monospace; font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: #E74C3C; }
    .alert-headline { font-family: "Big Shoulders Display", sans-serif; font-weight: 700; font-size: 28px; text-transform: uppercase; margin-top: 8px; line-height: 1.1; }
    .alert-body { margin-top: 10px; font-size: 16px; color: #6B7A8A; line-height: 1.45; }
    .cta-bar { position: absolute; bottom: 0; left: 0; right: 0; height: 72px; z-index: 4; display: flex; align-items: center; justify-content: center; gap: 18px; background: linear-gradient(90deg, #FFB000 0%, #E67E22 100%); box-shadow: 0 -8px 32px rgba(255, 176, 0, 0.25); }
    .cta-action { font-family: "Big Shoulders Display", sans-serif; font-weight: 800; font-size: 34px; letter-spacing: 0.06em; text-transform: uppercase; color: #0A0E12; }
    .cta-arrow { font-family: "Big Shoulders Display", sans-serif; font-weight: 800; font-size: 40px; color: #0A0E12; line-height: 1; }
    .cta-url { font-family: "IBM Plex Mono", monospace; font-size: 18px; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(10, 14, 18, 0.75); padding-left: 18px; border-left: 2px solid rgba(10, 14, 18, 0.25); }
    .visual-wrap { position: relative; align-self: center; justify-self: end; width: 280px; height: 280px; }
    .visual-caption { position: absolute; top: -8px; right: 0; font-family: "IBM Plex Mono", monospace; font-size: 9px; letter-spacing: 0.15em; text-transform: uppercase; color: #6B7A8A; }
    .globe { width: 280px; height: 280px; border-radius: 50%; background: radial-gradient(circle at 35% 30%, rgba(255,176,0,0.12), transparent 45%), radial-gradient(circle at 60% 65%, rgba(201,212,222,0.08), transparent 40%), linear-gradient(145deg, #1a2633 0%, #0f151c 100%); border: 1px solid rgba(255, 176, 0, 0.15); box-shadow: 0 0 60px rgba(255, 176, 0, 0.08), inset 0 0 40px rgba(0,0,0,0.4); position: relative; overflow: hidden; }
    .globe::before { content: ''; position: absolute; inset: 8%; border-radius: 50%; border: 1px solid rgba(201, 212, 222, 0.18); }
    .marker { position: absolute; width: 10px; height: 10px; border-radius: 50%; transform: translate(-50%, -50%); box-shadow: 0 0 12px currentColor; }
    .m1 { top: 38%; left: 22%; background: #FF3B30; color: #FF3B30; }
    .m2 { top: 30%; left: 52%; background: #FFB000; color: #FFB000; }
    .m3 { top: 48%; left: 72%; background: #FFB000; color: #FFB000; }
    .m4 { top: 58%; left: 48%; background: #FF3B30; color: #FF3B30; }
    .m5 { top: 42%; left: 78%; background: #F1C40F; color: #F1C40F; }
    .radar { width: 280px; height: 280px; border-radius: 50%; position: relative; border: 1px solid rgba(230, 126, 34, 0.2); background: radial-gradient(circle, rgba(17,22,29,0.9) 0%, rgba(10,14,18,1) 70%); overflow: hidden; }
    .ring { position: absolute; border: 1px solid rgba(230, 126, 34, 0.14); border-radius: 50%; top: 50%; left: 50%; transform: translate(-50%, -50%); }
    .r1 { width: 35%; height: 35%; } .r2 { width: 60%; height: 60%; } .r3 { width: 85%; height: 85%; }
    .sweep { position: absolute; inset: 0; background: conic-gradient(from 200deg at 50% 50%, transparent 0deg, rgba(231,76,60,0.35) 28deg, transparent 56deg); }
    .blip { position: absolute; width: 12px; height: 12px; border-radius: 50%; transform: translate(-50%, -50%); box-shadow: 0 0 14px currentColor; }
    .b1 { top: 54%; left: 58%; background: #E74C3C; color: #E74C3C; }
    .b2 { top: 30%; left: 52%; background: #E67E22; color: #E67E22; }
    .b3 { top: 62%; left: 72%; background: #FFB000; color: #FFB000; }
  </style>
</head>
<body class="scanlines">
  <div class="wrap">
    <div>
      <p class="eyebrow">${v.eyebrow}</p>
      <h1>${v.title1}<br>${v.title2}</h1>
      <p class="subtitle">${v.subtitle}</p>
      <div class="risk${v.mode === "alert" ? " alert" : ""}">
        <p class="risk-label">${v.riskLabel}</p>
        <p class="risk-level">${v.riskLevel}</p>
        <p class="risk-detail">${v.riskDetail}</p>
      </div>
      ${panelsHtml(v)}
    </div>
    <div class="visual-wrap">
      <p class="visual-caption">${v.visualCaption}</p>
      ${visualHtml(v)}
    </div>
  </div>
  <div class="cta-bar">
    <span class="cta-action">${v.cta}</span>
    <span class="cta-arrow">→</span>
    <span class="cta-url">${v.ctaUrl}</span>
  </div>
</body>
</html>`;
}