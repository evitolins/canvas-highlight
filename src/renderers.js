/**
 * Rendering strategies for canvas overlay highlights
 */

/**
 * Simple rectangle renderer - draws basic filled rectangles
 */
export function renderRectangle(ctx, rects) {
  rects.forEach((rect) => {
    // Canvas is position: absolute, so convert viewport-relative to document-relative coordinates
    const x = rect.left + window.scrollX;
    const y = rect.top + window.scrollY;
    const width = rect.width;
    const height = rect.height;

    ctx.fillStyle = 'rgba(255, 255, 0, 0.4)';
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
export function renderMarker(ctx, rects) {
  const markerColor = { r: 185, g: 255, b: 20 }; // Yellow
  const baseOpacity = 0.25;

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
      drawMarkerStroke(ctx, x, offsetY, width, markerHeight, angle, markerColor, baseOpacity);
    }
  });
}

/**
 * Helper: Draw a single marker stroke with soft edges and variations
 */
function drawMarkerStroke(ctx, x, y, width, height, angle, color, opacity) {
  ctx.save();

  // Create gradient BEFORE translate with coordinates relative to the shape
  const gradient = ctx.createLinearGradient(0, -height / 2, 0, height / 2);
  const rgba = `rgba(${color.r}, ${color.g}, ${color.b}`;

  // Feather edges by fading opacity at top and bottom
  gradient.addColorStop(0, `${rgba}, 0)`);
  gradient.addColorStop(0.15, `${rgba}, ${opacity})`);
  gradient.addColorStop(0.5, `${rgba}, ${opacity * 1.2})`);
  gradient.addColorStop(0.85, `${rgba}, ${opacity})`);
  gradient.addColorStop(1, `${rgba}, 0)`);

  ctx.translate(x, y);

  // Apply slight rotation for natural feel
  if (angle) {
    ctx.rotate(angle);
  }

  // Draw with the feathered gradient
  ctx.fillStyle = gradient;

  // Add roughness to the edges for hand-drawn feel
  const roughness = 2;
  ctx.beginPath();
  ctx.moveTo(0, -height / 2);

  // Rough top edge
  for (let i = 0; i <= width; i += 3) {
    const yVar = (Math.random() - 0.5) * roughness;
    ctx.lineTo(i, -height / 2 + yVar);
  }

  // Right side
  ctx.lineTo(width, height / 2);

  // Rough bottom edge (reversed for closed path)
  for (let i = width; i >= 0; i -= 3) {
    const yVar = (Math.random() - 0.5) * roughness;
    ctx.lineTo(i, height / 2 + yVar);
  }

  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * Pen/calligraphy renderer - draws with variable stroke width
 * based on direction, simulating a calligraphy pen
 */
export function renderPen(ctx, rects) {
  const penColor = { r: 0, g: 0, b: 220 }; // Black
  const baseOpacity = 0.6;
  const strokeWidth = 2;

  rects.forEach((rect) => {
    // Canvas is position: absolute, so convert viewport-relative to document-relative coordinates
    const x = rect.left + window.scrollX;
    const y = rect.top + window.scrollY;
    const width = rect.width;
    const height = rect.height;

    // Draw underline-style
    ctx.strokeStyle = `rgba(${penColor.r}, ${penColor.g}, ${penColor.b}, ${baseOpacity})`;
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
