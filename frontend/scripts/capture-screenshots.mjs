// Capture responsive-design screenshots for the project report.
//
// Walks five viewport widths × five key pages and writes PNGs to
// `report/screenshots/<page>-<width>.png`. Logs in once via the auth API,
// then injects the token into localStorage so we skip the login form on
// every viewport.
//
// Usage:
//   1. Start the frontend dev server in another terminal: `cd frontend && npm run dev`
//   2. From the frontend/ directory:
//        node scripts/capture-screenshots.mjs
//
// Environment overrides (all optional):
//   SCREENSHOT_BASE_URL  Frontend origin to screenshot. Default http://localhost:5173
//   SCREENSHOT_API_URL   Auth backend.        Default https://aidbackend.vercel.app
//   SCREENSHOT_EMAIL     Login email.         Default admin@pt.com
//   SCREENSHOT_PASSWORD  Login password.      Default admin123

import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
// scripts/ lives at frontend/scripts/, so the repo root is two levels up.
const REPO_ROOT = resolve(__dirname, '..', '..');
const OUT_DIR = join(REPO_ROOT, 'report', 'screenshots');

const BASE_URL = process.env.SCREENSHOT_BASE_URL || 'http://localhost:5173';
const API_URL  = process.env.SCREENSHOT_API_URL  || 'https://aidbackend.vercel.app';
const EMAIL    = process.env.SCREENSHOT_EMAIL    || 'admin@pt.com';
const PASSWORD = process.env.SCREENSHOT_PASSWORD || 'admin123';

// Viewports the rubric asks for: phone, tablet portrait, tablet landscape,
// laptop, desktop.
const VIEWPORTS = [
  { width: 360,  height: 780,  label: '360-mobile' },
  { width: 768,  height: 1024, label: '768-tablet' },
  { width: 1024, height: 768,  label: '1024-tablet-landscape' },
  { width: 1440, height: 900,  label: '1440-laptop' },
  { width: 1920, height: 1080, label: '1920-desktop' },
];

// Pages to capture. `hash` is the hash route (after `#`); empty for landing.
// `wait` is a selector we wait on to make sure content has rendered before
// taking the shot (so we don't catch a half-loaded skeleton).
const PAGES = [
  { name: 'landing',   hash: '',           wait: 'h1' },
  { name: 'dashboard', hash: '#/dashboard', wait: 'main, [role="main"], body' },
  { name: 'library',   hash: '#/library',   wait: 'main, body' },
  { name: 'papers',    hash: '#/papers',    wait: 'main, body' },
  { name: 'editor',    hash: '#/write',     wait: 'body' },
];

async function login() {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Auth failed (${res.status}): ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  const token = data.access_token || data.token;
  if (!token) throw new Error(`Auth response had no token: ${JSON.stringify(data).slice(0, 200)}`);
  return token;
}

async function probeFrontend() {
  try {
    const res = await fetch(BASE_URL, { method: 'GET' });
    return res.ok || res.status === 404;
  } catch {
    return false;
  }
}

async function main() {
  console.log(`→ Screenshot run`);
  console.log(`  Frontend: ${BASE_URL}`);
  console.log(`  API:      ${API_URL}`);
  console.log(`  Output:   ${OUT_DIR}`);

  if (!(await probeFrontend())) {
    console.error(`\nFrontend is not reachable at ${BASE_URL}.`);
    console.error(`Start it first:  cd frontend && npm run dev`);
    process.exit(1);
  }

  let token;
  try {
    token = await login();
    console.log(`  Auth:     ok (${EMAIL})`);
  } catch (err) {
    console.warn(`  Auth:     FAILED (${err.message}). Will capture landing only.`);
    token = null;
  }

  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const log = [];
  let captured = 0;

  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await ctx.newPage();

    // Seed localStorage with the auth token before any route loads so the
    // SPA boots in a signed-in state. Has to happen on a real page first.
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    if (token) {
      await page.evaluate(t => localStorage.setItem('aid_token', t), token);
    }

    for (const p of PAGES) {
      // Skip authenticated pages if we never got a token.
      if (!token && p.name !== 'landing') continue;

      const url = `${BASE_URL}/${p.hash}`;
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
      } catch {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      }
      try {
        await page.waitForSelector(p.wait, { timeout: 5000 });
      } catch { /* selector wait is best-effort */ }
      // Settle for animations / lazy renders.
      await page.waitForTimeout(800);

      const file = join(OUT_DIR, `${p.name}-${vp.label}.png`);
      await page.screenshot({ path: file, fullPage: true });
      console.log(`  ✓ ${p.name.padEnd(10)} @ ${vp.label.padEnd(22)} → ${file.replace(REPO_ROOT + '\\', '').replace(REPO_ROOT + '/', '')}`);
      log.push({ page: p.name, viewport: vp.label, file: file });
      captured += 1;
    }

    await ctx.close();
  }

  await browser.close();

  // Write a manifest so the report can reference exactly which files exist.
  const manifest = [
    `# Responsive Screenshots — Manifest`,
    ``,
    `Generated by \`scripts/capture-screenshots.mjs\` on ${new Date().toISOString()}.`,
    ``,
    `| Page | Viewport | File |`,
    `|------|----------|------|`,
    ...log.map(e => `| ${e.page} | ${e.viewport} | \`${e.page}-${e.viewport}.png\` |`),
    ``,
  ].join('\n');
  await writeFile(join(OUT_DIR, 'README.md'), manifest, 'utf-8');

  console.log(`\nCaptured ${captured} screenshots.`);
  console.log(`Manifest: ${join(OUT_DIR, 'README.md')}`);
}

main().catch(err => {
  console.error('\nScript failed:', err);
  process.exit(1);
});
