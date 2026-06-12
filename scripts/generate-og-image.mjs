import { chromium } from "playwright";
import { writeFileSync, copyFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { OG_VARIANTS, buildOgHtml } from "./og-template.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const tmpDir = path.join(root, "scripts", ".og-tmp");
mkdirSync(tmpDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });

for (const variant of OG_VARIANTS) {
  const htmlPath = path.join(tmpDir, `og-${variant.id}.html`);
  const outPath = path.join(root, `og-image-${variant.id}.jpg`);
  writeFileSync(htmlPath, buildOgHtml(variant), "utf8");

  await page.goto(`file:///${htmlPath.replace(/\\/g, "/")}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await page.screenshot({ path: outPath, type: "jpeg", quality: 92 });
  console.log(`Wrote og-image-${variant.id}.jpg`);
}

copyFileSync(path.join(root, "og-image-1.jpg"), path.join(root, "og-image.jpg"));
console.log("Wrote og-image.jpg (copy of variant 1)");

await browser.close();