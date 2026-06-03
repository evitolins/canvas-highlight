/**
 * Rendering strategies for canvas overlay highlights
 */

/**
 * Get color from mark element's data-hue attribute or use default color
 * @param {HTMLElement} mark - The mark element
 * @param {string} defaultColor - Default fill style (e.g., 'rgba(255, 255, 0, 0.4)')
 * @param {number} defaultHue - Default hue value (0-360) if data-hue isn't specified
 * @param {number} saturation - Saturation percentage (default 100)
 * @param {number} lightness - Lightness percentage (default 50)
 * @param {number} alpha - Alpha/opacity (default 0.4)
 * @returns {string} Color value in HSL or the default color
 */
function getMarkColor(mark, defaultColor, defaultHue = 60, saturation = 100, lightness = 50, alpha = 0.4) {
  const hueAttr = mark?.getAttribute('data-hue');
  const hue = hueAttr !== null && hueAttr !== undefined && hueAttr !== '' ? parseFloat(hueAttr) : defaultHue;
  return `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
}

/**
 * Simple rectangle renderer - draws basic filled rectangles
 */
export function renderRectangle(ctx, rects, mark) {
  const defaultColor = 'rgba(255, 255, 0, 0.4)'; // Yellow fallback
  const fillColor = getMarkColor(mark, defaultColor, 60, 100, 50, 0.4); // Yellow hue is 60

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
export function renderMarker(ctx, rects, mark) {
  const baseOpacity = 0.25;

  // Get hue from mark or use default yellow (60)
  const hueAttr = mark?.getAttribute('data-hue');
  const hue = hueAttr !== null && hueAttr !== undefined && hueAttr !== '' ? parseFloat(hueAttr) : 60;

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
      drawMarkerStroke(ctx, x, offsetY, width, markerHeight, angle, hue, baseOpacity);
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
  gradient.addColorStop(0, `hsla(${hue}, 100%, 50%, 0)`);
  gradient.addColorStop(0.15, `hsla(${hue}, 100%, 50%, ${opacity})`);
  gradient.addColorStop(0.5, `hsla(${hue}, 100%, 50%, ${opacity * 1.2})`);
  gradient.addColorStop(0.85, `hsla(${hue}, 100%, 50%, ${opacity})`);
  gradient.addColorStop(1, `hsla(${hue}, 100%, 50%, 0)`);

  ctx.translate(x, y);

  // Apply slight rotation for natural feel
  if (angle) {
    ctx.rotate(angle);
  }

  // Draw with the feathered gradient
  ctx.fillStyle = gradient;

  // Add roughness to the edges for hand-drawn feel
  const roughness = 3.5; // Increased for more vertical variation
  const edgePointSpacing = 1.5; // More frequent sampling for jagged edges

  ctx.beginPath();
  ctx.moveTo(0, -height / 2);

  // Rough top edge with more variation
  for (let i = 0; i <= width; i += edgePointSpacing) {
    const yVar = (Math.random() - 0.5) * roughness;
    ctx.lineTo(i, -height / 2 + yVar);
  }

  // Right side
  ctx.lineTo(width, height / 2);

  // Rough bottom edge (reversed for closed path) with more variation
  for (let i = width; i >= 0; i -= edgePointSpacing) {
    const yVar = (Math.random() - 0.5) * roughness;
    ctx.lineTo(i, height / 2 + yVar);
  }

  ctx.closePath();
  ctx.fill();

  const includeDetails = false;
  if (includeDetails) {
    // Add darker caps at beginning and end for ink bleed effect (3-10% of width)
    const capWidth = width * (0.03 + Math.random() * 0.17); // Random 3-10% of width

    // Left edge cap (darker, more opaque) - reduced effect by 20%
    const leftCapGradient = ctx.createLinearGradient(-capWidth, -height / 2, capWidth, -height / 2);
    leftCapGradient.addColorStop(0, `hsla(${hue}, 100%, 45%, 0)`);
    leftCapGradient.addColorStop(0.5, `hsla(${hue}, 100%, 40%, ${opacity * 1.04})`);
    leftCapGradient.addColorStop(1, `hsla(${hue}, 100%, 45%, 0)`);

    ctx.fillStyle = leftCapGradient;
    ctx.fillRect(0, -height / 2, capWidth, height);

    // Right edge cap (darker, more opaque) - reduced effect by 20%
    const rightCapGradient = ctx.createLinearGradient(width - capWidth, -height / 2, width + capWidth, -height / 2);
    rightCapGradient.addColorStop(0, `hsla(${hue}, 100%, 45%, 0)`);
    rightCapGradient.addColorStop(0.5, `hsla(${hue}, 100%, 40%, ${opacity * 1.04})`);
    rightCapGradient.addColorStop(1, `hsla(${hue}, 100%, 45%, 0)`);

    ctx.fillStyle = rightCapGradient;
    ctx.fillRect(width - capWidth, -height / 2, capWidth, height);
  }

  ctx.restore();
}

/**
 * Pen/calligraphy renderer - draws with variable stroke width
 * based on direction, simulating a calligraphy pen
 */
export function renderPen(ctx, rects, mark) {
  const baseOpacity = 0.6;
  const strokeWidth = 2;

  // Get hue from mark or use default blue (240)
  const hueAttr = mark?.getAttribute('data-hue');
  const hue = hueAttr !== null && hueAttr !== undefined && hueAttr !== '' ? parseFloat(hueAttr) : 240;

  rects.forEach((rect) => {
    // Canvas is position: absolute, so convert viewport-relative to document-relative coordinates
    const x = rect.left + window.scrollX;
    const y = rect.top + window.scrollY;
    const width = rect.width;
    const height = rect.height;

    // Draw underline-style with HSL color
    ctx.strokeStyle = `hsla(${hue}, 100%, 50%, ${baseOpacity})`;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Wavy underline
    ctx.beginPath();
    ctx.moveTo(x, y + height + 2);

    const waveAmplitude = 1.5;
    const waveFrequency = 0.05;
    for (let i = 0; i <= width; i += 2) {
      const waveOffset = Math.sin(i * waveFrequency) * waveAmplitude;
      ctx.lineTo(x + i, y + height + 2 + waveOffset);
    }

    ctx.stroke();
  });
}
