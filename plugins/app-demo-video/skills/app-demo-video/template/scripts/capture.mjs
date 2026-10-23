#!/usr/bin/env node
// Capture screenshots and short screen recordings of a running web app from a shot list.
// Usage: node scripts/capture.mjs shots/<name>.json [--only shotName]
// Writes images/clips + manifest.json into the shot list's outDir (default public/assets/shots).
// Set CHROME_PATH to use an installed Chrome instead of Playwright's (npx playwright install chromium).
import { chromium } from "playwright";
import { readFileSync, writeFileSync, mkdirSync, renameSync, existsSync, rmSync } from "node:fs";
import { join, resolve, relative } from "node:path";
import { execFileSync } from "node:child_process";

const listPath = process.argv[2];
if (!listPath) { console.error("usage: node scripts/capture.mjs shots/<name>.json [--only name]"); process.exit(1); }
const only = process.argv.includes("--only") ? process.argv[process.argv.indexOf("--only") + 1] : null;
const cfg = JSON.parse(readFileSync(listPath, "utf8"));

const DEVICES = {
  desktop: { viewport: { width: 1440, height: 900 }, isMobile: false, hasTouch: false },
  laptop: { viewport: { width: 1280, height: 800 }, isMobile: false, hasTouch: false },
  mobile: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1" },
};
const device = { ...(DEVICES[cfg.device ?? "desktop"] ?? DEVICES.desktop) };
if (cfg.viewport) device.viewport = cfg.viewport;
const vp = device.viewport;
const outDir = resolve(cfg.outDir ?? "public/assets/shots");
const tmpDir = join(outDir, ".tmp");
mkdirSync(tmpDir, { recursive: true });
const base = (cfg.baseUrl ?? "http://localhost:3000").replace(/\/$/, "");
const url = (p) => (/^https?:/.test(p) ? p : base + (p.startsWith("/") ? p : "/" + p));
const hide = cfg.hide ?? [];
// Paths in the manifest are relative to public/, ready to paste into a brief ("assets/shots/x.png").
const publicDir = resolve("public");
const pub = (f) => relative(publicDir, f).replace(/\\/g, "/");
const slow = cfg.slowMo ?? 450; // pause between actions in recordings so viewers can follow

// ---- wait for the app to be reachable ----
async function waitForServer(timeoutMs = 90_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try { const r = await fetch(base, { redirect: "manual" }); if (r.status < 500) return; } catch {}
    await new Promise((r) => setTimeout(r, 1500));
  }
  console.error(`App not reachable at ${base} after ${timeoutMs / 1000}s. Is the dev server running on that port?`);
  process.exit(2);
}

// Blur sensitive elements + optional fake cursor (headless browsers don't draw one).
const hideCss = hide.length ? `${hide.join(",")}{filter:blur(9px)!important}` : "";
const initScript = ({ css, cursor }) => {
  const apply = () => {
    if (css && !document.getElementById("__demo_hide")) {
      const s = document.createElement("style"); s.id = "__demo_hide"; s.textContent = css; document.head.appendChild(s);
    }
    if (cursor && !document.getElementById("__demo_cursor")) {
      const c = document.createElement("div"); c.id = "__demo_cursor";
      c.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24"><path d="M4 2l16 9.5-7 1.8L9.5 21z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
      Object.assign(c.style, { position: "fixed", left: "-50px", top: "-50px", zIndex: 2147483647, pointerEvents: "none", transition: "transform .08s" });
      document.body.appendChild(c);
      addEventListener("mousemove", (e) => { c.style.left = e.clientX - 4 + "px"; c.style.top = e.clientY - 2 + "px"; }, true);
      addEventListener("mousedown", (e) => {
        c.style.transform = "scale(.85)";
        const r = document.createElement("div");
        Object.assign(r.style, { position: "fixed", left: e.clientX - 18 + "px", top: e.clientY - 18 + "px", width: "36px", height: "36px",
          borderRadius: "50%", background: "rgba(59,130,246,.35)", zIndex: 2147483646, pointerEvents: "none", transition: "all .45s ease-out" });
        document.body.appendChild(r);
        requestAnimationFrame(() => { r.style.transform = "scale(2.2)"; r.style.opacity = "0"; });
        setTimeout(() => r.remove(), 500);
      }, true);
      addEventListener("mouseup", () => { c.style.transform = ""; }, true);
    }
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", apply); else apply();
};

async function moveTo(page, locator) {
  await locator.scrollIntoViewIfNeeded({ timeout: 8000 });
  const b = await locator.boundingBox();
  if (b) await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 22 });
}

async function runActions(page, actions = [], recording = false) {
  for (const a of actions) {
    const [kind] = Object.keys(a);
    const v = a[kind];
    if (kind === "goto") await page.goto(url(v), { waitUntil: "networkidle" }).catch(() => page.goto(url(v)));
    else if (kind === "click") { const l = page.locator(v).first(); if (recording) await moveTo(page, l); await l.click(); }
    else if (kind === "fill") await page.locator(v[0]).first().fill(v[1]);
    else if (kind === "type") { const l = page.locator(v[0]).first(); if (recording) await moveTo(page, l); await l.click(); await l.pressSequentially(v[1], { delay: recording ? 55 : 0 }); }
    else if (kind === "press") await page.keyboard.press(v);
    else if (kind === "hover") { const l = page.locator(v).first(); await moveTo(page, l); await l.hover(); }
    else if (kind === "select") await page.locator(v[0]).first().selectOption(v[1]);
    else if (kind === "scroll") await page.mouse.wheel(0, v);
    else if (kind === "waitFor") await page.locator(v).first().waitFor({ timeout: 15000 });
    else if (kind === "wait") await page.waitForTimeout(v);
    else throw new Error(`unknown action "${kind}"`);
    if (recording && kind !== "wait") await page.waitForTimeout(slow);
  }
}

async function focusOf(page, selector) {
  if (!selector) return null;
  const l = page.locator(selector).first();
  try {
    await l.scrollIntoViewIfNeeded({ timeout: 5000 });
    const b = await l.boundingBox();
    if (!b) return null;
    const clamp = (n) => Math.max(0, Math.min(1, n));
    const x = clamp(b.x / vp.width), y = clamp(b.y / vp.height);
    return { x, y, w: clamp((b.x + b.width) / vp.width) - x, h: clamp((b.y + b.height) / vp.height) - y };
  } catch { console.warn(`  ! focus selector not found: ${selector}`); return null; }
}

await waitForServer();
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined }).catch((e) => {
  console.error("Could not start the browser. Run: npx playwright install chromium   (or set CHROME_PATH)\n" + e.message);
  process.exit(3);
});
const ctxOpts = { ...device, deviceScaleFactor: cfg.scale ?? 2, colorScheme: cfg.colorScheme ?? "light" };

// Setup (e.g. log in with a TEST account) once, then reuse the session for every shot.
const statePath = join(tmpDir, "state.json");
{
  const ctx = await browser.newContext(ctxOpts);
  await ctx.addInitScript(initScript, { css: hideCss, cursor: false });
  const page = await ctx.newPage();
  await page.goto(url(cfg.startPath ?? "/"), { waitUntil: "networkidle" }).catch(() => {});
  try { await runActions(page, cfg.setup ?? []); }
  catch (e) { console.error("Setup steps failed: " + e.message); await page.screenshot({ path: join(outDir, "_setup-failed.png") }); process.exit(4); }
  await ctx.storageState({ path: statePath });
  await ctx.close();
}

const manifestPath = join(outDir, "manifest.json");
const manifest = existsSync(manifestPath) && only ? JSON.parse(readFileSync(manifestPath, "utf8")) : { device: cfg.device ?? "desktop", viewport: vp, shots: [] };
manifest.shots = manifest.shots.filter((s) => s.name !== only);

for (const shot of cfg.shots) {
  if (only && shot.name !== only) continue;
  const rec = !!shot.record;
  const ctx = await browser.newContext({
    ...ctxOpts, storageState: statePath,
    ...(rec ? { recordVideo: { dir: tmpDir, size: vp } } : {}),
  });
  await ctx.addInitScript(initScript, { css: hideCss, cursor: rec });
  const page = await ctx.newPage();
  const entry = { name: shot.name, title: shot.title ?? null, path: shot.path, width: vp.width, height: vp.height };
  const t0 = Date.now();
  try {
    await page.goto(url(shot.path ?? "/"), { waitUntil: "networkidle" }).catch(() => page.goto(url(shot.path ?? "/")));
    if (rec) { await page.mouse.move(vp.width * 0.8, vp.height * 0.85); await page.waitForTimeout(700); }
    await runActions(page, shot.actions, rec);
    await page.waitForTimeout(rec ? 1300 : 600);
    entry.focus = await focusOf(page, shot.focus);
    if (rec) await page.waitForTimeout(300);
    const png = join(outDir, `${shot.name}.png`);
    await page.screenshot({ path: png, fullPage: !!shot.fullPage, animations: "disabled" });
    entry.image = pub(png);
    const video = page.video();
    if (rec) entry.seconds = Math.round((Date.now() - t0) / 100) / 10;
    await ctx.close();
    if (rec && video) {
      const src = await video.path();
      const dest = join(outDir, `${shot.name}.webm`);
      if (existsSync(dest)) rmSync(dest);
      renameSync(src, dest);
      entry.video = pub(dest);
      try { // exact clip length if ffprobe is installed; otherwise keep the timer estimate
        entry.seconds = Math.round(parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", dest]).toString()) * 10) / 10;
      } catch {}
    }
    console.log(`✓ ${shot.name}${rec ? " (+clip)" : ""}${entry.focus ? " focus ok" : ""}`);
  } catch (e) {
    entry.error = e.message.split("\n")[0];
    console.error(`✗ ${shot.name}: ${entry.error}`);
    await page.screenshot({ path: join(outDir, `${shot.name}-failed.png`) }).catch(() => {});
    await ctx.close().catch(() => {});
  }
  manifest.shots.push(entry);
}

await browser.close();
rmSync(tmpDir, { recursive: true, force: true }); // removes the saved session (cookies) too
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
const failed = manifest.shots.filter((s) => s.error).length;
console.log(`\nManifest: ${manifestPath}  (${manifest.shots.length - failed} ok, ${failed} failed)`);
process.exit(failed ? 5 : 0);
