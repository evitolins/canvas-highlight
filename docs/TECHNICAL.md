# Technical Reference

## Overview

`canvasOverlayPOC` renders decorative highlights over HTML `<mark>` elements using a full-document `<canvas>` overlay. The canvas sits absolutely positioned at `z-index: 1000` with `pointer-events: none`, so it is purely visual and does not interfere with page interaction.

## Core Component: `CanvasOverlay` (`src/CanvasOverlay.jsx`)

**Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `renderMode` | `string` | `'rectangle'` | Selects the highlight rendering style |

**Behavior:**
- Mounts a `<canvas>` sized to `window.innerWidth × document.scrollHeight` (covers the full document)
- Queries all `<mark>` elements in the DOM
- Uses the **Range API** (`range.getClientRects()`) to get per-line bounding rects, correctly handling text that wraps across multiple lines
- Converts viewport-relative rects to document-relative coordinates via `window.scrollX/Y`
- Redraws on `window resize` and any DOM mutation (via `MutationObserver` on `document.body`)

## Renderers (`src/renderers.js`)

All renderers share the signature `(ctx, rects, markElement)` and read an optional `data-hue` attribute (HSL hue, 0–360) from the `<mark>` element for color customization.

| Mode | Default Hue | Description |
|---|---|---|
| `rectangle` | 60 (yellow) | Simple filled `fillRect` with semi-transparent color |
| `marker` | 60 (yellow) | Multi-stroke effect with feathered vertical gradient, jagged path edges, slight random rotation, and ink-bleed caps at stroke ends |
| `pen` | 240 (blue) | Single wavy underline below the text (low-frequency sine wave) |
| `penScribble` | 240 (blue) | 5 overlapping high-frequency sine wave passes spanning the text height, simulating a scribble-over effect |

### Renderer Architecture

`renderPen` and `renderPenScribble` are both produced by `createPenRenderer`, a factory function that accepts a config object:

```js
createPenRenderer({
  getBaseY,     // (y, height, passIndex, totalPasses) => number
  getAmplitude, // pixels, or (height) => pixels
  frequency,    // angular frequency in radians/pixel
  passCount,    // number of overlapping strokes per rect
  strokeWidth,
  baseOpacity,
  defaultHue,
})
```

`renderMarker` uses `drawMarkerStroke` internally, which applies canvas `save/restore`, linear gradients for feathering, and a randomized jagged path for organic edge variation.

### Color Resolution

All renderers resolve color via the `data-hue` attribute on the `<mark>` element:

```html
<mark data-hue="120">Green highlight</mark>
<mark data-hue="0">Red highlight</mark>
```

If `data-hue` is absent, each renderer falls back to its default hue. Colors are expressed as `hsla(hue, 100%, 50%, alpha)`.

## Integration

Drop `<CanvasOverlay>` anywhere near the root of the React tree:

```jsx
import { CanvasOverlay } from './CanvasOverlay';

function MyPage() {
  return (
    <>
      <CanvasOverlay renderMode="marker" />
      <div>
        <p>Your content with <mark>marked</mark> text here.</p>
      </div>
    </>
  );
}
```

Highlights are driven purely by `<mark>` elements in the DOM — no React state or props are needed on the marked content itself. No external dependencies beyond React.
