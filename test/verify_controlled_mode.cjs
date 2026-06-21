/**
 * Controlled mode verification for CanvasOverlay.
 *
 * Strategy: use the same content for both modes so output is directly comparable.
 *
 * 1. Auto mode baseline — rectangle renderer, <mark> elements present.
 *    Capture pixel count and extract precomputed rects from each mark.
 * 2. Controlled mode — same rects passed as highlights prop via window.__testAPI.
 *    <mark> elements remain in DOM to confirm they are ignored in controlled mode.
 *    Pixel count must match auto mode (rectangle uses fillRect with identical coords).
 * 3. Isolation: highlights=[] → zero pixels even with <mark> in DOM.
 * 4. Return to auto mode (highlights=undefined) → marks render again.
 *
 * Requires dev server on port 5200 (npm run dev).
 * Usage: node test/verify_controlled_mode.cjs
 */
const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:5200/';
const WAIT_MS = 400;

function countNonZeroAlpha(data) {
  let count = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i] > 0) count++;
  return count;
}

async function getCanvasPixelCount(page) {
  return page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let count = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 0) count++;
    return count;
  });
}

// Extract precomputed rects and hues from all <mark> elements using the same
// Range API the auto mode uses, serialised to plain objects for IPC.
async function extractMarkHighlights(page) {
  return page.evaluate(() => {
    return Array.from(document.querySelectorAll('mark')).map((mark) => {
      const range = document.createRange();
      range.selectNodeContents(mark);
      const rects = Array.from(range.getClientRects()).map((r) => ({
        left: r.left,
        top: r.top,
        width: r.width,
        height: r.height,
      }));
      const hueAttr = mark.getAttribute('data-hue');
      const hue = hueAttr ? parseFloat(hueAttr) : undefined;
      return { rects, hue };
    });
  });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  let passed = 0;
  let failed = 0;

  function assert(condition, label) {
    if (condition) {
      console.log(`  PASS  ${label}`);
      passed++;
    } else {
      console.error(`  FAIL  ${label}`);
      failed++;
    }
  }

  await page.goto(BASE_URL);
  await page.waitForTimeout(WAIT_MS);

  // Ensure rectangle mode for a deterministic pixel comparison
  await page.click('button:has-text("Rectangle")');
  await page.waitForTimeout(WAIT_MS);

  // ── 1. Auto mode baseline ────────────────────────────────────────────────
  console.log('\n── 1. Auto mode baseline ──');

  const autoPixels = await getCanvasPixelCount(page);
  console.log(`  Auto mode pixels: ${autoPixels}`);
  assert(autoPixels > 0, 'Auto mode renders non-zero pixels');

  const markCount = await page.evaluate(() => document.querySelectorAll('mark').length);
  console.log(`  Mark elements found: ${markCount}`);
  assert(markCount > 0, 'Page has <mark> elements');

  // Extract mark positions as precomputed rects (serialisable plain objects)
  const highlights = await extractMarkHighlights(page);
  console.log(`  Extracted highlights for ${highlights.length} marks`);
  assert(highlights.length === markCount, 'One highlight descriptor per mark');

  await page.screenshot({ path: '/tmp/controlled_auto_baseline.png' });

  // ── 2. Controlled mode — same precomputed rects ──────────────────────────
  console.log('\n── 2. Controlled mode (precomputed rects) ──');

  // Switch to controlled mode and inject the extracted highlights
  await page.evaluate((hl) => {
    window.__testAPI.setControlledMode(true);
    window.__testAPI.setHighlights(hl);
  }, highlights);
  await page.waitForTimeout(WAIT_MS);

  const controlledPixels = await getCanvasPixelCount(page);
  console.log(`  Controlled mode pixels: ${controlledPixels}`);
  assert(controlledPixels > 0, 'Controlled mode renders non-zero pixels');

  // Rectangle renderer uses fillRect with the exact same coordinates, so
  // pixel counts must be equal (floating-point rect coords may round the same).
  // Allow a tiny tolerance (<1%) for sub-pixel rounding differences.
  const diff = Math.abs(controlledPixels - autoPixels);
  const tolerance = Math.ceil(autoPixels * 0.01);
  console.log(`  Pixel diff: ${diff} (tolerance: ${tolerance})`);
  assert(diff <= tolerance, `Controlled mode pixel count matches auto mode (±1%)`);

  await page.screenshot({ path: '/tmp/controlled_highlights_rects.png' });

  // Confirm <mark> elements are still in DOM but ignored
  const marksStillPresent = await page.evaluate(() => document.querySelectorAll('mark').length > 0);
  assert(marksStillPresent, '<mark> elements remain in DOM during controlled mode');

  // ── 3. Isolation — empty highlights array ────────────────────────────────
  console.log('\n── 3. Isolation: highlights=[] → zero pixels ──');

  await page.evaluate(() => window.__testAPI.setHighlights([]));
  await page.waitForTimeout(WAIT_MS);

  const emptyPixels = await getCanvasPixelCount(page);
  console.log(`  Empty highlights pixels: ${emptyPixels}`);
  assert(emptyPixels === 0, 'highlights=[] renders nothing even with <mark> in DOM');

  await page.screenshot({ path: '/tmp/controlled_empty.png' });

  // ── 4. Return to auto mode ───────────────────────────────────────────────
  console.log('\n── 4. Return to auto mode (highlights=undefined) ──');

  await page.evaluate(() => window.__testAPI.setControlledMode(false));
  await page.waitForTimeout(WAIT_MS);

  const autoAgainPixels = await getCanvasPixelCount(page);
  console.log(`  Auto mode restored pixels: ${autoAgainPixels}`);
  assert(autoAgainPixels > 0, 'Auto mode re-enables and renders <mark> elements again');

  // Should match the original baseline
  const autoAgainDiff = Math.abs(autoAgainPixels - autoPixels);
  assert(autoAgainDiff <= tolerance, 'Restored auto mode matches original baseline');

  await page.screenshot({ path: '/tmp/controlled_auto_restored.png' });

  // ── Summary ──────────────────────────────────────────────────────────────
  await browser.close();
  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  console.log('Screenshots: /tmp/controlled_*.png');
  if (failed > 0) process.exit(1);
})().catch((e) => { console.error(e.message); process.exit(1); });
