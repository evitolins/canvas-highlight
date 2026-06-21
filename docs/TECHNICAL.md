# Technical Reference

## Overview

`canvasOverlayPOC` renders decorative highlights over HTML `<mark>` elements using a full-document `<canvas>` overlay. The canvas sits absolutely positioned at `z-index: 1000` with `pointer-events: none`, so it is purely visual and does not interfere with page interaction.

## Core Component: `CanvasOverlay` (`src/CanvasOverlay.jsx`)

**Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `renderMode` | `string` | `'rectangle'` | Selects the highlight rendering style |
| `highlights` | `Array \| undefined` | `undefined` | Controlled mode: array of `{ range?, rects?, hue? }` descriptors. When provided, `<mark>` scanning and `MutationObserver` are disabled. |

**Highlight descriptor shape (`highlights` prop):**

| Field | Type | Description |
|---|---|---|
| `range` | `Range` | Live DOM Range — rects re-queried on every draw, so highlights update correctly on resize |
| `rects` | `Array<{left,top,width,height}>` | Precomputed rects — fast, but caller must recompute on layout changes |
| `hue` | `number` | HSL hue (0–360). Falls back to each renderer's default if omitted |

Exactly one of `range` or `rects` must be present per descriptor.

**Behavior:**

*Auto mode* (`highlights === undefined`):
- Queries all `<mark>` elements, uses the Range API to get per-line bounding rects
- Reads `data-hue` attribute from each `<mark>` for color
- `MutationObserver` on `document.body` triggers redraws on DOM changes

*Controlled mode* (`highlights` is an array):
- Iterates the `highlights` array; resolves Range → rects on each draw if `range` is supplied
- `<mark>` elements in the DOM are ignored
- No `MutationObserver` — redraws are driven by React re-renders when `highlights` changes

Both modes redraw on `window resize`. The canvas is `position: absolute`, sized to `window.innerWidth × document.scrollHeight`, and scrolls naturally with the page.

## Renderers (`src/renderers.js`)

All renderers share the signature `(ctx, rects, meta)` where `meta` is a plain object `{ hue?: number }`. Color is resolved from `meta.hue`; if absent, each renderer uses its default hue.

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

All renderers call the internal `getMarkColor(hue, defaultColor, defaultHue, saturation, lightness, alpha)` helper, which resolves to `hsla(resolvedHue, sat%, light%, alpha)`. `hue` comes from `meta?.hue`; if `null`/`undefined`, `defaultHue` is used.

In auto mode, `CanvasOverlay` reads `data-hue` from each `<mark>` element and passes the parsed float as `meta.hue`. In controlled mode, the caller sets `hue` directly on each highlight descriptor.

## Integration

### Auto mode

Drop `<CanvasOverlay>` anywhere near the root of the React tree. No state management required at the call site.

```jsx
import { CanvasOverlay } from './CanvasOverlay';

function MyPage() {
  return (
    <>
      <CanvasOverlay renderMode="marker" />
      <p>Your content with <mark data-hue="120">marked</mark> text here.</p>
    </>
  );
}
```

### Controlled mode

Manage highlight state in the parent and pass it as the `highlights` prop. When `highlights` is defined (including an empty array), `<mark>` scanning is fully bypassed.

```jsx
const [highlights, setHighlights] = useState([]);

// Capture a user's text selection
const capture = () => {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
  setHighlights((prev) => [...prev, { range: sel.getRangeAt(0).cloneRange(), hue: 200 }]);
};

return (
  <>
    <CanvasOverlay renderMode="marker" highlights={highlights} />
    <button onClick={capture}>Capture selection</button>
    <button onClick={() => setHighlights([])}>Clear</button>
  </>
);
```

No external dependencies beyond React.

## Testing

| Script | What it verifies |
|---|---|
| `node test/verify_renderers.cjs` | Auto mode regression — all four render modes produce non-zero canvas pixels |
| `node test/verify_controlled_mode.cjs` | Controlled mode — pixel parity with auto mode, empty-array isolation, auto mode restoration |

Both scripts require the dev server running on port 5200 (`npm run dev`). Screenshots are saved to `/tmp/`.

`verify_controlled_mode.cjs` works by:
1. Capturing the canvas pixel count in auto mode (rectangle renderer)
2. Extracting precomputed rects from `<mark>` elements via the Range API
3. Switching to controlled mode via `window.__testAPI` and injecting those rects as highlights
4. Asserting the pixel count is identical (rectangle renderer uses `fillRect` with the same coordinates)
5. Asserting `highlights=[]` renders nothing even with `<mark>` elements present in the DOM
