/**
 * Rendering strategies for canvas overlay highlights
 */

export interface Rect {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

export interface RendererMeta {
  hue?: number;
}

export type Renderer = (ctx: CanvasRenderingContext2D, rects: Rect[], meta?: RendererMeta) => void;

export function shiftRects(
  rects: ArrayLike<DOMRect> | Rect[],
  offsetX: number,
  offsetY: number,
): Rect[] {
  return Array.from(rects as Rect[]).map((r) => ({
    left: r.left + offsetX,
    top: r.top + offsetY,
    width: r.width,
    height: r.height,
  }));
}

export function padRects(rects: Rect[], paddingH: number, paddingV: number): Rect[] {
  return rects.map((r) => ({
    left: r.left - paddingH,
    top: r.top - paddingV,
    width: r.width + paddingH * 2,
    height: r.height + paddingV * 2,
  }));
}

interface PenRendererConfig {
  getBaseY: (y: number, height: number, passIndex: number, totalPasses: number) => number;
  getAmplitude: number | ((height: number) => number);
  frequency: number;
  passCount: number;
  strokeWidth: number;
  baseOpacity: number;
  defaultHue?: number;
}

/**
 * Get color from a numeric hue value or use default
 * @param hue - Hue value (0-360)
 * @param defaultHue - Default hue value (0-360) if hue isn't specified
 * @param saturation - Saturation percentage (default 100)
 * @param lightness - Lightness percentage (default 50)
 * @param alpha - Alpha/opacity (default 0.4)
 * @returns Color value in HSLA
 */
function getMarkColor(
  hue: number | null | undefined,
  defaultHue = 60,
  saturation = 100,
  lightness = 50,
  alpha = 0.4,
): string {
  const resolvedHue = hue !== null && hue !== undefined ? hue : defaultHue;
  return `hsla(${resolvedHue}, ${saturation}%, ${lightness}%, ${alpha})`;
}

/**
 * Simple rectangle renderer - draws basic filled rectangles
 */
export function renderRectangle(
  ctx: CanvasRenderingContext2D,
  rects: Rect[],
  meta?: RendererMeta,
): void {
  const fillColor = getMarkColor(meta?.hue, 60, 100, 50, 0.4); // Yellow hue is 60

  padRects(rects, 3, 2).forEach((rect) => {
    ctx.fillStyle = fillColor;
    ctx.fillRect(rect.left, rect.top, rect.width, rect.height);
  });
}

/**
 * Marker renderer - creates a more realistic highlighter effect with:
 * - Soft, feathered edges
 * - Opacity variations along the stroke
 * - Slight angle variations for hand-drawn feel
 * - Multiple overlapping strokes for depth
 */
export function renderMarker(
  ctx: CanvasRenderingContext2D,
  rects: Rect[],
  meta?: RendererMeta,
): void {
  const baseOpacity = 0.35;

  // Get hue from meta or use default yellow (60)
  const hue = meta?.hue ?? 60;

  padRects(rects, 4, 0).forEach((rect) => {
    const x = rect.left;
    const y = rect.top;
    const width = rect.width;
    const height = rect.height;

    // Use text height and add extra padding for a taller marker effect
    const markerHeight = height * 1.3;

    // Draw 2-3 overlapping strokes with slight variations for natural look
    const strokeCount = Math.floor(3 * Math.random()) + 1; // 2-3 strokes
    for (let i = 0; i < strokeCount; i++) {
      // Small vertical offset for each stroke (within the text bounds)
      const offsetY = y + height / 2 + (Math.random() - 0.5) * height * 0.2;

      // Slight angle for each stroke
      const angle = (Math.random() - 0.5) * 0.03;

      // Draw the main stroke with gradient for soft edges
      drawMarkerStroke(ctx, x, offsetY, width, markerHeight, angle, hue, baseOpacity);
    }
  });
}

/**
 * Helper: Draw a single marker stroke with soft edges and variations
 */
function drawMarkerStroke(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  angle: number,
  hue: number,
  opacity: number,
): void {
  ctx.save();

  // Create gradient BEFORE translate with coordinates relative to the shape
  const gradient = ctx.createLinearGradient(0, -height / 2, 0, height / 2);

  // Feather edges by fading opacity at top and bottom using HSL
  gradient.addColorStop(0, `hsla(${hue}, 100%, 80%, 0)`);
  gradient.addColorStop(0.15, `hsla(${hue}, 100%, 80%, ${opacity})`);
  gradient.addColorStop(0.5, `hsla(${hue}, 100%, 80%, ${opacity * 1.2})`);
  gradient.addColorStop(0.85, `hsla(${hue}, 100%, 80%, ${opacity})`);
  gradient.addColorStop(1, `hsla(${hue}, 100%, 80%, 0)`);

  ctx.translate(x, y);

  // Apply slight rotation from center for natural feel
  if (angle) {
    ctx.translate(width / 2, height / 2);
    ctx.rotate(angle);
    ctx.translate(-width / 2, -height / 2);
  }

  // Draw with the feathered gradient
  ctx.fillStyle = gradient;

  // Add roughness to the edges for hand-drawn feel
  const roughness = 3.5; // Increased for more vertical variation
  const edgePointSpacing = 1.5; // More frequent sampling for jagged edges

  // Pen angle effect - varies along the stroke length
  // Higher angle at start, lower at end, creating a natural pen-angle appearance
  const penAngleStart = (Math.random() - 0.5) * height * 1.9; // Angle variation at start
  const penAngleEnd = (Math.random() - 0.5) * height * 1.9; // Different angle at end

  ctx.beginPath();
  ctx.moveTo(0, -height / 2);

  // Rough top edge with more variation and pen angle
  for (let i = 0; i <= width; i += edgePointSpacing) {
    const yVar = (Math.random() - 0.5) * roughness;
    // Interpolate pen angle from start to end
    const progress = i / width;
    const penAngle = penAngleStart + (penAngleEnd - penAngleStart) * progress;
    ctx.lineTo(i, -height / 2 + yVar + penAngle * 0.3);
  }

  // Right side - angled to favor left (pen angle)
  const rightEdgeAngle = penAngleEnd * 0.6;
  ctx.lineTo(width, height / 2 + rightEdgeAngle);

  // Rough bottom edge (reversed for closed path) with more variation and pen angle
  for (let i = width; i >= 0; i -= edgePointSpacing) {
    const yVar = (Math.random() - 0.5) * roughness;
    // Interpolate pen angle from end to start
    const progress = (width - i) / width;
    const penAngle = penAngleEnd + (penAngleStart - penAngleEnd) * progress;
    ctx.lineTo(i, height / 2 + yVar + penAngle * 0.3);
  }

  ctx.closePath();
  ctx.fill();

  // Add darker caps at beginning and end for ink bleed effect (3-10% of width)
  const capWidth = width * (0.03 + Math.random() * 0.17); // Random 3-10% of width

  // Left edge cap (darker, more opaque) - reduced effect by 20%
  const leftCapGradient = ctx.createLinearGradient(-capWidth, -height / 2, capWidth, -height / 2);
  leftCapGradient.addColorStop(0, `hsla(${hue}, 100%, 45%, 0)`);
  leftCapGradient.addColorStop(0.5, `hsla(${hue}, 100%, 40%, ${opacity * 0.84})`);
  leftCapGradient.addColorStop(1, `hsla(${hue}, 100%, 45%, 0)`);

  ctx.fillStyle = leftCapGradient;
  ctx.fillRect(0, -height / 2, capWidth, height);

  // Right edge cap (darker, more opaque) - reduced effect by 20%
  const rightCapGradient = ctx.createLinearGradient(
    width - capWidth,
    -height / 2,
    width + capWidth,
    -height / 2,
  );
  rightCapGradient.addColorStop(0, `hsla(${hue}, 100%, 45%, 0)`);
  rightCapGradient.addColorStop(0.5, `hsla(${hue}, 100%, 40%, ${opacity * 0.5})`);
  rightCapGradient.addColorStop(1, `hsla(${hue}, 100%, 45%, 0)`);

  ctx.fillStyle = rightCapGradient;
  ctx.fillRect(width - capWidth, -height / 2, capWidth, height);
  ctx.restore();
}

/**
 * Factory that produces a pen renderer from a style config.
 */
function createPenRenderer({
  getBaseY,
  getAmplitude,
  frequency,
  passCount,
  strokeWidth,
  baseOpacity,
  defaultHue = 240,
}: PenRendererConfig): Renderer {
  return function (ctx: CanvasRenderingContext2D, rects: Rect[], meta?: RendererMeta): void {
    const hue = meta?.hue ?? defaultHue;
    const seed = Math.random() * 10;

    padRects(rects, 2, 0).forEach((rect) => {
      const x = rect.left;
      const y = rect.top;
      const width = rect.width;
      const height = rect.height;

      ctx.strokeStyle = `hsla(${hue}, 100%, 50%, ${baseOpacity})`;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const amplitude = typeof getAmplitude === 'function' ? getAmplitude(height) : getAmplitude;

      for (let p = 0; p < passCount; p++) {
        const passSeed = seed + p * 3.7;
        const baseY = getBaseY(y, height, p, passCount);

        ctx.beginPath();
        ctx.moveTo(x, baseY);

        for (let i = 0; i <= width; i += 2) {
          ctx.lineTo(x + i, baseY + Math.sin(i * frequency + passSeed) * amplitude);
        }

        ctx.stroke();
      }
    });
  };
}

/**
 * Pen renderer - wavy underline below the text
 */
export const renderPen: Renderer = createPenRenderer({
  getBaseY: (y, height) => y + height + 2,
  getAmplitude: 1.2,
  frequency: 0.05,
  passCount: 1,
  strokeWidth: 2,
  baseOpacity: 0.6,
});

/**
 * Pen scribble renderer - irregular overlapping waves drawn over the text.
 * Combines three incommensurable frequencies so the waveform never repeats visibly.
 * A low-frequency drift wave offsets the baseline of each pass to mimic the gentle
 * vertical wander of a moving hand.
 */
export function renderPenScribble(
  ctx: CanvasRenderingContext2D,
  rects: Rect[],
  meta?: RendererMeta,
): void {
  const hue = meta?.hue ?? 240;
  const frequency = 4;
  // Step adapts to frequency so curves always have enough samples per cycle
  const step = Math.max(1, 2 / frequency);

  ctx.strokeStyle = `hsla(${hue}, 100%, 50%, 0.45)`;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  padRects(rects, 2, 0).forEach((rect) => {
    const { left: x, top: y, width, height } = rect;

    const passCount = 3;
    const seed = Math.random() * 100;
    // Low-frequency drift wave simulates the gentle vertical wander of a moving hand
    const driftFreq = 0.008;
    const driftAmplitude = height * 0.08;
    const driftPhase = Math.random() * Math.PI * 2;

    for (let p = 0; p < passCount; p++) {
      const passSeed = seed + p * 37.3;
      const passOffset = (p / Math.max(passCount - 1, 1) - 0.5) * height * 0.5;
      const amplitude = height * 0.32;

      // Slightly randomize start/end x per pass to avoid a uniform left/right edge
      const startX = x + (Math.random() - 0.5) * 6;
      const endX = x + width + (Math.random() - 0.5) * 6;
      const passWidth = endX - startX;

      ctx.beginPath();

      for (let i = 0; i <= passWidth; i += step) {
        // Three incommensurable frequencies produce a quasi-random waveform
        const yOffset =
          Math.sin(i * 0.28 * frequency + passSeed) * amplitude * 0.55 +
          Math.sin(i * 0.17 * frequency + passSeed * 1.9) * amplitude * 0.3 +
          Math.sin(i * 0.43 * frequency + passSeed * 0.7) * amplitude * 0.15;

        const drift = Math.sin(i * driftFreq + driftPhase) * driftAmplitude;
        const baseY = y + height / 2 + passOffset + drift;

        // First lineTo on an empty path acts as moveTo per the Canvas 2D spec
        ctx.lineTo(startX + i, baseY + yOffset);
      }

      ctx.stroke();
    }
  });
}
