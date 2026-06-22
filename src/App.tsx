import { useState, useEffect } from 'react';
import { CanvasOverlay } from './CanvasOverlay';
import type { HighlightDescriptor, RenderMode } from './CanvasOverlay';

export function App() {
  const [renderMode, setRenderMode] = useState<RenderMode>('rectangle');
  const [controlledMode, setControlledMode] = useState(false);
  const [controlledHighlights, setControlledHighlights] = useState<HighlightDescriptor[]>([]);
  const [nextHue, setNextHue] = useState(200);

  // Expose test API for Playwright e2e tests
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__testAPI = {
      setControlledMode,
      setHighlights: setControlledHighlights,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return () => { delete (window as any).__testAPI; };
  }, [setControlledMode, setControlledHighlights]);

  const captureSelection = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    const range = sel.getRangeAt(0).cloneRange();
    setControlledHighlights((prev) => [...prev, { range, hue: nextHue }]);
    setNextHue((h) => (h + 60) % 360);
    sel.removeAllRanges();
  };

  return (
    <>
      <CanvasOverlay
        renderMode={renderMode}
        highlights={controlledMode ? controlledHighlights : undefined}
        onRenderComplete={() => {
          // Expose a render counter for test automation
          const w = window as unknown as Record<string, number>;
          w.__renderCount = (w.__renderCount ?? 0) + 1;
        }}
      />

      <div className="container">
        <h1>canvas-highlight</h1>

        <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
          <strong>Rendering Mode:</strong>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            {(['rectangle', 'marker', 'pen', 'penScribble'] as RenderMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setRenderMode(mode)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: renderMode === mode ? '#007bff' : '#e0e0e0',
                  color: renderMode === mode ? 'white' : 'black',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: renderMode === mode ? 'bold' : 'normal',
                }}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
          <p style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
            {renderMode === 'rectangle' && 'Simple filled rectangles - precise and efficient'}
            {renderMode === 'marker' && 'Realistic marker with soft edges and stroke variations'}
            {renderMode === 'pen' && 'Pen/underline style with wavy strokes'}
            {renderMode === 'penScribble' && 'Pen scribble — high-frequency waves drawn over the text'}
          </p>
        </div>

        <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#e8f4e8', borderRadius: '8px', border: '1px solid #b0d8b0' }}>
          <strong>Controlled Mode:</strong>
          <p style={{ fontSize: '14px', color: '#444', marginTop: '8px' }}>
            Toggle controlled mode to drive highlights from React state instead of{' '}
            <code>&lt;mark&gt;</code> elements. Select text below then click "Capture Selection".
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
            <button
              onClick={() => setControlledMode((m) => !m)}
              style={{
                padding: '8px 16px',
                backgroundColor: controlledMode ? '#28a745' : '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              {controlledMode ? 'Controlled mode ON' : 'Controlled mode OFF'}
            </button>
            <button
              onClick={captureSelection}
              disabled={!controlledMode}
              style={{
                padding: '8px 16px',
                backgroundColor: controlledMode ? '#007bff' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: controlledMode ? 'pointer' : 'not-allowed',
              }}
            >
              Capture Selection
            </button>
            <button
              onClick={() => setControlledHighlights([])}
              disabled={!controlledMode}
              style={{
                padding: '8px 16px',
                backgroundColor: controlledMode ? '#dc3545' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: controlledMode ? 'pointer' : 'not-allowed',
              }}
            >
              Clear ({controlledHighlights.length})
            </button>
          </div>
        </div>

        <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
          <strong>Custom Hue Support:</strong>
          <p style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
            Use the <code>data-hue</code> attribute on <code>&lt;mark&gt;</code> elements to set custom colors.
            Hue values range from 0-360 (0=Red, 60=Yellow, 120=Green, 180=Cyan, 240=Blue, 300=Magenta).
          </p>
          <p>
            Example: <mark data-hue="0">Red hue (0)</mark>, <mark data-hue="120">Green hue (120)</mark>,{' '}
            <mark data-hue="240">Blue hue (240)</mark>, or <mark data-hue="300">Magenta hue (300)</mark>.
          </p>
        </div>

        <p>
          This is a demo of a <mark>canvas overlay</mark> that renders highlighter
          strokes above marked text.
        </p>

        <p>
          The component scans for <mark data-hue="120">mark elements</mark> in the DOM and draws
          over them on a canvas layer that sits <mark data-hue="240">above the document</mark>.
        </p>

        <p>
          Try scrolling down to see the overlay <mark data-hue="300">follow your scroll</mark> position.
        </p>

        <p>
          <strong>Multi-line test:</strong> The component handles text that <mark data-hue="30">wraps across multiple
          lines by using the Range API to get individual rectangles for each line</mark> of text.
          This gives accurate highlighting for longer marked sections regardless of the rendering mode.
        </p>

        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do <mark>eiusmod tempor</mark>{' '}
          incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
          exercitation ullamco laboris.
        </p>

        <p>
          Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat
          nulla pariatur. Excepteur sint occaecat <mark>cupidatat non proident</mark>, sunt in
          culpa qui officia deserunt mollit anim id est laborum.
        </p>

        <p>
          Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque
          laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi{' '}
          <mark>architecto beatae vitae</mark> dicta sunt explicabo.
        </p>

        <p>
          Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia
          consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.
        </p>

        <p>
          Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci
          velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam
          aliquam quaerat voluptatem.
        </p>

        <p>
          Ut enim ad minima veniam, quis <mark>nostrum exercitationem</mark> ullam corporis
          suscipit laboriosam, nisi ut quid ex ea commodi consequatur.
        </p>
      </div>
    </>
  );
}
