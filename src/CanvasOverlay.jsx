import { useEffect, useRef } from 'react';

export function CanvasOverlay() {
  const canvasRef = useRef(null);

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

      // Draw rectangles over each mark
      marks.forEach((mark) => {
        const rect = mark.getBoundingClientRect();

        // Account for scroll position
        const x = rect.left + window.scrollX;
        const y = rect.top + window.scrollY;
        const width = rect.width;
        const height = rect.height;

        // Draw yellow highlighter rectangle
        ctx.fillStyle = 'rgba(255, 255, 0, 0.4)';
        ctx.fillRect(x, y, width, height);

        // Optional: draw border for visibility
        ctx.strokeStyle = 'rgba(255, 200, 0, 0.6)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
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
  }, []);

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
