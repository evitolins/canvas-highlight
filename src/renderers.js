/**
 * Rendering strategies for canvas overlay highlights
 */

/**
 * Get color from a numeric hue value or use default
 * @param {number|null|undefined} hue - Hue value (0-360)
 * @param {string} defaultColor - Default fill style (e.g., 'rgba(255, 255, 0, 0.4)')
 * @param {number} defaultHue - Default hue value (0-360) if hue isn't specified
 * @param {number} saturation - Saturation percentage (default 100)
 * @param {number} lightness - Lightness percentage (default 50)
 * @param {number} alpha - Alpha/opacity (default 0.4)
 * @returns {string} Color value in HSLA
 */
function getMarkColor(
  hue,
  defaultColor,
  defaultHue = 60,
  saturation = 100,
  lightness = 50,
  alpha = 0.4,
) {
  const resolvedHue = (hue !== null && hue !== undefined) ? hue : defaultHue;
  return `hsla(${resolvedHue}, ${saturation}%, ${lightness}%, ${alpha})`;
}

/**
 * Simple rectangle renderer - draws basic filled rectangles
 */
export function renderRectangle(ctx, rects, meta) {
  const defaultColor = "rgba(255, 255, 0, 0.4)"; // Yellow fallback
  const fillColor = getMarkColor(meta?.hue, defaultColor, 60, 100, 50, 0.4); // Yellow hue is 60

  rects.forEach((rect) => {
    // Canvas is position: absolute, so convert viewport-relative to document-relative coordinates
    const x = rect.left + window.scrollX;
    const y = rect.top + window.scrollY;
    const width = rect.width;
    const height = rect.height;

    ctx.fillStyle = fillColor;
    ctx.fillRect(x, y, width, height);
  });
}

/**
 * Marker renderer - creates a more realistic highlighter effect with:
 * - Soft, feathered edges
 * - Opacity variations along the stroke
 * - Slight angle variations for hand-drawn feel
 * - Multiple overlapping strokes for depth
 */
export function renderMarker(ctx, rects, meta) {
  const baseOpacity = 0.25;

  // Get hue from meta or use default yellow (60)
  const hue = meta?.hue ?? 60;

  rects.forEach((rect) => {
    // Canvas is position: absolute, so convert viewport-relative to document-relative coordinates
    const x = rect.left + window.scrollX;
    const y = rect.top + window.scrollY;
    const width = rect.width;
    const height = rect.height;

    // Use text height and add extra padding for a taller marker effect
    const markerHeight = height * 1.3;

    // Draw 2-3 overlapping strokes with slight variations for natural look
    const strokeCount = 2 + Math.random(); // 2-3 strokes
    for (let i = 0; i < Math.floor(strokeCount); i++) {
      // Small vertical offset for each stroke (within the text bounds)
      const offsetY = y + height / 2 + (Math.random() - 0.5) * height * 0.2;
      // Slight angle for each stroke
      const angle = (Math.random() - 0.5) * 0.02;

      // Draw the main stroke with gradient for soft edges
      drawMarkerStroke(
        ctx,
        x,
        offsetY,
        width,
        markerHeight,
        angle,
        hue,
        baseOpacity,
      );
    }
  });
}

/**
 * Helper: Draw a single marker stroke with soft edges and variations
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} width - Width of the stroke
 * @param {number} height - Height of the stroke
 * @param {number} angle - Rotation angle in radians
 * @param {number} hue - Hue value (0-360)
 * @param {number} opacity - Opacity value (0-1)
 */
function drawMarkerStroke(ctx, x, y, width, height, angle, hue, opacity) {
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

  // Apply slight rotation for natural feel
  if (angle) {
    ctx.rotate(angle);
  }

  // Draw with the feathered gradient
  ctx.fillStyle = gradient;

  // Add roughness to the edges for hand-drawn feel
  const roughness = 1.5; // Increased for more vertical variation
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

  const includeDetails = true;
  if (includeDetails) {
    // Add darker caps at beginning and end for ink bleed effect (3-10% of width)
    const capWidth = width * (0.03 + Math.random() * 0.17); // Random 3-10% of width

    // Left edge cap (darker, more opaque) - reduced effect by 20%
    const leftCapGradient = ctx.createLinearGradient(
      -capWidth,
      -height / 2,
      capWidth,
      -height / 2,
    );
    leftCapGradient.addColorStop(0, `hsla(${hue}, 100%, 45%, 0)`);
    leftCapGradient.addColorStop(
      0.5,
      `hsla(${hue}, 100%, 40%, ${opacity * 0.84})`,
    );
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
    rightCapGradient.addColorStop(
      0.5,
      `hsla(${hue}, 100%, 40%, ${opacity * 0.5})`,
    );
    rightCapGradient.addColorStop(1, `hsla(${hue}, 100%, 45%, 0)`);

    ctx.fillStyle = rightCapGradient;
    ctx.fillRect(width - capWidth, -height / 2, capWidth, height);
  }

  ctx.restore();
}

/**
 * Factory that produces a pen renderer from a style config.
 * @param {Object} config
 * @param {function} config.getBaseY   - (y, height, passIndex, totalPasses) => number
 * @param {number|function} config.getAmplitude - pixels, or (height) => pixels
 * @param {number} config.frequency    - angular frequency in radians/pixel
 * @param {number} config.passCount    - number of overlapping strokes per rect
 * @param {number} config.strokeWidth
 * @param {number} config.baseOpacity
 * @param {number} config.defaultHue
 */
function createPenRenderer({
  getBaseY,
  getAmplitude,
  frequency,
  passCount,
  strokeWidth,
  baseOpacity,
  defaultHue = 240,
}) {
  return function (ctx, rects, meta) {
    const hue = meta?.hue ?? defaultHue;
    const seed = Math.random() * 10;

    rects.forEach((rect) => {
      const x = rect.left + window.scrollX;
      const y = rect.top + window.scrollY;
      const width = rect.width;
      const height = rect.height;

      ctx.strokeStyle = `hsla(${hue}, 100%, 50%, ${baseOpacity})`;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const amplitude =
        typeof getAmplitude === "function"
          ? getAmplitude(height)
          : getAmplitude;

      for (let p = 0; p < passCount; p++) {
        const passSeed = seed + p * 3.7;
        const baseY = getBaseY(y, height, p, passCount);

        ctx.beginPath();
        ctx.moveTo(x, baseY);

        for (let i = 0; i <= width; i += 2) {
          ctx.lineTo(
            x + i,
            baseY + Math.sin(i * frequency + passSeed) * amplitude,
          );
        }

        ctx.stroke();
      }
    });
  };
}

/**
 * Pen renderer - wavy underline below the text
 */
export const renderPen = createPenRenderer({
  getBaseY: (y, height) => y + height + 2,
  getAmplitude: 1.2,
  frequency: 0.05,
  passCount: 1,
  strokeWidth: 2,
  baseOpacity: 0.6,
});

/**
 * Pen scribble renderer - high-frequency waves drawn over the text,
 * spanning the full text height across multiple passes.
 */
export const renderPenScribble = createPenRenderer({
  // Distribute passes evenly across the text height so combined coverage exceeds it
  getBaseY: (y, height, p, total) =>
    y + height / 2 + (p / Math.max(total - 1, 1) - 0.5) * height * 0.5,
  // Amplitude slightly exceeds half the text height so the wave clips beyond text bounds
  getAmplitude: (height) => height * 0.32,
  frequency: 0.3,
  passCount: 5,
  strokeWidth: 1.5,
  baseOpacity: 0.45,
});
