# Core Tool Version Policy

Milestone 10 introduces core CPU/render install declarations, not final pinned
production release images. Human-run image builds should pin and review exact
versions before production rollout.

Core readiness should report:

- FFmpeg and ffprobe command availability with version output;
- FFmpeg LGPL verification as pending manual review until proven;
- libass subtitle support as passed only when safely inspectable;
- Python import availability for PyAV, PySceneDetect, OpenCV headless, DuckDB, Polars, OpenTimelineIO, OpenColorIO, and OpenImageIO;
- Node package metadata availability for Sharp and Remotion when present;
- optional OpenImageIO/OpenColorIO runtime/media execution as still gated even when import readiness passes;
- Revideo as evaluation-only and production-blocked.

Readiness checks must not process media, run final render/export, download model
weights, call providers, or execute frontend/browser runtime code.
