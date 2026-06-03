import { useEffect, useRef } from 'react';
import { renderRectangle, renderMarker, renderPen } from './renderers';

const RENDER_MODES = {
  rectangle: renderRectangle,
  marker: renderMarker,
  pen: renderPen,
};

/**
 * Canvas overlay component that renders highlights above marked text
 * @param {Object} props
 * @param {string} props.renderMode - The rendering style: 'rectangle', 'marker', or 'pen'
 */
export function CanvasOverlay({ renderMode = 'rectangle' }) {
  const canvasRef = useRef(null);
  const renderer = RENDER_MODES[renderMode] || renderRectangle;

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

      // Find all <mark> elements
      const marks = document.querySelectorAll('mark');

      // Render each mark using the selected renderer
      marks.forEach((mark) => {
        // Use Range API to get individual line rectangles for wrapped text
        const range = document.createRange();
        range.selectNodeContents(mark);
        const rects = Array.from(range.getClientRects());

        // Pass the mark element and rects to the renderer
        // (mark element contains data-hue attribute if custom color is desired)
        if (rects.length > 0) {
          renderer(ctx, rects, mark);
        }
      });
    };

    // Initial draw
    updateCanvas();

    // Redraw on window resize (which may change content layout)
    const handleResize = () => updateCanvas();
    window.addEventListener('resize', handleResize);

    // Use MutationObserver to redraw when DOM changes
    const observer = new MutationObserver(() => updateCanvas());
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, [renderer]);

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
