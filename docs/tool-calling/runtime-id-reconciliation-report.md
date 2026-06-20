# Tool-Calling Runtime ID Reconciliation Report

## Summary

Milestone 2 adds explicit per-tool capability study cards and runtime ID alias resolution. The study cards enrich planning metadata, but `server/tool-registry` remains the canonical source for selectable runtime IDs.

## First-Class Runtime IDs Covered By Study Cards

All current first-class `ProductionToolId` entries now have explicit study-card coverage.

- `ffmpeg`
- `ffprobe`
- `pyav`
- `opentimelineio`
- `hyperframe`
- `remotion`
- `libass`
- `sharp`
- `duckdb`
- `polars`
- `faster_whisper`
- `whisper_cpp`
- `paddleocr`
- `pyscenedetect`
- `opencv`
- `mediapipe`
- `kornia`
- `birefnet`
- `sam2`
- `transparent_background`
- `rembg`
- `opencolorio`
- `openimageio`
- `deepfilternet`
- `rnnoise`
- `demucs`
- `librosa`
- `audioflux`
- `signalsmith_stretch`
- `soundtouch`
- `rubber_band`
- `essentia`
- `real_esrgan`
- `film`
- `pixijs`
- `three_js`
- `babylon_js`
- `lottie`
- `playwright`
- `maplibre`
- `turf`
- `d3`
- `echarts`
- `vega_lite`
- `deck_gl`
- `cesium_js`
- `konva`
- `vapoursynth`
- `revideo`

## Aliases Resolved To Runtime IDs

- `sharp_libvips -> sharp`
- `polars_nodejs_polars -> polars`
- `remotion_render_validation -> remotion`
- `opentimelineio_timeline_validation -> opentimelineio`
- `libass_caption_burnin -> libass`
- `film_frame_interpolation -> film`
- `opencolorio -> opencolorio`
- `openimageio -> openimageio`

## Pending Production Registry Expansion

- `imagemagick_graphicsmagick -> pending_production_tool_registry_expansion`
  - Reason: ImageMagick/GraphicsMagick are useful image tools but `imagemagick` is not a first-class `ProductionToolId` on this base.
  - Next milestone: add a registry profile, runtime policy, QA/fallback mapping, and adapter contract if ImageMagick or GraphicsMagick becomes selectable.
- `mediainfo -> pending_production_tool_registry_expansion`
  - Reason: MediaInfo is useful for metadata QA but is not a first-class `ProductionToolId` on this base.
  - Next milestone: add a registry profile and metadata inspection adapter contract before runtime selection.
- `exiftool -> pending_production_tool_registry_expansion`
  - Reason: ExifTool is useful for image metadata evidence but is not a first-class `ProductionToolId` on this base.
  - Next milestone: add a registry profile and metadata adapter contract before runtime selection.
- `tesseract -> pending_production_tool_registry_expansion`
  - Reason: Tesseract is useful OCR evidence but is not a first-class `ProductionToolId` on this base.
  - Next milestone: add a registry profile and OCR adapter contract before runtime selection.

## Runtime Selection Rule

Pending external study cards can appear in reconciliation reports, study listings, pending-candidate diagnostics, and future expansion notes. They must not appear as a pipeline `selectedToolId` until promoted to a first-class `ProductionToolId`.
