# Phase 46A Media/Data Dependency Risk Report

Tracked risks:

- PyAV depends on FFmpeg libraries and codec behavior. FFmpeg build, codec, patent, and license review remains separate.
- Sharp depends on libvips. libvips LGPL-2.1-or-later compliance, native binary, optional dependency, and untrusted image handling review remains required.
- OpenCV native wheels can carry platform and GUI/headless dependency risks. Worker images should prefer `opencv-python-headless`.
- PySceneDetect depends on OpenCV and can produce false scene-boundary candidates. Scene outputs must be QA-gated and advisory until validated.
- DuckDB must have extension loading, network access, and local file IO policy locked down before runtime.
- Polars requires CPU compatibility, memory/streaming behavior, and schema drift review before report integration at scale.

These risks do not block Phase 46A evidence completion, but they block broad runtime, beta, production, and broad media use.
