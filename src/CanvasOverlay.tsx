import { useEffect, useRef } from 'react';
import { renderRectangle, renderMarker, renderPen, renderPenScribble } from './renderers';
import type { Rect, Renderer } from './renderers';

export type { Rect } from './renderers';
export type { RendererMeta, Renderer } from './renderers';

export type RenderMode = 'rectangle' | 'marker' | 'pen' | 'penScribble';

export interface HighlightDescriptor {
  range?: Range;
  rects?: Rect[];
  hue?: number;
}

export interface CanvasOverlayProps {
  renderMode?: RenderMode;
  highlights?: HighlightDescriptor[];
  /** Called after every completed draw cycle (initial render, resize, highlights change). */
  onRenderComplete?: () => void;
}

const RENDER_MODES: Record<RenderMode, Renderer> = {
  rectangle: renderRectangle,
  marker: renderMarker,
  pen: renderPen,
  penScribble: renderPenScribble,
};

/**
 * Canvas overlay component that renders highlights above marked text
 * @param renderMode - The rendering style: 'rectangle', 'marker', 'pen', or 'penScribble'
 * @param highlights - Controlled mode: array of { range?, rects?, hue? } descriptors.
 *   When provided, only these highlights are drawn and <mark> scanning is disabled.
 */
export function CanvasOverlay({ renderMode = 'rectangle', highlights, onRenderComplete }: CanvasOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderer = RENDER_MODES[renderMode] || renderRectangle;
  // Keep a ref so the effect never needs onRenderComplete in its dep array,
  // avoiding re-runs (and potential loops) when the caller passes an inline function.
  const onRenderCompleteRef = useRef(onRenderComplete);
  onRenderCompleteRef.current = onRenderComplete;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateCanvas = () => {
      // Set canvas to match viewport width and full document height
      canvas.width = window.innerWidth;
      canvas.height = document.documentElement.scrollHeight;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (highlights !== undefined) {
        // Controlled mode: iterate highlights array
        highlights.forEach(({ range, rects: precomputedRects, hue }) => {
          let resolvedRects: Rect[];
          if (range) {
            resolvedRects = Array.from(range.getClientRects());
          } else if (precomputedRects) {
            resolvedRects = precomputedRects;
          } else return;
          if (resolvedRects.length > 0) renderer(ctx, resolvedRects, { hue });
        });
      } else {
        // Auto mode: scan <mark> elements
        document.querySelectorAll('mark').forEach((mark) => {
          const range = document.createRange();
          range.selectNodeContents(mark);
          const rects = Array.from(range.getClientRects());
          if (rects.length > 0) {
            const hueAttr = mark.getAttribute('data-hue');
            const hue = hueAttr ? parseFloat(hueAttr) : undefined;
            renderer(ctx, rects, { hue });
          }
        });
      }
    };

    const updateCanvasAndNotify = () => {
      updateCanvas();
      onRenderCompleteRef.current?.();
    };

    // Initial draw
    updateCanvasAndNotify();

    // Redraw on window resize (which may change content layout)
    const handleResize = () => updateCanvasAndNotify();
    window.addEventListener('resize', handleResize);

    // MutationObserver only needed in auto mode
    let observer: MutationObserver | undefined;
    if (highlights === undefined) {
      observer = new MutationObserver(() => updateCanvasAndNotify());
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      observer?.disconnect();
    };
  }, [renderer, highlights]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    />
  );
}
