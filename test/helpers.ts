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

// Waits until the first canvas in the DOM has at least one non-transparent pixel.
// More reliable than checking __renderCount alone, which can fire on a render that
// clears the canvas before the subsequent draw completes.
export async function waitForCanvasPixels(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas || canvas.width === 0 || canvas.height === 0) return false;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 3; i < data.length; i += 4) if (data[i] > 0) return true;
    return false;
  });
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
