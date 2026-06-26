# AGENTS.md — canvas-highlight

Guide for AI agents working in this repository.

## Architecture Overview

This repo has two distinct purposes sharing one `src/` directory:

| Purpose | Entry point | How it runs |
|---|---|---|
| **Publishable library** | `src/index.ts` | `npm run build:lib` → `dist/` |
| **Demo app** | `src/main.tsx` → `index.html` | `npm run dev` (Vite dev server) |

The boundary is sharp: anything not exported from `src/index.ts` is not in the package. `App.tsx`, `main.tsx`, and `window.__testAPI` never appear in the published bundle.

### Component modes

**Auto mode** (default): `<CanvasOverlay renderMode="marker" />` — the component scans all `<mark>` elements in the DOM and redraws on mutations and resize.

**Controlled mode**: `<CanvasOverlay highlights={descriptors} />` — the caller passes an array of `HighlightDescriptor` objects; DOM scanning is disabled.

## Key Types

All public types are defined in [`src/CanvasOverlay.tsx`](src/CanvasOverlay.tsx) and [`src/renderers.ts`](src/renderers.ts) and re-exported from [`src/index.ts`](src/index.ts). Read those files for the authoritative signatures — don't rely on copies here.

Briefly: `HighlightDescriptor` carries the source geometry (`ranges` or `rects`), an optional `hue`, and an optional `active` flag. `CanvasOverlayProps` is the component's prop surface. `Renderer` is the function signature all render strategies conform to.

## Adding a New Renderer

1. Implement the `Renderer` type in `src/renderers.ts` and export it.
2. Add the key to the `RENDER_MODES` record in `src/CanvasOverlay.tsx` and extend the `RenderMode` union.
3. Export the new renderer from `src/index.ts`.
4. Add a demo button/label for the new mode in `src/App.tsx` (demo only — not required for the library).

## Build Commands

```bash
npm run dev          # Start Vite dev server at http://localhost:5200 (demo app)
npm run build        # Build demo app to dist/ (Vite default)
npm run build:lib    # Build publishable library to dist/ (ES + CJS + .d.ts)
npm run typecheck    # tsc --noEmit — zero errors required
npm run lint         # ESLint on src/
npm run format       # Prettier on src/
```

## Test Commands

```bash
npm run test:e2e   # runs all Playwright specs (starts its own server via webServer config)
```

Specs live in `test/`. See [`test/helpers.ts`](test/helpers.ts) for shared utilities.

## What NOT to Include in the Library Entry

`src/index.ts` must never import or re-export:
- `App.tsx` or `main.tsx`
- `window.__testAPI` (Playwright test hook, demo-only)
- Any UI chrome, demo content, or dev-server configuration

If it isn't exported from `src/index.ts`, it doesn't ship.
