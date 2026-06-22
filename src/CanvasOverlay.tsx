import { useEffect, useRef, type RefObject } from 'react';
import { renderRectangle, renderMarker, renderPen, renderPenScribble, renderActiveOutline } from './renderers';
import type { Rect, Renderer } from './renderers';

export type { Rect } from './renderers';
export type { RendererMeta, Renderer } from './renderers';

export type RenderMode = 'rectangle' | 'marker' | 'pen' | 'penScribble';

export interface HighlightDescriptor {
  range?: Range;
  rects?: Rect[];
  hue?: number;
  active?: boolean;
}

export interface CanvasOverlayProps {
  renderMode?: RenderMode;
  highlights?: HighlightDescriptor[];
  /** When provided, the canvas is sized and positioned relative to this element instead of the document. The element must have `position: relative`. */
  container?: RefObject<Element | null>;
  /** Called after every completed draw cycle (initial render, resize, highlights change). */
  onRenderComplete?: () => void;
}

const RENDER_MODES: Record<RenderMode, Renderer> = {
  rectangle: renderRectangle,
  marker: renderMarker,
  pen: renderPen,
  penScribble: renderPenScribble,
};

export function CanvasOverlay({ renderMode = 'rectangle', highlights, container, onRenderComplete }: CanvasOverlayProps) {
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
      const containerEl = container?.current;

      let canvasWidth: number;
      let canvasHeight: number;
      let offsetX: number;
      let offsetY: number;

      if (containerEl) {
        canvasWidth = containerEl.scrollWidth;
        canvasHeight = containerEl.scrollHeight;
        const cr = containerEl.getBoundingClientRect();
        offsetX = -cr.left + containerEl.scrollLeft;
        offsetY = -cr.top + containerEl.scrollTop;
      } else {
        canvasWidth = window.innerWidth;
        canvasHeight = document.documentElement.scrollHeight;
        offsetX = window.scrollX;
        offsetY = window.scrollY;
      }

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      const shiftRects = (viewportRects: ArrayLike<DOMRect> | Rect[]): Rect[] =>
        Array.from(viewportRects as Rect[]).map(r => ({
          left: r.left + offsetX,
          top: r.top + offsetY,
          width: r.width,
          height: r.height,
        }));

      const drawHighlight = ({ range, rects: precomputedRects, hue }: HighlightDescriptor) => {
        let raw: ArrayLike<DOMRect> | Rect[];
        if (range) raw = range.getClientRects();
        else if (precomputedRects) raw = precomputedRects;
        else return;
        const shifted = shiftRects(raw);
        if (shifted.length === 0) return;
        renderer(ctx, shifted, { hue });
      };

      if (highlights !== undefined) {
        // First pass: fill highlights
        highlights.forEach(drawHighlight);
        // Second pass: active outlines on top
        highlights.forEach(({ range, rects: precomputedRects, active }) => {
          if (!active) return;
          let raw: ArrayLike<DOMRect> | Rect[];
          if (range) raw = range.getClientRects();
          else if (precomputedRects) raw = precomputedRects;
          else return;
          const shifted = shiftRects(raw);
          if (shifted.length === 0) return;
          renderActiveOutline(ctx, shifted);
        });
      } else {
        // Auto mode: scan <mark> elements
        document.querySelectorAll('mark').forEach((mark) => {
          const range = document.createRange();
          range.selectNodeContents(mark);
          const shifted = shiftRects(range.getClientRects());
          if (shifted.length > 0) {
            const hueAttr = mark.getAttribute('data-hue');
            const hue = hueAttr ? parseFloat(hueAttr) : undefined;
            renderer(ctx, shifted, { hue });
          }
        });
      }
    };

    const updateAndNotify = () => { updateCanvas(); onRenderCompleteRef.current?.(); };
    updateAndNotify();

    let cleanup: (() => void);
    const containerEl = container?.current;

    if (containerEl) {
      const ro = new ResizeObserver(() => updateAndNotify());
      ro.observe(containerEl);
      cleanup = () => ro.disconnect();
    } else {
      window.addEventListener('resize', updateAndNotify);
      let observer: MutationObserver | undefined;
      if (highlights === undefined) {
        observer = new MutationObserver(() => updateAndNotify());
        observer.observe(document.body, { childList: true, subtree: true, characterData: true });
      }
      cleanup = () => {
        window.removeEventListener('resize', updateAndNotify);
        observer?.disconnect();
      };
    }

    return cleanup;
  }, [renderer, highlights, container]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 1000 }}
    />
  );
}
