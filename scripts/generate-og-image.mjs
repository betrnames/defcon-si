import { chromium } from "playwright";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const htmlPath = path.join(root, "og-render.html");
const outPath = path.join(root, "og-image.jpg");

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto(`file:///${htmlPath.replace(/\\/g, "/")}`, { waitUntil: "networkidle" });
await page.waitForTimeout(800);
await page.screenshot({ path: outPath, type: "jpeg", quality: 92 });
await browser.close();
console.log(`Wrote ${outPath}`);