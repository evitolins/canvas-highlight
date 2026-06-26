import { test, expect, type Page } from '@playwright/test';
import { waitForRenderAfter, getAlphaSum } from './helpers';

type TestAPI = {
  setControlledMode: (v: boolean) => void;
  setHighlights: (h: unknown[]) => void;
};

type MarkRects = { left: number; top: number; width: number; height: number }[];

async function getTwoMarkRects(page: Page): Promise<[MarkRects, MarkRects]> {
  return page.evaluate(() => {
    const marks = document.querySelectorAll('mark');
    return [marks[0], marks[1]].map((mark) => {
      const range = document.createRange();
      range.selectNodeContents(mark);
      return Array.from(range.getClientRects()).map((r) => ({
        left: r.left,
        top: r.top,
        width: r.width,
        height: r.height,
      }));
    }) as [MarkRects, MarkRects];
  });
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(
    () => ((window as unknown as Record<string, number>).__renderCount ?? 0) > 0,
  );
});

test('inactive highlight dims to lower-alpha grey when another is active', async ({ page }) => {
  const [rects1, rects2] = await getTwoMarkRects(page);

  // Baseline: both highlights render at full opacity (no active flags → anyActive=false)
  await waitForRenderAfter(page, () =>
    page.evaluate(([r1, r2]) => {
      const api = (window as unknown as { __testAPI: TestAPI }).__testAPI;
      api.setControlledMode(true);
      api.setHighlights([
        { rects: r1, hue: 200 },
        { rects: r2, hue: 60 },
      ]);
    }, [rects1, rects2]),
  );
  const baselineAlpha = await getAlphaSum(page);

  // One active, one not: the inactive highlight switches from its normal fill (0.4 opacity)
  // to the dimmed grey fill (0.15 opacity), so total canvas alpha sum should drop.
  await waitForRenderAfter(page, () =>
    page.evaluate(([r1, r2]) => {
      (window as unknown as { __testAPI: TestAPI }).__testAPI.setHighlights([
        { rects: r1, hue: 200, active: true },
        { rects: r2, hue: 60, active: false },
      ]);
    }, [rects1, rects2]),
  );
  const dimmedAlpha = await getAlphaSum(page);

  expect(dimmedAlpha).toBeLessThan(baselineAlpha * 0.9);
});

test('no dimming when no highlights carry an active flag', async ({ page }) => {
  const [rects1, rects2] = await getTwoMarkRects(page);

  await waitForRenderAfter(page, () =>
    page.evaluate(([r1, r2]) => {
      const api = (window as unknown as { __testAPI: TestAPI }).__testAPI;
      api.setControlledMode(true);
      api.setHighlights([
        { rects: r1, hue: 200 },
        { rects: r2, hue: 60 },
      ]);
    }, [rects1, rects2]),
  );
  const noFlagAlpha = await getAlphaSum(page);

  // Explicit active:false on every highlight also means anyActive=false — no dimming
  await waitForRenderAfter(page, () =>
    page.evaluate(([r1, r2]) => {
      (window as unknown as { __testAPI: TestAPI }).__testAPI.setHighlights([
        { rects: r1, hue: 200, active: false },
        { rects: r2, hue: 60, active: false },
      ]);
    }, [rects1, rects2]),
  );
  const allFalseAlpha = await getAlphaSum(page);

  expect(Math.abs(allFalseAlpha - noFlagAlpha)).toBeLessThan(noFlagAlpha * 0.05);
});

test('no dimming when all highlights are active', async ({ page }) => {
  const [rects1, rects2] = await getTwoMarkRects(page);

  await waitForRenderAfter(page, () =>
    page.evaluate(([r1, r2]) => {
      const api = (window as unknown as { __testAPI: TestAPI }).__testAPI;
      api.setControlledMode(true);
      api.setHighlights([
        { rects: r1, hue: 200 },
        { rects: r2, hue: 60 },
      ]);
    }, [rects1, rects2]),
  );
  const baselineAlpha = await getAlphaSum(page);

  // When every highlight is active, none qualify as inactive — all render at full opacity
  await waitForRenderAfter(page, () =>
    page.evaluate(([r1, r2]) => {
      (window as unknown as { __testAPI: TestAPI }).__testAPI.setHighlights([
        { rects: r1, hue: 200, active: true },
        { rects: r2, hue: 60, active: true },
      ]);
    }, [rects1, rects2]),
  );
  const allActiveAlpha = await getAlphaSum(page);

  expect(Math.abs(allActiveAlpha - baselineAlpha)).toBeLessThan(baselineAlpha * 0.05);
});

test('single highlight with active:true renders at full intensity', async ({ page }) => {
  const [rects1] = await getTwoMarkRects(page);

  await waitForRenderAfter(page, () =>
    page.evaluate((r1) => {
      const api = (window as unknown as { __testAPI: TestAPI }).__testAPI;
      api.setControlledMode(true);
      api.setHighlights([{ rects: r1, hue: 200 }]);
    }, rects1),
  );
  const noFlagAlpha = await getAlphaSum(page);

  // A lone active:true highlight has anyActive=true but !active=false, so it renders normally
  await waitForRenderAfter(page, () =>
    page.evaluate((r1) => {
      (window as unknown as { __testAPI: TestAPI }).__testAPI.setHighlights([
        { rects: r1, hue: 200, active: true },
      ]);
    }, rects1),
  );
  const singleActiveAlpha = await getAlphaSum(page);

  expect(Math.abs(singleActiveAlpha - noFlagAlpha)).toBeLessThan(noFlagAlpha * 0.05);
});
