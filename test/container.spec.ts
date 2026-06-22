import { test, expect } from '@playwright/test';
import { waitForRenderAfter, getNonZeroPixelCount } from './helpers';

type TestAPI = {
  setContainerMode: (v: boolean) => void;
  setControlledMode: (v: boolean) => void;
  setHighlights: (h: unknown[]) => void;
};

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => ((window as unknown as Record<string, number>).__renderCount ?? 0) > 0);
});

test('container mode sizes canvas to container scrollWidth and scrollHeight', async ({ page }) => {
  await waitForRenderAfter(page, () =>
    page.evaluate(() => {
      (window as unknown as { __testAPI: TestAPI }).__testAPI.setContainerMode(true);
    }),
  );

  const dims = await page.evaluate(() => {
    const canvas = document.querySelector('canvas')!;
    const container = document.querySelector('[data-testid="content-container"]')!;
    return {
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      containerScrollWidth: container.scrollWidth,
      containerScrollHeight: container.scrollHeight,
    };
  });

  expect(dims.canvasWidth).toBe(dims.containerScrollWidth);
  expect(dims.canvasHeight).toBe(dims.containerScrollHeight);
});

test('container mode canvas is smaller than the full document', async ({ page }) => {
  const documentScrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);

  await waitForRenderAfter(page, () =>
    page.evaluate(() => {
      (window as unknown as { __testAPI: TestAPI }).__testAPI.setContainerMode(true);
    }),
  );

  const canvasHeight = await page.evaluate(() => document.querySelector('canvas')!.height);
  expect(canvasHeight).toBeLessThan(documentScrollHeight);
});

test('container mode renders non-zero pixels (auto mode)', async ({ page }) => {
  await waitForRenderAfter(page, () =>
    page.evaluate(() => {
      (window as unknown as { __testAPI: TestAPI }).__testAPI.setContainerMode(true);
    }),
  );

  const px = await getNonZeroPixelCount(page);
  expect(px).toBeGreaterThan(0);
});

test('container mode renders non-zero pixels in controlled mode', async ({ page }) => {
  const rects = await page.evaluate(() => {
    const mark = document.querySelector('[data-testid="content-container"] mark')!;
    const range = document.createRange();
    range.selectNodeContents(mark);
    return Array.from(range.getClientRects()).map((r) => ({
      left: r.left,
      top: r.top,
      width: r.width,
      height: r.height,
    }));
  });

  await waitForRenderAfter(page, () =>
    page.evaluate((r) => {
      const api = (window as unknown as { __testAPI: TestAPI }).__testAPI;
      api.setContainerMode(true);
      api.setControlledMode(true);
      api.setHighlights([{ rects: r }]);
    }, rects),
  );

  const px = await getNonZeroPixelCount(page);
  expect(px).toBeGreaterThan(0);
});

test('switching back from container mode restores full-document canvas', async ({ page }) => {
  await waitForRenderAfter(page, () =>
    page.evaluate(() => {
      (window as unknown as { __testAPI: TestAPI }).__testAPI.setContainerMode(true);
    }),
  );

  const containerCanvasHeight = await page.evaluate(() => document.querySelector('canvas')!.height);

  await waitForRenderAfter(page, () =>
    page.evaluate(() => {
      (window as unknown as { __testAPI: TestAPI }).__testAPI.setContainerMode(false);
    }),
  );

  const restoredCanvasHeight = await page.evaluate(() => document.querySelector('canvas')!.height);
  expect(restoredCanvasHeight).toBeGreaterThan(containerCanvasHeight);
});
