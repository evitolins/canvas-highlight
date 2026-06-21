import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    react(),
    dts({ include: ['src/index.ts', 'src/CanvasOverlay.tsx', 'src/renderers.ts'] }),
  ],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'CanvasHighlight',
      formats: ['es', 'cjs'],
      fileName: (format) => `canvas-highlight.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: { react: 'React', 'react-dom': 'ReactDOM' },
      },
    },
  },
});
