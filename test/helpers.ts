import type { Page } from '@playwright/test';

export async function getRenderCount(page: Page): Promise<number> {
  return page.evaluate(() => (window as unknown as Record<string, number>).__renderCount ?? 0);
}

export async function waitForRenderAfter(page: Page, action: () => Promise<void>): Promise<void> {
  const before = await getRenderCount(page);
  await action();
  await page.waitForFunction(
    (c) => ((window as unknown as Record<string, number>).__renderCount ?? 0) > c,
    before,
  );
}

export async function getNonZeroPixelCount(page: Page): Promise<number> {
  return page.evaluate(() => {
    const canvas = document.querySelector('canvas')!;
    const ctx = canvas.getContext('2d')!;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let count = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 0) count++;
    return count;
  });
}

// Sums all alpha channel values across the canvas — more sensitive than counting non-zero pixels
// because it distinguishes between full-opacity renders (a≈102 for rectangle at 0.4) and
// the grey dimmed fill (a≈38 at 0.15 opacity), where a pixel count alone would treat both as equal.
export async function getAlphaSum(page: Page): Promise<number> {
  return page.evaluate(() => {
    const canvas = document.querySelector('canvas')!;
    const ctx = canvas.getContext('2d')!;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let sum = 0;
    for (let i = 3; i < data.length; i += 4) sum += data[i];
    return sum;
  });
}
