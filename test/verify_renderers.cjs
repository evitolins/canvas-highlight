/**
 * Visual verification script for canvas overlay renderers.
 * Requires the dev server running on port 5200 (npm run dev).
 * Screenshots saved to /tmp/verify_*.png
 *
 * Usage: node test/verify_renderers.cjs
 */
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  await page.goto('http://localhost:5200/');
  await page.waitForTimeout(800);

  await page.screenshot({ path: '/tmp/verify_initial.png' });
  console.log('Initial state: /tmp/verify_initial.png');

  // Check mark layout
  const debug = await page.evaluate(() => {
    const marks = document.querySelectorAll('mark');
    const canvas = document.querySelector('canvas');
    const markInfo = Array.from(marks).slice(0, 3).map(m => {
      const range = document.createRange();
      range.selectNodeContents(m);
      const rects = Array.from(range.getClientRects());
      return { text: m.textContent.slice(0, 20), rectCount: rects.length, firstRect: rects[0] };
    });
    return {
      canvasSize: canvas ? { w: canvas.width, h: canvas.height } : null,
      markCount: marks.length,
      markInfo,
    };
  });
  console.log('Canvas / mark debug:', JSON.stringify(debug, null, 2));

  // Verify each mode renders non-zero pixels
  for (const mode of ['Rectangle', 'Marker', 'Pen', 'PenScribble']) {
    await page.click(`button:has-text("${mode}")`);
    await page.waitForTimeout(400);
    const slug = mode.toLowerCase();
    await page.screenshot({ path: `/tmp/verify_${slug}.png` });
    const px = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      const ctx = canvas.getContext('2d');
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let count = 0;
      for (let i = 3; i < data.length; i += 4) if (data[i] > 0) count++;
      return count;
    });
    console.log(`${mode}: ${px} non-zero pixels → /tmp/verify_${slug}.png`);
  }

  // Probe: penScribble covers more pixels than pen underline
  await page.click('button:has-text("Pen")');
  await page.waitForTimeout(300);
  const penPx = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let count = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 0) count++;
    return count;
  });

  await page.click('button:has-text("PenScribble")');
  await page.waitForTimeout(300);
  const scribblePx = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let count = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 0) count++;
    return count;
  });
  console.log(`Scribble (${scribblePx}px) > Underline (${penPx}px): ${scribblePx > penPx}`);

  // Probe: scroll and verify scribble still renders
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/tmp/verify_penscribble_scroll.png' });
  console.log('Scroll probe: /tmp/verify_penscribble_scroll.png');

  await browser.close();
  console.log('\nDone. All screenshots in /tmp/verify_*.png');
})().catch(e => { console.error(e.message); process.exit(1); });
