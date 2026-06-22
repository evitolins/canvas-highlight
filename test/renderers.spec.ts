import { test, expect, type Page } from '@playwright/test';

async function getRenderCount(page: Page): Promise<number> {
  return page.evaluate(() => (window as unknown as Record<string, number>).__renderCount ?? 0);
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

async function waitForRenderAfter(page: Page, action: () => Promise<void>): Promise<void> {
  const before = await getRenderCount(page);
  await action();
  await page.waitForFunction(
    (c) => ((window as unknown as Record<string, number>).__renderCount ?? 0) > c,
    before,
  );
}

async function switchMode(page: Page, mode: string): Promise<void> {
  await waitForRenderAfter(page, () =>
    page.getByRole('button', { name: mode, exact: true }).click(),
  );
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  // Wait for the initial draw to complete
  await page.waitForFunction(() => ((window as unknown as Record<string, number>).__renderCount ?? 0) > 0);
});

test('rectangle mode renders non-zero pixels', async ({ page }) => {
  // Rectangle is the default mode — no switch needed
  const px = await getNonZeroPixelCount(page);
  expect(px).toBeGreaterThan(0);
});

test('marker mode renders non-zero pixels', async ({ page }) => {
  await switchMode(page, 'Marker');
  const px = await getNonZeroPixelCount(page);
  expect(px).toBeGreaterThan(0);
});

test('pen mode renders non-zero pixels', async ({ page }) => {
  await switchMode(page, 'Pen');
  const px = await getNonZeroPixelCount(page);
  expect(px).toBeGreaterThan(0);
});

test('penScribble mode renders non-zero pixels', async ({ page }) => {
  await switchMode(page, 'PenScribble');
  const px = await getNonZeroPixelCount(page);
  expect(px).toBeGreaterThan(0);
});

test('penScribble covers more pixels than pen underline', async ({ page }) => {
  await switchMode(page, 'Pen');
  const penPx = await getNonZeroPixelCount(page);

  await switchMode(page, 'PenScribble');
  const scribblePx = await getNonZeroPixelCount(page);

  expect(scribblePx).toBeGreaterThan(penPx);
});
