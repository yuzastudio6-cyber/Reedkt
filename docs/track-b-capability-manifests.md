# Track B Capability Manifests

The Track B capability manifests define restricted internal testing eligibility for the tool families owned by Track B:

- Audio/timing: DeepFilterNet, Signalsmith Stretch, Demucs
- OCR: PaddleOCR, PaddlePaddle
- VLM: Qwen3-VL, vLLM
- Media/data: OpenCV, PyAV, PySceneDetect, Sharp/libvips, DuckDB, Polars
- Hybrid compute/cost routing: web capability profiler, desktop capability profiler, local worker sidecar planning, cost estimator, tool route manifest integration

The canonical tool ids are locked in `server/activation/track-b-capability-manifests/track-b-tool-registry.ts`. The generated per-tool JSON manifests live under `docs/activation-track-b-capability-manifests-reports/tool-manifests/`.

These manifests are not production routing. They are source-of-truth metadata for future route-manifest integration and internal QA/planning review only.
