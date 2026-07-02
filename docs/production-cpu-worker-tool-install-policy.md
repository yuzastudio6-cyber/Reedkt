# Production CPU Worker Tool Install Policy

The CPU worker image is for deterministic media foundation and analysis work after approved snapshots: probe/proxy preparation, frame/audio extraction support, scene/timeline analysis, tabular report assembly, and basic QA inputs.

## Included Core Packages

- FFmpeg and ffprobe: media probing, proxy/audio/frame extraction support, and safe worker-side inspection.
- Python 3 and pip: controlled worker analysis runtime.
- PyAV: stream/frame access and FFmpeg handoff.
- PySceneDetect: future scene boundary analysis.
- OpenCV headless: CPU visual analysis and QA primitives without desktop GUI dependencies.
- DuckDB and Polars: deterministic local analytical summaries.
- OpenTimelineIO: timeline/edit-decision interchange.
- Sharp/libvips system support: image/thumbnail/asset preparation boundary.

## Exclusions

The CPU image must not include GPU/model packages, model weights, provider secrets, frontend execution paths, or Revideo. PaddleOCR, faster-whisper, SAM2, BiRefNet, DeepFilterNet, Demucs, Real-ESRGAN, and FILM remain outside M10 core CPU install scope.

OpenImageIO and OpenColorIO remain optional/pending until dependency and license review selects production packages.
