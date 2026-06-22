import { test, expect, type Page } from '@playwright/test';
import { waitForRenderAfter, getNonZeroPixelCount } from './helpers';

type TestAPI = {
  setControlledMode: (v: boolean) => void;
  setHighlights: (h: unknown[]) => void;
};

async function getBlueOutlinePixelCount(page: Page): Promise<number> {
  return page.evaluate(() => {
    const canvas = document.querySelector('canvas')!;
    const ctx = canvas.getContext('2d')!;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let count = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], b = data[i + 2], a = data[i + 3];
      // renderActiveOutline uses rgba(0, 127, 212, 0.9) → raw canvas pixel: r≈0, b≈212, a≈230
      if (b > 180 && r < 20 && a > 100) count++;
    }
    return count;
  });
}

async function firstMarkRects(page: Page) {
  return page.evaluate(() => {
    const mark = document.querySelector('mark')!;
    const range = document.createRange();
    range.selectNodeContents(mark);
    return Array.from(range.getClientRects()).map((r) => ({
      left: r.left,
      top: r.top,
      width: r.width,
      height: r.height,
    }));
  });
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => ((window as unknown as Record<string, number>).__renderCount ?? 0) > 0);
});

test('active highlight adds more pixels than the same highlight without active', async ({ page }) => {
  const rects = await firstMarkRects(page);

  await waitForRenderAfter(page, () =>
    page.evaluate((r) => {
      const api = (window as unknown as { __testAPI: TestAPI }).__testAPI;
      api.setControlledMode(true);
      api.setHighlights([{ rects: r }]);
    }, rects),
  );
  const inactivePixels = await getNonZeroPixelCount(page);

  await waitForRenderAfter(page, () =>
    page.evaluate((r) => {
      (window as unknown as { __testAPI: TestAPI }).__testAPI.setHighlights([{ rects: r, active: true }]);
    }, rects),
  );
  const activePixels = await getNonZeroPixelCount(page);

  expect(activePixels).toBeGreaterThan(inactivePixels);
});

test('active highlight renders blue outline pixels', async ({ page }) => {
  const rects = await firstMarkRects(page);

  await waitForRenderAfter(page, () =>
    page.evaluate((r) => {
      const api = (window as unknown as { __testAPI: TestAPI }).__testAPI;
      api.setControlledMode(true);
      api.setHighlights([{ rects: r, active: true }]);
    }, rects),
  );

  const bluePixels = await getBlueOutlinePixelCount(page);
  expect(bluePixels).toBeGreaterThan(0);
});

test('non-active highlight has no blue outline pixels', async ({ page }) => {
  const rects = await firstMarkRects(page);

  await waitForRenderAfter(page, () =>
    page.evaluate((r) => {
      const api = (window as unknown as { __testAPI: TestAPI }).__testAPI;
      api.setControlledMode(true);
      api.setHighlights([{ rects: r }]);
    }, rects),
  );

  const bluePixels = await getBlueOutlinePixelCount(page);
  expect(bluePixels).toBe(0);
});

test('only highlights with active:true get an outline when mixed', async ({ page }) => {
  const rects = await firstMarkRects(page);

  // Without any active flags: no blue pixels
  await waitForRenderAfter(page, () =>
    page.evaluate((r) => {
      const api = (window as unknown as { __testAPI: TestAPI }).__testAPI;
      api.setControlledMode(true);
      api.setHighlights([{ rects: r }, { rects: r, hue: 120 }]);
    }, rects),
  );
  expect(await getBlueOutlinePixelCount(page)).toBe(0);

  // Mark one as active: blue pixels should appear
  await waitForRenderAfter(page, () =>
    page.evaluate((r) => {
      (window as unknown as { __testAPI: TestAPI }).__testAPI.setHighlights([
        { rects: r, active: true },
        { rects: r, hue: 120 },
      ]);
    }, rects),
  );
  expect(await getBlueOutlinePixelCount(page)).toBeGreaterThan(0);
});
