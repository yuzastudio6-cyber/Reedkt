# Track B Capability Manifest Baseline

Phase 44I-A creates a Track B restricted internal testing manifest baseline. It is reporting-only and separate from the broader production tool registry.

Run id: `phase44ia-trackb-capability-manifest-baseline-20260604`

Reports:

- `docs/activation-track-b-capability-manifests-reports/track_b_capability_manifests.json`
- `docs/activation-track-b-capability-manifests-reports/track_b_initial_internal_testing_manifest.json`
- `docs/activation-track-b-capability-manifests-reports/track_b_route_manifest_handoff.json`
- `docs/activation-track-b-capability-manifests-reports/tool-manifests/*.json`

This phase does not run Docker, Cloud Build, Cloud Run, GPU jobs, model downloads, media/audio/OCR/VLM runtimes, provider calls, IAM/GCP mutation, or beta/production unlocks.

Initial restricted internal testing eligibility includes DeepFilterNet, Signalsmith Stretch, PaddleOCR, PaddlePaddle, OpenCV, PyAV, PySceneDetect, Sharp/libvips, DuckDB, and Polars.

Demucs, Qwen3-VL, and vLLM are excluded/blocked. Demucs remains blocked pending training-data provenance. Qwen3-VL and vLLM remain excluded because Phase 39C generated VLM runtime verification did not pass.

The hybrid compute/cost routing tools are not started: web capability profiler, desktop capability profiler, local worker sidecar planning, cost estimator, and tool route manifest integration.

Actual route integration remains Phase 44I work. Workers must execute approved plan snapshots and approved artifact scopes only. Raw chat execution and direct tool execution from model output remain blocked.
