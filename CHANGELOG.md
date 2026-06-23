# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
