import { test, expect, type Page } from '@playwright/test';
import { waitForRenderAfter, getNonZeroPixelCount } from './helpers';

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
