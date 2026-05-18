# Browser-Safe Tool Installation

## Purpose

RP-TOOLS-INSTALL-01 installs a small set of browser-safe frontend libraries for future controlled preview components and visual planning:

- D3 for custom SVG/data diagrams.
- ECharts for standard charts.
- MapLibre GL for map preview/planning.
- Turf for geospatial calculations.
- lottie-web for reusable vector animation playback.

These tools support ReeditPro's controlled visual planning direction. They do not replace Remotion as the final compositor and they do not change provider model routing.

## What This Milestone Does

- Installs only the approved browser-safe packages.
- Adds lazy loader wrappers so heavy libraries are loaded only when explicitly checked or used later.
- Updates the tool registry to mark approved browser-safe tools as frontend-installed and browser-preview-ready.
- Adds smoke-check utilities that confirm lazy imports are available without rendering anything.
- Adds a developer-only install status card.
- Keeps production rendering, worker execution, browser capture, map tiles, chart previews, and animation playback disabled.

## What This Milestone Does Not Do

- It does not render real maps in production plans.
- It does not render real charts in production plans.
- It does not call map tile services.
- It does not fetch external data.
- It does not access websites.
- It does not execute Playwright.
- It does not run real video rendering.
- It does not run backend workers.
- It does not process real video.
- It does not replace Remotion as the final compositor.

## Lazy Loader Policy

These libraries can be large, so the chat/editor bundle should not eagerly import them unless a future preview actually needs them. Use dynamic import wrappers:

- `loadD3()`
- `loadECharts()`
- `loadMapLibre()`
- `loadTurf()`
- `loadLottieWeb()`

Install checks must be user/developer-triggered. They should not run automatically on initial editor load.

## Provider Model Separation

Open-source browser tools are not provider models. Installing them does not change:

- Wan as the primary animation model.
- Hailuo as fallback/alternate.
- Veo 3.1 Lite as Premium-only final fallback/rescue.
- Basic and Pro no-Veo rules.

## Worker Tool Separation

Do not install worker-only tools in the frontend in this milestone:

- FFmpeg
- OpenCV
- OpenColorIO
- OpenImageIO
- Playwright
- Essentia
- librosa
- whisper.cpp
- Rubber Band
- VapourSynth

Those tools remain future worker, QA, or planning-only capabilities until a separate milestone explicitly installs or executes them.

## Production Readiness Note

The installed packages are for future browser-safe preview components and controlled visual generation. Actual production export/rendering, browser capture, and backend worker execution still require later milestones, approved plan snapshots, and credit/approval gates.
