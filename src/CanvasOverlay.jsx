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
      // Set canvas size to match window
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

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

        // Pass all rects for this mark to the renderer
        if (rects.length > 0) {
          renderer(ctx, rects);
        }
      });
    };

    // Initial draw
    updateCanvas();

    // Redraw on window resize
    const handleResize = () => updateCanvas();
    window.addEventListener('resize', handleResize);

    // Redraw on scroll
    const handleScroll = () => updateCanvas();
    window.addEventListener('scroll', handleScroll);

    // Use MutationObserver to redraw when DOM changes
    const observer = new MutationObserver(() => updateCanvas());
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, [renderer]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    />
  );
}
