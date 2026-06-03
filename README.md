# Canvas Overlay POC

A React component that renders realistic highlighter and marker strokes above `<mark>` elements in HTML documents using canvas overlay.

## Features

- **Canvas Overlay**: Renders highlights on a canvas layer that scrolls naturally with page content
- **Multi-line Support**: Uses the Range API to accurately highlight text that wraps across multiple lines
- **Multiple Rendering Modes**:
  - **Rectangle**: Simple, efficient filled rectangles
  - **Marker**: Realistic highlighter with soft edges, opacity variations, and natural ink bleed effects
  - **Pen**: Calligraphy-style underlines with wavy strokes
- **Custom Colors**: Use `data-hue` attributes on `<mark>` elements to set custom highlight colors (0-360)
- **Responsive**: Automatically updates on window resize and DOM mutations

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Opens the app at `http://localhost:5173`

### Build

```bash
npm run build
```

## Usage

### Basic Highlighting

Add `<mark>` elements to your HTML as usual:

```html
<p>This is <mark>highlighted text</mark>.</p>
```

### Custom Colors with data-hue

Use the `data-hue` attribute to set custom highlight colors:

```html
<p>
  <mark data-hue="0">Red highlight</mark>
  <mark data-hue="120">Green highlight</mark>
  <mark data-hue="240">Blue highlight</mark>
</p>
```

Hue values range from 0-360:
- **0**: Red
- **60**: Yellow (default for Rectangle/Marker modes)
- **120**: Green
- **180**: Cyan
- **240**: Blue (default for Pen mode)
- **300**: Magenta

### Component Integration

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

## How It Works

1. **Canvas Setup**: A full-height `position: absolute` canvas spans the document
2. **Mark Detection**: Component finds all `<mark>` elements on the page
3. **Range API**: Uses `Range.getClientRects()` to get individual rectangles for each line of wrapped text
4. **Rendering**: Selected renderer draws on the canvas using viewport-relative coordinates
5. **Synchronization**: Canvas scrolls naturally with the page content; updates on resize and DOM mutations

## Project Structure

```
src/
├── main.jsx          # App entry point
├── App.jsx           # Demo application with mode selector
├── CanvasOverlay.jsx # Main overlay component
└── renderers.js      # Rendering strategies (Rectangle, Marker, Pen)
```

## Performance Considerations

- Canvas is redrawn on: window resize, DOM mutations, and rendering mode changes
- Scroll events do NOT trigger redraws (canvas scrolls naturally)
- Each renderer is optimized for its specific use case
- MutationObserver monitors DOM changes for dynamic content

## Browser Support

- Modern browsers with Canvas 2D support
- Requires ES6+ JavaScript support
