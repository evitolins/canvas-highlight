# Canvas Overlay POC

A React component that renders realistic highlighter and marker strokes above text in HTML documents using a canvas overlay. Supports two modes: **auto mode** (driven by `<mark>` elements) and **controlled mode** (driven by a `highlights` prop accepting Range objects or precomputed rects).

## Features

- **Canvas Overlay**: Renders highlights on a canvas layer that scrolls naturally with page content
- **Multi-line Support**: Uses the Range API to accurately highlight text that wraps across multiple lines
- **Two Highlight Modes**:
  - **Auto mode**: Drop the component in and annotate content with `<mark>` — no JS needed at the call site
  - **Controlled mode**: Pass a `highlights` prop (Range objects or precomputed rects) from any data source — search results, user selections, NLP output
- **Multiple Rendering Modes**:
  - **Rectangle**: Simple, efficient filled rectangles
  - **Marker**: Realistic highlighter with soft edges, opacity variations, and natural ink bleed effects
  - **Pen**: Calligraphy-style underlines with wavy strokes
  - **PenScribble**: High-frequency overlapping waves drawn over the text
- **Custom Colors**: Set hue per highlight via `data-hue` on `<mark>` elements (auto mode) or the `hue` field in each highlight descriptor (controlled mode)
- **Responsive**: Automatically redraws on window resize; DOM mutation watching scoped to auto mode only

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Opens the app at `http://localhost:5200`

### Build

```bash
npm run build
```

## Usage

### Auto Mode — `<mark>` elements

Drop `<CanvasOverlay>` near the root and annotate content with `<mark>`. No JS needed at the usage site.

```jsx
import { CanvasOverlay } from './CanvasOverlay';

function MyPage() {
  return (
    <>
      <CanvasOverlay renderMode="marker" />
      <p>Your content with <mark>marked text</mark> here.</p>
    </>
  );
}
```

Use `data-hue` for custom colors:

```html
<mark data-hue="0">Red</mark>
<mark data-hue="120">Green</mark>
<mark data-hue="240">Blue</mark>
```

Hue values (0–360): 0 = Red, 60 = Yellow (default), 120 = Green, 180 = Cyan, 240 = Blue (pen default), 300 = Magenta.

### Controlled Mode — `highlights` prop

Pass an array of highlight descriptors to drive highlights from any data source. When `highlights` is provided, `<mark>` scanning and `MutationObserver` are both disabled.

Each descriptor is `{ range?, rects?, hue? }` — supply either a live `Range` object or precomputed `rects` (array of `{ left, top, width, height }`).

```jsx
// Highlight a user's text selection
const [highlights, setHighlights] = useState([]);

const capture = () => {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  setHighlights((prev) => [...prev, { range: sel.getRangeAt(0).cloneRange(), hue: 200 }]);
};

return (
  <>
    <CanvasOverlay renderMode="marker" highlights={highlights} />
    <button onClick={capture}>Capture selection</button>
    <button onClick={() => setHighlights([])}>Clear</button>
    <p>Select any text on this page and click Capture.</p>
  </>
);
```

Precomputed rects (useful when Range objects are unavailable):

```jsx
<CanvasOverlay renderMode="rectangle" highlights={[
  { rects: [{ left: 100, top: 200, width: 300, height: 18 }], hue: 120 },
]} />
```

## Rendering Modes

### Rectangle
Simple filled rectangles. Best for:
- Performance-critical applications
- precise, clean highlighting

### Marker
Realistic highlighter effect with:
- Soft, feathered edges using gradients
- Multiple overlapping strokes for depth
- Opacity variations along the stroke
- Subtle angle rotations for natural feel
- Ink bleed effects at stroke endpoints
- Best for document annotation interfaces

### Pen
Calligraphy-style underlines with:
- Wavy stroke patterns
- Consistent line width
- Best for editorial/annotation tools

### PenScribble
High-frequency waves drawn over the full text height:
- 5 overlapping sine-wave passes
- Amplitude scales with text height
- Best for emphasis or redaction effects

## How It Works

1. **Canvas Setup**: A full-height `position: absolute` canvas spans the document
2. **Highlight Source**: Either `<mark>` elements (auto mode) or the `highlights` prop (controlled mode)
3. **Range API**: Uses `Range.getClientRects()` to get individual rectangles for each line of wrapped text
4. **Rendering**: Selected renderer draws on the canvas using document-relative coordinates (`viewport + scrollX/Y`)
5. **Synchronization**: Canvas scrolls naturally with page content; redraws on resize. MutationObserver is active only in auto mode.

## Documentation

For a full technical reference including renderer architecture and integration details, see [docs/TECHNICAL.md](docs/TECHNICAL.md).

## Project Structure

```
src/
├── main.jsx          # App entry point
├── App.jsx           # Demo app: mode selector + controlled mode UI
├── CanvasOverlay.jsx # Main overlay component
└── renderers.js      # Rendering strategies (Rectangle, Marker, Pen, PenScribble)
test/
├── verify_renderers.cjs        # Auto mode regression: all four modes produce non-zero pixels
└── verify_controlled_mode.cjs  # Controlled mode: parity, isolation, and round-trip tests
```

## Performance Considerations

- Canvas redraws on: window resize and rendering mode changes
- In **auto mode**: also redraws on any DOM mutation via `MutationObserver`
- In **controlled mode**: redraws are driven by React re-renders when `highlights` changes — no `MutationObserver` overhead
- Scroll events do NOT trigger redraws — the canvas scrolls naturally with the document
- Precomputed rects in controlled mode become stale on layout change; re-query on resize if needed

## Browser Support

- Modern browsers with Canvas 2D support
- Requires ES6+ JavaScript support
