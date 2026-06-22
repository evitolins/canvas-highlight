import { test, expect, type Page } from '@playwright/test';

interface HighlightRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface HighlightDescriptor {
  rects: HighlightRect[];
  hue?: number;
}

type TestAPI = { setControlledMode: (v: boolean) => void; setHighlights: (h: unknown[]) => void };

async function getRenderCount(page: Page): Promise<number> {
  return page.evaluate(() => (window as unknown as Record<string, number>).__renderCount ?? 0);
}

async function waitForRenderAfter(page: Page, action: () => Promise<void>): Promise<void> {
  const before = await getRenderCount(page);
  await action();
  await page.waitForFunction(
    (c) => ((window as unknown as Record<string, number>).__renderCount ?? 0) > c,
    before,
  );
}

async function getNonZeroPixelCount(page: Page): Promise<number> {
  return page.evaluate(() => {
    const canvas = document.querySelector('canvas')!;
    const ctx = canvas.getContext('2d')!;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let count = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 0) count++;
    return count;
  });
}

async function extractMarkHighlights(page: Page): Promise<HighlightDescriptor[]> {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('mark')).map((mark) => {
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
    }),
  );
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  // Wait for the initial draw to complete (rectangle mode by default)
  await page.waitForFunction(() => ((window as unknown as Record<string, number>).__renderCount ?? 0) > 0);
});

test('auto mode renders non-zero pixels', async ({ page }) => {
  const px = await getNonZeroPixelCount(page);
  expect(px).toBeGreaterThan(0);
});

test('controlled mode with precomputed rects matches auto mode pixel count', async ({ page }) => {
  const autoPixels = await getNonZeroPixelCount(page);
  const highlights = await extractMarkHighlights(page);

  await waitForRenderAfter(page, () =>
    page.evaluate((hl) => {
      const api = (window as unknown as { __testAPI: TestAPI }).__testAPI;
      api.setControlledMode(true);
      api.setHighlights(hl);
    }, highlights),
  );

  const controlledPixels = await getNonZeroPixelCount(page);
  expect(controlledPixels).toBeGreaterThan(0);

  const tolerance = Math.ceil(autoPixels * 0.01);
  expect(Math.abs(controlledPixels - autoPixels)).toBeLessThanOrEqual(tolerance);
});

test('highlights=[] renders nothing even with mark elements in DOM', async ({ page }) => {
  await waitForRenderAfter(page, () =>
    page.evaluate(() => {
      const api = (window as unknown as { __testAPI: TestAPI }).__testAPI;
      api.setControlledMode(true);
      api.setHighlights([]);
    }),
  );

  const px = await getNonZeroPixelCount(page);
  expect(px).toBe(0);
});

test('returning to auto mode re-enables mark rendering', async ({ page }) => {
  const autoPixels = await getNonZeroPixelCount(page);

  await waitForRenderAfter(page, () =>
    page.evaluate(() => {
      const api = (window as unknown as { __testAPI: TestAPI }).__testAPI;
      api.setControlledMode(true);
      api.setHighlights([]);
    }),
  );

  await waitForRenderAfter(page, () =>
    page.evaluate(() => {
      const api = (window as unknown as { __testAPI: TestAPI }).__testAPI;
      api.setControlledMode(false);
    }),
  );

  const restoredPixels = await getNonZeroPixelCount(page);
  expect(restoredPixels).toBeGreaterThan(0);

  const tolerance = Math.ceil(autoPixels * 0.01);
  expect(Math.abs(restoredPixels - autoPixels)).toBeLessThanOrEqual(tolerance);
});
