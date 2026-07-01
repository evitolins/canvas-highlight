# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.1] - 2026-07-01

### Added
- `HighlightDescriptor.renderMode` — each highlight can now override the component-level `renderMode` prop, enabling mixed render styles in a single `CanvasOverlay` instance
- `padRects(rects, paddingH, paddingV)` exported as a public utility for custom renderer authors

### Changed
- Each built-in renderer now applies its own internal padding via `padRects` (rectangle: 3 px H / 2 px V; marker: 4 px H; pen/penScribble: 2 px H)
- Canvas uses `mix-blend-mode: multiply` so overlapping highlights composite like real ink
- Demo: Controlled Mode toggle replaced with an animated CSS switch; new showcase section demonstrates all four render modes side-by-side
- `renderMarker`: fix stroke count (was always 2, now 1–3), rotate strokes around their center, increased edge roughness

## [0.3.0] - 2026-06-26

### Changed
- **Breaking:** `renderActiveOutline` removed from the public API. Active-state visual distinction is now handled internally: when any highlight has `active: true`, inactive highlights are dimmed to a uniform grey (`rgba(140, 140, 140, 0.15)`) and the active highlight renders normally with its hue. Remove any calls to `renderActiveOutline` from your own code.

## [0.2.0] - 2026-06-24

### Changed
- **Breaking:** `HighlightDescriptor.range` (single `Range`) replaced by `ranges` (`Range[]`). Update callers from `{ range: r }` to `{ ranges: [r] }`. Multiple ranges per descriptor are now supported and flattened into one rect list before rendering, eliminating seam artifacts between adjacent spans.

## [0.1.2] - 2026-06-23

### Fixed
- GitHub Actions publish workflow now uses npm Trusted Publishing (OIDC) correctly

## [0.1.0] - 2026-06-23

### Added
- `CanvasOverlay` React component with two operating modes:
  - **Auto mode** — scans `<mark>` elements and renders highlights automatically via `MutationObserver`
  - **Controlled mode** — accepts a `highlights` prop (Range objects or precomputed rects) for programmatic control
- Four built-in rendering modes: `rectangle`, `marker`, `pen`, `penScribble`
- Custom hue per highlight via `data-hue` on `<mark>` elements (auto mode) or the `hue` field on each highlight descriptor (controlled mode)
- `renderActiveOutline` renderer for the active/selected highlight state
- Container scoping via `container` prop to restrict `<mark>` scanning to a subtree
- Exported types: `Rect`, `RendererMeta`, `Renderer`, `CanvasOverlayProps`, `HighlightDescriptor`, `RenderMode`
- ESM and CJS builds with TypeScript declarations

[0.1.0]: https://github.com/evitolins/canvas-highlight/releases/tag/v0.1.0
