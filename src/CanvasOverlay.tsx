import { useEffect, useRef, type RefObject } from 'react';
import {
  renderRectangle,
  renderMarker,
  renderPen,
  renderPenScribble,
  shiftRects,
} from './renderers';
import type { Rect, Renderer } from './renderers';

export type { Rect } from './renderers';
export type { RendererMeta, Renderer } from './renderers';

export type RenderMode = 'rectangle' | 'marker' | 'pen' | 'penScribble';

export interface HighlightDescriptor {
  ranges?: Range[];
  rects?: Rect[];
  hue?: number;
  active?: boolean;
  renderMode?: RenderMode;
}

export interface CanvasOverlayProps {
  renderMode?: RenderMode;
  highlights?: HighlightDescriptor[];
  /** When provided, the canvas is sized and positioned relative to this element instead of the document. The element must have `position: relative`. */
  container?: RefObject<Element | null>;
  /** Called after every completed draw cycle (initial render, resize, highlights change). */
  onRenderComplete?: () => void;
}

function getCanvasBounds(containerEl: Element | null | undefined) {
  if (containerEl) {
    const cr = containerEl.getBoundingClientRect();
    return {
      width: containerEl.scrollWidth,
      height: containerEl.scrollHeight,
      offsetX: -cr.left + containerEl.scrollLeft,
      offsetY: -cr.top + containerEl.scrollTop,
    };
  }
  return {
    width: window.innerWidth,
    height: document.documentElement.scrollHeight,
    offsetX: window.scrollX,
    offsetY: window.scrollY,
  };
}

const RENDER_MODES: Record<RenderMode, Renderer> = {
  rectangle: renderRectangle,
  marker: renderMarker,
  pen: renderPen,
  penScribble: renderPenScribble,
};

export function CanvasOverlay({
  renderMode = 'rectangle',
  highlights,
  container,
  onRenderComplete,
}: CanvasOverlayProps) {
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
      const { width, height, offsetX, offsetY } = getCanvasBounds(container?.current);

      canvas.width = width;
      canvas.height = height;
      ctx.clearRect(0, 0, width, height);

      if (highlights !== undefined) {
        const computed = highlights.flatMap(
          ({ ranges, rects: precomputedRects, hue, active, renderMode: highlightRenderMode }) => {
            const raw = ranges
              ? ranges.flatMap((r) => Array.from(r.getClientRects()))
              : (precomputedRects ?? []);
            if (raw.length === 0) return [];
            const shifted = shiftRects(raw, offsetX, offsetY);
            return shifted.length ? [{ shifted, hue, active, highlightRenderMode }] : [];
          },
        );
        const anyActive = computed.some((h) => h.active);
        computed.forEach(({ shifted, hue, active, highlightRenderMode }) => {
          if (anyActive && !active) {
            // Bypass the renderer with a fixed grey fill so all inactive highlights are
            // visually uniform — desaturating via ctx.filter still produces different greys
            // because luminance varies per hue.
            ctx.fillStyle = 'rgba(140, 140, 140, 0.15)';
            shifted.forEach((r) => ctx.fillRect(r.left, r.top, r.width, r.height));
          } else {
            const r = highlightRenderMode
              ? (RENDER_MODES[highlightRenderMode] ?? renderRectangle)
              : renderer;
            r(ctx, shifted, { hue });
          }
        });
      } else {
        // Auto mode: scan <mark> elements
        document.querySelectorAll('mark').forEach((mark) => {
          const range = document.createRange();
          range.selectNodeContents(mark);
          const shifted = shiftRects(range.getClientRects(), offsetX, offsetY);
          if (shifted.length > 0) {
            const hueAttr = mark.getAttribute('data-hue');
            const hue = hueAttr ? parseFloat(hueAttr) : undefined;
            renderer(ctx, shifted, { hue });
          }
        });
      }
    };

    const updateAndNotify = () => {
      updateCanvas();
      onRenderCompleteRef.current?.();
    };
    updateAndNotify();

    const containerEl = container?.current;
    const ro = new ResizeObserver(updateAndNotify);
    ro.observe(containerEl ?? document.documentElement);

    if (containerEl) {
      return () => ro.disconnect();
    }
    let observer: MutationObserver | undefined;
    if (highlights === undefined) {
      observer = new MutationObserver(updateAndNotify);
      observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    }
    return () => {
      ro.disconnect();
      observer?.disconnect();
    };
  }, [renderer, highlights, container]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 1000,
        mixBlendMode: 'multiply',
      }}
    />
  );
}
